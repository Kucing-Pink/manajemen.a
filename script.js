// ===========================
// CONFIGURATION
// ===========================
// PENTING: Ganti URL di bawah dengan URL Google Apps Script deployment Anda
const API_URL = 'https://script.google.com/macros/s/AKfycbzlI-YMpNyruASA0gkwkRsDn7yGGODAiY6zMfKG_swzKhefmgLgmSrSb6aCpgNkWFpI/exec';

// Cloudinary Config (Free tier - buat akun di cloudinary.com)
// PENTING: Ganti dengan cloud name dan upload preset Anda
const CLOUDINARY_CLOUD = 'duknzwtx2';
const CLOUDINARY_PRESET = 'upload_preset';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`;

// ===========================
// STATE
// ===========================
let state = {
    isLoggedIn: false,
    currentUser: null,     // { phone, name, bio, photoUrl }
    posts: [],
    currentPost: null,
    currentFilter: 'all',
    displayedItems: 12,
    musicPlaying: false,
    isDarkTheme: true,
};

// ===========================
// INIT
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    loadSession();
    loadThemePreference();
    loadPosts();
    initNavbar();
    initLoginModal();
    initProfileModal();
    initUploadModal();
    initPostDetailModal();
    initThemeToggle();
    initMusicToggle();
    initFilters();
    animateStats();
    loadMembers();
});

// ===========================
// SESSION (localStorage)
// ===========================
function loadSession() {
    const saved = localStorage.getItem('webKelas_user');
    if (saved) {
        try {
            state.currentUser = JSON.parse(saved);
            state.isLoggedIn = true;
            updateUIForLogin();
        } catch (e) {
            localStorage.removeItem('webKelas_user');
        }
    }
}

function saveSession() {
    if (state.currentUser) {
        localStorage.setItem('webKelas_user', JSON.stringify(state.currentUser));
    }
}

function clearSession() {
    localStorage.removeItem('webKelas_user');
    state.isLoggedIn = false;
    state.currentUser = null;
}

// ===========================
// API Helper
// ===========================
async function apiCall(data) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        showToast('Gagal terhubung ke server', 'error');
        return { success: false, message: 'Network error' };
    }
}

// ===========================
// UTILITY
// ===========================
function getAvatarURL(user) {
    if (user?.photoUrl) return user.photoUrl;
    const seed = user?.name || user?.phone || 'MA';
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = { success: 'fa-check', error: 'fa-exclamation', info: 'fa-info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ===========================
// NAVBAR
// ===========================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navHamburger = document.getElementById('navHamburger');
    const navMenu = document.getElementById('navMenu');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    navHamburger.addEventListener('click', () => {
        navHamburger.classList.toggle('active');
        navMenu.classList.toggle('show');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navHamburger.classList.remove('active');
            navMenu.classList.remove('show');
        });
    });

    // Active nav on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 100;
            if (window.scrollY >= top) current = section.getAttribute('id');
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    });

    // Profile dropdown
    const profileToggle = document.getElementById('profileToggle');
    const profileDropdown = document.getElementById('profileDropdown');
    profileToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => {
        profileDropdown?.classList.remove('show');
    });

    // Logout
    document.getElementById('btnLogout')?.addEventListener('click', (e) => {
        e.preventDefault();
        clearSession();
        updateUIForLogin();
        profileDropdown.classList.remove('show');
        showToast('Anda telah keluar', 'info');
    });

    // Open profile modal
    document.getElementById('btnOpenProfile')?.addEventListener('click', (e) => {
        e.preventDefault();
        profileDropdown.classList.remove('show');
        openProfileModal();
    });
}

// ===========================
// UI FOR LOGIN/LOGOUT
// ===========================
function updateUIForLogin() {
    const btnLogin = document.getElementById('btnOpenLogin');
    const navProfile = document.getElementById('navProfile');

    btnLogin.style.display = state.isLoggedIn ? 'none' : 'flex';
    navProfile.style.display = state.isLoggedIn ? 'block' : 'none';

    if (state.isLoggedIn && state.currentUser) {
        const avatarUrl = getAvatarURL(state.currentUser);
        document.getElementById('dropdownName').textContent = state.currentUser.name;
        document.getElementById('dropdownPhone').textContent = state.currentUser.phone;
        document.getElementById('dropdownAvatar').src = avatarUrl;
        document.querySelector('#profileToggle img').src = avatarUrl;

        const commentUserAvatar = document.getElementById('commentUserAvatar');
        if (commentUserAvatar) commentUserAvatar.src = avatarUrl;
    }

    // Update comment area visibility if post detail is open
    const commentInputArea = document.getElementById('commentInputArea');
    const commentLoginPrompt = document.getElementById('commentLoginPrompt');
    if (commentInputArea) commentInputArea.style.display = state.isLoggedIn ? 'flex' : 'none';
    if (commentLoginPrompt) commentLoginPrompt.style.display = state.isLoggedIn ? 'none' : 'block';
}

// ===========================
// THEME TOGGLE
// ===========================
function initThemeToggle() {
    const btn = document.getElementById('btnThemeToggle');
    btn.addEventListener('click', () => {
        state.isDarkTheme = !state.isDarkTheme;
        applyTheme();
        localStorage.setItem('webKelas_theme', state.isDarkTheme ? 'dark' : 'light');
    });
}

function loadThemePreference() {
    const saved = localStorage.getItem('webKelas_theme');
    if (saved === 'light') {
        state.isDarkTheme = false;
    }
    applyTheme();
}

function applyTheme() {
    const btn = document.getElementById('btnThemeToggle');
    if (state.isDarkTheme) {
        document.body.classList.remove('light-theme');
        btn.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.add('light-theme');
        btn.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// ===========================
// MUSIC TOGGLE
// ===========================
function initMusicToggle() {
    const btn = document.getElementById('btnMusicToggle');
    const audio = document.getElementById('bgMusic');
    audio.volume = 0.3;

    btn.addEventListener('click', () => {
        if (state.musicPlaying) {
            audio.pause();
            btn.classList.remove('music-playing');
            state.musicPlaying = false;
        } else {
            audio.play().then(() => {
                btn.classList.add('music-playing');
                state.musicPlaying = true;
            }).catch(() => {
                showToast('Klik lagi untuk memutar musik', 'info');
            });
        }
    });
}

// ===========================
// LOGIN MODAL
// ===========================
function initLoginModal() {
    const loginModal = document.getElementById('loginModal');
    const btnOpenLogin = document.getElementById('btnOpenLogin');
    const btnCloseLogin = document.getElementById('btnCloseLogin');
    const btnLoginNext = document.getElementById('btnLoginNext');
    const btnLoginVerify = document.getElementById('btnLoginVerify');
    const btnRegister = document.getElementById('btnRegister');
    const btnStartUse = document.getElementById('btnStartUse');
    const btnChangePhone = document.getElementById('btnChangePhone');

    let pendingPhone = '';

    // Open/Close
    btnOpenLogin.addEventListener('click', () => openLoginModal());
    btnCloseLogin.addEventListener('click', () => closeLoginModal());
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) closeLoginModal();
    });

    // Code input behavior
    document.querySelectorAll('.code-input').forEach((input, i, all) => {
        input.addEventListener('input', (e) => {
            input.value = input.value.replace(/\D/g, '');
            input.classList.toggle('filled', input.value.length > 0);
            if (input.value && i < all.length - 1) {
                all[i + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && i > 0) {
                all[i - 1].focus();
                all[i - 1].classList.remove('filled');
            }
        });
    });

    // Step 1: Check phone number
    btnLoginNext.addEventListener('click', async () => {
        const phone = document.getElementById('loginPhone').value.trim();
        if (!phone || phone.length < 10) {
            showToast('Masukkan nomor HP yang valid', 'error');
            return;
        }

        setButtonLoading(btnLoginNext, true);
        pendingPhone = phone;

        // Check if user exists in Google Sheet
        const result = await apiCall({ action: 'getUser', phone });

        setButtonLoading(btnLoginNext, false);

        if (result.success) {
            // User exists, ask for 4-digit code
            showStep('loginStep2');
            document.getElementById('phoneDisplay').textContent = phone;
            document.querySelector('#loginStep2 .code-input')?.focus();
        } else {
            // User NOT found in Google Sheet
            showToast('Nomor HP tidak terdaftar. Hubungi admin kelas.', 'error');
        }
    });

    // Change phone
    btnChangePhone.addEventListener('click', () => {
        showStep('loginStep1');
        document.getElementById('loginPhone').focus();
    });

    // Step 2: Verify 4-digit code
    btnLoginVerify.addEventListener('click', async () => {
        const inputs = document.querySelectorAll('#codeInputs .code-input');
        const code = Array.from(inputs).map(i => i.value).join('');

        if (code.length < 4) {
            showToast('Masukkan 4 digit kode', 'error');
            return;
        }

        setButtonLoading(btnLoginVerify, true);
        const result = await apiCall({ action: 'login', phone: pendingPhone, code });
        setButtonLoading(btnLoginVerify, false);

        if (result.success) {
            state.isLoggedIn = true;
            state.currentUser = result.user;
            saveSession();
            closeLoginModal();
            updateUIForLogin();
            showToast(`Selamat datang, ${result.user.name}! 🎉`, 'success');
        } else {
            showToast('Kode salah, coba lagi', 'error');
            inputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
            inputs[0].focus();
        }
    });


}

function openLoginModal() {
    document.getElementById('loginModal').classList.add('show');
    document.body.style.overflow = 'hidden';
    showStep('loginStep1');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    document.body.style.overflow = '';
    // Reset
    document.getElementById('loginPhone').value = '';
    document.getElementById('regName').value = '';
    document.querySelectorAll('.code-input').forEach(i => { i.value = ''; i.classList.remove('filled'); });
}

function showStep(stepId) {
    document.querySelectorAll('.login-step').forEach(s => s.style.display = 'none');
    document.getElementById(stepId).style.display = 'block';
}

function setButtonLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (text) text.style.display = loading ? 'none' : '';
    if (loader) loader.style.display = loading ? 'inline-block' : 'none';
    btn.disabled = loading;
}

// ===========================
// PROFILE MODAL
// ===========================
function initProfileModal() {
    const modal = document.getElementById('profileModal');
    const btnClose = document.getElementById('btnCloseProfile');
    const btnSave = document.getElementById('btnSaveProfile');
    const photoWrapper = document.getElementById('profilePhotoWrapper');
    const photoInput = document.getElementById('profilePhotoInput');

    btnClose.addEventListener('click', () => closeProfileModal());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProfileModal();
    });

    // Photo click
    photoWrapper.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', async (e) => {
        if (e.target.files[0]) {
            const preview = document.getElementById('profilePhotoPreview');
            preview.src = URL.createObjectURL(e.target.files[0]);
        }
    });

    // Save profile
    btnSave.addEventListener('click', async () => {
        const name = document.getElementById('profileName').value.trim();
        const bio = document.getElementById('profileBio').value.trim();
        const instagram = document.getElementById('profileInstagram').value.trim();
        const linkedin = document.getElementById('profileLinkedin').value.trim();
        const tiktok = document.getElementById('profileTiktok').value.trim();

        if (!name) {
            showToast('Nama tidak boleh kosong', 'error');
            return;
        }

        setButtonLoading(btnSave, true);

        let photoUrl = state.currentUser.photoUrl;

        // Upload photo if changed
        const file = photoInput.files[0];
        if (file) {
            const uploaded = await uploadToCloudinary(file);
            if (uploaded) photoUrl = uploaded;
        }

        // Update profile
        const result = await apiCall({
            action: 'updateProfile',
            phone: state.currentUser.phone,
            name, bio, photoUrl
        });

        // Update social media
        await apiCall({
            action: 'updateSocials',
            phone: state.currentUser.phone,
            instagram, linkedin, tiktok
        });

        setButtonLoading(btnSave, false);

        if (result.success) {
            state.currentUser = { ...result.user, instagram, linkedin, tiktok };
            saveSession();
            updateUIForLogin();
            closeProfileModal();
            loadMembers(); // Refresh members carousel
            showToast('Profil berhasil diperbarui! ✨', 'success');
        } else {
            showToast(result.message || 'Gagal memperbarui profil', 'error');
        }
    });
}

function openProfileModal() {
    if (!state.isLoggedIn) return;
    const modal = document.getElementById('profileModal');

    document.getElementById('profileName').value = state.currentUser.name || '';
    document.getElementById('profileBio').value = state.currentUser.bio || '';
    document.getElementById('profilePhotoPreview').src = getAvatarURL(state.currentUser);
    document.getElementById('profilePhotoInput').value = '';
    document.getElementById('profileInstagram').value = state.currentUser.instagram || '';
    document.getElementById('profileLinkedin').value = state.currentUser.linkedin || '';
    document.getElementById('profileTiktok').value = state.currentUser.tiktok || '';

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('show');
    document.body.style.overflow = '';
}

// ===========================
// CLOUDINARY UPLOAD
// ===========================
async function uploadToCloudinary(file, onProgress) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_PRESET);
        formData.append('folder', 'web-kelas');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', CLOUDINARY_URL);

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.secure_url);
            } else {
                showToast('Upload gagal, coba lagi', 'error');
                resolve(null);
            }
        });

        xhr.addEventListener('error', () => {
            showToast('Upload gagal, cek koneksi', 'error');
            resolve(null);
        });

        xhr.send(formData);
    });
}

// ===========================
// UPLOAD MODAL
// ===========================
function initUploadModal() {
    const modal = document.getElementById('uploadModal');
    const btnClose = document.getElementById('btnCloseUpload');
    const fabUpload = document.getElementById('fabUpload');
    const btnHeroUpload = document.getElementById('btnHeroUpload');
    const dragArea = document.getElementById('uploadDragArea');
    const fileInput = document.getElementById('uploadFileInput');
    const placeholder = document.getElementById('uploadPlaceholder');
    const preview = document.getElementById('uploadPreview');
    const previewImg = document.getElementById('previewImg');
    const previewVideo = document.getElementById('previewVideo');
    const btnRemove = document.getElementById('btnRemovePreview');
    const btnPublish = document.getElementById('btnPublish');

    let selectedFile = null;

    function openUploadModal() {
        if (!state.isLoggedIn) {
            openLoginModal();
            showToast('Silakan masuk terlebih dahulu', 'info');
            return;
        }
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeUploadModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        resetUpload();
    }

    function resetUpload() {
        selectedFile = null;
        fileInput.value = '';
        placeholder.style.display = '';
        preview.style.display = 'none';
        previewImg.style.display = 'none';
        previewVideo.style.display = 'none';
        document.getElementById('uploadCaption').value = '';
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('progressFill').style.width = '0%';
    }

    fabUpload.addEventListener('click', openUploadModal);
    btnHeroUpload.addEventListener('click', openUploadModal);
    btnClose.addEventListener('click', closeUploadModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeUploadModal();
    });

    // Drag & drop
    dragArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragArea.classList.add('dragover');
    });
    dragArea.addEventListener('dragleave', () => {
        dragArea.classList.remove('dragover');
    });
    dragArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dragArea.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        if (!isImage && !isVideo) {
            showToast('Format file tidak didukung', 'error');
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            showToast('Ukuran file maks 50MB', 'error');
            return;
        }

        selectedFile = file;
        const url = URL.createObjectURL(file);
        placeholder.style.display = 'none';
        preview.style.display = 'block';

        if (isImage) {
            previewImg.src = url;
            previewImg.style.display = 'block';
            previewVideo.style.display = 'none';
        } else {
            previewVideo.src = url;
            previewVideo.style.display = 'block';
            previewImg.style.display = 'none';
        }
    }

    btnRemove.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        placeholder.style.display = '';
        preview.style.display = 'none';
    });

    // Publish
    btnPublish.addEventListener('click', async () => {
        if (!selectedFile) {
            showToast('Pilih foto/video terlebih dahulu', 'error');
            return;
        }

        const caption = document.getElementById('uploadCaption').value.trim();
        const progressArea = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        btnPublish.disabled = true;
        progressArea.style.display = 'block';

        // Upload to Cloudinary
        const mediaUrl = await uploadToCloudinary(selectedFile, (percent) => {
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `${percent}%`;
        });

        if (!mediaUrl) {
            btnPublish.disabled = false;
            return;
        }

        progressText.textContent = 'Menyimpan...';

        // Save to Google Sheets
        const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
        const result = await apiCall({
            action: 'createPost',
            phone: state.currentUser.phone,
            name: state.currentUser.name,
            mediaUrl,
            mediaType,
            caption,
        });

        btnPublish.disabled = false;

        if (result.success) {
            closeUploadModal();
            showToast('Momen berhasil diposting! 🎉', 'success');
            loadPosts(); // Refresh gallery
        } else {
            showToast('Gagal memposting, coba lagi', 'error');
        }
    });
}

// ===========================
// LOAD POSTS (GALLERY)
// ===========================
async function loadPosts() {
    const grid = document.getElementById('masonryGrid');
    const loading = document.getElementById('galleryLoading');

    grid.innerHTML = '';
    grid.appendChild(loading);
    loading.style.display = 'block';

    const result = await apiCall({ action: 'getPosts' });

    loading.style.display = 'none';

    if (result.success && result.posts) {
        state.posts = result.posts;
        updateStats();
        renderGallery();
    } else {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">Belum ada postingan. Jadilah yang pertama!</p>';
    }
}

function renderGallery() {
    const grid = document.getElementById('masonryGrid');
    const loadMoreWrap = document.getElementById('loadMoreWrap');

    const filtered = state.currentFilter === 'all'
        ? state.posts
        : state.posts.filter(p => p.mediaType === state.currentFilter);

    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">Tidak ada postingan.</p>';
        loadMoreWrap.style.display = 'none';
        return;
    }

    const toShow = filtered.slice(0, state.displayedItems);

    toShow.forEach((post, index) => {
        const card = document.createElement('div');
        card.className = 'masonry-item';
        card.style.animationDelay = `${index * 0.05}s`;

        const authorPhoto = post.authorPhoto || getAvatarURL({ name: post.name });
        const isVideo = post.mediaType === 'video';

        if (isVideo) {
            card.innerHTML = `
                <div class="video-indicator"><i class="fas fa-play"></i></div>
                <video src="${post.mediaUrl}" muted loop playsinline preload="metadata"
                       onmouseenter="this.play()" onmouseleave="this.pause();this.currentTime=0;"></video>
                <div class="masonry-item-overlay">
                    <div class="masonry-item-info">
                        <img src="${authorPhoto}" alt="${post.name}">
                        <span>${post.name}</span>
                    </div>
                    <div class="masonry-item-stats">
                        <span><i class="fas fa-heart"></i> ${post.likes}</span>
                        <span><i class="fas fa-comment"></i> ${post.commentCount}</span>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <img src="${post.mediaUrl}" alt="${post.caption || ''}" loading="lazy">
                <div class="masonry-item-overlay">
                    <div class="masonry-item-info">
                        <img src="${authorPhoto}" alt="${post.name}">
                        <span>${post.name}</span>
                    </div>
                    <div class="masonry-item-stats">
                        <span><i class="fas fa-heart"></i> ${post.likes}</span>
                        <span><i class="fas fa-comment"></i> ${post.commentCount}</span>
                    </div>
                </div>
            `;
        }

        card.addEventListener('click', () => openPostDetail(post));
        grid.appendChild(card);
    });

    loadMoreWrap.style.display = toShow.length < filtered.length ? '' : 'none';
}

function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter;
            state.displayedItems = 12;
            renderGallery();
        });
    });

    document.getElementById('btnLoadMore')?.addEventListener('click', () => {
        state.displayedItems += 8;
        renderGallery();
    });
}

function updateStats() {
    const postCount = state.posts.length;
    const uniquePhones = new Set(state.posts.map(p => p.phone)).size;
    const totalComments = state.posts.reduce((sum, p) => sum + (p.commentCount || 0), 0);

    animateCounter('statPosts', postCount);
    animateCounter('statMembers', uniquePhones);
    animateCounter('statComments', totalComments);
}

function animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = current;
    }, 30);
}

function animateStats() {
    // Animation happens via updateStats after loadPosts
}

// ===========================
// POST DETAIL MODAL
// ===========================
function initPostDetailModal() {
    const modal = document.getElementById('postDetailModal');
    const btnClose = document.getElementById('btnClosePost');
    const btnLike = document.getElementById('btnLikePost');
    const btnShare = document.getElementById('btnSharePost');
    const btnSendComment = document.getElementById('btnSendComment');
    const commentInput = document.getElementById('commentInput');

    btnClose.addEventListener('click', () => closePostDetail());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closePostDetail();
    });

    // Like
    btnLike.addEventListener('click', async () => {
        if (!state.isLoggedIn) {
            showToast('Masuk untuk like postingan', 'info');
            return;
        }

        const result = await apiCall({
            action: 'likePost',
            postId: state.currentPost.id,
            phone: state.currentUser.phone,
        });

        if (result.success) {
            const countEl = document.getElementById('likeCount');
            let currentLikes = parseInt(countEl.textContent) || 0;

            if (result.liked) {
                currentLikes++;
                btnLike.classList.add('liked');
                btnLike.querySelector('i').className = 'fas fa-heart';
            } else {
                currentLikes = Math.max(0, currentLikes - 1);
                btnLike.classList.remove('liked');
                btnLike.querySelector('i').className = 'far fa-heart';
            }
            countEl.textContent = currentLikes;

            // Update in state
            const postIdx = state.posts.findIndex(p => p.id === state.currentPost.id);
            if (postIdx >= 0) {
                state.posts[postIdx].likes = currentLikes;
            }
        }
    });

    // Share
    btnShare.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'Momen Manajemen A',
                text: state.currentPost?.caption || '',
                url: window.location.href,
            });
        } else {
            navigator.clipboard?.writeText(window.location.href);
            showToast('Link disalin!', 'success');
        }
    });

    // Comment
    function sendComment() {
        if (!state.isLoggedIn) return;
        const text = commentInput.value.trim();
        if (!text) return;

        apiCall({
            action: 'addComment',
            postId: state.currentPost.id,
            phone: state.currentUser.phone,
            name: state.currentUser.name,
            text,
        }).then(result => {
            if (result.success) {
                // Add comment to UI
                const commentsList = document.getElementById('commentsList');
                const el = createCommentElement({
                    name: state.currentUser.name,
                    photoUrl: state.currentUser.photoUrl,
                    text,
                    timestamp: new Date().toISOString(),
                });
                commentsList.appendChild(el);
                commentsList.scrollTop = commentsList.scrollHeight;

                const countEl = document.getElementById('commentCount');
                countEl.textContent = parseInt(countEl.textContent) + 1;

                commentInput.value = '';
            }
        });
    }

    btnSendComment.addEventListener('click', sendComment);
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendComment();
    });

    // Comment login link
    document.getElementById('commentLoginLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        closePostDetail();
        openLoginModal();
    });
}

function openPostDetail(post) {
    state.currentPost = post;
    const modal = document.getElementById('postDetailModal');

    // Set media
    const img = document.getElementById('postDetailImg');
    const video = document.getElementById('postDetailVideo');

    if (post.mediaType === 'video') {
        img.style.display = 'none';
        video.style.display = 'block';
        video.src = post.mediaUrl;
        video.play().catch(() => { });
    } else {
        img.style.display = 'block';
        video.style.display = 'none';
        img.src = post.mediaUrl;
    }

    // Set info
    const authorPhoto = post.authorPhoto || getAvatarURL({ name: post.name });
    document.getElementById('postAuthorAvatar').src = authorPhoto;
    document.getElementById('postAuthorName').textContent = post.name;
    document.getElementById('postDate').textContent = timeAgo(post.timestamp);
    document.getElementById('postCaption').textContent = post.caption || '';
    document.getElementById('likeCount').textContent = post.likes || 0;

    // Like state
    const btnLike = document.getElementById('btnLikePost');
    const isLiked = state.isLoggedIn && post.likedBy?.includes(state.currentUser?.phone);
    btnLike.classList.toggle('liked', isLiked);
    btnLike.querySelector('i').className = isLiked ? 'fas fa-heart' : 'far fa-heart';

    // Comment area
    const commentInputArea = document.getElementById('commentInputArea');
    const commentLoginPrompt = document.getElementById('commentLoginPrompt');
    commentInputArea.style.display = state.isLoggedIn ? 'flex' : 'none';
    commentLoginPrompt.style.display = state.isLoggedIn ? 'none' : 'block';

    if (state.isLoggedIn) {
        document.getElementById('commentUserAvatar').src = getAvatarURL(state.currentUser);
    }

    // Load comments
    loadComments(post.id);

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

async function loadComments(postId) {
    const commentsList = document.getElementById('commentsList');
    const commentCount = document.getElementById('commentCount');
    commentsList.innerHTML = '<div class="gallery-loading"><div class="spinner"></div></div>';

    const result = await apiCall({ action: 'getComments', postId });

    commentsList.innerHTML = '';

    if (result.success && result.comments) {
        commentCount.textContent = result.comments.length;
        result.comments.forEach(c => {
            commentsList.appendChild(createCommentElement(c));
        });

        if (result.comments.length === 0) {
            commentsList.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;font-size:0.85rem;">Belum ada komentar</p>';
        }
    }
}

function createCommentElement(comment) {
    const el = document.createElement('div');
    el.className = 'comment-item';
    const avatar = comment.photoUrl || getAvatarURL({ name: comment.name });
    el.innerHTML = `
        <img src="${avatar}" alt="${comment.name}" class="comment-avatar">
        <div class="comment-body">
            <div class="comment-username">${comment.name}</div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-meta">
                <span>${timeAgo(comment.timestamp)}</span>
            </div>
        </div>
    `;
    return el;
}

function closePostDetail() {
    const modal = document.getElementById('postDetailModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    const video = document.getElementById('postDetailVideo');
    video.pause();
    video.src = '';
}

// ===========================
// MEMBERS CAROUSEL
// ===========================
async function loadMembers() {
    const track = document.getElementById('membersTrack');
    if (!track) return;

    const result = await apiCall({ action: 'getMembers' });

    if (!result.success || !result.members || result.members.length === 0) {
        track.innerHTML = '<p style="color:var(--text-muted);padding:20px;text-align:center;">Belum ada anggota terdaftar.</p>';
        return;
    }

    const members = result.members;

    function createMemberCard(member) {
        const card = document.createElement('div');
        card.className = 'member-card';

        const photo = member.photoUrl || getAvatarURL(member);

        // Only show social icons that are actually filled in
        let socialsHTML = '';
        if (member.instagram) {
            socialsHTML += `<a href="https://instagram.com/${member.instagram}" target="_blank" class="ig" title="Instagram"><i class="fab fa-instagram"></i></a>`;
        }
        if (member.linkedin) {
            socialsHTML += `<a href="https://linkedin.com/in/${member.linkedin}" target="_blank" class="li" title="LinkedIn"><i class="fab fa-linkedin-in"></i></a>`;
        }
        if (member.tiktok) {
            socialsHTML += `<a href="https://tiktok.com/@${member.tiktok}" target="_blank" class="tt" title="TikTok"><i class="fab fa-tiktok"></i></a>`;
        }

        card.innerHTML = `
            <div class="member-photo">
                <img src="${photo}" alt="${member.name}" loading="lazy">
            </div>
            <div class="member-name">${member.name}</div>
            <div class="member-bio">${member.bio || 'Mahasiswa MJ-A'}</div>
            ${socialsHTML ? `<div class="member-socials">${socialsHTML}</div>` : ''}
        `;
        return card;
    }

    track.innerHTML = '';

    // Render original cards first
    members.forEach(m => track.appendChild(createMemberCard(m)));

    // Check if cards overflow — only scroll if they overflow the viewport
    const cardWidth = 200; // card width + gap
    const totalWidth = members.length * cardWidth;
    const viewportWidth = window.innerWidth;

    if (totalWidth > viewportWidth) {
        // Overflow: duplicate cards for seamless infinite scroll
        members.forEach(m => track.appendChild(createMemberCard(m)));
        const duration = Math.max(20, members.length * 5);
        track.style.animationDuration = `${duration}s`;
        track.style.animation = `membersScroll ${duration}s linear infinite`;
        track.style.justifyContent = '';
    } else {
        // Few members: center them, no scrolling
        track.style.animation = 'none';
        track.style.justifyContent = 'center';
    }
}
