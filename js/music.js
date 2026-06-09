/**
 * music.js — Floating ambient music player
 * Menggunakan Web Audio API untuk menghasilkan suara ambient lofi
 * tanpa file eksternal (bekerja offline & GitHub Pages)
 */

(function () {
  'use strict';

  let audioCtx = null;
  let masterGain = null;
  let isPlaying = false;
  let scheduledNodes = [];

  // ── Warna nada lofi (pentatonic + minor) ────────────────────────────────
  const NOTES = [
    261.63, 293.66, 329.63, 349.23, 392.00,  // C D E F G
    440.00, 493.88, 523.25, 587.33, 659.25    // A B C D E (oktaf atas)
  ];
  const CHORD_SETS = [
    [261.63, 329.63, 392.00],  // C maj
    [293.66, 349.23, 440.00],  // D min
    [349.23, 440.00, 523.25],  // F maj
    [329.63, 392.00, 493.88],  // E min
  ];

  function initAudio() {
    if (audioCtx) return;
    audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }

  // ── Pink noise generator ─────────────────────────────────────────────────
  function createPinkNoise() {
    const bufferSize = 4096;
    let b = [0,0,0,0,0,0,0];
    const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
    node.onaudioprocess = (e) => {
      const out = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const wh = Math.random() * 2 - 1;
        b[0] = 0.99886 * b[0] + wh * 0.0555179;
        b[1] = 0.99332 * b[1] + wh * 0.0750759;
        b[2] = 0.96900 * b[2] + wh * 0.1538520;
        b[3] = 0.86650 * b[3] + wh * 0.3104856;
        b[4] = 0.55000 * b[4] + wh * 0.5329522;
        b[5] = -0.7616 * b[5] - wh * 0.0168980;
        out[i] = (b[0]+b[1]+b[2]+b[3]+b[4]+b[5]+b[6]+wh*0.5362) * 0.11;
        b[6] = wh * 0.115926;
      }
    };
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0.04;
    node.connect(noiseGain);
    noiseGain.connect(masterGain);
    return { node, noiseGain };
  }

  // ── Chord pad ────────────────────────────────────────────────────────────
  function playChord(freqs, time, duration) {
    freqs.forEach(freq => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq / 2;  // oktaf bawah untuk kedalaman
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 0.8);
      gain.gain.linearRampToValueAtTime(0.04, time + duration - 0.5);
      gain.gain.linearRampToValueAtTime(0,    time + duration);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + duration);
      scheduledNodes.push(osc, gain);
    });
  }

  // ── Melodi nada santai ───────────────────────────────────────────────────
  function playMelodyNote(freq, time, duration) {
    const osc   = audioCtx.createOscillator();
    const gain  = audioCtx.createGain();
    const filt  = audioCtx.createBiquadFilter();

    filt.type            = 'lowpass';
    filt.frequency.value = 1200;

    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.09, time + 0.05);
    gain.gain.linearRampToValueAtTime(0.04, time + duration * 0.6);
    gain.gain.linearRampToValueAtTime(0,    time + duration);

    osc.connect(filt);
    filt.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + duration);
    scheduledNodes.push(osc, filt, gain);
  }

  // ── Scheduler utama ──────────────────────────────────────────────────────
  let chordIdx    = 0;
  let schedTimer  = null;
  let noiseNodes  = null;

  function scheduleLoop() {
    if (!isPlaying) return;

    const now     = audioCtx.currentTime;
    const chords  = CHORD_SETS;
    const dur     = 4.0;

    // Chord pad setiap 4 detik, rotasi
    playChord(chords[chordIdx % chords.length], now, dur + 0.5);
    chordIdx++;

    // Melodi acak di atas chord
    const beats = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5];
    beats.forEach(beat => {
      if (Math.random() > 0.45) {
        const note = NOTES[Math.floor(Math.random() * NOTES.length)];
        playMelodyNote(note, now + beat, 0.4 + Math.random() * 0.4);
      }
    });

    schedTimer = setTimeout(scheduleLoop, dur * 1000 - 200);
  }

  function startMusic() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    isPlaying = true;
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 1.2);
    noiseNodes = createPinkNoise();
    scheduleLoop();
  }

  function stopMusic() {
    isPlaying = false;
    if (schedTimer) clearTimeout(schedTimer);
    if (masterGain && audioCtx) {
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
      setTimeout(() => {
        scheduledNodes.forEach(n => { try { n.disconnect(); } catch(e){} });
        scheduledNodes = [];
        if (noiseNodes) {
          try { noiseNodes.node.disconnect(); noiseNodes.noiseGain.disconnect(); } catch(e){}
          noiseNodes = null;
        }
      }, 1200);
    }
  }

  // ── Buat widget UI ───────────────────────────────────────────────────────
  function createWidget() {
    const btn = document.createElement('button');
    btn.id             = 'music-toggle-btn';
    btn.setAttribute('aria-label', 'Putar musik santai');
    btn.setAttribute('title',      'Musik Santai (klik untuk putar)');
    btn.innerHTML      = '<span class="music-icon">&#127925;</span><span class="music-label">Musik</span>';
    btn.className      = 'music-btn';

    const ripple = document.createElement('span');
    ripple.className   = 'music-ripple';
    btn.appendChild(ripple);

    btn.addEventListener('click', () => {
      if (isPlaying) {
        stopMusic();
        btn.classList.remove('music-btn--playing');
        btn.setAttribute('aria-label', 'Putar musik santai');
        btn.querySelector('.music-label').textContent = 'Musik';
      } else {
        startMusic();
        btn.classList.add('music-btn--playing');
        btn.setAttribute('aria-label', 'Hentikan musik');
        btn.querySelector('.music-label').textContent = 'Sedang Putar';
      }
    });

    document.body.appendChild(btn);
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
