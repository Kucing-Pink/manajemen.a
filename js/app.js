/**
 * app.js — Global utilities: session management, auth guard
 */

const App = (() => {
  const SESSION_KEY = 'examready_session';

  /** Simpan sesi setelah login — menyimpan nama, kode & izin akses */
  function setSession(name, code, allowedCourses) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name, code, allowedCourses, ts: Date.now() }));
  }

  /** Ambil sesi aktif */
  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch { return null; }
  }

  /** Hapus sesi (logout) */
  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('examready_course');
    sessionStorage.removeItem('examready_answers');
  }

  /** Guard: redirect ke login jika belum ada sesi */
  function requireAuth() {
    if (!getSession()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  /** Simpan mata kuliah yang dipilih */
  function setCourse(courseData) {
    sessionStorage.setItem('examready_course', JSON.stringify(courseData));
  }

  /** Ambil mata kuliah yang dipilih */
  function getCourse() {
    try {
      return JSON.parse(sessionStorage.getItem('examready_course'));
    } catch { return null; }
  }

  /** Simpan jawaban ujian */
  function setAnswers(answers) {
    sessionStorage.setItem('examready_answers', JSON.stringify(answers));
  }

  /** Ambil jawaban ujian */
  function getAnswers() {
    try {
      return JSON.parse(sessionStorage.getItem('examready_answers'));
    } catch { return null; }
  }

  /** Fetch file teks (untuk codes.txt) */
  async function fetchText(url) {
    const res = await fetch(url + '?v=' + Date.now());
    if (!res.ok) throw new Error('Gagal memuat: ' + url);
    return res.text();
  }

  /** Fetch JSON */
  async function fetchJSON(url) {
    const res = await fetch(url + '?v=' + Date.now());
    if (!res.ok) throw new Error('Gagal memuat: ' + url);
    return res.json();
  }

  return { setSession, getSession, clearSession, requireAuth, setCourse, getCourse, setAnswers, getAnswers, fetchText, fetchJSON };
})();
