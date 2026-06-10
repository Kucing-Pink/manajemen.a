/**
 * login.js — Logika halaman login (kode 4 angka)
 */

(async () => {
  // Jika sudah login, langsung ke courses
  if (App.getSession()) {
    window.location.href = 'courses.html';
    return;
  }

  let code = '';
  const MAX = 4;

  // DOM refs
  const digits = [0, 1, 2, 3].map(i => document.getElementById('digit-' + i));
  const errorEl = document.getElementById('login-error');
  const enterBtn = document.getElementById('key-enter');

  // Update tampilan digit
  function renderDigits() {
    digits.forEach((el, i) => {
      el.classList.remove('active', 'filled', 'error');
      if (i < code.length) {
        el.textContent = code[i];
        el.classList.add('filled');
      } else if (i === code.length) {
        el.textContent = '_';
        el.classList.add('active');
      } else {
        el.textContent = '_';
      }
    });
    enterBtn.disabled = code.length < MAX;
  }

  function showError(msg) {
    errorEl.textContent = '⚠ ' + msg;
    digits.forEach(el => el.classList.add('error'));
    setTimeout(() => {
      digits.forEach(el => el.classList.remove('error'));
      errorEl.textContent = '';
    }, 1500);
    // Reset code setelah error
    code = '';
    setTimeout(renderDigits, 200);
  }

  // Load & validate codes — format: "Nama Kode [courseId1 courseId2 ...]"
  async function validateCode(inputCode) {
    try {
      const text = await App.fetchText('data/codes.txt');
      const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

      for (const line of lines) {
        // Cari posisi kode 4 digit
        const m = line.match(/^(.+?)\s+(\d{4})\s*(.*)$/);
        if (!m) continue;
        
        const lineName = m[1].trim();
        const lineCode = m[2];
        const rest     = m[3].trim();

        if (lineCode !== inputCode) continue;

        // Parse course IDs dari sisa baris (angka-angka)
        const allowedCourses = rest
          ? rest.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0)
          : [];

        return { name: lineName, allowedCourses };
      }
      return null; // tidak ditemukan
    } catch (e) {
      console.error(e);
      showError('Gagal memuat data. Coba lagi.');
      return null;
    }
  }

  async function handleEnter() {
    if (code.length < MAX) return;
    const result = await validateCode(code);
    if (result) {
      App.setSession(result.name, code, result.allowedCourses);
      // Animasi sukses
      digits.forEach(el => {
        el.style.borderColor = '#10b981';
        el.style.background = '#d1fae5';
        el.style.color = '#065f46';
      });
      setTimeout(() => { window.location.href = 'courses.html'; }, 500);
    } else {
      showError('Kode tidak valid. Coba lagi.');
    }
  }

  // Keypad click (HTML Buttons di Halaman)
  document.getElementById('keypad').addEventListener('click', (e) => {
    const btn = e.target.closest('.key-btn');
    if (!btn) return;
    
    // Mencegah behavior bawaan
    e.preventDefault();

    const val = btn.dataset.val;
    if (val === 'clear') {
      if (code.length > 0) {
        code = code.slice(0, -1);
      }
    } else if (val === 'enter') {
      handleEnter();
    } else if (/^[0-9]$/.test(val) && code.length < MAX) {
      code += val;
      if (code.length === MAX) {
        // Auto masuk setelah 4 digit
        setTimeout(handleEnter, 300);
      }
    }
    renderDigits();
  });

  // Keyboard fisik input (untuk pengguna Desktop tanpa memunculkan soft-keyboard mobile)
  document.addEventListener('keydown', (e) => {
    // Abaikan jika fokus sedang berada pada input lain (jika ada)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const val = e.key;
    if (/^[0-9]$/.test(val) && code.length < MAX) {
      code += val;
      if (code.length === MAX) {
        setTimeout(handleEnter, 300);
      }
    } else if (val === 'Backspace') {
      if (code.length > 0) {
        code = code.slice(0, -1);
      }
    } else if (val === 'Enter') {
      handleEnter();
    }
    renderDigits();
  });

  renderDigits();
})();
