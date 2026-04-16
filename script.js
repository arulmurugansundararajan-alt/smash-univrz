/* ═══════════════════════════════════════════════
   SMASH UNIVRZ – Main Script
   ═══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {

    /* ── 1. NAVBAR: scroll shrink + hamburger ─── */
    const navbar   = document.getElementById("navbar");
    const hamburger = document.getElementById("hamburger");
    const navLinks  = document.getElementById("navLinks");

    window.addEventListener("scroll", () => {
        navbar.classList.toggle("scrolled", window.scrollY > 60);
    });

    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("open");
        navLinks.classList.toggle("open");
    });

    // Close mobile menu on link click
    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            hamburger.classList.remove("open");
            navLinks.classList.remove("open");
        });
    });

    /* ── 2. ACTIVE NAV LINK on scroll ─────────── */
    const sections = document.querySelectorAll("section[id], .hero[id]");
    const navAnchors = document.querySelectorAll(".nav-links a[href^='#']");

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navAnchors.forEach(a => a.classList.remove("active"));
                const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
                if (active) active.classList.add("active");
            }
        });
    }, { rootMargin: "-40% 0px -55% 0px" });

    sections.forEach(s => sectionObserver.observe(s));

    /* ── 3. GALLERY SLIDER ─────────────────────── */
    const slides    = document.querySelectorAll(".slide");
    const dotsEl    = document.getElementById("sliderDots");
    const prevBtn   = document.getElementById("prevBtn");
    const nextBtn   = document.getElementById("nextBtn");
    let current     = 0;
    let autoTimer;

    // Build dots
    slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "slider-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", `Slide ${i + 1}`);
        dot.addEventListener("click", () => goTo(i));
        dotsEl.appendChild(dot);
    });

    function goTo(idx) {
        slides[current].classList.remove("active");
        dotsEl.children[current].classList.remove("active");
        current = (idx + slides.length) % slides.length;
        slides[current].classList.add("active");
        dotsEl.children[current].classList.add("active");
        resetAuto();
    }

    function resetAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => goTo(current + 1), 3500);
    }

    prevBtn.addEventListener("click", () => goTo(current - 1));
    nextBtn.addEventListener("click", () => goTo(current + 1));
    resetAuto();

    // Touch/swipe support
    let touchStartX = 0;
    const sliderEl = document.getElementById("slider");
    sliderEl.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    sliderEl.addEventListener("touchend",   e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
    });

    /* ── 4. SCROLL-IN ANIMATIONS ──────────────── */
    const animEls = document.querySelectorAll("[data-animate]");
    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger cards in the same parent
                const siblings = Array.from(entry.target.parentElement.querySelectorAll("[data-animate]"));
                const delay = siblings.indexOf(entry.target) * 100;
                setTimeout(() => entry.target.classList.add("animated"), delay);
                animObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -80px 0px" });

    animEls.forEach(el => animObserver.observe(el));

    /* ── 5. STATS COUNTER ─────────────────────── */
    const statNumbers = document.querySelectorAll(".stat-number[data-target]");

    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        const duration = 1800;
        const step = 16;
        const increment = target / (duration / step);
        let count = 0;

        const timer = setInterval(() => {
            count = Math.min(count + increment, target);
            el.textContent = Math.floor(count);
            if (count >= target) clearInterval(timer);
        }, step);
    }

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statsObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -60px 0px" });

    statNumbers.forEach(el => statsObserver.observe(el));

});
