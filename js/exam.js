/**
 * exam.js — Logika halaman ujian
 */

(async () => {
  if (!App.requireAuth()) return;

  const course = App.getCourse();
  if (!course) { window.location.href = 'courses.html'; return; }

  // Header
  const courseNameEl = document.getElementById('exam-course-name');
  if (courseNameEl) courseNameEl.textContent = course.name;

  // Back button
  document.getElementById('btn-back').addEventListener('click', () => {
    if (confirm('Keluar dari ujian? Progres latihan Anda akan disimpan agar bisa dilanjutkan nanti.')) {
      saveProgress();
      
      const btnBack = document.getElementById('btn-back');
      if (btnBack) {
        btnBack.disabled = true;
        btnBack.textContent = 'Menyimpan...';
      }
      
      // Push progress to real-time Pantry database
      if (session && session.code && session.name) {
        const dbKey = `scores_${session.code}_${session.name.toLowerCase().replace(/\s+/g, '_')}`;
        
        fetch(`https://getpantry.cloud/apiv1/pantry/fb008621-eb2d-44fe-b380-ca85744448f6/basket/${dbKey}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
          .then(dbData => {
            dbData = dbData || { name: session.name, scores: {}, progress: {} };
            if (!dbData.progress) dbData.progress = {};
            dbData.progress[course.code] = { answered: answers.length, total: TOTAL };
            
            return fetch(`https://getpantry.cloud/apiv1/pantry/fb008621-eb2d-44fe-b380-ca85744448f6/basket/${dbKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dbData)
            });
          })
          .then(() => {
            window.location.href = 'courses.html';
          })
          .catch(e => {
            console.error('Error syncing exit progress to Pantry:', e);
            window.location.href = 'courses.html';
          });
      } else {
        window.location.href = 'courses.html';
      }
    }
  });

  // Load questions
  const questionArea = document.getElementById('question-area');
  let questions = [];
  try {
    questions = await App.fetchJSON(course.file);
  } catch (e) {
    questionArea.innerHTML = '<div class="loading-state"><p style="color:#ef4444">⚠ Gagal memuat soal. Pastikan file tersedia.</p></div>';
    return;
  }

  const TOTAL = questions.length;
  let currentIdx = 0;
  let selectedOption = null;   // index opsi yang dipilih user
  let answered = false;        // apakah sudah memilih jawaban
  const answers = [];
  let countCorrect = 0;
  let countWrong   = 0;
  let showHint = false;  // toggle highlight jawaban benar

  // DOM refs (progress)
  const progressFill = document.getElementById('progress-bar-fill');
  const progressLabel = document.getElementById('progress-label');
  const progressWrap = document.getElementById('progress-bar-wrap');
  const counterEl = document.getElementById('exam-counter');
  const countCorrectEl = document.getElementById('count-correct');
  const countWrongEl   = document.getElementById('count-wrong');
  const chipCorrectEl  = document.getElementById('score-correct');
  const chipWrongEl    = document.getElementById('score-wrong');

  // --- SAVE & RESUME PROGRESS LOGIC ---
  const session = App.getSession();
  const progressKey = session ? `examready_progress_${session.code}_${course.id}` : '';
  
  function saveProgress() {
    if (!progressKey) return;
    const progressData = {
      currentIdx,
      answers,
      countCorrect,
      countWrong
    };
    localStorage.setItem(progressKey, JSON.stringify(progressData));
  }

  function clearProgress() {
    if (progressKey) localStorage.removeItem(progressKey);
  }

  // Load saved progress if exists
  if (progressKey) {
    try {
      const saved = JSON.parse(localStorage.getItem(progressKey));
      if (saved && saved.answers && saved.answers.length > 0) {
        if (saved.answers.length >= TOTAL) {
          clearProgress();
        } else {
          const resume = confirm(`Kami menemukan progres latihan sebelumnya (melanjutkan dari Soal ${saved.answers.length + 1} dari ${TOTAL}). Ingin melanjutkan?`);
          if (resume) {
            answers.push(...saved.answers);
            currentIdx = answers.length;
            countCorrect = answers.filter(a => a.isCorrect).length;
            countWrong = answers.length - countCorrect;
            // Pastikan chips nilai ter-update
            setTimeout(updateScoreChips, 100);
          } else {
            clearProgress();
          }
        }
      }
    } catch (e) {
      console.error('Error loading progress:', e);
    }
  }

  function updateScoreChips() {
    countCorrectEl.textContent = countCorrect;
    countWrongEl.textContent   = countWrong;
    // Flash animation on the chip that just changed
    const chip = countCorrect + countWrong === answers.length
      ? (answers[answers.length - 1].isCorrect ? chipCorrectEl : chipWrongEl)
      : null;
    if (chip) {
      chip.classList.remove('chip-pop');
      // Reflow to restart animation
      void chip.offsetWidth;
      chip.classList.add('chip-pop');
    }
  }

  function updateProgress() {
    const pct = Math.round((currentIdx / TOTAL) * 100);
    progressFill.style.width = pct + '%';
    progressWrap.setAttribute('aria-valuenow', pct);
    progressLabel.textContent = `Soal ${currentIdx + 1} dari ${TOTAL}`;
    counterEl.textContent = `${currentIdx + 1} / ${TOTAL}`;
  }

  // Toggle highlight jawaban benar di semua opsi
  function applyHint(optBtns, correctIdx) {
    optBtns.forEach((btn, i) => {
      if (i === correctIdx) {
        if (showHint) btn.classList.add('hint-highlight');
        else btn.classList.remove('hint-highlight');
      }
    });
    const hintBtn = document.getElementById('btn-hint');
    if (hintBtn) hintBtn.classList.toggle('active', showHint);
  }

  function renderQuestion(direction = 'right') {
    answered = false;
    selectedOption = null;
    showHint = false;  // reset hint setiap soal baru
    const q = questions[currentIdx];
    const isLast = currentIdx === TOTAL - 1;

    updateProgress();

    const card = document.createElement('div');
    card.className = 'question-card' + (direction === 'left' ? ' slide-left' : '');
    card.id = 'question-card';

    const isImageQuestion = q.type === 'image' && q.image;
    const isCompactOptions = isImageQuestion && q.options.every(opt => opt.trim().length <= 8);

    // Opsi: jika tipe gambar dan opsi hanya 1 huruf → tampilkan huruf besar saja
    const optionsHTML = q.options.map((opt, i) => {
      const letter  = String.fromCharCode(65 + i);
      const isShort = ['A', 'B', 'C', 'D'].includes(opt.trim().toUpperCase());
      return `
        <li>
          <button class="option-btn${isShort ? ' option-btn--letter' : ''}"
                  id="opt-${i}" data-idx="${i}"
                  aria-label="Pilihan ${letter}${isShort ? '' : ': ' + opt}">
            <span class="option-letter" aria-hidden="true">${letter}</span>
            ${isShort ? '' : `<span class="option-text">${opt}</span>`}
          </button>
        </li>
      `;
    }).join('');

    // Gambar soal (jika ada)
    const imageHTML = q.image ? `
      <div class="question-image-wrap">
        <img
          src="${q.image}"
          alt="Gambar soal ${currentIdx + 1}"
          class="question-image"
          loading="lazy"
          onerror="this.parentElement.innerHTML='<p class=\\'img-error\\'>Gambar tidak dapat ditampilkan.</p>'"
        />
      </div>
    ` : '';

    card.innerHTML = `
      ${imageHTML}
      ${q.question ? `<p class="question-text">${q.question}</p>` : ''}
      <ul class="options-list${isCompactOptions ? ' options-list--compact' : ''}"
          id="options-list" role="radiogroup" aria-label="Pilihan jawaban">
        ${optionsHTML}
      </ul>
      <div id="feedback-area"></div>
      <div class="question-nav">
        <button class="btn-hint" id="btn-hint" title="Tampilkan / sembunyikan jawaban benar" aria-label="Tampilkan jawaban benar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="icon-lightbulb">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
          </svg>
        </button>
        <button class="btn-next ${isLast ? 'finish' : ''}" id="btn-next" disabled>
          ${isLast ? '&#9989; Selesai' : 'Lanjut &#8594;'}
        </button>
      </div>
    `;

    questionArea.innerHTML = '';
    questionArea.appendChild(card);

    // Attach option listeners
    const optBtns = card.querySelectorAll('.option-btn');
    optBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        const idx = parseInt(btn.dataset.idx);
        handleAnswer(idx, q, optBtns, isLast);
      });
    });

    // Hint button — tampilkan/sembunyikan jawaban benar
    card.querySelector('#btn-hint').addEventListener('click', () => {
      showHint = !showHint;
      const currentOptBtns = card.querySelectorAll('.option-btn');
      applyHint(currentOptBtns, q.answer);
    });

    // Next button
    card.querySelector('#btn-next').addEventListener('click', handleNext);
  }


  function handleAnswer(chosenIdx, q, optBtns, isLast) {
    answered = true;
    selectedOption = chosenIdx;
    const correctIdx = q.answer;
    const isCorrect = chosenIdx === correctIdx;

    // Disable all buttons
    optBtns.forEach(btn => { btn.disabled = true; });

    // Highlight correct & wrong
    optBtns.forEach((btn, i) => {
      if (i === correctIdx) {
        btn.classList.add('correct');
      }
      if (i === chosenIdx && !isCorrect) {
        btn.classList.add('wrong');
      }
      if (i === chosenIdx && isCorrect) {
        btn.classList.add('selected');
      }
    });

    // Feedback banner
    const feedbackArea = document.getElementById('feedback-area');
    if (isCorrect) {
      feedbackArea.innerHTML = `
        <div class="feedback-banner correct" role="alert">
          <span class="feedback-icon" aria-hidden="true">✅</span>
          <span>Jawaban Anda <strong>benar!</strong></span>
        </div>
      `;
    } else {
      const correctLetter = String.fromCharCode(65 + correctIdx);
      feedbackArea.innerHTML = `
        <div class="feedback-banner wrong" role="alert">
          <span class="feedback-icon" aria-hidden="true">❌</span>
          <span>Jawaban Anda <strong>salah.</strong> Jawaban yang benar: <strong>${correctLetter}. ${q.options[correctIdx]}</strong></span>
        </div>
      `;
    }

    // Enable next
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.disabled = false;

    // Simpan jawaban
    answers.push({
      questionId: q.id,
      question: q.question,
      options: q.options,
      selected: chosenIdx,
      correctAnswer: correctIdx,
      isCorrect
    });

    // Update score chips di header
    if (isCorrect) countCorrect++; else countWrong++;
    updateScoreChips();

    // Auto save progress
    saveProgress();
  }

  function proceedNext() {
    if (currentIdx < TOTAL - 1) {
      currentIdx++;
      renderQuestion('right');
      saveProgress();
    } else {
      // Selesai — hapus progres, simpan jawaban & ke halaman hasil
      clearProgress();
      App.setAnswers({
        courseName: course.name,
        courseCode: course.code,
        answers,
        total: TOTAL
      });
      window.location.href = 'result.html';
    }
  }

  function showPhaseModal(phase) {
    const startIndex = (phase - 1) * 50;
    const endIndex = phase * 50;
    const phaseAnswers = answers.slice(startIndex, endIndex);
    const correctInPhase = phaseAnswers.filter(a => a.isCorrect).length;
    const wrongInPhase = phaseAnswers.length - correctInPhase;
    const pctInPhase = Math.round((correctInPhase / phaseAnswers.length) * 100);

    const overlay = document.createElement('div');
    overlay.className = 'phase-modal-overlay';
    overlay.id = 'phase-modal';
    overlay.innerHTML = `
      <div class="phase-modal-card">
        <div class="phase-emoji">🎉</div>
        <h2>Selesai Ujian Fase ${phase}!</h2>
        <p class="phase-subtitle">Anda telah menyelesaikan ${endIndex} soal pertama.</p>
        <div class="phase-stats">
          <div class="phase-stat-item">
            <span class="phase-stat-val correct">${correctInPhase}</span>
            <span class="phase-stat-lbl">Benar</span>
          </div>
          <div class="phase-stat-item">
            <span class="phase-stat-val wrong">${wrongInPhase}</span>
            <span class="phase-stat-lbl">Salah</span>
          </div>
          <div class="phase-stat-item">
            <span class="phase-stat-val percentage">${pctInPhase}%</span>
            <span class="phase-stat-lbl">Akurasi</span>
          </div>
        </div>
        <button class="btn-next phase-dismiss-btn" id="btn-phase-continue">Lanjutkan Ujian</button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-phase-continue').addEventListener('click', () => {
      overlay.remove();
      proceedNext();
    });
  }

  function handleNext() {
    if (!answered) return;

    const completedCount = currentIdx + 1;
    if (completedCount % 50 === 0 && completedCount < TOTAL) {
      const phase = completedCount / 50;
      showPhaseModal(phase);
      return;
    }

    proceedNext();
  }

  // Keyboard shortcut: 1-4 untuk pilih, Enter untuk lanjut
  document.addEventListener('keydown', (e) => {
    if (['1','2','3','4'].includes(e.key) && !answered) {
      const idx = parseInt(e.key) - 1;
      const btn = document.getElementById('opt-' + idx);
      if (btn && !btn.disabled) btn.click();
    } else if (e.key === 'Enter' && answered) {
      const nextBtn = document.getElementById('btn-next');
      if (nextBtn && !nextBtn.disabled) nextBtn.click();
    }
  });

  // Initial render
  renderQuestion('right');
})();
