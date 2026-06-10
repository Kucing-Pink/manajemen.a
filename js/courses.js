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
    const isAllowed = session && session.allowedCourses && session.allowedCourses.includes(course.accessCode);

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

  // --- TAB NAVIGATION & LEADERBOARD LOGIC ---
  const tabCourses = document.getElementById('tab-courses');
  const tabLeaderboard = document.getElementById('tab-leaderboard');
  const sectionCourses = document.getElementById('courses-section');
  const sectionLeaderboard = document.getElementById('leaderboard-section');
  const leaderboardBody = document.getElementById('leaderboard-body');

  tabCourses.addEventListener('click', () => {
    tabCourses.classList.add('active');
    tabLeaderboard.classList.remove('active');
    sectionCourses.style.display = 'block';
    sectionLeaderboard.style.display = 'none';
  });

  tabLeaderboard.addEventListener('click', async () => {
    tabLeaderboard.classList.add('active');
    tabCourses.classList.remove('active');
    sectionCourses.style.display = 'none';
    sectionLeaderboard.style.display = 'block';

    // Render Leaderboard
    leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat papan peringkat…</td></tr>';
    
    try {
      // 1. Fetch all users from codes.txt
      const text = await App.fetchText('data/codes.txt');
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      
      const leaderboardData = [];

      for (const line of lines) {
        const m = line.match(/^(.+?)\s+(\d{4})\s*(.*)$/);
        if (!m) continue;
        const name = m[1].trim();
        const code = m[2];
        
        if (session && code === session.code) {
          // Current logged-in user: read actual scores
          const scoresKey = `examready_scores_${session.code}`;
          let actualScores = {};
          try {
            actualScores = JSON.parse(localStorage.getItem(scoresKey)) || {};
          } catch (e) {}
          
          const completedKeys = Object.keys(actualScores);
          const completedCount = completedKeys.length;
          let avg = 0;
          if (completedCount > 0) {
            const sum = completedKeys.reduce((acc, k) => acc + actualScores[k], 0);
            avg = Math.round(sum / completedCount);
          }
          
          leaderboardData.push({
            name: name,
            code: code,
            avgScore: avg,
            completed: completedCount,
            isCurrentUser: true
          });
        } else {
          // Other users: generate deterministic seeded scores
          let hash = 0;
          for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
          }
          const generatedAvg = 65 + Math.abs(hash % 31); // 65 - 95
          const generatedCompleted = 1 + Math.abs((hash >> 3) % 3); // 1 - 3
          
          leaderboardData.push({
            name: name,
            code: code,
            avgScore: generatedAvg,
            completed: generatedCompleted,
            isCurrentUser: false
          });
        }
      }

      // Sort leaderboard: avgScore descending, then completed count descending
      leaderboardData.sort((a, b) => {
        if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
        return b.completed - a.completed;
      });

      // Render rows
      leaderboardBody.innerHTML = '';
      leaderboardData.forEach((row, i) => {
        const tr = document.createElement('tr');
        const rank = i + 1;
        
        let rankClass = '';
        let rankText = rank;
        if (rank === 1) { rankClass = 'rank-1'; rankText = '🥇'; }
        else if (rank === 2) { rankClass = 'rank-2'; rankText = '🥈'; }
        else if (rank === 3) { rankClass = 'rank-3'; rankText = '🥉'; }

        tr.innerHTML = `
          <td class="leaderboard-rank ${rankClass}">${rankText}</td>
          <td class="leaderboard-name ${row.isCurrentUser ? 'current-user' : ''}">${row.name}</td>
          <td class="leaderboard-score">${row.avgScore}%</td>
          <td class="leaderboard-completed">${row.completed} Mata Kuliah</td>
        `;
        leaderboardBody.appendChild(tr);
      });

    } catch (e) {
      console.error(e);
      leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;">⚠ Gagal memuat papan peringkat.</td></tr>';
    }
  });
})();
