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

    let allReviews = [];
    let currentFilter = 'all';

    let allPhotos = [];
    let currentPhotoFilter = 'all';

    // UI Elements
    const reviewsContainer = document.getElementById('reviewsContainer');
    const reviewForm = document.getElementById('reviewForm');
    const submitBtn = document.getElementById('submitReviewBtn');
    const formFeedback = document.getElementById('formFeedback');
    const reviewModal = document.getElementById('reviewModal');
    const closeModalBtn = document.getElementById('closeReviewModal');
    const reviewsCountBadge = document.getElementById('reviewsCountBadge');

    // Tab Switchers
    const tabReviewsBtn = document.getElementById('tabReviewsBtn');
    const tabPhotosBtn = document.getElementById('tabPhotosBtn');
    const reviewsViewContainer = document.getElementById('reviewsViewContainer');
    const photosViewContainer = document.getElementById('photosViewContainer');
    const heroReviewsBtn = document.getElementById('heroReviewsBtn');
    const heroPhotosBtn = document.getElementById('heroPhotosBtn');
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
            reviewsCountBadge.textContent = `${allReviews.length} Reviews`;
        }

        if (!list || list.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
                    <h3>No reviews found under this category</h3>
                    <p style="margin-top: 8px; color: var(--text-dim);">Be the first patient to share a review for this condition!</p>
                </div>
            `;
            return;
        }

        reviewsContainer.innerHTML = list.map(item => {
            const initials = item.name
                ? item.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
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

    const loadReviews = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/reviews`);
            if (!res.ok) throw new Error("Failed to load reviews");
            const data = await res.json();
            allReviews = Array.isArray(data) ? data : [];
            applyFilter(currentFilter);
        } catch (err) {
            console.warn("Reviews load failed:", err);
            if (reviewsContainer) {
                reviewsContainer.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 30px;">
                        <p style="color: #f87171;">Unable to load reviews right now. Please check if server is active.</p>
                    </div>
                `;
            }
        }
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

            const payload = {
                name,
                rating: selectedRating,
                treatment,
                review,
                recommend
            };

            try {
                const response = await fetch(`${BACKEND_URL}/api/reviews`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    if (result.review) {
                        allReviews.unshift(result.review);
                    }
                    applyFilter(currentFilter);

                    reviewForm.reset();
                    selectedRating = 5;
                    setStarVisuals(5);

                    if (formFeedback) {
                        formFeedback.className = 'form-feedback success';
                        formFeedback.textContent = 'Review submitted successfully!';
                    }

                    if (reviewModal) {
                        reviewModal.classList.add('active');
                    }
                } else {
                    if (formFeedback) {
                        formFeedback.className = 'form-feedback error';
                        formFeedback.textContent = result.message || 'Failed to submit review.';
                    }
                }
            } catch (error) {
                console.error("Submission error:", error);
                if (formFeedback) {
                    formFeedback.className = 'form-feedback error';
                    formFeedback.textContent = 'Network error. Please make sure the server is running.';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>Submit Patient Review</span>';
                }
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
                    <p style="color: var(--text-dim); margin-top: 8px;">Explore other categories or upload a new clinic photo!</p>
                </div>
            `;
            return;
        }

        photosContainer.innerHTML = list.map((item, index) => {
            return `
                <article class="photo-card" data-index="${index}" title="Click to view full photo and details">
                    <div class="photo-img-wrap">
                        <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80';">
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
        try {
            const res = await fetch(`${BACKEND_URL}/api/photos`);
            if (!res.ok) throw new Error("Failed to load photos");
            const data = await res.json();
            allPhotos = Array.isArray(data) ? data : [];
            applyPhotoFilter(currentPhotoFilter);
        } catch (err) {
            console.warn("Photos load failed:", err);
            if (photosContainer) {
                photosContainer.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                        <p style="color: #f87171;">Unable to load photos right now. Please verify server status.</p>
                    </div>
                `;
            }
        }
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

    // ================= 5. DOCTOR PHOTO UPLOAD MODAL =================
    const uploadPhotoModal = document.getElementById('uploadPhotoModal');
    const triggerUploadModalBtn = document.getElementById('triggerUploadModalBtn');
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

    triggerUploadModalBtn?.addEventListener('click', openUploadModal);
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

    // File Input change
    photoFileInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please choose an image file (JPG, PNG, WEBP).');
            return;
        }

        if (dropzoneText) dropzoneText.textContent = `Selected: ${file.name}`;

        const reader = new FileReader();
        reader.onload = (event) => {
            selectedBase64Image = event.target.result;
            if (photoPreviewImg) photoPreviewImg.src = selectedBase64Image;
            if (photoPreviewWrap) photoPreviewWrap.style.display = 'block';
        };
        reader.readAsDataURL(file);
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
        const uploadedBy = document.getElementById('photoUploader')?.value.trim() || 'Dr. Subhajit Mukherjee (Roy PhysioCare)';

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

        try {
            const payload = { title, category, caption, imageUrl: finalImageUrl, uploadedBy };
            const response = await fetch(`${BACKEND_URL}/api/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                if (result.photo) {
                    allPhotos.unshift(result.photo);
                }
                applyPhotoFilter(currentPhotoFilter);

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
                    photosViewContainer?.scrollIntoView({ behavior: 'smooth' });
                }, 700);
            } else {
                if (photoFormFeedback) {
                    photoFormFeedback.className = 'form-feedback error';
                    photoFormFeedback.textContent = result.message || 'Failed to upload photo.';
                }
            }
        } catch (err) {
            console.error("Upload error:", err);
            if (photoFormFeedback) {
                photoFormFeedback.className = 'form-feedback error';
                photoFormFeedback.textContent = 'Error uploading photo. Server might be busy.';
            }
        } finally {
            if (submitPhotoBtn) {
                submitPhotoBtn.disabled = false;
                submitPhotoBtn.innerHTML = '<span>🚀 Publish Photo with Caption</span>';
            }
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
