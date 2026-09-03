// ======================================================
// tableScrollEdge.js
// Edge-hover scroll card. Nempel otomatis ke semua .table-scroll
// yang overflow horizontal. Native scroll manual tetap jalan.
// ======================================================

(function(){

    const EDGE_ZONE = 32;
    const SCROLL_STEP = 220;

    function makeCard(side){

        const card = document.createElement("div");
        card.className = `table-scroll-edge-card edge-${side}`;
        card.textContent = side === "left" ? "‹" : "›";
        card.style.cssText = `
            position:absolute; ${side}:4px; z-index:20; display:none;
            width:28px; height:36px; margin-top:-18px;
            align-items:center; justify-content:center;
            background:#fff; border:1px solid #ccc; border-radius:4px;
            box-shadow:0 2px 6px rgba(0,0,0,0.15);
            cursor:pointer; font-size:14px; color:#444; user-select:none;
        `;

        return card;

    }

    function setupEdgeScroll(container){

        if(container.dataset.edgeScrollReady) return;
        container.dataset.edgeScrollReady = "1";

        if(getComputedStyle(container).position === "static"){
            container.style.position = "relative";
        }

        const leftCard = makeCard("left");
        const rightCard = makeCard("right");

        container.appendChild(leftCard);
        container.appendChild(rightCard);

        leftCard.addEventListener("click", () => {
            container.scrollBy({ left: -SCROLL_STEP, behavior: "smooth" });
        });

        rightCard.addEventListener("click", () => {
            container.scrollBy({ left: SCROLL_STEP, behavior: "smooth" });
        });

        container.addEventListener("pointermove", (e) => {

            const hasOverflow = container.scrollWidth > container.clientWidth;

            if(!hasOverflow){
                leftCard.style.display = "none";
                rightCard.style.display = "none";
                return;
            }

            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const canLeft = container.scrollLeft > 0;
            const canRight = container.scrollLeft < container.scrollWidth - container.clientWidth - 1;

            const nearLeft = x <= EDGE_ZONE && canLeft;
            const nearRight = x >= rect.width - EDGE_ZONE && canRight;

            leftCard.style.display = nearLeft ? "flex" : "none";
            rightCard.style.display = nearRight ? "flex" : "none";

            if(nearLeft) leftCard.style.top = y + "px";
            if(nearRight) rightCard.style.top = y + "px";

        });

        container.addEventListener("pointerleave", () => {
            leftCard.style.display = "none";
            rightCard.style.display = "none";
        });

    }

    document.addEventListener("DOMContentLoaded", () => {

        document.querySelectorAll(".table-scroll").forEach(setupEdgeScroll);

    });

})();