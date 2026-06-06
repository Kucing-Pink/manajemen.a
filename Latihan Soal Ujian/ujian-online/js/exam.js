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
    if (confirm('Keluar dari ujian? Progres tidak akan disimpan.')) {
      window.location.href = 'courses.html';
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
  // answers: [{questionId, selected, correct, correctAnswer}]
  const answers = [];

  // DOM refs (progress)
  const progressFill = document.getElementById('progress-bar-fill');
  const progressLabel = document.getElementById('progress-label');
  const progressWrap = document.getElementById('progress-bar-wrap');
  const counterEl = document.getElementById('exam-counter');
  const countCorrectEl = document.getElementById('count-correct');
  const countWrongEl   = document.getElementById('count-wrong');
  const chipCorrectEl  = document.getElementById('score-correct');
  const chipWrongEl    = document.getElementById('score-wrong');

  let countCorrect = 0;
  let countWrong   = 0;

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

  function renderQuestion(direction = 'right') {
    answered = false;
    selectedOption = null;
    const q = questions[currentIdx];
    const isLast = currentIdx === TOTAL - 1;

    updateProgress();

    const card = document.createElement('div');
    card.className = 'question-card' + (direction === 'left' ? ' slide-left' : '');
    card.id = 'question-card';

    const optionsHTML = q.options.map((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      return `
        <li>
          <button class="option-btn" id="opt-${i}" data-idx="${i}" aria-label="Pilihan ${letter}: ${opt}">
            <span class="option-letter" aria-hidden="true">${letter}</span>
            <span class="option-text">${opt}</span>
          </button>
        </li>
      `;
    }).join('');

    card.innerHTML = `
      <div class="question-number">Soal ${currentIdx + 1}</div>
      <p class="question-text">${q.question}</p>
      <ul class="options-list" id="options-list" role="radiogroup" aria-label="Pilihan jawaban">
        ${optionsHTML}
      </ul>
      <div id="feedback-area"></div>
      <div class="question-nav">
        <button class="btn-next ${isLast ? 'finish' : ''}" id="btn-next" disabled>
          ${isLast ? '✅ Selesai' : 'Lanjut →'}
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
  }

  function handleNext() {
    if (!answered) return;

    if (currentIdx < TOTAL - 1) {
      currentIdx++;
      renderQuestion('right');
    } else {
      // Selesai — simpan & ke halaman hasil
      App.setAnswers({
        courseName: course.name,
        courseCode: course.code,
        answers,
        total: TOTAL
      });
      window.location.href = 'result.html';
    }
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
