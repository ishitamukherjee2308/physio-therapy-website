/*CLINICAL CORE AUTHENTICATION CONTROLLER*/
document.addEventListener('DOMContentLoaded', async () => {
    const authForm = document.getElementById('authForm');
    const authContainer = document.getElementById('authContainer');
    const toRegister = document.getElementById('toRegister');
    const toLogin = document.getElementById('toLogin');
    const formSubtitle = document.getElementById('formSubtitle');
    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');
    const registrationFields = document.querySelectorAll('.register-only input, .register-only select');

    // Vercel serves the frontend and API from one origin. During local work the
    // HTML is commonly opened with Live Server, so requests must use Express on
    // port 5000 instead of Live Server's origin.
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const BACKEND_URL = (isLocalHost || window.location.protocol === 'file:') && window.location.port !== '5000'
        ? `http://${isLocalHost ? window.location.hostname : 'localhost'}:5000`
        : '';

    // 1. SESSION STABILITY
    try {
        const sessionCheck = await fetch(`${BACKEND_URL}/api/auth/check-role`, { credentials: 'include' });
        if (sessionCheck.ok) {
            const data = await sessionCheck.json();
            if (data.role === 'doctor') window.location.href = 'admin.html';
            else if (data.role) window.location.href = 'index.html';
        }
    } catch (err) {
        console.warn("Session check skipped.");
    }

    // 2. UI TOGGLE & FILE FEEDBACK
    const setMode = (isRegister) => {
        if (!authContainer) return;
        authContainer.className = isRegister ? 'auth-container mode-register' : 'auth-container mode-login';
        if (formSubtitle) formSubtitle.innerText = isRegister ? "Register for clinical access." : "Secure professional authentication.";
        registrationFields.forEach((field) => {
            if (field.id === 'regName' || field.id === 'confirmPassword') field.required = isRegister;
        });
        if (formStatus) formStatus.textContent = '';
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

    // 4. FORM SUBMISSION
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isRegistering = authContainer.classList.contains('mode-register');
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('confirmPassword').value;
        if (isRegistering && password !== passwordConfirm) {
            if (formStatus) formStatus.textContent = 'Passwords do not match.';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = isRegistering ? 'Registering...' : 'Signing in...';
        const formData = new FormData(authForm);
        const payload = Object.fromEntries(formData);
        delete payload.passwordConfirm;
        const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                // Documents are not stored by the current server, so sending a
                // small JSON payload avoids serverless multipart upload limits.
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json')
                ? await response.json()
                : { message: `The server returned an unexpected response (HTTP ${response.status}).` };

            if (response.ok) {
                if (isRegistering) {
                    showSuccessModal();
                } else {
                    window.location.href = result.role === 'doctor' ? 'admin.html' : 'index.html';
                }
            } else {
                if (formStatus) formStatus.textContent = result.message || 'Authentication failed.';
            }
        } catch (err) {
            console.error("Auth Error:", err);
            if (formStatus) {
                formStatus.textContent = BACKEND_URL
                    ? 'Cannot reach the local server. Start it with: node backend/server.js'
                    : 'Cannot reach the server. Please try again shortly.';
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = isRegistering
                ? '<span class="register-text">Register Now</span>'
                : '<span class="login-text">Login Now</span>';
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

    setMode(false);

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
