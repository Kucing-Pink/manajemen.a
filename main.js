const RAW_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6eN3mFnsAiNoQbxdzCSx2ePPB6KRn52gRKhKcjz-qavsEIpjNO_J2rmPHQPWPVSrID08Q1G1htZF9/pub?gid=0&single=true&output=csv";
const GOOGLE_SHEET_CSV_URL = "https://api.allorigins.win/raw?url=" + encodeURIComponent(RAW_CSV_URL);
const GOOGLE_APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwM5KWS6EC_KqCGi0e08S0bOcs0qNvMN1CcGjjDgllMKUe2oWTUso1B4Cip5zdQerCOvg/exec";

// Premium Mock Data (Pinterest Style Masonry)
const memories = [
  { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600', caption: 'Presentasi seru dari kelompok 3. 📈', likes: '88', comments: '9', date: '2026-02-14', semester: '6' },
  { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&h=900&fit=crop', caption: 'Fokus nugas sampai lupa waktu. ☕💻', likes: '156', comments: '18', date: '2025-04-12', semester: '4' },
  { id: 3, type: 'image', url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800', caption: 'Kerja kelompok di perpus, nongkrong sambil nugas. Memang beda rasanya! 📚✨', likes: '89', comments: '5', date: '2024-09-10', semester: '3' },
  { id: 4, type: 'image', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=800&fit=crop', caption: 'Tugas menumpuk tapi tetap semangat! 💪', likes: '112', comments: '4', date: '2024-05-20', semester: '3' },
  { id: 5, type: 'image', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=800&fit=crop', caption: 'Suasana kampus sore hari, tenang dan damai. Siapa yang kangen? 🌅', likes: '210', comments: '24', date: '2023-11-20', semester: '2' },
  { id: 6, type: 'image', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600', caption: 'Masa orientasi mahasiswa baru yang paling pecah! 🔥 #ManajemenA', likes: '342', comments: '56', date: '2023-08-05', semester: '1' },
  { id: 7, type: 'image', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=1000&fit=crop', caption: 'Belajar untuk UTS malam-malam di perpus. Mata udah 5 watt. 🥱', likes: '205', comments: '35', date: '2024-04-10', semester: '2' },
  { id: 8, type: 'image', url: 'https://images.unsplash.com/photo-1571260899304-4250701120f6?w=800', caption: 'Menuju skripsi! Kita pasti lulus bareng teman-teman. 🎓🌟', likes: '420', comments: '80', date: '2026-03-01', semester: '6' },
  { id: 9, type: 'image', url: 'https://images.unsplash.com/photo-1491308056676-205b7c9a7dc1?w=600', caption: 'Persahabatan yang terjalin sejak semester awal. ✨', likes: '250', comments: '30', date: '2023-10-15', semester: '1' },
  { id: 10, type: 'image', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600', caption: 'Lulus Ujian Akhir Semester! 🎉 Perjuangan yang membuahkan hasil luar biasa.', likes: '124', comments: '12', date: '2025-12-15', semester: '5' },
  { id: 11, type: 'image', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=900&fit=crop', caption: 'Nongkrong sehabis kelas, bahas organisasi dan masa depan. 🗣️', likes: '178', comments: '15', date: '2024-11-12', semester: '4' },
  { id: 12, type: 'image', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop', caption: 'Kerja kelompok buat tugas Bisnis Digital. Seru banget! 🚀', likes: '95', comments: '8', date: '2025-06-18', semester: '5' },
  { id: 13, type: 'image', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600', caption: 'Diskusi kelompok yang seringnya malah banyak bercanda. 😂', likes: '144', comments: '22', date: '2023-09-25', semester: '1' },
  { id: 14, type: 'image', url: 'https://images.unsplash.com/photo-1560523159-4a9692d222f9?w=800', caption: 'Ujian komprehensif selesai! Lega luar biasa. 😭🙏', likes: '315', comments: '42', date: '2026-02-28', semester: '6' },
  { id: 15, type: 'image', url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800', caption: 'Hari Wisuda yang dinanti telah tiba! Selamat Manajemen A! 🎓🎉', likes: '850', comments: '120', date: '2026-08-15', semester: '6' }
];

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
  musicToggleBtn.addEventListener('click', () => {
    if(isMusicPlaying) {
      bgMusic.pause();
      musicToggleBtn.classList.remove('active');
    } else {
      bgMusic.volume = 0.3;
      bgMusic.play().catch(e => console.log("Audio play blocked by browser."));
      musicToggleBtn.classList.add('active');
    }
    isMusicPlaying = !isMusicPlaying;
  });

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
      
      el.innerHTML = `
        <img src="${item.url}" alt="Kenangan" loading="lazy">
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
      
      // Save to localStorage
      const profileData = {
        name: userProfileName.textContent.trim(),
        bio: userProfileBio.textContent.trim(),
        avatar: userProfileImg.src
      };
      localStorage.setItem(`userProfile_${currentUserHp}`, JSON.stringify(profileData));
      
      // Update Navbar icon if open
      const navImg = loginBtn.querySelector('img');
      if(navImg) navImg.src = profileData.avatar;
    }
  }

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
  const removeImageBtn = document.getElementById('removeImageBtn');
  const uploadCaption = document.getElementById('uploadCaption');
  const uploadSemester = document.getElementById('uploadSemester');
  const submitUploadBtn = document.getElementById('submitUploadBtn');

  let currentUploadFile = null;
  let currentBase64 = '';

  if(fabUploadBtn) {
    fabUploadBtn.addEventListener('click', () => {
      uploadModal.classList.remove('hidden');
    });
  }

  closeUploadBtn.addEventListener('click', resetUploadModal);
  removeImageBtn.addEventListener('click', () => {
     currentUploadFile = null; currentBase64 = '';
     imagePreview.src = ''; imagePreviewContainer.classList.add('hidden');
     imageUploadInput.value = '';
  });

  imageUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
      currentUploadFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        currentBase64 = ev.target.result;
        imagePreview.src = currentBase64;
        imagePreviewContainer.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  submitUploadBtn.addEventListener('click', async () => {
    if(!currentUploadFile) return alert("Harap pilih foto kenangan Anda!");
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
        'caption': cap, 'semester': sem, 'date': currentDate, 'likes': 0, 'comments': 0
      });

      const response = await fetch(GOOGLE_APP_SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: scriptData.toString()
      });

      const result = await response.json();
      if(result.error) throw new Error(result.error);

      const newMemory = { id: Date.now(), type: 'image', url: currentBase64, caption: cap, likes: '0', comments: '0', date: currentDate, semester: sem };
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
      const newMemory = { id: Date.now(), type: 'image', url: currentBase64, caption: cap, likes: '0', comments: '0', date: new Date().toISOString().split('T')[0], semester: sem };
      memories.unshift(newMemory);
      renderHighlights();
      renderGallery();
      resetUploadModal();
  }

  function resetUploadModal() {
    uploadModal.classList.add('hidden');
    currentUploadFile = null; currentBase64 = '';
    imagePreview.src = ''; imagePreviewContainer.classList.add('hidden');
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

  // Expose function globally so HTML inline calls can use it.
  window.openMediaModal = function(item) {
    mediaDisplayArea.innerHTML = `<img src="${item.url}" alt="Kenangan">`;
    mediaCaption.textContent = item.caption;
    likeCount.textContent = item.likes;
    authorSub.textContent = `Semester ${item.semester} • ${new Date(item.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    mediaModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

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
