// PROCESS TIMELINE INTERACTION & ENGINE

document.addEventListener('DOMContentLoaded', () => {
    const stepItems = document.querySelectorAll('.step-item');
    const glowLine = document.querySelector('.glow-line');
    const container = document.querySelector('.timeline-container');

    // 1. HIGH-PERFORMANCE SCROLL REVEAL
    const revealOptions = {
        threshold: 0.20,
        rootMargin: "0px 0px -60px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, revealOptions);

    stepItems.forEach(item => {
        revealObserver.observe(item);
    });

    // 2. DYNAMIC TIMELINE SPINE TRACK GLOW ENGINE
    const updateTimelineGlow = () => {
        if (!container || !glowLine) return;

        const containerRect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const activationLine = viewportHeight * 0.70;

        let trackingDistance = activationLine - containerRect.top;

        if (trackingDistance < 0) trackingDistance = 0;
        if (trackingDistance > containerRect.height) trackingDistance = containerRect.height;

        const glowPercentage = (trackingDistance / containerRect.height) * 100;
        glowLine.style.height = `${glowPercentage}%`;

        // 3. MOVEMENT-BASED STEP DOT COLOR SWITCHES
        stepItems.forEach(item => {
            const itemDot = item.querySelector('.step-dot');
            if (itemDot) {
                const dotTopOffset = itemDot.getBoundingClientRect().top;

                if (dotTopOffset < activationLine) {
                    item.classList.add('passed');
                } else {
                    item.classList.remove('passed');
                }
            }
        });
    };

    window.addEventListener('scroll', updateTimelineGlow, { passive: true });
    window.addEventListener('resize', updateTimelineGlow, { passive: true });

    updateTimelineGlow();
});