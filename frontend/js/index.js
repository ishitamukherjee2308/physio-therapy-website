// APPOINTMENT FORM LOGIC

document.addEventListener('DOMContentLoaded', () => {
    const appointmentForm = document.getElementById('appointmentForm');

    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = {
                name: document.getElementById('name').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                date: document.getElementById('date').value,
                time: "05:00 PM",
                message: document.getElementById('message').value.trim()
            };

            if (!formData.name || !formData.phone || !formData.date) {
                alert("Please fill in all required fields.");
                return;
            }

            const submitBtn = this.querySelector('.btn') || this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;

            submitBtn.innerText = "Processing...";
            submitBtn.style.opacity = "0.7";
            submitBtn.disabled = true;

            try {
                const response = await fetch('http://localhost:5000/api/appointments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert(`Thank you, ${formData.name}! Your appointment request has been confirmed. Dr. Subhajit Mukherjee will contact you shortly.`);
                    appointmentForm.reset();
                    window.location.href = "index.html";
                } else {
                    alert(`Submission failed: ${result.message || 'Unknown server error.'}`);
                }

            } catch (error) {
                console.error("API Link Failure:", error);
                alert("Unable to reach the appointment server. Please double-check if your Node back-end is actively running on port 5000!");
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.style.opacity = "1";
                submitBtn.disabled = false;
            }
        });
    }

    // DATE PICKER - MINIMUM DATE RESTRICTION
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});