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
  const codeInput = document.getElementById('code-input');

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
    codeInput.value = '';
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

  // Sinkronisasi input real dengan digit visual
  codeInput.addEventListener('input', () => {
    let val = codeInput.value.replace(/\D/g, '');
    if (val.length > MAX) {
      val = val.slice(0, MAX);
    }
    code = val;
    codeInput.value = val;
    renderDigits();

    if (code.length === MAX) {
      // Auto masuk setelah 4 digit
      setTimeout(handleEnter, 300);
    }
  });

  // Keypad click
  document.getElementById('keypad').addEventListener('click', (e) => {
    const btn = e.target.closest('.key-btn');
    if (!btn) return;
    
    // Cegah button click mengambil fokus dari input
    e.preventDefault();

    const val = btn.dataset.val;
    if (val === 'clear') {
      let valInput = codeInput.value;
      if (valInput.length > 0) {
        codeInput.value = valInput.slice(0, -1);
        codeInput.dispatchEvent(new Event('input'));
      }
    } else if (val === 'enter') {
      handleEnter();
    } else if (/^[0-9]$/.test(val) && codeInput.value.length < MAX) {
      codeInput.value += val;
      codeInput.dispatchEvent(new Event('input'));
    }
  });

  // Mousedown pada keypad untuk mencegah hilangnya fokus input
  document.getElementById('keypad').addEventListener('mousedown', (e) => {
    if (e.target.closest('.key-btn')) {
      e.preventDefault();
    }
  });
  document.getElementById('keypad').addEventListener('touchstart', (e) => {
    if (e.target.closest('.key-btn')) {
      e.preventDefault();
    }
  });

  // Auto focus input ketika halaman dimuat
  codeInput.focus();

  // Focus input ketika baris digit diklik
  document.getElementById('code-display-row').addEventListener('click', (e) => {
    e.stopPropagation();
    codeInput.focus();
  });

  // Focus input jika klik di area mana saja selain tombol musik / keypad
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.key-btn') && !e.target.closest('#music-toggle-btn')) {
      codeInput.focus();
    }
  });

  renderDigits();
})();
