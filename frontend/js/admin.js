/* CLINICAL CORE ADMINISTRATIVE DASHBOARD CONTROLLER */
document.addEventListener('DOMContentLoaded', async () => {

    // 0. SECURITY FIRST
    document.body.style.visibility = 'hidden';

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

    // 1. ROBUST SECURITY GATEWAY
    const verifyAccess = async () => {
        try {
            const authResponse = await fetch(`${BACKEND_URL}/api/auth/check-role`, {
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (!authResponse.ok) throw new Error("Unauthorized");

            const authData = await authResponse.json();

            if (authData.role !== 'doctor') {
                window.location.href = "auth.html";
                return false;
            }

            document.body.style.visibility = 'visible';
            return true;
        } catch (err) {
            console.warn("Security check failed:", err.message);
            window.location.href = "auth.html";
            return false;
        }
    };

    const isAuthorized = await verifyAccess();
    if (!isAuthorized) return;

    // 2. APPOINTMENT ENGINE
    const pendingListContainer = document.getElementById('pendingList');
    const historyListContainer = document.getElementById('historyList');

    const loadPendingAppointments = async () => {
        if (!pendingListContainer) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/appointments`, {
                credentials: 'include'
            });

            if (!response.ok) throw new Error("Failed to fetch pending appointments");

            const data = await response.json();
            pendingListContainer.innerHTML = "";

            if (!data || data.length === 0) {
                pendingListContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 25px;">No pending requests found.</td></tr>`;
                return;
            }

            data.forEach(patient => {
                const tr = document.createElement('tr');
                [patient.name, patient.problem, patient.requestedSlot].forEach((value) => {
                    const cell = document.createElement('td');
                    cell.textContent = value || '—';
                    tr.appendChild(cell);
                });

                const actions = document.createElement('td');
                actions.style.whiteSpace = 'nowrap';
                [['btn-accept', 'APPROVED', 'Accept'], ['btn-reject', 'REJECTED', 'Deny']].forEach(([className, action, label]) => {
                    const button = document.createElement('button');
                    button.className = className;
                    button.dataset.id = patient.id;
                    button.dataset.action = action;
                    button.dataset.patientName = patient.name;
                    button.textContent = label;
                    button.type = 'button';
                    actions.appendChild(button);
                });
                tr.appendChild(actions);
                pendingListContainer.appendChild(tr);
            });
        } catch (err) {
            console.error("Fetch Error:", err);
            pendingListContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #f87171;">Failed to load pending requests.</td></tr>`;
        }
    };

    const loadHistoryAppointments = async () => {
        if (!historyListContainer) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/history`, {
                credentials: 'include'
            });

            if (!response.ok) return;

            const data = await response.json();
            if (!data || data.length === 0) return;

            historyListContainer.innerHTML = "";
            data.forEach(item => {
                const tr = document.createElement('tr');
                
                const dateCell = document.createElement('td');
                dateCell.textContent = item.requestedSlot || 'Recent';
                tr.appendChild(dateCell);

                const nameCell = document.createElement('td');
                nameCell.textContent = item.name || 'Anonymous';
                tr.appendChild(nameCell);

                const problemCell = document.createElement('td');
                const badgeColor = item.status === 'APPROVED' ? '#10b981' : '#f87171';
                problemCell.innerHTML = `<span style="color: ${badgeColor}; font-weight: 700; margin-right: 8px;">[${item.status}]</span> ${item.problem || 'Therapy'}`;
                tr.appendChild(problemCell);

                const rxCell = document.createElement('td');
                const btn = document.createElement('button');
                btn.className = 'btn-view';
                btn.type = 'button';
                btn.textContent = 'View RX';
                btn.dataset.name = item.name;
                btn.dataset.rx = `${item.problem || 'General Musculoskeletal Rehab'} | Recommended 8 sessions`;
                rxCell.appendChild(btn);
                tr.appendChild(rxCell);

                historyListContainer.appendChild(tr);
            });
        } catch (err) {
            console.warn("History fetch skipped:", err.message);
        }
    };

    // 3. EVENT DELEGATION FOR ACTIONS
    pendingListContainer?.addEventListener('click', async (e) => {
        const { action, id, patientName } = e.target.dataset;
        if (!action || !id) return;

        e.target.disabled = true;
        e.target.textContent = 'Saving...';

        try {
            const response = await fetch(`${BACKEND_URL}/api/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action }),
                credentials: 'include'
            });

            if (response.ok) {
                alert(`Appointment for ${patientName || 'patient'} has been ${action.toLowerCase()}!`);
                await loadPendingAppointments();
                await loadHistoryAppointments();
            } else {
                alert("Action could not be processed.");
            }
        } catch (err) {
            alert("Connection error.");
        }
    });

    // 4. SMART FEE CALCULATOR
    const problemType = document.getElementById('problemType');
    const suggestedFee = document.getElementById('suggestedFee');
    const sendFeeBtn = document.getElementById('sendFeeBtn');

    if (problemType && suggestedFee) {
        problemType.addEventListener('change', (e) => {
            suggestedFee.textContent = `₹${e.target.value}`;
        });
    }

    if (sendFeeBtn && suggestedFee) {
        sendFeeBtn.addEventListener('click', () => {
            alert(`Fee quotation of ${suggestedFee.textContent} has been generated and ready to send to the patient.`);
        });
    }

    // 5. VIEW PRESCRIPTION (RX) DETAILS
    document.addEventListener('click', (e) => {
        if (e.target.matches('.btn-view')) {
            const name = e.target.dataset.name || 'Patient';
            const rx = e.target.dataset.rx || 'Clinical Examination & Exercise Prescription';
            alert(`Prescription for: ${name}\n\nClinical Details: ${rx}\nStatus: Active Record\nDoctor: Dr. Subhajit Mukherjee`);
        }
    });

    // 6. SECURE SIGNOUT
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch(`${BACKEND_URL}/api/auth/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (err) {
                console.warn('Logout fetch failed:', err);
            }
            window.location.href = 'auth.html';
        });
    }

    // Initial data load
    loadPendingAppointments();
    loadHistoryAppointments();
});
