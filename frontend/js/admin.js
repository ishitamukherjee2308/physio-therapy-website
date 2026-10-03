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

    // 6. CLINIC PHOTOS MANAGEMENT
    const adminPhotosGrid = document.getElementById('adminPhotosGrid');
    const toggleUploadBoxBtn = document.getElementById('toggleUploadBoxBtn');
    const adminUploadBox = document.getElementById('adminUploadBox');
    const admCancelUploadBtn = document.getElementById('admCancelUploadBtn');
    const adminPhotoForm = document.getElementById('adminPhotoForm');
    const admPhotoFile = document.getElementById('admPhotoFile');
    const admPhotoPreviewWrap = document.getElementById('admPhotoPreviewWrap');
    const admPhotoPreview = document.getElementById('admPhotoPreview');
    const admPhotoFeedback = document.getElementById('admPhotoFeedback');
    const admSubmitPhotoBtn = document.getElementById('admSubmitPhotoBtn');

    let admBase64Image = null;

    toggleUploadBoxBtn?.addEventListener('click', () => {
        if (adminUploadBox) {
            adminUploadBox.style.display = adminUploadBox.style.display === 'none' ? 'block' : 'none';
        }
    });

    admCancelUploadBtn?.addEventListener('click', () => {
        if (adminUploadBox) adminUploadBox.style.display = 'none';
    });

    admPhotoFile?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            admBase64Image = evt.target.result;
            if (admPhotoPreview) admPhotoPreview.src = admBase64Image;
            if (admPhotoPreviewWrap) admPhotoPreviewWrap.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });

    const loadAdminPhotos = async () => {
        if (!adminPhotosGrid) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/photos`);
            if (!res.ok) throw new Error("Failed to load photos");
            const photos = await res.json();

            if (!photos || photos.length === 0) {
                adminPhotosGrid.innerHTML = '<p style="color: var(--text-dim); grid-column: 1 / -1;">No photos uploaded yet.</p>';
                return;
            }

            adminPhotosGrid.innerHTML = photos.map(item => `
                <div style="background: rgba(11, 17, 32, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;">
                    <img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; height: 130px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80'">
                    <div style="padding: 12px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <span style="font-size: 0.72rem; color: #2dd4bf; font-weight: 700;">${item.category || 'Facility'}</span>
                            <h4 style="font-size: 0.95rem; margin: 4px 0 6px; color: #fff;">${item.title}</h4>
                            <p style="font-size: 0.8rem; color: var(--text-dim); line-height: 1.4;">${item.caption}</p>
                        </div>
                        <div style="margin-top: 10px; font-size: 0.75rem; color: #64748b;">📅 ${item.date || 'Recent'}</div>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error("Admin photos load failed:", err);
            adminPhotosGrid.innerHTML = '<p style="color: #f87171;">Unable to load photos.</p>';
        }
    };

    adminPhotoForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('admPhotoTitle')?.value.trim();
        const category = document.getElementById('admPhotoCategory')?.value;
        const caption = document.getElementById('admPhotoCaption')?.value.trim();

        if (!title || !caption || !admBase64Image) {
            if (admPhotoFeedback) {
                admPhotoFeedback.style.color = '#f87171';
                admPhotoFeedback.textContent = 'Please fill all fields and select a photo.';
            }
            return;
        }

        if (admSubmitPhotoBtn) {
            admSubmitPhotoBtn.disabled = true;
            admSubmitPhotoBtn.textContent = 'Publishing...';
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    category,
                    caption,
                    imageUrl: admBase64Image,
                    uploadedBy: 'Dr. Subhajit Mukherjee (Roy PhysioCare)'
                })
            });

            const result = await res.json();
            if (res.ok && result.success) {
                if (admPhotoFeedback) {
                    admPhotoFeedback.style.color = '#34d399';
                    admPhotoFeedback.textContent = 'Photo published successfully!';
                }
                adminPhotoForm.reset();
                admBase64Image = null;
                if (admPhotoPreviewWrap) admPhotoPreviewWrap.style.display = 'none';
                loadAdminPhotos();
                setTimeout(() => {
                    if (adminUploadBox) adminUploadBox.style.display = 'none';
                    if (admPhotoFeedback) admPhotoFeedback.textContent = '';
                }, 1000);
            } else {
                if (admPhotoFeedback) {
                    admPhotoFeedback.style.color = '#f87171';
                    admPhotoFeedback.textContent = result.message || 'Failed to upload photo.';
                }
            }
        } catch (err) {
            console.error("Upload error:", err);
            if (admPhotoFeedback) {
                admPhotoFeedback.style.color = '#f87171';
                admPhotoFeedback.textContent = 'Server error during upload.';
            }
        } finally {
            if (admSubmitPhotoBtn) {
                admSubmitPhotoBtn.disabled = false;
                admSubmitPhotoBtn.textContent = 'Publish to Website';
            }
        }
    });

    // 7. SECURE SIGNOUT
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
    loadAdminPhotos();
});
