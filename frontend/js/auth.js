/* CLINICAL CORE AUTHENTICATION CONTROLLER */
document.addEventListener('DOMContentLoaded', async () => {
    const authForm = document.getElementById('authForm');
    const authContainer = document.getElementById('authContainer');
    const toRegister = document.getElementById('toRegister');
    const toLogin = document.getElementById('toLogin');
    const formSubtitle = document.getElementById('formSubtitle');
    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');
    const registrationFields = document.querySelectorAll('.register-only input, .register-only select');

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
    const BACKEND_URL = getBackendUrl();

    const setMode = (isRegister) => {
        if (!authContainer) return;
        authContainer.className = isRegister ? 'auth-container mode-register' : 'auth-container mode-login';
        if (formSubtitle) {
            formSubtitle.textContent = isRegister
                ? 'Register for clinical or personal access.'
                : 'Secure professional authentication.';
        }
        registrationFields.forEach((field) => {
            if (field.id === 'regName' || field.id === 'confirmPassword') {
                field.required = isRegister;
            }
        });
        if (formStatus) formStatus.textContent = '';
    };

    // Default to login mode
    setMode(false);

    // 1. SESSION RECOVERY
    try {
        const sessionCheck = await fetch(`${BACKEND_URL}/api/auth/check-role`, {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (sessionCheck.ok) {
            const data = await sessionCheck.json();
            if (data.role === 'doctor') {
                window.location.href = 'admin.html';
                return;
            } else if (data.role) {
                window.location.href = 'index.html';
                return;
            }
        }
    } catch (err) {
        console.warn("Session check skipped:", err.message);
    }

    // 2. FILE PREVIEW FEEDBACK
    document.addEventListener('change', (e) => {
        if (e.target.matches('input[type="file"]')) {
            const previewDiv = document.getElementById(`preview-${e.target.id}`);
            if (previewDiv && e.target.files.length > 0) {
                previewDiv.innerText = `✅ ${e.target.files[0].name}`;
                previewDiv.style.color = "#10b981";
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
                <p style="color: #cbd5e1; font-size: 0.95rem; margin-top: 8px;">Your account is ready. Please sign in with your credentials.</p>
                <button id="okBtn" class="auth-btn" style="cursor:pointer; margin-top:20px;">Proceed to Login</button>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => {
            modal.remove();
            if (authForm) authForm.reset();
            setMode(false);
        };

        document.getElementById('okBtn')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    };

    // 4. FORM SUBMISSION
    authForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isRegistering = authContainer.classList.contains('mode-register');
        const passwordInput = document.getElementById('password');
        const passwordConfirmInput = document.getElementById('confirmPassword');
        const emailInput = document.getElementById('email');

        const password = passwordInput ? passwordInput.value : '';
        const passwordConfirm = passwordConfirmInput ? passwordConfirmInput.value : '';
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email || !password) {
            if (formStatus) formStatus.textContent = 'Please enter both email and password.';
            return;
        }

        if (isRegistering && password !== passwordConfirm) {
            if (formStatus) formStatus.textContent = 'Passwords do not match.';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.textContent = isRegistering ? 'Registering…' : 'Signing in…';

        const formData = new FormData(authForm);
        const payload = Object.fromEntries(formData);
        delete payload.passwordConfirm;

        const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json')
                ? await response.json()
                : { message: `Server error (HTTP ${response.status}).` };

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
                formStatus.textContent = 'Cannot reach server. Start it with: node backend/server.js';
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
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

    // 5. DROPDOWN INIT
    document.querySelectorAll('select').forEach(el => {
        if (typeof Choices !== 'undefined') {
            try {
                new Choices(el, {
                    searchEnabled: false,
                    itemSelectText: '',
                    shouldSort: false
                });
            } catch (err) {
                console.warn('Choices initialization skipped for', el);
            }
        }
    });
});
