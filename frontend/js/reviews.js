/* PATIENT REVIEWS & CLINIC PHOTOS ENGINE */
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

    // High quality client-side canvas compressor for phone cameras & desktops
    const compressImage = (file, maxDim = 1200, quality = 0.82) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    let { width, height } = img;
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedDataUrl);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    // Authentic clinic photos of Dr. Subhajit Mukherjee at Roy PhysioCare
    const DEFAULT_CLINIC_PHOTOS = [
        {
            id: 'photo-1',
            title: 'Doctor Consultation & Diagnosis Desk',
            category: 'Clinic Facility',
            caption: 'Dr. Subhajit Mukherjee, PT at his clinical evaluation and diagnostic desk at Roy PhysioCare, conducting comprehensive 1-on-1 patient consultations and range-of-motion assessments.',
            imageUrl: 'image/dr_subhajit_mukherjee.jpg',
            uploadedBy: 'Dr. Subhajit Mukherjee',
            date: '10 Oct 2026'
        },
        {
            id: 'photo-2',
            title: 'Myofascial Decompression & Back Cupping',
            category: 'Equipment & Modalities',
            caption: 'Clinical vacuum cupping therapy performed by Dr. Subhajit Mukherjee to relieve severe lumbar spasm, decompress deep fascia, and promote accelerated microcirculation.',
            imageUrl: 'image/cupping_therapy.jpg',
            uploadedBy: 'Dr. Subhajit Mukherjee',
            date: '10 Oct 2026'
        },
        {
            id: 'photo-3',
            title: 'Spinal Mobility & Wall Bar Posture Therapy',
            category: 'Spine & Neuro Rehab',
            caption: 'Targeted spinal realignment and active posture rehabilitation using clinical wall bars and resistance straps for chronic back, scoliosis, and postural imbalance.',
            imageUrl: 'image/posture_wallbar.png',
            uploadedBy: 'Dr. Subhajit Mukherjee',
            date: '10 Oct 2026'
        },
        {
            id: 'photo-4',
            title: 'Post-Surgical Treadmill Gait & Joint Rehab',
            category: 'Spine & Neuro Rehab',
            caption: 'Dr. Subhajit Mukherjee assisting a patient with supervised gait training, joint stability, and treadmill rehabilitation following surgery and joint replacement.',
            imageUrl: 'image/treadmill_rehab.png',
            uploadedBy: 'Dr. Subhajit Mukherjee',
            date: '10 Oct 2026'
        },
        {
            id: 'photo-5',
            title: 'Sports Rehabilitation & Coordination Agility Drills',
            category: 'Sports Therapy',
            caption: 'Floor agility ladder and neuromuscular coordination training session in clinic to restore dynamic footwork, joint stability, and athletic confidence.',
            imageUrl: 'image/agility_ladder.png',
            uploadedBy: 'Dr. Subhajit Mukherjee',
            date: '10 Oct 2026'
        },
        {
            id: 'photo-6',
            title: 'Balance & Gait Agility Cone Training',
            category: 'Spine & Neuro Rehab',
            caption: 'Dynamic cone stepping drills supervised by Dr. Subhajit Mukherjee for fall prevention, senior mobility enhancement, and neurological gait restoration.',
            imageUrl: 'image/balance_training.png',
            uploadedBy: 'Dr. Subhajit Mukherjee',
            date: '10 Oct 2026'
        },
        {
            id: 'photo-7',
            title: 'Targeted Knee Joint Decompression Cupping',
            category: 'Equipment & Modalities',
            caption: 'Clinical multi-cup vacuum decompression applied around the knee joint to reduce chronic inflammation, joint stiffness, and accelerate healing in osteoarthritis and meniscus issues.',
            imageUrl: 'image/knee_cupping.jpg',
            uploadedBy: 'Dr. Subhajit Mukherjee',
            date: '10 Oct 2026'
        }
    ];

    let allReviews = [];
    let currentFilter = 'all';

    let allPhotos = [...DEFAULT_CLINIC_PHOTOS];
    let currentPhotoFilter = 'all';

    // UI Elements
    const reviewsContainer = document.getElementById('reviewsContainer');
    const reviewForm = document.getElementById('reviewForm');
    const submitBtn = document.getElementById('submitReviewBtn');
    const formFeedback = document.getElementById('formFeedback');
    const reviewModal = document.getElementById('reviewModal');
    const closeModalBtn = document.getElementById('closeReviewModal');
    const reviewsCountBadge = document.getElementById('reviewsCountBadge');

    // Tab Switchers & Action Buttons
    const tabReviewsBtn = document.getElementById('tabReviewsBtn');
    const tabPhotosBtn = document.getElementById('tabPhotosBtn');
    const reviewsViewContainer = document.getElementById('reviewsViewContainer');
    const photosViewContainer = document.getElementById('photosViewContainer');
    const heroReviewsBtn = document.getElementById('heroReviewsBtn');
    const heroPhotosBtn = document.getElementById('heroPhotosBtn');
    const heroUploadBtn = document.getElementById('heroUploadBtn');
    const openUploadModalBtn = document.getElementById('openUploadModalBtn');

    // Switch View Tabs Function
    const switchTab = (tab) => {
        if (tab === 'photos') {
            tabReviewsBtn?.classList.remove('active');
            tabPhotosBtn?.classList.add('active');
            if (reviewsViewContainer) reviewsViewContainer.style.display = 'none';
            if (photosViewContainer) photosViewContainer.style.display = 'block';
            window.history.replaceState(null, null, '#photos');
        } else {
            tabPhotosBtn?.classList.remove('active');
            tabReviewsBtn?.classList.add('active');
            if (photosViewContainer) photosViewContainer.style.display = 'none';
            if (reviewsViewContainer) reviewsViewContainer.style.display = 'block';
            window.history.replaceState(null, null, '#reviews');
        }
    };

    tabReviewsBtn?.addEventListener('click', () => switchTab('reviews'));
    tabPhotosBtn?.addEventListener('click', () => switchTab('photos'));

    heroReviewsBtn?.addEventListener('click', () => {
        switchTab('reviews');
        const formSec = document.getElementById('submitReviewSection');
        if (formSec) formSec.scrollIntoView({ behavior: 'smooth' });
    });

    heroPhotosBtn?.addEventListener('click', () => {
        switchTab('photos');
        photosViewContainer?.scrollIntoView({ behavior: 'smooth' });
    });

    // ================= 1. STAR RATING PICKER =================
    const starPicker = document.getElementById('starPicker');
    const ratingValueInput = document.getElementById('ratingValue');
    const ratingLabel = document.getElementById('ratingLabel');
    const stars = starPicker ? starPicker.querySelectorAll('.star-btn') : [];

    const ratingDescriptions = {
        1: "1.0 / 5.0 (Needs Improvement)",
        2: "2.0 / 5.0 (Fair Treatment)",
        3: "3.0 / 5.0 (Good Experience)",
        4: "4.0 / 5.0 (Very Good Care)",
        5: "5.0 / 5.0 (Exceptional Care & Recovery)"
    };

    let selectedRating = 5;

    const setStarVisuals = (rating) => {
        stars.forEach(star => {
            const val = parseInt(star.dataset.rating, 10);
            if (val <= rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
        if (ratingLabel) {
            ratingLabel.textContent = ratingDescriptions[rating] || `${rating}.0 / 5.0`;
        }
    };

    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const hoverVal = parseInt(star.dataset.rating, 10);
            stars.forEach(s => {
                const val = parseInt(s.dataset.rating, 10);
                if (val <= hoverVal) s.classList.add('hover');
                else s.classList.remove('hover');
            });
            if (ratingLabel) ratingLabel.textContent = ratingDescriptions[hoverVal] || `${hoverVal}.0 / 5.0`;
        });

        star.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hover'));
            setStarVisuals(selectedRating);
        });

        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating, 10);
            if (ratingValueInput) ratingValueInput.value = selectedRating;
            setStarVisuals(selectedRating);
        });
    });

    // ================= 2. REVIEWS ENGINE =================
    const renderReviews = (list) => {
        if (!reviewsContainer) return;

        if (reviewsCountBadge) {
            reviewsCountBadge.textContent = allReviews.length > 0
                ? `${allReviews.length} Verified ${allReviews.length === 1 ? 'Review' : 'Reviews'}`
                : 'Open for Patient Reviews';
        }

        if (!list || list.length === 0) {
            if (allReviews.length === 0) {
                reviewsContainer.innerHTML = `
                    <div class="empty-state-welcome" style="grid-column: 1 / -1; text-align: center; padding: 50px 24px; background: rgba(255, 255, 255, 0.03); border: 2px dashed rgba(56, 189, 248, 0.3); border-radius: 28px; backdrop-filter: blur(12px); box-shadow: 0 15px 35px rgba(0,0,0,0.25);">
                        <div style="font-size: 3rem; margin-bottom: 14px;">🌟</div>
                        <h3 style="font-size: 1.6rem; color: #fff; margin-bottom: 10px; font-weight: 600;">Be the First to Review Dr. Subhajit Mukherjee!</h3>
                        <p style="color: var(--text-dim); max-width: 580px; margin: 0 auto 24px; font-size: 1.02rem; line-height: 1.65;">
                            All previous placeholder reviews have been cleared. Our reviews platform is now open for all patients! Share your treatment and recovery experience below.
                        </p>
                        <a href="#submitReviewSection" class="btn-scroll-form" style="display: inline-block; padding: 14px 34px; text-decoration: none; border-radius: 50px; background: var(--primary); color: #0f172a; font-weight: 600; box-shadow: 0 10px 25px rgba(56, 189, 248, 0.3); transition: all 0.3s ease;">✍️ Leave Your Patient Review</a>
                    </div>
                `;
            } else {
                reviewsContainer.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
                        <h3>No reviews found under this filter</h3>
                        <p style="margin-top: 8px; color: var(--text-dim);">Select "All Reviews" to view all patient feedback.</p>
                    </div>
                `;
            }
            return;
        }

        reviewsContainer.innerHTML = list.map(item => {
            const initials = item.name
                ? item.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
                : 'PT';
            
            const starIcons = '★'.repeat(Math.max(1, Math.min(5, item.rating || 5)));

            return `
                <article class="review-card">
                    <div>
                        <div class="card-top">
                            <div class="user-info">
                                <div class="avatar">${initials}</div>
                                <div class="user-details">
                                    <h4>${escapeHtml(item.name)} <span class="verified-badge" title="Verified Patient">✓</span></h4>
                                    <span class="treatment-badge">${escapeHtml(item.treatment || 'Physiotherapy')}</span>
                                </div>
                            </div>
                            <div class="card-stars">${starIcons}</div>
                        </div>

                        <p class="review-body">“${escapeHtml(item.review)}”</p>
                    </div>

                    <div class="card-footer">
                        <span>📅 ${escapeHtml(item.date || 'Recent')}</span>
                        ${item.recommend !== false ? `<span class="recommend-badge">👍 Recommends Dr. Subhajit</span>` : ''}
                    </div>
                </article>
            `;
        }).join('');
    };

    const isDummyReview = (r) => {
        const dummyIds = ['rev-1', 'rev-2', 'rev-3', 'rev-4'];
        const dummyNames = ['Aniket Sen', 'Sangeeta Roy', 'Rajesh Ganguly', 'Debolina Chatterjee'];
        return dummyIds.includes(r.id) || dummyNames.includes(r.name);
    };

    const loadReviews = async () => {
        let localReviews = [];
        try {
            const raw = localStorage.getItem('local_patient_reviews');
            if (raw) {
                localReviews = JSON.parse(raw).filter(r => !isDummyReview(r));
                localStorage.setItem('local_patient_reviews', JSON.stringify(localReviews));
            }
        } catch (e) {
            console.warn(e);
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/reviews`);
            if (res.ok) {
                const data = await res.json();
                const serverReviews = (Array.isArray(data) ? data : []).filter(r => !isDummyReview(r));
                const existingIds = new Set(serverReviews.map(r => r.id));
                const uniqueLocal = localReviews.filter(r => !existingIds.has(r.id));
                allReviews = [...uniqueLocal, ...serverReviews];
            } else {
                allReviews = localReviews;
            }
        } catch (err) {
            console.warn("Reviews server fetch error, falling back to local storage:", err);
            allReviews = localReviews;
        }

        applyFilter(currentFilter);
    };

    const filterPills = document.querySelectorAll('#filterPills .pill');
    const applyFilter = (filter) => {
        currentFilter = filter;
        let filtered = allReviews;

        if (filter === '5') {
            filtered = allReviews.filter(r => Number(r.rating) === 5);
        } else if (filter !== 'all') {
            filtered = allReviews.filter(r => 
                (r.treatment || '').toLowerCase().includes(filter.toLowerCase())
            );
        }

        renderReviews(filtered);
    };

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            applyFilter(pill.dataset.filter);
        });
    });

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('reviewerName')?.value.trim();
            const treatment = document.getElementById('treatmentType')?.value;
            const review = document.getElementById('reviewMessage')?.value.trim();
            const recommend = document.getElementById('recommendDoctor')?.checked;

            if (!name || !treatment || !review) {
                if (formFeedback) {
                    formFeedback.className = 'form-feedback error';
                    formFeedback.textContent = 'Please fill out all required fields.';
                }
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Submitting Review...</span>';
            }

            const newReviewObj = {
                id: 'rev-' + Date.now(),
                name,
                rating: selectedRating,
                treatment,
                review,
                recommend: recommend !== false,
                date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            };

            let savedReview = newReviewObj;

            try {
                const response = await fetch(`${BACKEND_URL}/api/reviews`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newReviewObj)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.review) {
                        savedReview = result.review;
                    }
                }
            } catch (error) {
                console.warn("Server POST error, saving to local storage fallback:", error);
            }

            // Immediately add to allReviews at the beginning
            allReviews = allReviews.filter(r => r.id !== savedReview.id);
            allReviews.unshift(savedReview);

            // Save to localStorage so it persists across refreshes
            try {
                let localReviews = [];
                const raw = localStorage.getItem('local_patient_reviews');
                if (raw) localReviews = JSON.parse(raw);
                localReviews = localReviews.filter(r => r.id !== savedReview.id && !isDummyReview(r));
                localReviews.unshift(savedReview);
                localStorage.setItem('local_patient_reviews', JSON.stringify(localReviews));
            } catch (e) {
                console.warn(e);
            }

            // Reset filter to 'all' so new review is immediately visible
            currentFilter = 'all';
            filterPills.forEach(p => {
                if (p.dataset.filter === 'all') p.classList.add('active');
                else p.classList.remove('active');
            });

            // Re-render reviews
            renderReviews(allReviews);

            // Reset form
            reviewForm.reset();
            selectedRating = 5;
            setStarVisuals(5);

            if (formFeedback) {
                formFeedback.className = 'form-feedback success';
                formFeedback.textContent = 'Your review has been published successfully!';
            }

            if (reviewModal) {
                reviewModal.classList.add('active');
            }

            // Scroll so user sees their review immediately
            setTimeout(() => {
                const reviewsSection = document.getElementById('reviewsContainer');
                if (reviewsSection) {
                    reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Submit Patient Review</span>';
            }
        });
    }

    if (closeModalBtn && reviewModal) {
        closeModalBtn.addEventListener('click', () => {
            reviewModal.classList.remove('active');
            const target = document.getElementById('reviewsContainer');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (reviewModal) {
        reviewModal.addEventListener('click', (e) => {
            if (e.target === reviewModal) reviewModal.classList.remove('active');
        });
    }

    // ================= 3. CLINIC PHOTOS GALLERY ENGINE =================
    const photosContainer = document.getElementById('photosContainer');
    const photoFilterPills = document.querySelectorAll('#photoFilterPills .pill');

    const renderPhotos = (list) => {
        if (!photosContainer) return;

        if (!list || list.length === 0) {
            photosContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
                    <div style="font-size: 2.5rem; margin-bottom: 12px;">📷</div>
                    <h3>No photos found under this category</h3>
                    <p style="color: var(--text-dim); margin-top: 8px;">Explore other categories or share your own clinic photo!</p>
                </div>
            `;
            return;
        }

        photosContainer.innerHTML = list.map((item, index) => {
            return `
                <article class="photo-card" data-index="${index}" title="Click to view full photo and details">
                    <div class="photo-img-wrap">
                        <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.onerror=null; this.src='image/dr_subhajit_mukherjee.jpg';">
                        <span class="photo-category-tag">${escapeHtml(item.category || 'Clinic Facility')}</span>
                        <div class="photo-overlay">
                            <span class="btn-overlay-view">🔍 View Fullscreen</span>
                        </div>
                    </div>
                    <div class="photo-card-body">
                        <div>
                            <h3>${escapeHtml(item.title)}</h3>
                            <p class="photo-caption">${escapeHtml(item.caption)}</p>
                        </div>
                        <div class="photo-card-footer">
                            <span class="photo-uploader-badge">👨‍⚕️ ${escapeHtml(item.uploadedBy || 'Dr. Subhajit Mukherjee')}</span>
                            <span>📅 ${escapeHtml(item.date || 'Recent')}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Attach click listeners to cards for Lightbox
        const cards = photosContainer.querySelectorAll('.photo-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const idx = parseInt(card.dataset.index, 10);
                const photoItem = list[idx];
                if (photoItem) openLightbox(photoItem);
            });
        });
    };

    const loadPhotos = async () => {
        let localPhotos = [];
        try {
            const raw = localStorage.getItem('local_clinic_photos');
            if (raw) localPhotos = JSON.parse(raw);
        } catch (e) {
            console.warn(e);
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/photos`);
            if (res.ok) {
                const data = await res.json();
                const serverPhotos = (Array.isArray(data) ? data : []).filter(p => !p.imageUrl?.includes('unsplash.com'));
                const existingIds = new Set(serverPhotos.map(p => p.id));
                const uniqueLocal = localPhotos.filter(p => !existingIds.has(p.id));
                const combined = [...uniqueLocal, ...serverPhotos];
                allPhotos = combined.length > 0 ? combined : DEFAULT_CLINIC_PHOTOS;
            } else {
                allPhotos = localPhotos.length > 0 ? [...localPhotos, ...DEFAULT_CLINIC_PHOTOS] : DEFAULT_CLINIC_PHOTOS;
            }
        } catch (err) {
            console.warn("Photos load failed, using local clinic photos fallback:", err);
            allPhotos = localPhotos.length > 0 ? [...localPhotos, ...DEFAULT_CLINIC_PHOTOS] : DEFAULT_CLINIC_PHOTOS;
        }
        applyPhotoFilter(currentPhotoFilter);
    };

    const applyPhotoFilter = (filter) => {
        currentPhotoFilter = filter;
        let filtered = allPhotos;
        if (filter !== 'all') {
            filtered = allPhotos.filter(p => 
                (p.category || '').toLowerCase().includes(filter.toLowerCase())
            );
        }
        renderPhotos(filtered);
    };

    photoFilterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            photoFilterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            applyPhotoFilter(pill.dataset.filter);
        });
    });

    // ================= 4. LIGHTBOX MODAL =================
    const photoLightboxModal = document.getElementById('photoLightboxModal');
    const closeLightboxBtn = document.getElementById('closeLightboxBtn');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCategory = document.getElementById('lightboxCategory');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxUploader = document.getElementById('lightboxUploader');
    const lightboxDate = document.getElementById('lightboxDate');

    const openLightbox = (photo) => {
        if (!photoLightboxModal) return;
        if (lightboxImg) lightboxImg.src = photo.imageUrl;
        if (lightboxCategory) lightboxCategory.textContent = photo.category || 'Clinic Facility';
        if (lightboxTitle) lightboxTitle.textContent = photo.title;
        if (lightboxCaption) lightboxCaption.textContent = photo.caption;
        if (lightboxUploader) lightboxUploader.textContent = `👨‍⚕️ ${photo.uploadedBy || 'Dr. Subhajit Mukherjee'}`;
        if (lightboxDate) lightboxDate.textContent = `📅 ${photo.date || 'Recent'}`;

        photoLightboxModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        if (photoLightboxModal) photoLightboxModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    closeLightboxBtn?.addEventListener('click', closeLightbox);
    photoLightboxModal?.addEventListener('click', (e) => {
        if (e.target === photoLightboxModal) closeLightbox();
    });

    // ================= 5. PHOTO UPLOAD MODAL (FOR DOCTOR & PATIENTS) =================
    const uploadPhotoModal = document.getElementById('uploadPhotoModal');
    const closePhotoUploadModal = document.getElementById('closePhotoUploadModal');
    const photoUploadForm = document.getElementById('photoUploadForm');
    const photoFileInput = document.getElementById('photoFileInput');
    const photoUrlInput = document.getElementById('photoUrlInput');
    const photoPreviewWrap = document.getElementById('photoPreviewWrap');
    const photoPreviewImg = document.getElementById('photoPreviewImg');
    const btnRemovePreview = document.getElementById('btnRemovePreview');
    const pillFileSource = document.getElementById('pillFileSource');
    const pillUrlSource = document.getElementById('pillUrlSource');
    const fileUploadWrapper = document.getElementById('fileUploadWrapper');
    const urlUploadWrapper = document.getElementById('urlUploadWrapper');
    const dropzoneText = document.getElementById('dropzoneText');
    const photoFormFeedback = document.getElementById('photoFormFeedback');
    const submitPhotoBtn = document.getElementById('submitPhotoBtn');

    let selectedBase64Image = null;
    let currentSource = 'file';

    const openUploadModal = () => {
        if (uploadPhotoModal) {
            uploadPhotoModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (photoFormFeedback) {
                photoFormFeedback.textContent = '';
                photoFormFeedback.className = 'form-feedback';
            }
        }
    };

    const closeUploadModal = () => {
        if (uploadPhotoModal) {
            uploadPhotoModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    heroUploadBtn?.addEventListener('click', openUploadModal);
    openUploadModalBtn?.addEventListener('click', openUploadModal);
    closePhotoUploadModal?.addEventListener('click', closeUploadModal);
    uploadPhotoModal?.addEventListener('click', (e) => {
        if (e.target === uploadPhotoModal) closeUploadModal();
    });

    // Source toggle
    pillFileSource?.addEventListener('click', () => {
        currentSource = 'file';
        pillFileSource.classList.add('active');
        pillUrlSource?.classList.remove('active');
        if (fileUploadWrapper) fileUploadWrapper.style.display = 'block';
        if (urlUploadWrapper) urlUploadWrapper.style.display = 'none';
    });

    pillUrlSource?.addEventListener('click', () => {
        currentSource = 'url';
        pillUrlSource.classList.add('active');
        pillFileSource?.classList.remove('active');
        if (fileUploadWrapper) fileUploadWrapper.style.display = 'none';
        if (urlUploadWrapper) urlUploadWrapper.style.display = 'block';
    });

    // File Input change with client-side canvas compression for mobile phone cameras
    photoFileInput?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please choose an image file (JPG, PNG, WEBP).');
            return;
        }

        if (dropzoneText) dropzoneText.textContent = `Processing ${file.name}...`;

        try {
            // Compress phone/camera image to max 1200px (fast, crisp, lightweight)
            selectedBase64Image = await compressImage(file, 1200, 0.82);
            if (photoPreviewImg) photoPreviewImg.src = selectedBase64Image;
            if (photoPreviewWrap) photoPreviewWrap.style.display = 'block';
            if (dropzoneText) dropzoneText.textContent = `Selected: ${file.name} (Optimized for instant viewing)`;
        } catch (compressErr) {
            console.warn("Fallback to FileReader:", compressErr);
            const reader = new FileReader();
            reader.onload = (event) => {
                selectedBase64Image = event.target.result;
                if (photoPreviewImg) photoPreviewImg.src = selectedBase64Image;
                if (photoPreviewWrap) photoPreviewWrap.style.display = 'block';
                if (dropzoneText) dropzoneText.textContent = `Selected: ${file.name}`;
            };
            reader.readAsDataURL(file);
        }
    });

    btnRemovePreview?.addEventListener('click', () => {
        selectedBase64Image = null;
        if (photoFileInput) photoFileInput.value = '';
        if (photoPreviewImg) photoPreviewImg.src = '';
        if (photoPreviewWrap) photoPreviewWrap.style.display = 'none';
        if (dropzoneText) dropzoneText.textContent = 'Click to choose photo from device';
    });

    // Form Submission
    photoUploadForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('photoTitle')?.value.trim();
        const category = document.getElementById('photoCategory')?.value;
        const caption = document.getElementById('photoCaption')?.value.trim();
        const uploadedBy = document.getElementById('photoUploader')?.value.trim() || 'Verified Patient';

        let finalImageUrl = '';
        if (currentSource === 'file') {
            if (!selectedBase64Image) {
                if (photoFormFeedback) {
                    photoFormFeedback.className = 'form-feedback error';
                    photoFormFeedback.textContent = 'Please choose a photo file from your device.';
                }
                return;
            }
            finalImageUrl = selectedBase64Image;
        } else {
            const urlVal = photoUrlInput?.value.trim();
            if (!urlVal) {
                if (photoFormFeedback) {
                    photoFormFeedback.className = 'form-feedback error';
                    photoFormFeedback.textContent = 'Please enter an image web URL.';
                }
                return;
            }
            finalImageUrl = urlVal;
        }

        if (!title || !caption) {
            if (photoFormFeedback) {
                photoFormFeedback.className = 'form-feedback error';
                photoFormFeedback.textContent = 'Please provide title and caption.';
            }
            return;
        }

        if (submitPhotoBtn) {
            submitPhotoBtn.disabled = true;
            submitPhotoBtn.innerHTML = '<span>Uploading Photo & Caption...</span>';
        }

        const newPhotoObj = {
            id: 'photo-' + Date.now(),
            title,
            category: category || 'Clinic Facility',
            caption,
            imageUrl: finalImageUrl,
            uploadedBy,
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        };

        let savedPhoto = newPhotoObj;

        try {
            const response = await fetch(`${BACKEND_URL}/api/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPhotoObj)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.photo) {
                    savedPhoto = result.photo;
                }
            }
        } catch (err) {
            console.warn("Upload fallback to local storage:", err);
        }

        // Add to allPhotos at the beginning
        allPhotos = allPhotos.filter(p => p.id !== savedPhoto.id);
        allPhotos.unshift(savedPhoto);

        // Save to localStorage
        try {
            let localPhotos = [];
            const raw = localStorage.getItem('local_clinic_photos');
            if (raw) localPhotos = JSON.parse(raw);
            localPhotos = localPhotos.filter(p => p.id !== savedPhoto.id);
            localPhotos.unshift(savedPhoto);
            localStorage.setItem('local_clinic_photos', JSON.stringify(localPhotos));
        } catch (e) {
            console.warn(e);
        }

        // Switch to 'all' filter and re-render
        currentPhotoFilter = 'all';
        photoFilterPills.forEach(p => {
            if (p.dataset.filter === 'all') p.classList.add('active');
            else p.classList.remove('active');
        });
        renderPhotos(allPhotos);

        // Reset form
        photoUploadForm.reset();
        selectedBase64Image = null;
        if (photoPreviewWrap) photoPreviewWrap.style.display = 'none';
        if (dropzoneText) dropzoneText.textContent = 'Click to choose photo from device';

        if (photoFormFeedback) {
            photoFormFeedback.className = 'form-feedback success';
            photoFormFeedback.textContent = 'Photo successfully published to clinic gallery!';
        }

        setTimeout(() => {
            closeUploadModal();
            switchTab('photos');
            const target = document.getElementById('photosContainer');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        }, 600);

        if (submitPhotoBtn) {
            submitPhotoBtn.disabled = false;
            submitPhotoBtn.innerHTML = '<span>🚀 Publish Photo with Caption</span>';
        }
    });

    // Close modals on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closeUploadModal();
            if (reviewModal) reviewModal.classList.remove('active');
        }
    });

    // XSS Escaper Helper
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ================= INITIAL LOAD =================
    setStarVisuals(5);
    loadReviews();
    loadPhotos();

    // Check URL hash on load
    if (window.location.hash === '#photos') {
        switchTab('photos');
    }
});
