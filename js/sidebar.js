// ======================================================
// sidebar.js
// ======================================================

const SB_KEY_STRUCT = "ph_sidebar_structure";
const SB_KEY_MODE = "ph_sidebar_mode";
const SB_KEY_WIDTH = "ph_sidebar_width";

const SB_DEFAULT_STRUCTURE = [
    { id: "grp-operations", label: "OPERATIONS", icon: "layout-grid", items: [
        { id: "nav-dashboard", label: "Dashboard", icon: "layout-dashboard", href: "dashboard.html" },
        { id: "nav-reservations", label: "Reservations", icon: "calendar-check", href: "index.html" },
        { id: "nav-rooms", label: "Rooms", icon: "bed", href: "room.html" },
        { id: "nav-guests", label: "Guests", icon: "users", href: "guest.html" }
    ]},
    { id: "grp-hotel-ops", label: "HOTEL OPERATIONS", icon: "concierge-bell", items: [
        { id: "nav-housekeeping", label: "Housekeeping", icon: "spray-can", href: "#" },
        { id: "nav-maintenance", label: "Maintenance", icon: "wrench", href: "#" },
        { id: "nav-handover", label: "Handover", icon: "arrow-left-right", href: "#" }
    ]},
    { id: "grp-commercial", label: "COMMERCIAL", icon: "briefcase", items: [
        { id: "nav-events", label: "Event & Group", icon: "party-popper", href: "#" },
        { id: "nav-rates-inv", label: "Rates & Inventory", icon: "tags", href: "#" },
        { id: "nav-companies", label: "Companies", icon: "building-2", href: "#" }
    ]},
    { id: "grp-finance", label: "FINANCE", icon: "wallet", items: [
        { id: "nav-finance", label: "Finance", icon: "banknote", href: "#" },
        { id: "nav-night-audit", label: "Night Audit", icon: "moon-star", href: "#" }
    ]},
    { id: "grp-reports", label: "REPORTS", icon: "bar-chart-3", items: [
        { id: "nav-downtime", label: "Down Time Report", icon: "flame", href: "#" }
    ]},
    { id: "grp-admin", label: "ADMINISTRATION", icon: "shield", items: [
        { id: "nav-property", label: "Property", icon: "building", href: "#" },
        { id: "nav-users", label: "Users", icon: "user-cog", href: "#" },
        { id: "nav-roles", label: "Roles & Permissions", icon: "shield-check", href: "#" },
        { id: "nav-departments", label: "Departments", icon: "network", href: "#" },
        { id: "nav-room-config", label: "Room Configuration", icon: "door-open", href: "#" },
        { id: "nav-rate-config", label: "Rate Configuration", icon: "percent", href: "#" },
        { id: "nav-tax-config", label: "Tax Configuration", icon: "receipt", href: "#" },
        { id: "nav-payment-methods", label: "Payment Methods", icon: "credit-card", href: "#" },
        { id: "nav-business-rules", label: "Business Rules", icon: "scale", href: "#" },
        { id: "nav-integrations", label: "Integrations", icon: "plug", href: "#" },
        { id: "nav-notifications", label: "Notifications", icon: "bell", href: "#" },
        { id: "nav-templates", label: "Templates", icon: "file-text", href: "#" },
        { id: "nav-audit-log", label: "Audit Log", icon: "history", href: "#" },
        { id: "nav-system-settings", label: "System Settings", icon: "settings", href: "#" }
    ]}
];

const SB_CUSTOMIZE_ICON = "layout-panel-left";

let sbStructure = [];
let sbMode = "hidden";
let sbWidth = 260;
let sbCustomizing = false;
let sbShowHidden = false;

// ------------------------------------------------------
// persistence
// ------------------------------------------------------

function sbLoad() {
    try {
        const s = JSON.parse(localStorage.getItem(SB_KEY_STRUCT));
        sbStructure = Array.isArray(s) ? s : JSON.parse(JSON.stringify(SB_DEFAULT_STRUCTURE));
    } catch (e) {
        sbStructure = JSON.parse(JSON.stringify(SB_DEFAULT_STRUCTURE));
    }
    sbMode = localStorage.getItem(SB_KEY_MODE) || "hidden";
    sbWidth = Number(localStorage.getItem(SB_KEY_WIDTH)) || 260;
}

function sbSaveStructure() { localStorage.setItem(SB_KEY_STRUCT, JSON.stringify(sbStructure)); }
function sbSaveMode() { localStorage.setItem(SB_KEY_MODE, sbMode); }
function sbSaveWidth() { localStorage.setItem(SB_KEY_WIDTH, String(sbWidth)); }

// ------------------------------------------------------
// styles
// ------------------------------------------------------

function sbInjectStyle() {
    if (document.getElementById("sbStyle")) return;
    const style = document.createElement("style");
    style.id = "sbStyle";
    style.textContent = `
        .sb-sidebar {
            position: fixed; top: 64px; left: 0; bottom: 0;
            width: 0; background: #fff; border-right: 1px solid transparent;
            display: flex; flex-direction: column;
            z-index: 40; overflow: hidden;
            transition: width .15s ease;
        }
        .sb-sidebar.sb-mode-icon { width: 64px; border-right: 1px solid #eee; }
        .sb-sidebar.sb-mode-full { border-right: 1px solid #ddd; }
        .sb-sidebar.sb-resizing { transition: none; }

        .sb-scroll { flex: 1 1 auto; overflow-y: auto; overflow-x: hidden; padding: 10px 0; }

        .sb-group { margin-bottom: 6px; }
        .sb-group-header {
            display: flex; align-items: center; gap: 10px;
            padding: 8px 16px; font-size: 11px; font-weight: 700;
            letter-spacing: .05em; text-transform: uppercase; color: #9aa0a6;
            white-space: nowrap;
        }
        .sb-mode-icon .sb-group-header { justify-content: center; padding: 8px 0; }
        .sb-mode-icon .sb-group-header .sb-label { display: none; }

        .sb-mode-icon .sb-group-header .sb-edit-row,
        .sb-mode-icon .sb-item { justify-content: center; }
        .sb-mode-icon .sb-edit-row { flex: none; }

        .sb-item {
            display: flex; align-items: center; gap: 10px;
            padding: 8px 14px; margin: 1px 6px; border-radius: 6px;
            color: #333; font-size: 13.5px; text-decoration: none;
            cursor: pointer; white-space: nowrap;
        }
        .sb-item:hover { background: #f2f3f5; }
        .sb-item.sb-active { background: #e3f2fd; color: #1565c0; font-weight: 600; }
        .sb-mode-icon .sb-item { justify-content: center; padding: 10px 0; margin: 2px 8px; }
        .sb-mode-icon .sb-item .sb-label { display: none; }

        .sb-item svg, .sb-group-header svg { width: 17px; height: 17px; flex: none; }

        .sb-resize-handle {
            position: absolute; top: 0; right: 0; bottom: 0; width: 6px;
            cursor: ew-resize;
        }
        .sb-resize-handle:hover { background: rgba(0,0,0,.08); }
        .sb-mode-icon .sb-resize-handle, .sb-mode-hidden .sb-resize-handle { display: none; }

        .sb-footer { flex: none; border-top: 1px solid #eee; padding: 8px; }
        .sb-footer-btn {
            width: 100%; display: flex; align-items: center; gap: 8px;
            padding: 8px 10px; border: none; background: none; border-radius: 6px;
            font-size: 12.5px; color: #666; cursor: pointer; white-space: nowrap;
        }
        .sb-footer-btn:hover { background: #f2f3f5; }
        .sb-mode-icon .sb-footer-btn .sb-label { display: none; }
        .sb-mode-icon .sb-footer-btn { justify-content: center; }
        .sb-footer-row { display: flex; gap: 6px; }
        .sb-footer-row .sb-footer-btn { flex: 1; justify-content: center; padding: 8px 4px; }
        .sb-apply-btn { background: #1565c0 !important; color: #fff !important; }
        .sb-apply-btn:hover { background: #0d47a1 !important; }
        .sb-active-toggle { background: #e3f2fd !important; color: #1565c0 !important; }

        /* customize mode: boundary box putus-putus */
        .sb-customizing .sb-item,
        .sb-customizing .sb-group-header {
            border: 1px dashed rgba(0,0,0,.15);
            border-radius: 6px;
            position: relative;
            padding-right: 26px;
        }
        .sb-hidden-el { opacity: .4; }
        .sb-hide-btn {
            position: absolute; top: 2px; right: 2px;
            width: 16px; height: 16px;
            display: flex; align-items: center; justify-content: center;
            border: none; background: #fff; border-radius: 3px;
            cursor: pointer; color: #888;
        }
        .sb-hide-btn:hover { background: #f0f0f0; color: #333; }
        .sb-hide-btn svg { width: 11px; height: 11px; }

        .sb-edit-row { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .sb-icon-btn-mini {
            flex: none; width: 22px; height: 22px; display: flex; align-items: center;
            justify-content: center; border: 1px dashed #bbb; border-radius: 4px;
            background: #fff; cursor: pointer;
        }
        .sb-icon-btn-mini svg { width: 13px; height: 13px; }
        .sb-label-edit {
            border: none; background: transparent; font: inherit; font-weight: inherit;
            color: inherit; outline: none; flex: 1; min-width: 0;
            border-bottom: 1px dashed transparent;
        }
        .sb-customizing .sb-label-edit { border-bottom-color: #bbb; }
        .sb-drag-handle { flex: none; cursor: grab; color: #bbb; display: flex; }
        .sb-drag-handle svg { width: 14px; height: 14px; }
        .sb-item.sb-dragging, .sb-group.sb-dragging { opacity: .4; }
        .sb-item.sb-drop-before { border-top: 2px solid #1565c0; }
        .sb-item.sb-drop-after { border-bottom: 2px solid #1565c0; }
        .sb-group.sb-drop-before { border-top: 2px solid #1565c0; }
        .sb-group.sb-drop-after { border-bottom: 2px solid #1565c0; }

        /* label: blur/fade overflow, jadi running text on hover */
        .sb-label {
            display: inline-block; overflow: hidden; white-space: nowrap;
            max-width: 100%; min-width: 0; vertical-align: bottom;
            transition-property: transform;
        }
        .sb-label-fade {
            -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
            mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }

        /* icon picker bubble */
        .sb-icon-picker {
            position: fixed; z-index: 200; width: 260px; max-height: 300px;
            background: #fff; border: 1px solid #ccc; border-radius: 10px;
            box-shadow: 0 8px 28px rgba(0,0,0,.18); display: flex; flex-direction: column;
        }
        .sb-icon-picker input {
            margin: 8px; border: 1px solid #ccc; border-radius: 6px;
            padding: 6px 8px; font-size: 12.5px;
        }
        .sb-icon-picker-grid {
            display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px;
            padding: 0 8px 8px; overflow-y: auto;
        }
        .sb-icon-picker-grid button {
            border: 1px solid transparent; background: none; border-radius: 6px;
            padding: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .sb-icon-picker-grid button:hover { background: #f0f7ff; border-color: #90caf9; }
        .sb-icon-picker-grid svg { width: 16px; height: 16px; }

        @media (max-width: 700px) {
            .sb-sidebar.sb-mode-full { width: min(85vw, 300px) !important; box-shadow: 0 0 24px rgba(0,0,0,.25); }
            .sb-sidebar.sb-mode-icon { width: 56px; }
            .sb-backdrop { position: fixed; inset: 64px 0 0 0; background: rgba(0,0,0,.25); z-index: 39; }
        }
    `;
    document.head.appendChild(style);
}

// ------------------------------------------------------
// icon helpers
// ------------------------------------------------------

function sbPascalToKebab(str) { return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(); }
function sbAllIconNames() {
    if (!window.lucide || !window.lucide.icons) return [];
    return Object.keys(window.lucide.icons).map(sbPascalToKebab);
}
function sbIconSvg(name) { return `<i data-lucide="${name}"></i>`; }
function sbRenderIcons() { if (window.lucide) window.lucide.createIcons({ nameAttr: "data-lucide" }); }

// ------------------------------------------------------
// render
// ------------------------------------------------------

function sbGetMount() {
    let mount = document.getElementById("sbMount");
    if (!mount) {
        mount = document.createElement("div");
        mount.id = "sbMount";
        document.body.appendChild(mount);
    }
    return mount;
}

function sbRender() {
    const mount = sbGetMount();

    const modeClass = sbMode === "full" ? "sb-mode-full" : sbMode === "icon" ? "sb-mode-icon" : "sb-mode-hidden";
    const widthStyle = sbMode === "full" ? `style="width:${sbWidth}px"` : "";

    const groupsHtml = sbStructure.map(g => sbRenderGroup(g)).join("");

    mount.innerHTML = `
        <div class="sb-sidebar ${modeClass} ${sbCustomizing ? "sb-customizing" : ""}" id="sbSidebar" ${widthStyle}>
            <div class="sb-scroll" id="sbScroll">${groupsHtml}</div>
            <div class="sb-footer" id="sbFooter"></div>
            <div class="sb-resize-handle" id="sbResizeHandle"></div>
        </div>
    `;

    sbRenderFooter();
    sbRenderIcons();
    sbBindDrag();
    sbBindResize();
    sbBindCustomizeInputs();
    sbBindMarquee();
    sbApplyLabelFade();

    if (sbMode === "full" && window.innerWidth <= 700) {
        let bd = document.getElementById("sbBackdrop");
        if (!bd) {
            bd = document.createElement("div");
            bd.id = "sbBackdrop";
            bd.className = "sb-backdrop";
            bd.onclick = () => sbSetMode("hidden");
            document.body.appendChild(bd);
        }
    } else {
        document.getElementById("sbBackdrop")?.remove();
    }

    sbApplyContentPush();
}

function sbRenderGroup(g) {
    const hidden = !!g.hidden;

    if (hidden && (!sbCustomizing || !sbShowHidden)) return "";

    const itemsHtml = g.items.map(it => sbRenderItem(it, g.id)).join("");

    return `
        <div class="sb-group" data-group-id="${g.id}">
            <div class="sb-group-header ${hidden ? "sb-hidden-el" : ""}" data-group-id="${g.id}" draggable="${sbCustomizing}">
                <div class="sb-edit-row">
                    ${sbCustomizing ? `<span class="sb-drag-handle">${sbIconSvg("grip-vertical")}</span>` : ""}
                    ${sbCustomizing ? `<button class="sb-icon-btn-mini" data-icon-target="group:${g.id}">${sbIconSvg(g.icon)}</button>` : sbIconSvg(g.icon)}
                    ${sbCustomizing
                        ? `<input class="sb-label-edit" data-label-target="group:${g.id}" value="${g.label}">`
                        : `<span class="sb-label">${g.label}</span>`}
                </div>
                ${sbCustomizing ? `<button class="sb-hide-btn" data-hide-target="group:${g.id}" title="${hidden ? "Show" : "Hide"}">${sbIconSvg(hidden ? "plus" : "minus")}</button>` : ""}
            </div>
            <div class="sb-group-items" data-group-id="${g.id}">${itemsHtml}</div>
        </div>
    `;
}

function sbRenderItem(it, groupId) {
    const hidden = !!it.hidden;
    if (hidden && (!sbCustomizing || !sbShowHidden)) return "";

    const active = location.pathname.split("/").pop() === it.href;

    return `
        <a class="sb-item ${active ? "sb-active" : ""} ${hidden ? "sb-hidden-el" : ""}" href="${sbCustomizing ? "javascript:void(0)" : it.href}"
           data-item-id="${it.id}" data-group-id="${groupId}" draggable="true" title="${it.label}">
            ${sbCustomizing ? `<span class="sb-drag-handle">${sbIconSvg("grip-vertical")}</span>` : ""}
            ${sbCustomizing ? `<button class="sb-icon-btn-mini" data-icon-target="item:${it.id}">${sbIconSvg(it.icon)}</button>` : sbIconSvg(it.icon)}
            ${sbCustomizing
                ? `<input class="sb-label-edit" data-label-target="item:${it.id}" value="${it.label}">`
                : `<span class="sb-label">${it.label}</span>`}
            ${sbCustomizing ? `<button class="sb-hide-btn" data-hide-target="item:${it.id}" title="${hidden ? "Show" : "Hide"}">${sbIconSvg(hidden ? "plus" : "minus")}</button>` : ""}
        </a>
    `;
}

function sbRenderFooter() {
    const footer = document.getElementById("sbFooter");
    if (!footer) return;

    if (!sbCustomizing) {
        footer.innerHTML = `
            <div class="sb-footer-row">
                <button class="sb-footer-btn" id="sbCreateGroupBtn" title="Create Group">
                    <span class="sb-label">Group</span>
                </button>
                <button class="sb-footer-btn ${sbShowHidden ? "sb-active-toggle" : ""}" id="sbShowHiddenBtn" title="Show Hidden">
                    <span class="sb-label">Hidden</span>
                </button>
                <button class="sb-footer-btn sb-apply-btn" id="sbApplyBtn" title="Apply">
                    <span class="sb-label">Apply</span>
                </button>
            </div>
        `;
    }

    footer.innerHTML = `
        <div class="sb-footer-row">
            <button class="sb-footer-btn" id="sbCreateGroupBtn" title="Create Group">
                ${sbIconSvg("plus")}<span class="sb-label">Group</span>
            </button>
            <button class="sb-footer-btn ${sbShowHidden ? "sb-active-toggle" : ""}" id="sbShowHiddenBtn" title="Show Hidden">
                ${sbIconSvg(sbShowHidden ? "eye" : "eye-off")}<span class="sb-label">Hidden</span>
            </button>
            <button class="sb-footer-btn sb-apply-btn" id="sbApplyBtn" title="Apply">
                ${sbIconSvg("check")}<span class="sb-label">Apply</span>
            </button>
        </div>
    `;

    document.getElementById("sbCreateGroupBtn").onclick = () => {
        sbStructure.push({ id: "grp-" + Date.now(), label: "Group Name", icon: "shapes", items: [] });
        sbSaveStructure();
        sbRender();
    };
    document.getElementById("sbShowHiddenBtn").onclick = () => {
        sbShowHidden = !sbShowHidden;
        sbRender();
    };
    document.getElementById("sbApplyBtn").onclick = () => {
        sbCustomizing = false;
        sbShowHidden = false;
        sbSaveStructure();
        sbRender();
    };

    sbRenderIcons();
}

function sbApplyContentPush() {
    const content = document.querySelector(".table-container");
    if (!content) return;
    if (sbMode === "hidden" || (sbMode === "full" && window.innerWidth <= 700)) {
        content.style.marginLeft = "";
    } else if (sbMode === "icon") {
        content.style.marginLeft = "64px";
    } else if (sbMode === "full") {
        content.style.marginLeft = sbWidth + "px";
    }
}

// ------------------------------------------------------
// mode cycling + header icon sync
// ------------------------------------------------------

function sbUpdateHamburgerIcon() {
    const btn = document.querySelector(".ph-hamburger-btn");
    if (!btn) return;
    const iconName = sbMode === "hidden" ? "menu" : sbMode === "full" ? "panel-left-close" : "x";
    btn.innerHTML = sbIconSvg(iconName);
    sbRenderIcons();
}

function sbSetMode(mode) {
    sbMode = mode;
    sbSaveMode();
    sbRender();
    sbUpdateHamburgerIcon();
}

function sbCycleMode() {
    if (sbMode === "hidden") sbSetMode("full");
    else if (sbMode === "full") sbSetMode("icon");
    else sbSetMode("hidden");
}

// ------------------------------------------------------
// resize
// ------------------------------------------------------

function sbBindResize() {
    const handle = document.getElementById("sbResizeHandle");
    const sidebar = document.getElementById("sbSidebar");
    if (!handle || !sidebar) return;

    handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        sidebar.classList.add("sb-resizing");

        const onMove = (ev) => {
            const w = Math.min(420, Math.max(200, ev.clientX));
            sbWidth = w;
            sidebar.style.width = w + "px";
            sbApplyContentPush();
            sbApplyLabelFade();
        };
        const onUp = () => {
            sidebar.classList.remove("sb-resizing");
            sbSaveWidth();
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    });
}

// ------------------------------------------------------
// inline label / icon / hide edit
// ------------------------------------------------------

function sbFindTarget(ref) {
    const [type, id] = ref.split(":");
    if (type === "group") return sbStructure.find(g => g.id === id);
    for (const g of sbStructure) {
        const it = g.items.find(i => i.id === id);
        if (it) return it;
    }
    return null;
}

function sbToggleHidden(ref) {
    const t = sbFindTarget(ref);
    if (!t) return;
    t.hidden = !t.hidden;
    sbSaveStructure();
    sbRender();
}

function sbBindCustomizeInputs() {
    if (!sbCustomizing) return;

    document.querySelectorAll(".sb-label-edit").forEach(input => {
        input.addEventListener("change", () => {
            const target = sbFindTarget(input.dataset.labelTarget);
            if (target) { target.label = input.value || "Group Name"; sbSaveStructure(); }
        });
        input.addEventListener("click", e => e.stopPropagation());
    });

    document.querySelectorAll("[data-icon-target]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            sbOpenIconPicker(btn, btn.dataset.iconTarget);
        });
    });

    document.querySelectorAll("[data-hide-target]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            sbToggleHidden(btn.dataset.hideTarget);
        });
    });
}

function sbOpenIconPicker(anchor, ref) {
    document.getElementById("sbIconPicker")?.remove();

    const rect = anchor.getBoundingClientRect();
    const picker = document.createElement("div");
    picker.id = "sbIconPicker";
    picker.className = "sb-icon-picker";
    picker.style.top = Math.min(rect.bottom + 4, window.innerHeight - 320) + "px";
    picker.style.left = Math.min(rect.left, window.innerWidth - 280) + "px";
    picker.innerHTML = `
        <input type="text" placeholder="Search icon..." id="sbIconSearch">
        <div class="sb-icon-picker-grid" id="sbIconGrid"></div>
    `;
    document.body.appendChild(picker);

    const allIcons = sbAllIconNames();
    const grid = document.getElementById("sbIconGrid");

    function renderGrid(filter) {
        const list = filter
            ? allIcons.filter(n => n.includes(filter.toLowerCase()))
            : allIcons;
        grid.innerHTML = list.map(n => `<button data-icon="${n}">${sbIconSvg(n)}</button>`).join("");
        sbRenderIcons();
        grid.querySelectorAll("button").forEach(b => {
            b.onclick = () => {
                const target = sbFindTarget(ref);
                if (target) { target.icon = b.dataset.icon; sbSaveStructure(); }
                picker.remove();
                sbRender();
            };
        });
    }

    renderGrid("");
    document.getElementById("sbIconSearch").addEventListener("input", (e) => renderGrid(e.target.value));

    setTimeout(() => {
        document.addEventListener("click", function closeOnce(ev) {
            if (!picker.contains(ev.target)) {
                picker.remove();
                document.removeEventListener("click", closeOnce);
            }
        });
    }, 0);
}

// ------------------------------------------------------
// label overflow -> blur/fade, running text on hover
// ------------------------------------------------------

function sbBindMarquee() {
    document.querySelectorAll(".sb-label").forEach(el => {
        el.addEventListener("mouseenter", () => {
            const over = el.scrollWidth - el.clientWidth;
            if (over <= 1) return;
            el.classList.remove("sb-label-fade");
            el.style.transitionDuration = Math.max(0.4, over / 40) + "s";
            el.style.transform = `translateX(-${over}px)`;
        });
        el.addEventListener("mouseleave", () => {
            el.style.transform = "translateX(0)";
            el.style.transitionDuration = ".3s";
            setTimeout(sbApplyLabelFade, 300);
        });
    });
}

function sbApplyLabelFade() {
    document.querySelectorAll(".sb-label").forEach(el => {
        el.classList.toggle("sb-label-fade", el.scrollWidth - el.clientWidth > 1);
    });
}

// ------------------------------------------------------
// drag & drop reorder
// ------------------------------------------------------

function sbBindDrag() {
    let draggedItem = null;
    let draggedGroup = null;

    document.querySelectorAll(".sb-item").forEach(el => {
        el.addEventListener("dragstart", (e) => {
            if (e.target.closest(".sb-hide-btn, .sb-icon-btn-mini, .sb-label-edit")) { e.preventDefault(); return; }
            draggedItem = el;
            el.classList.add("sb-dragging");
        });
        el.addEventListener("dragend", () => {
            el.classList.remove("sb-dragging");
            document.querySelectorAll(".sb-item").forEach(x => x.classList.remove("sb-drop-before", "sb-drop-after"));
            sbSyncStructureFromDom();
        });
        el.addEventListener("dragover", (e) => {
            if (!draggedItem || draggedItem === el) return;
            const sameGroup = draggedItem.dataset.groupId === el.dataset.groupId;
            if (!sameGroup && !sbCustomizing) return;
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            const before = e.clientY < rect.top + rect.height / 2;
            document.querySelectorAll(".sb-item").forEach(x => x.classList.remove("sb-drop-before", "sb-drop-after"));
            el.classList.add(before ? "sb-drop-before" : "sb-drop-after");
        });
        el.addEventListener("drop", (e) => {
            e.preventDefault();
            if (!draggedItem || draggedItem === el) return;
            const sameGroup = draggedItem.dataset.groupId === el.dataset.groupId;
            if (!sameGroup && !sbCustomizing) return;
            const rect = el.getBoundingClientRect();
            const before = e.clientY < rect.top + rect.height / 2;
            el.parentNode.insertBefore(draggedItem, before ? el : el.nextSibling);
            draggedItem.dataset.groupId = el.dataset.groupId;
        });
    });

    document.querySelectorAll(".sb-group-items").forEach(zone => {
        zone.addEventListener("dragover", (e) => { if (sbCustomizing) e.preventDefault(); });
        zone.addEventListener("drop", (e) => {
            if (!sbCustomizing || !draggedItem) return;
            e.preventDefault();
            if (e.target === zone) {
                zone.appendChild(draggedItem);
                draggedItem.dataset.groupId = zone.dataset.groupId;
            }
        });
    });

    if (sbCustomizing) {
        document.querySelectorAll(".sb-group-header").forEach(el => {
            el.addEventListener("dragstart", (e) => {
                if (e.target.closest(".sb-label-edit, .sb-icon-btn-mini, .sb-hide-btn")) { e.preventDefault(); return; }
                draggedGroup = el.closest(".sb-group");
                draggedGroup.classList.add("sb-dragging");
            });
            el.addEventListener("dragend", () => {
                draggedGroup?.classList.remove("sb-dragging");
                document.querySelectorAll(".sb-group").forEach(x => x.classList.remove("sb-drop-before", "sb-drop-after"));
                sbSyncStructureFromDom();
            });
        });
        document.querySelectorAll(".sb-group").forEach(el => {
            el.addEventListener("dragover", (e) => {
                if (!draggedGroup || draggedGroup === el) return;
                e.preventDefault();
                const rect = el.getBoundingClientRect();
                const before = e.clientY < rect.top + rect.height / 2;
                document.querySelectorAll(".sb-group").forEach(x => x.classList.remove("sb-drop-before", "sb-drop-after"));
                el.classList.add(before ? "sb-drop-before" : "sb-drop-after");
            });
            el.addEventListener("drop", (e) => {
                if (!draggedGroup || draggedGroup === el) return;
                e.preventDefault();
                const rect = el.getBoundingClientRect();
                const before = e.clientY < rect.top + rect.height / 2;
                el.parentNode.insertBefore(draggedGroup, before ? el : el.nextSibling);
            });
        });
    }
}

function sbSyncStructureFromDom() {
    const scroll = document.getElementById("sbScroll");
    if (!scroll) return;

    const newStructure = [...scroll.querySelectorAll(".sb-group")].map(gEl => {
        const gId = gEl.dataset.groupId;
        const g = sbStructure.find(x => x.id === gId) || { id: gId, label: "Group", icon: "shapes" };
        const items = [...gEl.querySelectorAll(".sb-item")].map(iEl => {
            const iId = iEl.dataset.itemId;
            for (const grp of sbStructure) {
                const found = grp.items.find(x => x.id === iId);
                if (found) return found;
            }
            return null;
        }).filter(Boolean);
        return { ...g, items };
    });

    sbStructure = newStructure;
    sbSaveStructure();
}

// ------------------------------------------------------
// init
// ------------------------------------------------------

function initSidebar() {
    sbInjectStyle();
    sbLoad();
    sbRender();
    sbUpdateHamburgerIcon();

    document.addEventListener("ph:toggle-nav", sbCycleMode);
    window.addEventListener("resize", () => sbApplyContentPush());
}