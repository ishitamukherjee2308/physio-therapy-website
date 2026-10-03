// FRONTEND HOME PAGE INTERACTIVITY ENGINE

document.addEventListener('DOMContentLoaded', () => {
    // 1. DYNAMIC BACKEND URL RESOLUTION
    const getBackendUrl = () => {
        if (window.location.port === '5000') return '';
        if (window.location.protocol === 'file:') return 'http://localhost:5000';
        if (['localhost', '127.0.0.1'].includes(window.location.hostname) ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname.startsWith('10.')) {
            return `http://${window.location.hostname}:5000`;
        }
        return '';
    };
    const backendUrl = getBackendUrl();

    // 2. STICKY NAVBAR SCROLL DYNAMICS
    const navbar = document.getElementById('navbar') || document.querySelector('.navbar');
    if (navbar) {
        const handleNavScroll = () => {
            if (window.scrollY > 40) {
                navbar.classList.add('active');
            } else {
                navbar.classList.remove('active');
            }
        };
        window.addEventListener('scroll', handleNavScroll, { passive: true });
        handleNavScroll();
    }

    // 3. FAQ ACCORDION ENGINE
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            if (!item) return;

            const wasActive = item.classList.contains('active');

            // Close all items
            document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));

            // If it was not open, open it
            if (!wasActive) {
                item.classList.add('active');
            }
        });
    });

    // 4. SCROLL REVEAL OBSERVER
    const revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        revealElements.forEach(el => el.classList.add('active'));
    }

    // 5. ANIMATED STAT COUNTERS
    const statSection = document.getElementById('stats');
    const counters = document.querySelectorAll('.counter');
    let countersAnimated = false;

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target || counter.innerText, 10);
            if (isNaN(target)) return;

            let count = 0;
            const duration = 1200;
            const stepTime = Math.max(20, Math.floor(duration / target));

            const timer = setInterval(() => {
                count += Math.ceil(target / (duration / stepTime));
                if (count >= target) {
                    counter.innerText = `${target}+`;
                    clearInterval(timer);
                } else {
                    counter.innerText = `${count}+`;
                }
            }, stepTime);
        });
    };

    if (statSection && 'IntersectionObserver' in window) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersAnimated) {
                    countersAnimated = true;
                    animateCounters();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        statsObserver.observe(statSection);
    } else if (counters.length > 0) {
        animateCounters();
    }

    // 6. APPOINTMENT FORM FALLBACK (if embedded)
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = {
                name: (document.getElementById('name')?.value || '').trim(),
                phone: (document.getElementById('phone')?.value || '').trim(),
                email: (document.getElementById('email')?.value || '').trim(),
                date: document.getElementById('date')?.value || '',
                time: document.getElementById('time')?.value || '05:00 PM',
                message: (document.getElementById('message')?.value || '').trim()
            };

            if (!formData.name || !formData.phone || !formData.date) {
                alert('Please fill in all required fields (Name, Phone, Date).');
                return;
            }

            const submitBtn = this.querySelector('.btn') || this.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerText : 'Submit';

            if (submitBtn) {
                submitBtn.innerText = 'Processing...';
                submitBtn.style.opacity = '0.7';
                submitBtn.disabled = true;
            }

            try {
                const response = await fetch(`${backendUrl}/api/appointments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert(`Thank you, ${formData.name}! Your appointment request has been submitted. Dr. Subhajit Mukherjee will contact you shortly.`);
                    appointmentForm.reset();
                } else {
                    alert(`Submission failed: ${result.message || 'Unknown server error.'}`);
                }
            } catch (error) {
                console.error('API Error:', error);
                alert('Unable to reach the server. Make sure the backend is running with: node backend/server.js');
            } finally {
                if (submitBtn) {
                    submitBtn.innerText = originalText;
                    submitBtn.style.opacity = '1';
                    submitBtn.disabled = false;
                }
            }
        });
    }

    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});
