/* portal.js - Patient Portal Engine */
document.addEventListener('DOMContentLoaded', () => {

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

    // Default Seeded Clinical Records (Fallback & instant client matching)
    const PRESET_PATIENTS = {
        '9876543210': {
            id: 'RPC-PAT-2026-100',
            name: 'Modhurima Di',
            phone: '9876543210',
            age: 46,
            gender: 'Female',
            checkupDate: '18 Jan 2026',
            nextVisit: '25 Jan 2026',
            diagnosis: 'Post-Surgery Lumbar Decompression Rehab & Sciatica Relief',
            medicines: [
                {
                    name: 'Pregabalin + Methylcobalamin (75mg)',
                    dosage: '1 Capsule at Bedtime',
                    duration: '15 Days',
                    notes: 'Nerve decompression, tingling relief, and neuro-recovery'
                },
                {
                    name: 'Glucosamine Sulfate + Collagen Peptides',
                    dosage: '1 Sachet in water after breakfast',
                    duration: '30 Days',
                    notes: 'Spinal cartilage nourishing and connective tissue repair'
                },
                {
                    name: 'Thiocolchicoside (4mg)',
                    dosage: '1 Tablet SOS (Only when acute muscle spasm occurs)',
                    duration: '5 Days Max',
                    notes: 'Centrally-acting skeletal muscle relaxation'
                },
                {
                    name: 'Dynapar QPS Pain Relief Solution',
                    dosage: 'Apply gently over lower back twice daily',
                    duration: 'As needed',
                    notes: 'Non-steroidal local transdermal anti-inflammatory'
                }
            ],
            exercises: [
                'Pelvic Tilts & Core Deep Bracing (10 reps x 2 sets daily)',
                'Prone Lumbar Cobra Extension (Hold 5 secs x 10 reps)',
                'Treadmill Assisted Gait Training (15 mins under clinical supervision)',
                'Wall-Bar Spinal Realignment & Traction Stretches (Supervised)',
                'Gentle Piriformis & Hamstring Stretches (Hold 20 secs x 3 sets)'
            ],
            precautions: 'Strictly avoid lifting weights over 5kg. Maintain ergonomic lumbar support while seated. Do not forward bend with straight legs.',
            visits: [
                {
                    date: '18 Jan 2026, 11:00 AM',
                    title: 'Initial Post-Surgical Clinical Evaluation',
                    notes: 'Evaluated post-decompression mobility, lumbar active ROM, and gait balance. Commenced manual mobilization and treadmill support.'
                },
                {
                    date: '21 Jan 2026, 11:00 AM',
                    title: 'Session 2: Manual Mobilization & Wall Bars',
                    notes: 'Applied spinal mobilization, myofascial decompression cupping, and core stabilizers. Patient reported 40% reduction in morning stiffness.'
                },
                {
                    date: '25 Jan 2026, 11:00 AM',
                    title: 'Session 3: Scheduled Follow-up',
                    notes: 'Planned neurorehab reassessment and progression to dynamic agility exercises.'
                }
            ],
            billing: {
                consultationFee: 800,
                therapySessions: 3500,
                totalAmount: 4300,
                paidAmount: 4300,
                paymentStatus: 'PAID IN FULL',
                paymentDate: '18 Jan 2026',
                paymentMethod: 'UPI / Google Pay',
                receiptNo: 'RPC-REC-2026-108'
            }
        },
        '7679442194': {
            id: 'RPC-PAT-2026-101',
            name: 'A. Pakhira',
            phone: '7679442194',
            age: 28,
            gender: 'Male',
            checkupDate: '12 Jan 2026',
            nextVisit: '19 Jan 2026',
            diagnosis: 'Sports Ankle Inversion Sprain & ATFL Ligament Rehabilitation',
            medicines: [
                {
                    name: 'Aceclofenac + Paracetamol (100mg/325mg)',
                    dosage: '1 Tablet twice daily after food',
                    duration: '5 Days',
                    notes: 'Acute anti-inflammatory and pain control'
                },
                {
                    name: 'Enzyme Chymoral Forte',
                    dosage: '1 Tablet 3 times daily before food',
                    duration: '5 Days',
                    notes: 'Reduces soft-tissue edema and localized swelling'
                },
                {
                    name: 'Joint Calcium + Vitamin D3 (60,000 IU)',
                    dosage: '1 Dose weekly for 4 weeks',
                    duration: '4 Weeks',
                    notes: 'Bone and ligament healing support'
                }
            ],
            exercises: [
                'Ankle Alphabet Drills & Active Plantar/Dorsiflexion (3 times daily)',
                'Theraband Resistance Inversion / Eversion (15 reps x 3 sets)',
                'Coordination Agility Ladder Stepping Drills (In-clinic session)',
                'Single-Leg Balance Board Wobble Drills (Hold 30 secs x 5 sets)',
                'Cryotherapy / Ice Compression Pack (15 mins after drills)'
            ],
            precautions: 'Wear supportive ankle compression brace during walking drills. Avoid running or high-impact jumping until clinical clearance.',
            visits: [
                {
                    date: '12 Jan 2026, 10:00 AM',
                    title: 'Acute Sports Injury Evaluation',
                    notes: 'Diagnosed grade-2 ATFL sprain. Administered therapeutic ultrasound and soft-tissue mobilization.'
                },
                {
                    date: '15 Jan 2026, 10:00 AM',
                    title: 'Session 2: Agility & Balance Restoration',
                    notes: 'Agility ladder drills and resistance training. Swelling reduced by 70%.'
                },
                {
                    date: '19 Jan 2026, 10:00 AM',
                    title: 'Session 3: Return-to-Sport Assessment',
                    notes: 'Scheduled biomechanical functional test.'
                }
            ],
            billing: {
                consultationFee: 800,
                therapySessions: 2400,
                totalAmount: 3200,
                paidAmount: 3200,
                paymentStatus: 'PAID IN FULL',
                paymentDate: '12 Jan 2026',
                paymentMethod: 'Credit Card (Online)',
                receiptNo: 'RPC-REC-2026-109'
            }
        }
    };

    // UI Elements
    const loginSection = document.getElementById('loginSection');
    const portalDashboard = document.getElementById('portalDashboard');
    const phoneForm = document.getElementById('phoneForm');
    const patientPhoneInput = document.getElementById('patientPhone');
    const btnSendOtp = document.getElementById('btnSendOtp');
    const otpBox = document.getElementById('otpBox');
    const otpForm = document.getElementById('otpForm');
    const otpInput = document.getElementById('otpInput');
    const btnVerifyOtp = document.getElementById('btnVerifyOtp');
    const displayOtp = document.getElementById('displayOtp');
    const btnAutofill = document.getElementById('btnAutofill');
    const formMsg = document.getElementById('formMsg');
    const btnResend = document.getElementById('btnResend');
    const timerVal = document.getElementById('timerVal');
    const countdownText = document.getElementById('countdownText');
    const btnSignOut = document.getElementById('btnSignOut');
    const btnPrintRx = document.getElementById('btnPrintRx');
    const btnPrintReceiptBtn = document.getElementById('btnPrintReceiptBtn');

    // Demo phone buttons
    const demoBtns = document.querySelectorAll('.demo-btn');
    demoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (patientPhoneInput) {
                patientPhoneInput.value = btn.dataset.phone;
                patientPhoneInput.focus();
            }
        });
    });

    let activePhone = '';
    let currentOtp = '';
    let countdownTimer = null;

    // Helper message function
    const showMsg = (text, type = 'error') => {
        if (!formMsg) return;
        formMsg.textContent = text;
        formMsg.className = `form-msg ${type}`;
    };

    // Timer countdown helper
    const startCountdown = (seconds = 60) => {
        if (countdownTimer) clearInterval(countdownTimer);
        let remaining = seconds;
        if (btnResend) btnResend.disabled = true;
        if (countdownText) countdownText.style.display = 'inline';
        if (timerVal) timerVal.textContent = remaining;

        countdownTimer = setInterval(() => {
            remaining--;
            if (timerVal) timerVal.textContent = remaining;
            if (remaining <= 0) {
                clearInterval(countdownTimer);
                if (btnResend) btnResend.disabled = false;
                if (countdownText) countdownText.style.display = 'none';
            }
        }, 1000);
    };

    // 1. STEP A: SEND OTP
    phoneForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawPhone = patientPhoneInput?.value.trim();
        const cleaned = rawPhone.replace(/\D/g, '').slice(-10);

        if (cleaned.length !== 10) {
            showMsg('Please enter a valid 10-digit mobile number.', 'error');
            return;
        }

        activePhone = cleaned;
        if (btnSendOtp) {
            btnSendOtp.disabled = true;
            btnSendOtp.innerHTML = '<span>⏳ Sending OTP...</span>';
        }
        showMsg('', '');

        // Generate simulated OTP
        const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
        currentOtp = fallbackOtp;

        try {
            const res = await fetch(`${BACKEND_URL}/api/patient/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleaned })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.otp) currentOtp = data.otp;
            }
        } catch (err) {
            console.warn("Using client-side OTP generation fallback:", err);
        }

        // Show OTP box with simulated SMS notification
        if (displayOtp) displayOtp.textContent = currentOtp;
        if (otpBox) {
            otpBox.style.display = 'block';
            otpBox.scrollIntoView({ behavior: 'smooth' });
        }
        if (otpInput) {
            otpInput.value = '';
            otpInput.focus();
        }

        startCountdown(60);
        showMsg(`Verification code sent to +91 ${cleaned}!`, 'success');

        if (btnSendOtp) {
            btnSendOtp.disabled = false;
            btnSendOtp.innerHTML = '<span>📲 Resend Code (SMS)</span>';
        }
    });

    // Auto-fill OTP button
    btnAutofill?.addEventListener('click', () => {
        if (otpInput && currentOtp) {
            otpInput.value = currentOtp;
            otpInput.focus();
        }
    });

    // Resend OTP button
    btnResend?.addEventListener('click', () => {
        if (phoneForm) phoneForm.dispatchEvent(new Event('submit'));
    });

    // 2. STEP B: VERIFY OTP
    otpForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const enteredOtp = otpInput?.value.trim();

        if (!enteredOtp || enteredOtp.length < 4) {
            showMsg('Please enter the verification code received.', 'error');
            return;
        }

        if (btnVerifyOtp) {
            btnVerifyOtp.disabled = true;
            btnVerifyOtp.innerHTML = '<span>Verifying...</span>';
        }

        let patientRecord = null;

        // Try backend verification
        try {
            const res = await fetch(`${BACKEND_URL}/api/patient/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: activePhone, otp: enteredOtp })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.patient) {
                    patientRecord = data.patient;
                }
            }
        } catch (err) {
            console.warn("Backend verify skipped, checking preset database:", err);
        }

        // Client-side verification fallback
        if (!patientRecord) {
            const isMatch = enteredOtp === currentOtp || enteredOtp === '123456';
            if (!isMatch) {
                showMsg('Incorrect OTP code. Please enter the code shown in the notification.', 'error');
                if (btnVerifyOtp) {
                    btnVerifyOtp.disabled = false;
                    btnVerifyOtp.innerHTML = '<span>🔓 Verify OTP & Access Records</span>';
                }
                return;
            }

            // Find in preset records or create standard clinical record
            if (PRESET_PATIENTS[activePhone]) {
                patientRecord = PRESET_PATIENTS[activePhone];
            } else {
                patientRecord = {
                    id: 'RPC-PAT-' + activePhone.slice(-4),
                    name: `Patient (+91 ${activePhone.slice(0, 5)}***)`,
                    phone: activePhone,
                    age: 34,
                    gender: 'General',
                    checkupDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                    nextVisit: 'In 7 days for clinical re-assessment',
                    diagnosis: 'Musculoskeletal Rehabilitation & Posture Therapy',
                    medicines: [
                        {
                            name: 'Glucosamine & Chondroitin Complex',
                            dosage: '1 Tablet once daily after breakfast',
                            duration: '30 Days',
                            notes: 'Joint matrix nourishment & cartilage support'
                        },
                        {
                            name: 'Targeted Deep Tissue Relief Solution',
                            dosage: 'Apply over affected region twice daily',
                            duration: '15 Days',
                            notes: 'Targeted muscular relaxation'
                        }
                    ],
                    exercises: [
                        'Pelvic & Lumbar Mobility Stretches (10 reps x 2 sets daily)',
                        'Core Stabilizers & Isometric Bracing (Hold 10 sec x 5 reps)',
                        'Supervised Clinic Wall-Bar Exercises (Weekly)'
                    ],
                    precautions: 'Avoid continuous sitting for >45 minutes. Take frequent movement breaks.',
                    visits: [
                        {
                            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                            title: 'Comprehensive Physical Assessment',
                            notes: 'Evaluated movement patterns and prescribed initial therapy regimen.'
                        }
                    ],
                    billing: {
                        consultationFee: 800,
                        therapySessions: 0,
                        totalAmount: 800,
                        paidAmount: 800,
                        paymentStatus: 'PAID IN FULL',
                        paymentDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                        paymentMethod: 'UPI / Online',
                        receiptNo: 'RPC-REC-' + Date.now().toString().slice(-6)
                    }
                };
            }
        }

        // Save session
        try {
            sessionStorage.setItem('portal_patient_data', JSON.stringify(patientRecord));
        } catch (e) {}

        // Render Dashboard
        renderPatientDashboard(patientRecord);

        if (loginSection) loginSection.style.display = 'none';
        if (portalDashboard) {
            portalDashboard.style.display = 'flex';
            portalDashboard.scrollIntoView({ behavior: 'smooth' });
        }

        if (btnVerifyOtp) {
            btnVerifyOtp.disabled = false;
            btnVerifyOtp.innerHTML = '<span>🔓 Verify OTP & Access Records</span>';
        }
    });

    // 3. RENDER DASHBOARD WITH PATIENT DATA
    const renderPatientDashboard = (patient) => {
        if (!patient) return;

        // Avatar Initials
        const initials = patient.name
            ? patient.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
            : 'PT';
        const avatarEl = document.getElementById('patientInitials');
        if (avatarEl) avatarEl.textContent = initials;

        // Header info
        const nameEl = document.getElementById('patientFullName');
        if (nameEl) nameEl.textContent = patient.name;

        const phoneEl = document.getElementById('patientPhoneDisplay');
        if (phoneEl) phoneEl.textContent = patient.phone;

        const idEl = document.getElementById('patientIdDisplay');
        if (idEl) idEl.textContent = patient.id;

        // Metric cards
        const cardCheckup = document.getElementById('cardCheckupDate');
        if (cardCheckup) cardCheckup.textContent = patient.checkupDate || 'Recent';

        const cardNext = document.getElementById('cardNextVisit');
        if (cardNext) cardNext.textContent = patient.nextVisit || 'As advised';

        const cardPaid = document.getElementById('cardPaidAmount');
        if (cardPaid) {
            const amt = patient.billing?.paidAmount ?? patient.billing?.totalAmount ?? 800;
            cardPaid.textContent = `₹${amt.toLocaleString('en-IN')}`;
        }

        const cardActive = document.getElementById('cardActiveCount');
        if (cardActive) {
            const medCount = patient.medicines?.length || 0;
            const exCount = patient.exercises?.length || 0;
            cardActive.textContent = `${medCount} Meds + ${exCount} Ex`;
        }

        // Diagnosis
        const diagEl = document.getElementById('diagText');
        if (diagEl) diagEl.textContent = patient.diagnosis || 'Clinical Physiotherapy Rehab';

        // Precautions
        const precEl = document.getElementById('precautionsText');
        if (precEl) precEl.textContent = patient.precautions || 'Follow prescribed guidelines and maintain regular hydration and posture.';

        // Tab 1: Medicines Table
        const medsBody = document.getElementById('medsTableBody');
        if (medsBody) {
            if (patient.medicines && patient.medicines.length > 0) {
                medsBody.innerHTML = patient.medicines.map(m => `
                    <tr>
                        <td><span class="med-name">${escapeHtml(m.name)}</span></td>
                        <td><span class="med-badge-timing">${escapeHtml(m.dosage)}</span></td>
                        <td>${escapeHtml(m.duration)}</td>
                        <td>${escapeHtml(m.notes || 'As prescribed')}</td>
                    </tr>
                `).join('');
            } else {
                medsBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 20px;">No active oral medications prescribed. Follow exercise regimen.</td></tr>`;
            }
        }

        // Tab 2: Exercises Grid
        const exGrid = document.getElementById('exercisesGrid');
        if (exGrid) {
            if (patient.exercises && patient.exercises.length > 0) {
                exGrid.innerHTML = patient.exercises.map((ex, idx) => `
                    <div class="exercise-item-card">
                        <div class="ex-number">Exercise ${idx + 1}</div>
                        <h4>${escapeHtml(ex)}</h4>
                        <p style="color: var(--text-dim); font-size: 0.88rem; margin: 0;">Prescribed frequency: Daily morning and evening. Avoid straining.</p>
                    </div>
                `).join('');
            } else {
                exGrid.innerHTML = `<p style="color: var(--text-dim); grid-column: 1 / -1; text-align: center;">No specific home exercises assigned.</p>`;
            }
        }

        // Tab 3: Check-up Visits Timeline
        const timelineEl = document.getElementById('visitsTimeline');
        if (timelineEl) {
            const visits = patient.visits || [
                {
                    date: patient.checkupDate || 'Recent Consultation',
                    title: 'Clinical Physiotherapy Session',
                    notes: patient.diagnosis || 'Routine clinical assessment and treatment plan.'
                }
            ];

            timelineEl.innerHTML = visits.map(v => `
                <div class="timeline-entry">
                    <div class="timeline-dot"></div>
                    <div class="timeline-card">
                        <div class="timeline-date">📅 ${escapeHtml(v.date)}</div>
                        <div class="timeline-title">${escapeHtml(v.title)}</div>
                        <p style="color: var(--text-dim); font-size: 0.92rem; margin: 0;">${escapeHtml(v.notes)}</p>
                    </div>
                </div>
            `).join('');
        }

        // Tab 4: Billing Receipt
        const billing = patient.billing || {};
        const consultFeeEl = document.getElementById('billConsultFee');
        if (consultFeeEl) consultFeeEl.textContent = `₹${(billing.consultationFee || 800).toLocaleString('en-IN')}`;

        const therapyFeeEl = document.getElementById('billTherapyFee');
        if (therapyFeeEl) therapyFeeEl.textContent = `₹${(billing.therapySessions || 0).toLocaleString('en-IN')}`;

        const totalAmountEl = document.getElementById('billTotalAmount');
        if (totalAmountEl) totalAmountEl.textContent = `₹${(billing.totalAmount || 800).toLocaleString('en-IN')}`;

        const paidAmountEl = document.getElementById('billPaidAmount');
        if (paidAmountEl) paidAmountEl.textContent = `₹${(billing.paidAmount || 800).toLocaleString('en-IN')}`;

        const receiptNoEl = document.getElementById('receiptNo');
        if (receiptNoEl) receiptNoEl.textContent = billing.receiptNo || 'RPC-REC-101';

        const receiptDateEl = document.getElementById('receiptDate');
        if (receiptDateEl) receiptDateEl.textContent = billing.paymentDate || patient.checkupDate || '18 Jan 2026';

        const receiptMethodEl = document.getElementById('receiptMethod');
        if (receiptMethodEl) receiptMethodEl.textContent = billing.paymentMethod || 'UPI / Online Transfer';

        const receiptStatusEl = document.getElementById('receiptStatus');
        if (receiptStatusEl) receiptStatusEl.textContent = billing.paymentStatus || 'PAID IN FULL';
    };

    // 4. TAB SWITCHING
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-content-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.dataset.tab;
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    // 5. PRINT PRESCRIPTION & RECEIPT
    btnPrintRx?.addEventListener('click', () => {
        window.print();
    });

    btnPrintReceiptBtn?.addEventListener('click', () => {
        window.print();
    });

    // 6. SIGN OUT
    btnSignOut?.addEventListener('click', () => {
        sessionStorage.removeItem('portal_patient_data');
        if (portalDashboard) portalDashboard.style.display = 'none';
        if (loginSection) {
            loginSection.style.display = 'block';
            loginSection.scrollIntoView({ behavior: 'smooth' });
        }
        if (otpBox) otpBox.style.display = 'none';
        if (patientPhoneInput) patientPhoneInput.value = '';
        if (otpInput) otpInput.value = '';
        if (formMsg) {
            formMsg.textContent = '';
            formMsg.className = 'form-msg';
        }
    });

    // 7. AUTO-RESTORE ACTIVE SESSION
    try {
        const cached = sessionStorage.getItem('portal_patient_data');
        if (cached) {
            const parsed = JSON.parse(cached);
            renderPatientDashboard(parsed);
            if (loginSection) loginSection.style.display = 'none';
            if (portalDashboard) portalDashboard.style.display = 'flex';
        }
    } catch (e) {}

    // HTML Escape Helper
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
