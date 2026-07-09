// 3D GLASSMORPHIC INTERACTIVE INTERFACE ENGINE

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.faq-card');

    // Animation frame tracking
    let animationFrameId = null;

    // 1. HARDWARE-ACCELERATED 3D TILT MATRIX
    const handleTilt = (e, card) => {
        const rect = card.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(() => {
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
    };

    const resetTilt = (card) => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(() => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    };

    // 2. SCROLL REVEAL PIPELINE
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px"
    };

    const revealOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;

                card.style.opacity = "1";
                card.style.transform = "translateY(0)";

                setTimeout(() => {
                    card.style.transition = "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.4s ease, box-shadow 0.4s ease";
                    attachTiltListeners(card);
                }, 800);

                revealOnScroll.unobserve(card);
            }
        });
    }, revealOptions);

    // 3. SYSTEM BOUNDARY INITIALIZATION
    const attachTiltListeners = (card) => {
        card.addEventListener('mousemove', (e) => handleTilt(e, card));
        card.addEventListener('mouseleave', () => resetTilt(card));
    };

    cards.forEach(card => {
        card.style.opacity = "0";
        card.style.transform = "translateY(40px)";
        card.style.transition = "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.8s ease-out";

        revealOnScroll.observe(card);
    });
});