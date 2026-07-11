/*CLINICAL CORE AUTHENTICATION CONTROLLER*/
document.addEventListener('DOMContentLoaded', async () => {
    const authForm = document.getElementById('authForm');
    const authContainer = document.getElementById('authContainer');
    const toRegister = document.getElementById('toRegister');
    const toLogin = document.getElementById('toLogin');
    const formSubtitle = document.getElementById('formSubtitle');
    const submitBtn = document.getElementById('submitBtn');

    const BACKEND_URL = '';

    // 1. SESSION STABILITY
    try {
        const sessionCheck = await fetch(`${BACKEND_URL}/api/auth/check-role`, { credentials: 'include' });
        if (sessionCheck.ok) {
            const data = await sessionCheck.json();
            if (data.role === 'doctor') window.location.href = 'admin.html';
            else if (data.role === 'patient') window.location.href = 'dashboard.html';
        }
    } catch (err) {
        console.warn("Session check skipped.");
    }

    // 2. UI TOGGLE & FILE FEEDBACK
    const setMode = (isRegister) => {
        if (!authContainer) return;
        authContainer.className = isRegister ? 'auth-container mode-register' : 'auth-container mode-login';
        if (formSubtitle) formSubtitle.innerText = isRegister ? "Register for clinical access." : "Secure professional authentication.";
    };

    document.addEventListener('change', (e) => {
        if (e.target.matches('input[type="file"]')) {
            const previewDiv = document.getElementById(`preview-${e.target.id}`);
            if (previewDiv && e.target.files.length > 0) {
                previewDiv.innerText = `✅ ${e.target.files[0].name}`;
                previewDiv.style.color = "#28a745";
            }
        }
    });

    // 3. SUCCESS MODAL
    const showSuccessModal = () => {
        if (document.getElementById('successModal')) return;

        const modal = document.createElement('div');
        modal.id = 'successModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="success-checkmark">
                    <div class="check-icon"></div>
                </div>
                <h3>Registration Successful!</h3>
                <button id="okBtn" class="auth-btn" style="cursor:pointer; margin-top:20px;">OK</button>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('okBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.remove();
            setMode(false);
        });
    };

    // 4. CLICK-BASED SUBMISSION
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        submitBtn.disabled = true;

        const isRegistering = authContainer.classList.contains('mode-register');
        const formData = new FormData(authForm);
        const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                body: isRegistering ? formData : JSON.stringify(Object.fromEntries(formData)),
                headers: isRegistering ? {} : { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                if (isRegistering) {
                    showSuccessModal();
                } else {
                    window.location.href = result.role === 'doctor' ? 'admin.html' : 'dashboard.html';
                }
            } else {
                alert(result.message || "Authentication failed.");
            }
        } catch (err) {
            console.error("Auth Error:", err);
            alert("Connection error. Please check your network.");
        } finally {
            submitBtn.disabled = false;
        }
    });

    toRegister?.addEventListener('click', (e) => {
        e.preventDefault();
        setMode(true);
    });

    toLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        setMode(false);
    });

    // 5. DROPDOWN INIT
    document.querySelectorAll('select').forEach(el => {
        if (typeof Choices !== 'undefined') {
            new Choices(el, {
                searchEnabled: false,
                itemSelectText: '',
                shouldSort: false
            });
        }
    });
});
