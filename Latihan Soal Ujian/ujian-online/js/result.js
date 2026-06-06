/**
 * result.js — Halaman hasil ujian dan review jawaban
 */

(() => {
  if (!App.requireAuth()) return;

  const data = App.getAnswers();
  if (!data) { window.location.href = 'courses.html'; return; }

  const { courseName, courseCode, answers, total } = data;
  const correct = answers.filter(a => a.isCorrect).length;
  const wrong = answers.length - correct;
  // Soal tidak dijawab (jika user keluar lebih awal, tidak mungkin terjadi pada flow normal)
  const pct = Math.round((correct / total) * 100);

  // --- Score card ---
  document.getElementById('score-course-name').textContent = courseName + (courseCode ? ` (${courseCode})` : '');
  document.getElementById('stat-correct').textContent = correct;
  document.getElementById('stat-wrong').textContent = wrong;
  document.getElementById('stat-total').textContent = total;

  // Emoji & title berdasarkan skor
  let emoji = '😢', title = 'Terus Berlatih!';
  if (pct >= 90)      { emoji = '🏆'; title = 'Luar Biasa!'; }
  else if (pct >= 75) { emoji = '🎉'; title = 'Bagus Sekali!'; }
  else if (pct >= 60) { emoji = '👍'; title = 'Cukup Baik!'; }
  else if (pct >= 40) { emoji = '📚'; title = 'Perlu Belajar Lebih!'; }
  document.getElementById('score-emoji').textContent = emoji;
  document.getElementById('score-title').textContent = title;

  // Animate score number
  const scoreNumEl = document.getElementById('score-number');
  let current = 0;
  const step = Math.ceil(pct / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, pct);
    scoreNumEl.textContent = current;
    if (current >= pct) clearInterval(timer);
  }, 30);

  // SVG ring animation
  // Circumference of r=68 circle: 2*PI*68 ≈ 427.26
  const CIRCUMFERENCE = 2 * Math.PI * 68;
  const ringFill = document.getElementById('ring-fill');

  // Inline gradient definition
  const svg = ringFill.closest('svg');
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  `;
  svg.insertBefore(defs, svg.firstChild);

  // Animate ring
  setTimeout(() => {
    const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
    ringFill.style.strokeDashoffset = offset;
  }, 100);

  // Danger: low score ring color
  if (pct < 40) {
    defs.innerHTML = `
      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ef4444"/>
        <stop offset="100%" style="stop-color:#f97316"/>
      </linearGradient>
    `;
  } else if (pct < 60) {
    defs.innerHTML = `
      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f59e0b"/>
        <stop offset="100%" style="stop-color:#fbbf24"/>
      </linearGradient>
    `;
  } else if (pct >= 75) {
    defs.innerHTML = `
      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10b981"/>
        <stop offset="100%" style="stop-color:#34d399"/>
      </linearGradient>
    `;
  }

  // --- Action buttons ---
  document.getElementById('btn-retry').addEventListener('click', () => {
    // Hapus jawaban lama, kembali ke exam dengan course yang sama
    App.setAnswers(null);
    sessionStorage.removeItem('examready_answers');
    window.location.href = 'exam.html';
  });

  document.getElementById('btn-courses').addEventListener('click', () => {
    App.setAnswers(null);
    sessionStorage.removeItem('examready_answers');
    window.location.href = 'courses.html';
  });

  // --- Review list ---
  const reviewList = document.getElementById('review-list');
  answers.forEach((a, i) => {
    const item = document.createElement('div');
    item.className = 'review-item ' + (a.isCorrect ? 'correct' : 'wrong');
    item.style.animationDelay = (i * 30) + 'ms';
    item.id = 'review-item-' + (i + 1);

    const selectedLetter = a.selected !== null && a.selected !== undefined
      ? String.fromCharCode(65 + a.selected) : '-';
    const correctLetter = String.fromCharCode(65 + a.correctAnswer);
    const selectedText = a.options[a.selected] || '-';
    const correctText = a.options[a.correctAnswer] || '-';

    const wrongRowHTML = !a.isCorrect ? `
      <div class="review-answer-row">
        <span class="review-label user-label">Jawaban Anda:</span>
        <span class="review-answer-text">❌ ${selectedLetter}. ${selectedText}</span>
      </div>
      <div class="review-answer-row">
        <span class="review-label correct-label">Jawaban Benar:</span>
        <span class="review-answer-text">✅ ${correctLetter}. ${correctText}</span>
      </div>
    ` : `
      <div class="review-answer-row">
        <span class="review-label correct-label">Jawaban Anda:</span>
        <span class="review-answer-text">✅ ${selectedLetter}. ${selectedText}</span>
      </div>
    `;

    item.innerHTML = `
      <div class="review-item-header">
        <span class="review-item-num">Soal ${i + 1}</span>
        <span class="review-status-badge">${a.isCorrect ? '✅ Benar' : '❌ Salah'}</span>
      </div>
      <p class="review-question-text">${a.question}</p>
      <div class="review-answers">
        ${wrongRowHTML}
      </div>
    `;

    reviewList.appendChild(item);
  });
})();
