/**
 * courses.js — Halaman daftar mata kuliah
 */

(async () => {
  if (!App.requireAuth()) return;

  // Tampilkan nama user di header
  const session = App.getSession();
  const userEl = document.getElementById('header-user-code');
  if (userEl && session) {
    userEl.textContent = session.name || ('Kode: ' + session.code);
  }

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    App.clearSession();
    window.location.href = 'index.html';
  });

  const grid = document.getElementById('courses-grid');
  const loading = document.getElementById('courses-loading');

  // Load courses
  let courses = [];
  try {
    courses = await App.fetchJSON('data/courses.json');
  } catch (e) {
    loading.innerHTML = '<p style="color:#ef4444">⚠ Gagal memuat daftar mata kuliah.</p>';
    return;
  }

  // Render cards
  loading.remove();

  courses.forEach((course, idx) => {
    // Tentukan apakah mata kuliah ini diizinkan
    const isAllowed = session && session.allowedCourses && (session.allowedCourses.includes(course.accessCode) || course.accessCode === 4);

    const card = document.createElement('div');
    card.className = 'course-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', isAllowed ? `Mulai ujian ${course.name}` : `Ujian ${course.name} Terkunci`);
    card.id = 'course-card-' + course.id;
    card.style.animationDelay = (idx * 80) + 'ms';

    if (!isAllowed) {
      card.classList.add('course-card--locked');
      card.innerHTML = `
        <div class="course-lock-overlay">
          <span class="lock-icon" aria-hidden="true">🔒</span>
        </div>
        <span class="course-card-icon" aria-hidden="true">${course.icon}</span>
        <span class="course-card-code">${course.code}</span>
        <h2 class="course-card-name">${course.name}</h2>
        <p class="course-card-desc">${course.description}</p>
        <div class="course-card-meta">
          <span class="locked-badge">Terkunci</span>
        </div>
      `;
    } else {
      card.innerHTML = `
        <span class="course-card-icon" aria-hidden="true">${course.icon}</span>
        <span class="course-card-code">${course.code}</span>
        <h2 class="course-card-name">${course.name}</h2>
        <p class="course-card-desc">${course.description}</p>
        <div class="course-card-meta">
          <span class="course-card-count">📝 ${course.totalQuestions} Soal</span>
          <span class="course-card-arrow" aria-hidden="true">→</span>
        </div>
      `;
    }

    const startExam = () => {
      if (!isAllowed) {
        alert(`Akses Terkunci: Anda tidak memiliki izin untuk mengakses latihan soal ${course.name}.`);
        return;
      }
      App.setCourse(course);
      window.location.href = 'exam.html';
    };

    card.addEventListener('click', startExam);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startExam(); }
    });

    grid.appendChild(card);
  });
})();
