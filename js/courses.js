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

  // Sync current user's local scores to KVdb on load
  if (session && session.code) {
    const scoresKey = `examready_scores_${session.code}`;
    try {
      const localScores = JSON.parse(localStorage.getItem(scoresKey));
      if (localScores && Object.keys(localScores).length > 0) {
        fetch(`https://kvdb.io/KGTXeyzkMeXqAuC7NhgjMx/scores_${session.code}`, {
          method: 'POST',
          body: JSON.stringify({
            name: session.name,
            scores: localScores
          })
        }).catch(e => console.error('Error syncing scores to KVdb:', e));
      }
    } catch (e) {}
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
      // 1. Fetch all users from codes.txt to establish names and codes
      const text = await App.fetchText('data/codes.txt');
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      
      const leaderboardMap = {};

      for (const line of lines) {
        const m = line.match(/^(.+?)\s+(\d{4})\s*(.*)$/);
        if (!m) continue;
        const name = m[1].trim();
        const code = m[2];
        
        leaderboardMap[code] = {
          name: name,
          code: code,
          avgScore: 0,
          completed: 0,
          isCurrentUser: (session && code === session.code)
        };
      }

      // 2. Fetch all real-time scores from KVdb
      try {
        const response = await fetch('https://kvdb.io/KGTXeyzkMeXqAuC7NhgjMx/?prefix=scores_&values=true&format=json');
        if (response.ok) {
          const dbData = await response.json(); // array of [key, value]
          dbData.forEach(([key, valStr]) => {
            try {
              const parsed = JSON.parse(valStr);
              const code = key.replace('scores_', '');
              if (leaderboardMap[code]) {
                const completedKeys = Object.keys(parsed.scores || {});
                const completedCount = completedKeys.length;
                let avg = 0;
                if (completedCount > 0) {
                  const sum = completedKeys.reduce((acc, k) => acc + parsed.scores[k], 0);
                  avg = Math.round(sum / completedCount);
                }
                leaderboardMap[code].avgScore = avg;
                leaderboardMap[code].completed = completedCount;
              }
            } catch (e) {
              console.error('Error parsing row:', e);
            }
          });
        }
      } catch (e) {
        console.error('Error fetching database scores:', e);
      }

      // Convert map to sorted array
      const leaderboardData = Object.values(leaderboardMap);
      
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
          <td class="leaderboard-completed">${row.completed} Mata Kuliah Selesai</td>
        `;
        leaderboardBody.appendChild(tr);
      });

    } catch (e) {
      console.error(e);
      leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ef4444;">⚠ Gagal memuat papan peringkat.</td></tr>';
    }
  });
})();
