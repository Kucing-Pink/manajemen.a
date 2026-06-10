/**
 * music.js — Floating music player menggunakan YouTube Iframe Player API
 * Memutar langsung R&B Morning Mix (Beyonce, SZA, TLC, Ne-Yo) dari YouTube secara efisien
 * tanpa memberatkan performa dan loading website.
 */

(function () {
  'use strict';

  const VIDEO_ID = 'Sk-xSLSYY7s';
  const SESSION_PLAYING_KEY = 'examready_music_playing';

  let player = null;
  let isApiReady = false;
  let isPlaying = false;
  let playRequested = sessionStorage.getItem(SESSION_PLAYING_KEY) === 'true';

  // DOM elements
  let btn = null;

  // 1. Buat kontainer YouTube Player tersembunyi secara dinamis
  function initPlayerDOM() {
    const container = document.createElement('div');
    container.id = 'yt-player-container';
    // Sembunyikan sepenuhnya dari layar tapi tetap aktif memutar audio
    container.style.position = 'absolute';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.style.overflow = 'hidden';
    container.style.zIndex = '-9999';
    container.style.bottom = '0';
    container.style.left = '0';

    const placeholder = document.createElement('div');
    placeholder.id = 'yt-player';
    container.appendChild(placeholder);
    document.body.appendChild(container);
  }

  // 2. Load script YouTube Iframe API secara dinamis
  function loadYouTubeAPI() {
    if (window.YT) return; // Sudah ter-load
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  // Callback global saat API YouTube siap
  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('yt-player', {
      height: '1',
      width: '1',
      videoId: VIDEO_ID,
      playerVars: {
        autoplay: playRequested ? 1 : 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3
      },
      events: {
        onReady: (e) => {
          isApiReady = true;
          player.setVolume(35); // Set volume awal 35% agar tidak terlalu keras untuk belajar
          if (playRequested) {
            player.playVideo();
            isPlaying = true;
            updateUI();
          }
        },
        onStateChange: (e) => {
          // Loop otomatis jika lagu selesai
          if (e.data === YT.PlayerState.ENDED) {
            player.playVideo();
          }
          // Sinkronisasi status jika berubah dari sisi YouTube (misal diblokir autoplay)
          if (e.data === YT.PlayerState.PLAYING) {
            isPlaying = true;
            sessionStorage.setItem(SESSION_PLAYING_KEY, 'true');
            updateUI();
          } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.CUED) {
            isPlaying = false;
            sessionStorage.setItem(SESSION_PLAYING_KEY, 'false');
            updateUI();
          }
        }
      }
    });
  };

  // 3. Update Tampilan Widget
  function updateUI() {
    if (!btn) return;
    const label = btn.querySelector('.music-label');
    if (isPlaying) {
      btn.classList.add('music-btn--playing');
      btn.setAttribute('aria-label', 'Hentikan musik');
      if (label) label.textContent = 'Sedang Putar';
    } else {
      btn.classList.remove('music-btn--playing');
      btn.setAttribute('aria-label', 'Putar musik Morning R&B');
      if (label) label.textContent = 'Musik';
    }
  }

  // 4. Inisialisasi Widget Tombol Mengambang
  function createWidget() {
    initPlayerDOM();
    loadYouTubeAPI();

    btn = document.createElement('button');
    btn.id = 'music-toggle-btn';
    btn.setAttribute('aria-label', 'Putar musik Morning R&B');
    btn.setAttribute('title', 'Morning R&B Mix (klik untuk putar)');
    btn.innerHTML = '<span class="music-icon">&#127925;</span><span class="music-label">Musik</span>';
    btn.className = 'music-btn';

    const ripple = document.createElement('span');
    ripple.className = 'music-ripple';
    btn.appendChild(ripple);

    // Click handler
    btn.addEventListener('click', () => {
      if (!player || !isApiReady) {
        // Jika API belum siap, simpan request dan tunjukkan status loading
        playRequested = !playRequested;
        isPlaying = playRequested;
        sessionStorage.setItem(SESSION_PLAYING_KEY, playRequested ? 'true' : 'false');
        updateUI();
        return;
      }

      if (isPlaying) {
        player.pauseVideo();
        isPlaying = false;
        sessionStorage.setItem(SESSION_PLAYING_KEY, 'false');
      } else {
        player.playVideo();
        isPlaying = true;
        sessionStorage.setItem(SESSION_PLAYING_KEY, 'true');
      }
      updateUI();
    });

    document.body.appendChild(btn);
    
    // Jika sebelumnya sudah memutar musik, langsung sesuaikan UI tombol
    if (playRequested) {
      isPlaying = true;
      updateUI();
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
