// ======================================================
// workspace.js — tab manager, iframe host per tab
// ======================================================

const Workspace = (function () {

    const MIN_W = 80, MAX_W = 220, NATURAL_PAD = 56;
    let tabs = [];
    let activeId = null;

    function uid() { return "t" + Math.random().toString(36).slice(2, 9); }
    function esc(s) { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; }

    function measure(text) {
        measure._ctx = measure._ctx || document.createElement("canvas").getContext("2d");
        measure._ctx.font = "13px -apple-system, sans-serif";
        return measure._ctx.measureText(text).width;
    }

    // --------------------------------------------------
    // open / activate / close
    // PATCHED: openTab SELALU bikin tab baru, gak dedupe by
    // page lagi — user eksplisit minta klik = tab baru.
    // --------------------------------------------------

    const MAX_TABS = 20;

    function openTab({ title, url, page }) {
        // Enforce tab limit: evict oldest non-active tab
        if (tabs.length >= MAX_TABS) {
            const victim = tabs.find(t => t.id !== activeId);
            if (victim) closeTab(victim.id);
        }

        const id = uid();
        tabs.push({ id, title, url, page });

        const host = document.getElementById("wsContent");
        const frame = document.createElement("iframe");
        frame.className = "ws-frame";
        frame.src = url;
        frame.dataset.tabId = id;
        frame.addEventListener("load", () => {
            try {
                const t = tabs.find(x => x.id === id);
                const docTitle = frame.contentDocument && frame.contentDocument.title;
                if (t && docTitle) {
                    t.title = docTitle.replace(/^Hotel PMS\s*(—|-)?\s*/i, "") || t.title;
                    render();
                }
            } catch (e) {}
        });
        host.appendChild(frame);
        activate(id);
    }

    function activate(id) {
        activeId = id;
        document.querySelectorAll(".ws-frame").forEach(f => {
            f.style.display = f.dataset.tabId === id ? "block" : "none";
        });
        const t = tabs.find(x => x.id === id);
        if (t && window.sbSetActiveByPage) sbSetActiveByPage(t.page);
        render();
        scrollTabIntoView(id);
    }

    function closeTab(id) {
        const idx = tabs.findIndex(t => t.id === id);
        if (idx === -1) return;

        tabs.splice(idx, 1);
        document.querySelector(`.ws-frame[data-tab-id="${id}"]`)?.remove();

        if (activeId === id) {
            const next = tabs[idx] || tabs[idx - 1];
            if (next) activate(next.id); else { activeId = null; render(); }
        } else {
            render();
        }
    }

    function closeAll() {
        tabs.slice().forEach(t => closeTab(t.id));
        closeKebab();
    }

    function scrollTabIntoView(id) {
        requestAnimationFrame(() => {
            const el = document.querySelector(`.ws-tab[data-id="${id}"]`);
            el?.scrollIntoView({ block: "nearest", inline: "nearest" });
        });
    }

    // --------------------------------------------------
    // width calc: 1 tab natural; >=2 tabs even-divide down
    // to MIN_W, below that -> fixed MIN_W + horizontal scroll
    // --------------------------------------------------

    function computeWidths(containerWidth) {
        const n = tabs.length;
        if (n === 0) return [];
        if (n === 1) {
            return [Math.min(MAX_W, Math.max(MIN_W, measure(tabs[0].title) + NATURAL_PAD))];
        }
        const even = containerWidth / n;
        if (even >= MIN_W) return tabs.map(() => Math.min(even, MAX_W));
        return tabs.map(() => MIN_W); // overflow mode
    }

    // --------------------------------------------------
    // render
    // --------------------------------------------------

    function render() {
        const bar = document.getElementById("wsTabbar");
        const scrollEl = document.getElementById("wsTabScroll");
        if (!bar || !scrollEl) return;

        if (tabs.length === 0) { bar.style.display = "none"; return; }
        bar.style.display = "flex";

        const containerWidth = scrollEl.clientWidth || 600;
        const widths = computeWidths(containerWidth);

        scrollEl.innerHTML = tabs.map((t, i) => `
            <div class="ws-tab ${t.id === activeId ? "active" : ""}" data-id="${t.id}" style="width:${widths[i]}px">
                <span class="ws-tab-label">${esc(t.title)}</span>
                <button class="ws-tab-close" data-close="${t.id}" title="Close">✕</button>
            </div>
        `).join("");

        bindTabEvents();
        updateOverflowUI();
    }

    function bindTabEvents() {
        document.querySelectorAll(".ws-tab").forEach(el => {
            el.addEventListener("click", e => {
                if (e.target.closest(".ws-tab-close")) return;
                if (el.dataset.dragged === "1") { el.dataset.dragged = "0"; return; }
                activate(el.dataset.id);
            });
            el.querySelector(".ws-tab-close").addEventListener("click", e => {
                e.stopPropagation();
                closeTab(el.dataset.id);
            });
            el.addEventListener("pointerdown", onTabPointerDown);
        });
    }

    // --------------------------------------------------
    // drag: vertical-first = reorder (with edge auto-scroll),
    // horizontal-first = plain scroll
    // --------------------------------------------------

    function onTabPointerDown(e) {
        if (e.target.closest(".ws-tab-close")) return;

        const el = e.currentTarget;
        const scrollEl = document.getElementById("wsTabScroll");
        const startX = e.clientX, startY = e.clientY;
        const startScrollLeft = scrollEl.scrollLeft;
        let mode = null, edgeDir = 0, raf = null;

        el.setPointerCapture(e.pointerId);

        function autoScroll() {
            if (edgeDir !== 0) scrollEl.scrollLeft += edgeDir * 14;
            raf = requestAnimationFrame(autoScroll);
        }
        autoScroll();

        function onMove(ev) {
            const dx = ev.clientX - startX, dy = ev.clientY - startY;

            if (!mode) {
                if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
                    mode = "reorder"; el.classList.add("ws-dragging"); el.dataset.dragged = "1";
                } else if (Math.abs(dx) > 8) {
                    mode = "scroll"; el.dataset.dragged = "1";
                }
            }

            if (mode === "scroll") {
                scrollEl.scrollLeft = startScrollLeft - dx;
            } else if (mode === "reorder") {
                const rect = scrollEl.getBoundingClientRect();
                edgeDir = ev.clientX > rect.right - 44 ? 1 : ev.clientX < rect.left + 44 ? -1 : 0;

                const overEl = document.elementFromPoint(ev.clientX, rect.top + rect.height / 2)?.closest(".ws-tab");
                if (overEl && overEl !== el) {
                    const r = overEl.getBoundingClientRect();
                    const before = ev.clientX < r.left + r.width / 2;
                    overEl.parentNode.insertBefore(el, before ? overEl : overEl.nextSibling);
                }
            }
        }

        function onUp() {
            cancelAnimationFrame(raf);
            el.releasePointerCapture(e.pointerId);
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerup", onUp);
            el.classList.remove("ws-dragging");
            if (mode === "reorder") syncOrderFromDom();
            updateOverflowUI();
        }

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
    }

    function syncOrderFromDom() {
        const ids = [...document.querySelectorAll("#wsTabScroll .ws-tab")].map(e => e.dataset.id);
        tabs = ids.map(id => tabs.find(t => t.id === id));
    }

    // --------------------------------------------------
    // overflow: arrows + right fade + kebab (only shows
    // tabs currently NOT fully visible in the scroller)
    // --------------------------------------------------

    function updateOverflowUI() {
        const scrollEl = document.getElementById("wsTabScroll");
        const overflow = scrollEl.scrollWidth > scrollEl.clientWidth + 1;

        document.getElementById("wsArrowLeft").style.display = overflow ? "flex" : "none";
        document.getElementById("wsArrowRight").style.display = overflow ? "flex" : "none";

        const atEnd = scrollEl.scrollLeft + scrollEl.clientWidth >= scrollEl.scrollWidth - 2;
        document.getElementById("wsFadeRight").style.opacity = (overflow && !atEnd) ? "1" : "0";

        document.getElementById("wsKebab").classList.toggle("has-overflow", overflow);
    }

    function getHiddenTabs() {
        const scrollEl = document.getElementById("wsTabScroll");
        const scrollRect = scrollEl.getBoundingClientRect();
        const hidden = [];
        document.querySelectorAll(".ws-tab").forEach(el => {
            const r = el.getBoundingClientRect();
            const fullyVisible = r.left >= scrollRect.left - 0.5 && r.right <= scrollRect.right + 0.5;
            if (!fullyVisible) hidden.push(el.dataset.id);
        });
        return tabs.filter(t => hidden.includes(t.id));
    }

    function openKebab() {
        closeKebab();
        const hiddenTabs = getHiddenTabs();

        const pop = document.createElement("div");
        pop.id = "wsKebabPopup";
        pop.className = "ws-kebab-popup";
        pop.innerHTML = `
            <button class="ws-kebab-item ws-kebab-danger" id="wsCloseAllBtn">Close all tabs</button>
            ${hiddenTabs.length ? `<hr>${hiddenTabs.map(t => `<div class="ws-kebab-item ws-kebab-tab" data-id="${t.id}">${esc(t.title)}</div>`).join("")}` : ""}
        `;
        document.body.appendChild(pop);

        const btn = document.getElementById("wsKebab");
        const r = btn.getBoundingClientRect();
        pop.style.top = (r.bottom + 4) + "px";
        pop.style.right = (window.innerWidth - r.right) + "px";
        pop.style.maxHeight = "70vh";
        pop.style.overflowY = "auto";

        document.getElementById("wsCloseAllBtn").onclick = closeAll;
        pop.querySelectorAll(".ws-kebab-tab").forEach(row => {
            row.onclick = () => { activate(row.dataset.id); closeKebab(); };
        });

        setTimeout(() => document.addEventListener("click", onOutsideKebab), 0);
    }

    function onOutsideKebab(e) {
        const pop = document.getElementById("wsKebabPopup");
        if (pop && !pop.contains(e.target) && e.target.id !== "wsKebab") closeKebab();
    }

    function closeKebab() {
        document.getElementById("wsKebabPopup")?.remove();
        document.removeEventListener("click", onOutsideKebab);
    }

    // --------------------------------------------------
    // init
    // --------------------------------------------------

    function init() {
        document.getElementById("wsArrowLeft").onclick = () =>
            document.getElementById("wsTabScroll").scrollBy({ left: -150, behavior: "smooth" });
        document.getElementById("wsArrowRight").onclick = () =>
            document.getElementById("wsTabScroll").scrollBy({ left: 150, behavior: "smooth" });
        document.getElementById("wsKebab").onclick = openKebab;
        document.getElementById("wsTabScroll").addEventListener("scroll", updateOverflowUI);
        window.addEventListener("resize", render);
    }

    return { init, openTab, activate, closeTab, closeAll };

})();

window.Workspace = Workspace;