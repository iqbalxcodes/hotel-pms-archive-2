// ======================================================
// pageHeader.js
// Shell mode: greeting/gear/jam + workspace tab bar.
// Guard: kalau file ini di-load DI DALAM iframe (dibuka oleh
// shell lewat Workspace), skip total — shell yang render chrome.
// ======================================================

let clockIntervalHandle, greetingTimerHandle;

function initPageHeader() {
    if (window.self !== window.top) return; // di dalam iframe, shell yang render header

    const bar = document.getElementById("pageHeaderBar");
    if (!bar) return;

    bar.innerHTML = `
        <div class="page-header-top">
            <span id="pageGreeting" class="page-greeting">Loading…</span>
            <div class="page-header-right">
                <a href="settings.html" class="page-gear-btn" title="Settings">&#9881;</a>
                <div class="page-header-clock">
                    <span id="pageClockDate"></span><span id="pageClockTime"></span>
                </div>
            </div>
        </div>
        <div class="ws-tabbar" id="wsTabbar">
            <button class="ws-tab-arrow" id="wsArrowLeft">‹</button>
            <div class="ws-tab-scroll-wrap">
                <div class="ws-tab-scroll" id="wsTabScroll"></div>
                <div class="ws-tab-fade-right" id="wsFadeRight"></div>
            </div>
            <button class="ws-tab-arrow" id="wsArrowRight">›</button>
            <button class="ws-kebab" id="wsKebab">⋮</button>
        </div>
    `;

    renderGreeting();
    startPageClock();

    if (window.Workspace && document.getElementById("wsContent")) Workspace.init();
}

function refreshPageGreeting() { renderGreeting(); }

function renderGreeting() {
    const el = document.getElementById("pageGreeting");
    if (!el) return;
    clearTimeout(greetingTimerHandle);

    const hotelName = (window.currentHotel && window.currentHotel.name) || "Hotel PMS";
    const user = window.currentUser || null;

    if (!user) { el.textContent = hotelName; return; }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
    const firstName = (user.full_name || user.name || "").split(" ")[0];
    el.textContent = firstName ? `${greeting}, ${firstName}!` : hotelName;

    greetingTimerHandle = setTimeout(() => { el.textContent = hotelName; }, 3000);
}

function startPageClock() {
    const dateEl = document.getElementById("pageClockDate");
    const timeEl = document.getElementById("pageClockTime");
    if (!dateEl && !timeEl) return;
    if (clockIntervalHandle !== undefined) clearInterval(clockIntervalHandle);

    function tick() {
        const now = new Date();
        if (dateEl) dateEl.textContent = now.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
        if (timeEl) timeEl.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    tick();
    clockIntervalHandle = setInterval(tick, 1000);
}

window.initPageHeader = initPageHeader;
window.refreshPageGreeting = refreshPageGreeting;