/*CLINICAL CORE ADMINISTRATIVE DASHBOARD CONTROLLER*/
document.addEventListener('DOMContentLoaded', async () => {

    // 0. SECURITY FIRST
    document.body.style.visibility = 'hidden';

    const BACKEND_URL = '';

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

    const loadPendingAppointments = async () => {
        if (!pendingListContainer) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/appointments`, {
                credentials: 'include'
            });

            if (!response.ok) throw new Error("Failed to fetch");

            const data = await response.json();
            pendingListContainer.innerHTML = "";

            if (!data || data.length === 0) {
                pendingListContainer.innerHTML = `<tr><td colspan="4" style="text-align: center;">No pending requests found.</td></tr>`;
                return;
            }

            data.forEach(patient => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${patient.name}</td>
                    <td>${patient.problem}</td>
                    <td>${patient.requestedSlot}</td>
                    <td>
                        <button class="btn-accept" data-id="${patient.id}" data-action="APPROVED">Accept</button>
                        <button class="btn-reject" data-id="${patient.id}" data-action="REJECTED">Deny</button>
                    </td>
                `;
                pendingListContainer.appendChild(tr);
            });
        } catch (err) {
            console.error("Fetch Error:", err);
        }
    };

    // 3. EVENT DELEGATION
    pendingListContainer?.addEventListener('click', async (e) => {
        const { action, id } = e.target.dataset;
        if (!action || !id) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action }),
                credentials: 'include'
            });

            if (response.ok) {
                loadPendingAppointments();
            } else {
                alert("Action could not be processed.");
            }
        } catch (err) {
            alert("Connection error.");
        }
    });

    loadPendingAppointments();
});
