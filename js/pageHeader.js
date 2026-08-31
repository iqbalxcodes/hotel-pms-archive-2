// ======================================================
// pageHeader.js
// Header bar bersama: greeting (kiri) + gear icon + jam
// live (kanan). SATU implementasi dipakai di semua halaman
// — jangan duplikasi logic ini di file lain.
//
// HTML cukup butuh:
//   <div id="pageHeaderBar" class="page-header-bar"></div>
// Isi-nya di-generate lewat JS di sini.
//
// initPageHeader() aman dipanggil berkali-kali: selalu
// rebuild innerHTML & clear timer lama dulu.
// ======================================================

let clockIntervalHandle;
let greetingTimerHandle;

function initPageHeader() {
    const bar = document.getElementById("pageHeaderBar");
    if (!bar) return;

    bar.innerHTML = `
        <span id="pageGreeting" class="page-greeting">Loading…</span>
        <div class="page-header-right">
            <a href="settings.html" class="page-gear-btn" title="Settings" aria-label="Settings">&#9881;</a>
            <div class="page-header-clock">
                <span id="pageClockDate"></span><span id="pageClockTime"></span>
            </div>
        </div>
    `;

    renderGreeting();
    startPageClock();
}

// Panggil ulang fungsi ini setelah data user/hotel selesai
// dimuat (mis. dari supabase.js / auth.js), supaya nama
// tamu/staff yang login ikut muncul di greeting.
function refreshPageGreeting() {
    renderGreeting();
}

function renderGreeting() {
    const el = document.getElementById("pageGreeting");
    if (!el) return;

    clearTimeout(greetingTimerHandle);

    // TODO: ganti dua baris ini sesuai variabel global auth
    // Hotel PMS-mu (yang di-set di js/auth.js atau supabase.js)
    const hotelName = (window.currentHotel && window.currentHotel.name) || "Hotel PMS";
    const user = window.currentUser || null;

    if (!user) {
        el.textContent = hotelName;
        return;
    }

    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    const firstName = (user.full_name || user.name || "").split(" ")[0];
    el.textContent = firstName ? `${greeting}, ${firstName}!` : hotelName;

    greetingTimerHandle = setTimeout(() => {
        el.textContent = hotelName;
    }, 3000);
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