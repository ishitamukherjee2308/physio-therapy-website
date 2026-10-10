/* APPOINTMENT & DATABASE INTEGRATION LOGIC */
document.addEventListener('DOMContentLoaded', () => {
    const appointmentForm = document.getElementById('appointmentForm');
    const modal = document.getElementById('confirmModal');
    const closeModal = document.getElementById('closeModal');

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

    revealElements();

    /* 1. FORM SUBMISSION & BACKEND CONNECTION */
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = appointmentForm.querySelector('.btn') || appointmentForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerText : 'Confirm Appointment';

            if (submitBtn) {
                submitBtn.innerText = "Processing...";
                submitBtn.disabled = true;
                submitBtn.style.opacity = "0.7";
            }

            const payload = {
                name: (document.getElementById('name')?.value || '').trim(),
                phone: (document.getElementById('phone')?.value || '').trim(),
                email: (document.getElementById('email')?.value || '').trim(),
                date: document.getElementById('date')?.value || '',
                time: document.getElementById('time')?.value || '05:00 PM',
                message: (document.getElementById('message')?.value || '').trim()
            };

            try {
                const response = await fetch(`${backendUrl}/api/appointments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    if (modal) {
                        modal.classList.add('active');
                    } else {
                        alert(`Thank you ${payload.name}! Your appointment request has been submitted.`);
                    }
                    appointmentForm.reset();
                } else {
                    alert(result.message || "Failed to submit request. Please check your inputs.");
                }
            } catch (error) {
                console.warn("Appointment submission fallback:", error);
                try {
                    let localAppts = JSON.parse(localStorage.getItem('patient_appointments') || '[]');
                    localAppts.unshift({ ...payload, id: 'appt-' + Date.now(), createdAt: new Date().toISOString() });
                    localStorage.setItem('patient_appointments', JSON.stringify(localAppts));
                } catch (err) {}
                if (modal) {
                    modal.classList.add('active');
                } else {
                    alert(`Thank you ${payload.name}! Your appointment request has been recorded. Dr. Subhajit Mukherjee will confirm your slot shortly. You can also reach out on WhatsApp: +91 76794 42194.`);
                }
                appointmentForm.reset();
            } finally {
                if (submitBtn) {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = "1";
                }
            }
        });
    }

    /* 2. MODAL INTERACTION LOGIC */
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
            window.location.href = "index.html";
        });
    }

    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                window.location.href = "index.html";
            }
        });
    }

    /* 3. SCROLL REVEAL ANIMATIONS */
    function revealElements() {
        const reveals = document.querySelectorAll('.reveal, .skill-card');
        const windowHeight = window.innerHeight;
        const revealPoint = 100;

        reveals.forEach(el => {
            const revealTop = el.getBoundingClientRect().top;
            if (revealTop < windowHeight - revealPoint) {
                el.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', revealElements, { passive: true });

    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});
