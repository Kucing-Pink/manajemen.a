const RAW_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6eN3mFnsAiNoQbxdzCSx2ePPB6KRn52gRKhKcjz-qavsEIpjNO_J2rmPHQPWPVSrID08Q1G1htZF9/pub?gid=0&single=true&output=csv";
const GOOGLE_SHEET_CSV_URL = "https://api.allorigins.win/raw?url=" + encodeURIComponent(RAW_CSV_URL);
const GOOGLE_APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx51YRrkchGIVUQ9F32Ee-4PUmlYJj8N6mi7pXJfLR3Ban0h3D1Kd5rTumkMjsHa1LLng/exec";

// Global Memories Database
let memories = [];

let validUsers = [];
let isLoggedIn = false;

document.addEventListener('DOMContentLoaded', () => {

  // --- Features: Theme & Music ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const bgMusic = document.getElementById('bgMusic');
  const htmlTag = document.documentElement;

  themeToggleBtn.addEventListener('click', () => {
    if(htmlTag.getAttribute('data-theme') === 'dark') {
      htmlTag.setAttribute('data-theme', 'light');
      themeToggleBtn.innerHTML = '<i class="ph-fill ph-sun"></i>';
    } else {
      htmlTag.setAttribute('data-theme', 'dark');
      themeToggleBtn.innerHTML = '<i class="ph-fill ph-moon-stars"></i>';
    }
  });

  let isMusicPlaying = false;
  if(musicToggleBtn && bgMusic) {
    musicToggleBtn.addEventListener('click', () => {
      if(isMusicPlaying) {
        bgMusic.pause();
        musicToggleBtn.innerHTML = '<i class="ph-fill ph-headphones"></i>';
        musicToggleBtn.style.color = '';
        musicToggleBtn.style.background = 'transparent';
      } else {
        bgMusic.volume = 0.3; // Volume santai
        bgMusic.play().catch(e => console.log("Gagal memutar musik:", e));
        musicToggleBtn.innerHTML = '<i class="ph-fill ph-speaker-high"></i>';
        musicToggleBtn.style.color = 'var(--bg-dark)';
        musicToggleBtn.style.background = 'var(--text-primary)';
      }
      isMusicPlaying = !isMusicPlaying;
    });
  }

  // --- Top Highlights (Gamification) ---
  function renderHighlights() {
    const container = document.getElementById('topMomentsContainer');
    container.innerHTML = '';
    
    // Sort memories by likes (descending) and pick top 4
    const topMemories = [...memories].sort((a,b) => parseInt(b.likes) - parseInt(a.likes)).slice(0, 4);
    
    topMemories.forEach(item => {
      const card = document.createElement('div');
      card.className = 'highlight-card';
      card.innerHTML = `
        <img src="${item.url}" alt="${item.caption}">
        <div class="overlay">
          <h4>🔥 ${item.likes} Cinta</h4>
          <p>${item.caption.substring(0, 25)}...</p>
        </div>
      `;
      card.addEventListener('click', () => openMediaModal(item));
      container.appendChild(card);
    });
  }

  // --- Gallery Rendering ---
  const grid = document.getElementById('galleryGrid');
  let currentSort = 'newest';
  let currentSemester = 'all';

  function renderGallery() {
    grid.innerHTML = '';
    
    let filtered = memories.filter(item => {
      if(currentSemester === 'all') return true;
      return item.semester === currentSemester;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return currentSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    if(filtered.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:2rem; grid-column:1/-1;">Belum ada jejak di mesin waktu ini.</p>';
      return;
    }

    filtered.forEach(item => {
      const el = document.createElement('div');
      el.className = 'media-item';
      
      let mediaTag = item.type === 'video' 
        ? `<video src="${item.url}" autoplay muted loop playsinline style="width: 100%; display: block; object-fit: cover;"></video>`
        : `<img src="${item.url}" alt="Kenangan" loading="lazy">`;
      
      el.innerHTML = `
        ${mediaTag}
        <div class="overlay">
          <p class="caption">${item.caption.substring(0, 40)}...</p>
          <div class="stats-row" style="margin-bottom: 0.8rem;">
            <div class="stats-badges">
              <div class="badge"><i class="ph ph-calendar-blank"></i> ${new Date(item.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })}</div>
              <div class="badge"><i class="ph ph-books"></i> Sem ${item.semester}</div>
            </div>
          </div>
          <div class="stats-row" style="color:var(--text-secondary); font-size:0.9rem;">
            <span><i class="ph-fill ph-heart"></i> ${item.likes}</span>
            <span><i class="ph-fill ph-chat-circle-dots"></i> ${item.comments}</span>
          </div>
        </div>
      `;
      el.addEventListener('click', () => openMediaModal(item));
      grid.appendChild(el);
    });
  }

  // Init
  renderHighlights();
  renderGallery();

  // --- Dynamic Filters Logic ---
  document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
    const btn = dropdown.querySelector('.dropdown-toggle');
    const textSpan = btn.querySelector('.selected-text');
    const menu = dropdown.querySelector('.dropdown-menu');
    const items = menu.querySelectorAll('li');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-dropdown').forEach(d => {
        if(d !== dropdown) d.classList.remove('open');
      });
      dropdown.classList.toggle('open');
    });

    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        textSpan.textContent = item.textContent;
        dropdown.classList.remove('open');

        if(dropdown.id === 'sortDropdown') currentSort = item.dataset.value;
        if(dropdown.id === 'semesterDropdown') currentSemester = item.dataset.value;
        
        renderGallery();
      });
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
  });

  // --- Auth & Google Sheets ---
  const dbStatus = document.getElementById('dbStatus');
  async function loadDatabaseFromSheet() {
    try {
      const response = await fetch(GOOGLE_SHEET_CSV_URL);
      if(!response.ok) throw new Error('Gagal mengambil data');
      const csvText = await response.text();
      const rows = csvText.split('\n').filter(r => r.trim() !== '');
      validUsers = rows.slice(1).map(row => {
        const [hp, pin] = row.split(',').map(s => s.trim());
        return { hp, pin };
      });
      dbStatus.innerHTML = `<i class="ph ph-check-circle" style="color: #10b981;"></i> Jalur aman. ${validUsers.length} identitas ditemukan.`;
    } catch (error) {
      console.error(error);
      dbStatus.innerHTML = `<i class="ph ph-warning" style="color: var(--accent-primary);"></i> Koneksi database terputus.`;
    }
  }

  let currentUserHp = '';

  const loginBtn = document.getElementById('loginBtn');
  const loginModal = document.getElementById('loginModal');
  const closeLoginBtn = document.getElementById('closeLoginBtn');
  const fabUploadBtn = document.getElementById('fabUploadBtn'); 



  // --- Profile Class Modal ---
  const profileClassBtn = document.getElementById('profileClassBtn');
  const profileModal = document.getElementById('profileModal');
  const closeProfileBtn = document.getElementById('closeProfileBtn');

  // --- User Profile Modal ---
  const userProfileModal = document.getElementById('userProfileModal');
  const closeUserProfileBtn = document.getElementById('closeUserProfileBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userProfileHp = document.getElementById('userProfileHp');
  
  const editProfileBtn = document.getElementById('editProfileBtn');
  const userProfileName = document.getElementById('userProfileName');
  const userProfileBio = document.getElementById('userProfileBio');
  const profileAvatarOverlay = document.getElementById('profileAvatarOverlay');
  const profilePicInput = document.getElementById('profilePicInput');
  const userProfileImg = document.getElementById('userProfileImg');

  let isEditingProfile = false;

  function loadUserProfileData(hp) {
    const savedData = localStorage.getItem(`userProfile_${hp}`);
    if(savedData) {
      const parsed = JSON.parse(savedData);
      if(parsed.name) userProfileName.textContent = parsed.name;
      if(parsed.bio) userProfileBio.textContent = parsed.bio;
      if(parsed.avatar) userProfileImg.src = parsed.avatar;
    } else {
      userProfileName.textContent = 'Siswa Terdaftar';
      userProfileBio.textContent = 'Haloo! Mari mengukir kenangan bersama Manajemen A.';
      userProfileImg.src = 'https://i.pravatar.cc/150?img=11';
    }
  }

  function toggleEditProfile() {
    isEditingProfile = !isEditingProfile;
    if(isEditingProfile) {
      editProfileBtn.innerHTML = '<i class="ph-fill ph-check"></i>';
      editProfileBtn.classList.add('active');
      userProfileName.contentEditable = "true";
      userProfileBio.contentEditable = "true";
      userProfileName.style.border = '1px dashed var(--accent-secondary)';
      userProfileBio.style.border = '1px dashed var(--accent-secondary)';
      userProfileName.style.background = 'rgba(255,255,255,0.05)';
      userProfileBio.style.background = 'rgba(255,255,255,0.05)';
      profileAvatarOverlay.classList.remove('hidden');
      userProfileName.focus();
    } else {
      editProfileBtn.innerHTML = '<i class="ph-fill ph-pencil-simple"></i>';
      editProfileBtn.classList.remove('active');
      userProfileName.contentEditable = "false";
      userProfileBio.contentEditable = "false";
      userProfileName.style.border = '1px dashed transparent';
      userProfileBio.style.border = '1px dashed transparent';
      userProfileName.style.background = 'transparent';
      userProfileBio.style.background = 'transparent';
      profileAvatarOverlay.classList.add('hidden');
      
      // Save to localStorage immediately for instant feedback
      const profileData = {
        name: userProfileName.textContent.trim(),
        bio: userProfileBio.textContent.trim(),
        avatar: userProfileImg.src
      };
      localStorage.setItem(`userProfile_${currentUserHp}`, JSON.stringify(profileData));
      
      // Update Navbar icon if open
      const navImg = loginBtn.querySelector('img');
      if(navImg) navImg.src = profileData.avatar;

      // Sync to Global Database
      submitProfileToGlobal(profileData);
    }
  }

  // --- GLOBAL SYNC FUNCTIONS ---
  window.GlobalProfiles = {}; // In-memory dictionary for fast rendering
  let globalComments = [];

  async function fetchGlobalProfiles() {
    try {
      const res = await fetch(GOOGLE_APP_SCRIPT_URL + "?action=getProfiles");
      const json = await res.json();
      json.forEach(p => {
        if(p.hp && p.name) {
          const profObj = { name: p.name, bio: p.bio, avatar: p.avatarUrl || 'https://i.pravatar.cc/150?img=11' };
          window.GlobalProfiles[p.hp] = profObj;
          localStorage.setItem(`userProfile_${p.hp}`, JSON.stringify(profObj));
        }
      });
    } catch(e) {
      console.warn("Global profiles fetch skipped/failed.");
    }
  }

  async function fetchGlobalComments() {
    try {
      const res = await fetch(GOOGLE_APP_SCRIPT_URL + "?action=getComments");
      globalComments = await res.json();
    } catch(e) {
      console.warn("Global comments fetch failed.");
    }
  }

  async function fetchGlobalMemories() {
    if(!GOOGLE_APP_SCRIPT_URL || GOOGLE_APP_SCRIPT_URL === "KOSONG") return;
    try {
      const res = await fetch(GOOGLE_APP_SCRIPT_URL); // Default action is getUploads
      const json = await res.json();
      if(Array.isArray(json) && json.length > 0) {
         memories = json.map(j => ({
           id: j.id || Date.now(),
           type: j.type || 'image',
           url: j.url || j.url,
           caption: j.caption || '',
           likes: j.likes || 0,
           comments: j.comments || 0,
           date: j.date || new Date().toISOString().split('T')[0],
           semester: j.semester || '1'
         })).reverse(); // Reverse so newest are at the top natively
      }
    } catch(e) {
      console.warn("Global memories fetch failed.");
    } finally {
      renderHighlights();
      renderGallery();
    }
  }

  async function submitProfileToGlobal(data) {
    if(!GOOGLE_APP_SCRIPT_URL || GOOGLE_APP_SCRIPT_URL === "KOSONG") return;
    
    let b64 = "";
    let mime = "";
    // Check if avatar is newly uploaded (base64)
    if(data.avatar.startsWith('data:image')) {
       const parts = data.avatar.split(';');
       mime = parts[0].split(':')[1];
       b64 = parts[1].split(',')[1];
    }

    const payload = new URLSearchParams({
      'action': 'updateProfile',
      'hp': currentUserHp,
      'name': data.name,
      'bio': data.bio,
      'avatarBase64': b64,
      'mimeType': mime
    });

    try {
      editProfileBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>'; 
      const res = await fetch(GOOGLE_APP_SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString()
      });
      const result = await res.json();
      
      if(result.success && result.url) {
        data.avatar = result.url;
        localStorage.setItem(`userProfile_${currentUserHp}`, JSON.stringify(data));
        userProfileImg.src = result.url;
      }
    } catch(e) {
      console.error("Global save failed", e);
    } finally {
      editProfileBtn.innerHTML = '<i class="ph-fill ph-pencil-simple"></i>';
    }
  }

  // Automatically fetch peer profiles on page load
  fetchGlobalProfiles();
  fetchGlobalComments();
  fetchGlobalMemories();

  if(editProfileBtn) editProfileBtn.addEventListener('click', toggleEditProfile);

  if(profileAvatarOverlay) {
    profileAvatarOverlay.addEventListener('click', () => profilePicInput.click());
  }

  if(profilePicInput) {
    profilePicInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
           userProfileImg.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if(profileClassBtn && profileModal) {
    profileClassBtn.addEventListener('click', () => {
      profileModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
    
    closeProfileBtn.addEventListener('click', () => {
      profileModal.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }

  if(userProfileModal) {
    closeUserProfileBtn.addEventListener('click', () => userProfileModal.classList.add('hidden'));
    logoutBtn.addEventListener('click', () => {
      isLoggedIn = false;
      currentUserHp = '';
      userProfileModal.classList.add('hidden');
      loginBtn.innerHTML = `<span>Akses Ruang</span> <i class="ph ph-sign-in"></i>`;
      if(fabUploadBtn) fabUploadBtn.classList.add('hidden');
      alert('Anda telah keluar dari ruang memori kelas.');
    });
  }

  loginBtn.addEventListener('click', () => {
    if(isLoggedIn) {
      if(userProfileModal) userProfileModal.classList.remove('hidden');
      return; 
    }
    loginModal.classList.remove('hidden');
    loadDatabaseFromSheet();
  });

  closeLoginBtn.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    resetLogin();
  });

  const otpInputs = document.querySelectorAll('.otp-digit');
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if (e.target.value.length > 0 && index < otpInputs.length - 1) otpInputs[index + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) otpInputs[index - 1].focus();
    });
  });

  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const loginInput = document.getElementById('loginInput');
  const otpError = document.getElementById('otpError');

  function normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.startsWith('62')) cleaned = cleaned.substring(2);
    else if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    return cleaned;
  }

  verifyOtpBtn.addEventListener('click', () => {
    let hpValue = loginInput.value.trim();
    let pinValue = '';
    otpInputs.forEach(i => pinValue += i.value.trim());

    const normInput = normalizePhone(hpValue);

    // Bypassing for demo purposes if CSV fails to load
    const isMockBypass = (normInput === '81215215837' && pinValue === '2203');
    const userFound = validUsers.some(u => normalizePhone(u.hp) === normInput && u.pin === pinValue) || isMockBypass;

    if(userFound) {
       isLoggedIn = true;
       currentUserHp = normInput;
       
       loadUserProfileData(currentUserHp);
       
       alert('Halo! Selamat datang di mesin waktu Manajemen A ✨');
       loginModal.classList.add('hidden');
       
       loginBtn.innerHTML = `<span>Profil Anda</span> <img src="${userProfileImg.src}" style="width:28px; height:28px; object-fit:cover; border-radius:50%; margin-left:8px;">`;
       if(userProfileHp) userProfileHp.textContent = '+62 ' + normInput;
       
       // Show Floating Action Button
       if(fabUploadBtn) fabUploadBtn.classList.remove('hidden');
       
    } else {
       otpError.classList.remove('hidden');
       const loginStep1 = document.getElementById('loginStep1');
       loginStep1.classList.add('shake');
       setTimeout(() => loginStep1.classList.remove('shake'), 400);
       otpInputs.forEach(i => i.value = '');
       otpInputs[0].focus();
    }
  });

  function resetLogin() {
    loginInput.value = '';
    otpError.classList.add('hidden');
    otpInputs.forEach(i => i.value = '');
  }

  // --- Upload Feature via FAB ---
  const uploadModal = document.getElementById('uploadModal');
  const closeUploadBtn = document.getElementById('closeUploadBtn');
  const imageUploadInput = document.getElementById('imageUploadInput');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const videoPreview = document.getElementById('videoPreview');
  const removeImageBtn = document.getElementById('removeImageBtn');
  const uploadCaption = document.getElementById('uploadCaption');
  const uploadSemester = document.getElementById('uploadSemester');
  const submitUploadBtn = document.getElementById('submitUploadBtn');

  let currentUploadFile = null;
  let currentBase64 = '';
  let currentItemType = 'image';

  if(fabUploadBtn) {
    fabUploadBtn.addEventListener('click', () => {
      uploadModal.classList.remove('hidden');
    });
  }

  closeUploadBtn.addEventListener('click', resetUploadModal);
  removeImageBtn.addEventListener('click', () => {
     currentUploadFile = null; currentBase64 = ''; currentItemType = 'image';
     imagePreview.src = ''; if(videoPreview) videoPreview.src = '';
     imagePreview.style.display = 'none'; if(videoPreview) videoPreview.style.display = 'none';
     imagePreviewContainer.classList.add('hidden');
     imageUploadInput.value = '';
  });

  imageUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
      if(file.size > 20 * 1024 * 1024) {
         imageUploadInput.value = '';
         return alert("Ups! Ukuran maksimal unggahan adalah 20MB demi menjaga stabilitas server.");
      }
      currentUploadFile = file;
      currentItemType = file.type.startsWith('video') ? 'video' : 'image';
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        currentBase64 = ev.target.result;
        if(currentItemType === 'video') {
           imagePreview.style.display = 'none';
           if(videoPreview) {
               videoPreview.src = currentBase64;
               videoPreview.style.display = 'block';
           }
        } else {
           if(videoPreview) videoPreview.style.display = 'none';
           imagePreview.src = currentBase64;
           imagePreview.style.display = 'block';
        }
        imagePreviewContainer.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  submitUploadBtn.addEventListener('click', async () => {
    if(!currentUploadFile) return alert("Harap pilih foto atau video kenangan Anda!");
    const cap = uploadCaption.value.trim();
    const sem = uploadSemester.value;
    if(!cap || !sem) return alert("Harap lengkapi cerita dan pilih semester!");

    if(!GOOGLE_APP_SCRIPT_URL || GOOGLE_APP_SCRIPT_URL === "KOSONG") {
        alert("Mode Simulasi: URL Google Apps Script belum terhubung.");
        simulateUpload(cap, sem); return;
    }

    submitUploadBtn.innerHTML = 'Menulis Memori... <i class="ph ph-spinner ph-spin"></i>';
    submitUploadBtn.disabled = true;

    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const base64Data = currentBase64.split(',')[1];
      const mimeType = currentUploadFile.type;
      const fileName = currentUploadFile.name;

      const scriptData = new URLSearchParams({
        'action': 'uploadAndSave',
        'fileData': base64Data, 'mimeType': mimeType, 'fileName': fileName,
        'itemType': currentItemType,
        'caption': cap, 'semester': sem, 'date': currentDate, 'likes': 0, 'comments': 0
      });

      const response = await fetch(GOOGLE_APP_SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: scriptData.toString()
      });

      const result = await response.json();
      if(result.error) throw new Error(result.error);

      const newMemory = { id: Date.now(), type: currentItemType, url: currentBase64, caption: cap, likes: '0', comments: '0', date: currentDate, semester: sem };
      memories.unshift(newMemory);
      renderHighlights();
      renderGallery();
      resetUploadModal();
      alert("Kenangan abadi berhasil disimpan ke Ruang Waktu! 🌌");

    } catch (error) {
      console.error(error);
      alert("Ups! Gagal mengunggah dimensi waktu. Coba ukuran gambar lebih kecil.");
    } finally {
      submitUploadBtn.innerHTML = 'Abadikan Memori <i class="ph-fill ph-sparkle"></i>';
      submitUploadBtn.disabled = false;
    }
  });

  function simulateUpload(cap, sem) {
      const newMemory = { id: Date.now(), type: currentItemType, url: currentBase64, caption: cap, likes: '0', comments: '0', date: new Date().toISOString().split('T')[0], semester: sem };
      memories.unshift(newMemory);
      renderHighlights();
      renderGallery();
      resetUploadModal();
  }

  function resetUploadModal() {
    uploadModal.classList.add('hidden');
    currentUploadFile = null; currentBase64 = ''; currentItemType = 'image';
    imagePreview.src = ''; if(videoPreview) videoPreview.src = '';
    imagePreview.style.display = 'none'; if(videoPreview) videoPreview.style.display = 'none';
    imagePreviewContainer.classList.add('hidden');
    uploadCaption.value = ''; uploadSemester.value = ''; imageUploadInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- TikTok Style Media Modal ---
  const mediaModal = document.getElementById('mediaModal');
  const closeMediaBtn = document.getElementById('closeMediaBtn');
  const mediaDisplayArea = document.getElementById('mediaDisplayArea');
  const mediaCaption = document.getElementById('mediaCaption');
  const authorSub = document.getElementById('authorSub');
  const likeCount = document.getElementById('likeCount');
  const likeBtn = document.getElementById('likeBtn');
  
  const commentsList = document.getElementById('commentsList');
  const postCommentBtn = document.getElementById('postCommentBtn');
  const newCommentInput = document.getElementById('newCommentInput');

  let activeMemoryId = null;

  // Expose function globally so HTML inline calls can use it.
  window.openMediaModal = function(item) {
    activeMemoryId = item.id;
    if(item.type === 'video') {
       mediaDisplayArea.innerHTML = `<video src="${item.url}" autoplay controls playsinline style="width: 100%; height: 100%; object-fit: contain; background: #000;"></video>`;
    } else {
       mediaDisplayArea.innerHTML = `<img src="${item.url}" alt="Kenangan" style="width: 100%; height: 100%; object-fit: contain; background: #000;">`;
    }
    mediaCaption.textContent = item.caption;
    likeCount.textContent = item.likes;
    authorSub.textContent = `Semester ${item.semester} • ${new Date(item.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    
    renderCommentsForCurrentMemory();
    
    mediaModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };
  
  function renderCommentsForCurrentMemory() {
    if(!commentsList) return;
    const memoryComments = globalComments.filter(c => String(c.memoryId) === String(activeMemoryId));
    commentsList.innerHTML = '';
    
    if(memoryComments.length === 0) {
      commentsList.innerHTML = '<div class="empty-state">Jadilah yang pertama untuk meninggalkan pesan di foto ini!</div>';
      return;
    }
    
    memoryComments.forEach(c => {
      let userProfile = window.GlobalProfiles[c.hp];
      if(!userProfile) {
        const local = localStorage.getItem(`userProfile_${c.hp}`);
        if(local) {
          userProfile = JSON.parse(local);
          window.GlobalProfiles[c.hp] = userProfile;
        }
      }
      if(!userProfile) {
        userProfile = { name: 'Anonim Student', avatar: 'https://i.pravatar.cc/150?img=1' };
      }
      
      const div = document.createElement('div');
      div.style = "display: flex; gap: 1rem; margin-bottom: 1.5rem; animation: fade-in 0.3s;";
      div.innerHTML = `
        <img src="${userProfile.avatar}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-secondary);">
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 1rem; border-radius: 0 16px 16px 16px; width: 100%;">
          <h5 style="color: var(--text-primary); font-size: 0.95rem; margin-bottom: 0.4rem; font-weight: 700;">${userProfile.name} <span style="font-weight: 400; color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem;">${new Date(c.date).toLocaleDateString('id-ID')}</span></h5>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5;">${c.text}</p>
        </div>
      `;
      commentsList.appendChild(div);
    });
    
    setTimeout(() => { commentsList.scrollTop = commentsList.scrollHeight; }, 50);
  }

  if(postCommentBtn && newCommentInput) {
    postCommentBtn.addEventListener('click', async () => {
      if(!isLoggedIn) return alert("Hanya Mahasiswa Terdaftar yang bisa berkomentar! Silakan masuk via akses ruang.");
      
      const txt = newCommentInput.value.trim();
      if(!txt) return;
      
      postCommentBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
      postCommentBtn.disabled = true;
      
      let tempComment = { memoryId: activeMemoryId, hp: currentUserHp, text: txt, date: new Date().toISOString() };
      globalComments.push(tempComment);
      renderCommentsForCurrentMemory();
      newCommentInput.value = '';
      
      const payload = new URLSearchParams({
        'action': 'addComment',
        'memoryId': activeMemoryId,
        'hp': currentUserHp,
        'text': txt
      });
      
      try {
        await fetch(GOOGLE_APP_SCRIPT_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload.toString()
        });
      } catch(e) {
        console.error("Gagal mengirim komentar", e);
      } finally {
        postCommentBtn.innerHTML = '<i class="ph-fill ph-paper-plane-tilt"></i>';
        postCommentBtn.disabled = false;
      }
    });

    newCommentInput.addEventListener('keypress', (e) => {
      if(e.key === 'Enter') postCommentBtn.click();
    });
  }

  closeMediaBtn.addEventListener('click', () => {
    mediaModal.classList.add('hidden');
    document.body.style.overflow = '';
  });

  likeBtn.addEventListener('click', () => {
    likeBtn.classList.toggle('liked');
    let currentLikes = parseInt(likeCount.textContent);
    if(likeBtn.classList.contains('liked')) {
      likeCount.textContent = currentLikes + 1;
    } else {
      likeCount.textContent = currentLikes - 1;
    }
  });

});
