/* APPOINTMENT & DATABASE INTEGRATION LOGIC*/
document.addEventListener('DOMContentLoaded', () => {
    const appointmentForm = document.getElementById('appointmentForm');
    const modal = document.getElementById('confirmModal');
    const closeModal = document.getElementById('closeModal');
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const backendUrl = (isLocalHost || window.location.protocol === 'file:') && window.location.port !== '5000'
        ? `http://${isLocalHost ? window.location.hostname : 'localhost'}:5000`
        : '';

    revealElements();

    /* 1. FORM SUBMISSION & BACKEND CONNECTION */
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = appointmentForm.querySelector('.btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Processing...";
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";

            const payload = {
                name: document.getElementById('name').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                date: document.getElementById('date').value,
                message: document.getElementById('message').value.trim()
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
                    }
                    appointmentForm.reset();
                } else {
                    alert(result.message || "Failed to submit request. Please check your inputs.");
                }
            } catch (error) {
                console.error("Database Connection Error:", error);
                alert("The server is currently offline. Start it with: node backend/server.js");
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";
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

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            window.location.href = "index.html";
        }
    });

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

    window.addEventListener('scroll', revealElements);

    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});
