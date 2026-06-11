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

  // Sync current user's local scores & progress to Pantry on load
  if (session && session.code && session.name) {
    const scoresKey = `examready_scores_${session.code}`;
    const dbKey = `scores_${session.code}_${session.name.toLowerCase().replace(/\s+/g, '_')}`;
    
    try {
      const localScores = JSON.parse(localStorage.getItem(scoresKey)) || {};
      
      // Deteksi jika ada progres latihan lokal
      const localProgress = {};
      const courseIds = ["econ4102", "eacc4101", "econ4103", "mkwn4110", "mkdi4202"];
      const courseCodeMap = {
        "econ4102": "ECON4102",
        "eacc4101": "EACC4101",
        "econ4103": "ECON4103",
        "mkwn4110": "MKWN4110",
        "mkdi4202": "MKDI4202"
      };
      
      courseIds.forEach(id => {
        const progKey = `examready_progress_${session.code}_${id}`;
        try {
          const prog = JSON.parse(localStorage.getItem(progKey));
          if (prog && prog.answers && prog.answers.length > 0) {
            const code = courseCodeMap[id];
            const courseTotalQuestions = {
              "ECON4102": 115,
              "EACC4101": 134,
              "ECON4103": 90,
              "MKWN4110": 129,
              "MKDI4202": 100
            };
            localProgress[code] = { answered: prog.answers.length, total: courseTotalQuestions[code] || 100 };
          }
        } catch(e) {}
      });
      
      // Ambil data DB, gabungkan dengan data lokal, lalu upload
      fetch(`https://getpantry.cloud/apiv1/pantry/fb008621-eb2d-44fe-b380-ca85744448f6/basket/${dbKey}`)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
        .then(dbData => {
          dbData = dbData || { name: session.name, scores: {}, progress: {} };
          if (!dbData.scores) dbData.scores = {};
          if (!dbData.progress) dbData.progress = {};
          
          Object.assign(dbData.scores, localScores);
          Object.assign(dbData.progress, localProgress);
          
          return fetch(`https://getpantry.cloud/apiv1/pantry/fb008621-eb2d-44fe-b380-ca85744448f6/basket/${dbKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
          });
        })
        .catch(e => console.error('Error syncing scores to Pantry on load:', e));
        
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
        const userKey = `${code}_${name.toLowerCase().replace(/\s+/g, '_')}`;
        
        leaderboardMap[userKey] = {
          name: name,
          code: code,
          completed: 0,
          bestProgress: { courseCode: '', answered: 0, total: 0 },
          isCurrentUser: (session && code === session.code && name.toLowerCase() === session.name.toLowerCase())
        };
      }

      // 2. Fetch all real-time scores from Pantry
      try {
        const response = await fetch('https://getpantry.cloud/apiv1/pantry/fb008621-eb2d-44fe-b380-ca85744448f6');
        if (response.ok) {
          const data = await response.json();
          const basketPromises = (data.baskets || [])
            .filter(b => b.name.startsWith('scores_'))
            .map(async (b) => {
              try {
                const res = await fetch(`https://getpantry.cloud/apiv1/pantry/fb008621-eb2d-44fe-b380-ca85744448f6/basket/${b.name}`);
                if (res.ok) {
                  const parsed = await res.json();
                  const userKey = b.name.replace('scores_', '');
                  if (leaderboardMap[userKey]) {
                    const item = leaderboardMap[userKey];
                    
                    // Hitung mata kuliah selesai
                    const completedKeys = Object.keys(parsed.scores || {});
                    item.completed = completedKeys.length;
                    
                    // Cari progres soal terbanyak
                    const courseTotalQuestions = {
                      "ECON4102": 115,
                      "EACC4101": 134,
                      "ECON4103": 90,
                      "MKWN4110": 129,
                      "MKDI4202": 100
                    };
                    
                    let bestCourse = '';
                    let maxAnswered = 0;
                    let bestTotal = 0;
                    
                    // Cek dari progress aktif
                    if (parsed.progress) {
                      for (const cCode in parsed.progress) {
                        const prog = parsed.progress[cCode];
                        if (prog && typeof prog.answered === 'number') {
                          if (prog.answered > maxAnswered) {
                            maxAnswered = prog.answered;
                            bestCourse = cCode;
                            bestTotal = prog.total || courseTotalQuestions[cCode] || 100;
                          }
                        }
                      }
                    }
                    
                    // Cek dari mata kuliah selesai (karena selesai berarti answered = total)
                    if (parsed.scores) {
                      for (const cCode in parsed.scores) {
                        const total = courseTotalQuestions[cCode] || 100;
                        if (total > maxAnswered) {
                          maxAnswered = total;
                          bestCourse = cCode;
                          bestTotal = total;
                        }
                      }
                    }
                    
                    item.bestProgress = {
                      courseCode: bestCourse,
                      answered: maxAnswered,
                      total: bestTotal
                    };
                  }
                }
              } catch (e) {
                console.error('Error fetching basket:', b.name, e);
              }
            });
          await Promise.all(basketPromises);
        }
      } catch (e) {
        console.error('Error fetching database scores:', e);
      }

      // Convert map to sorted array
      const leaderboardData = Object.values(leaderboardMap);
      
      // Sort leaderboard: bestProgress.answered descending, then completed count descending, then name ascending
      leaderboardData.sort((a, b) => {
        if (b.bestProgress.answered !== a.bestProgress.answered) {
          return b.bestProgress.answered - a.bestProgress.answered;
        }
        if (b.completed !== a.completed) {
          return b.completed - a.completed;
        }
        return a.name.localeCompare(b.name);
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

        let progressText = '0 Soal';
        if (row.bestProgress.answered > 0) {
          progressText = `${row.bestProgress.courseCode} (${row.bestProgress.answered}/${row.bestProgress.total} Soal)`;
        }

        const maskedName = row.name.length > 2 
          ? row.name.substring(0, 2) + '*'.repeat(row.name.length - 2) 
          : row.name;

        tr.innerHTML = `
          <td class="leaderboard-rank ${rankClass}">${rankText}</td>
          <td class="leaderboard-name ${row.isCurrentUser ? 'current-user' : ''}">${maskedName}</td>
          <td class="leaderboard-score">${progressText}</td>
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
