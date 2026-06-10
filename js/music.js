/**
 * music.js — Floating ambient music player
 * Menggunakan Web Audio API untuk menghasilkan suara ambient lofi
 * dengan nuansa Morning Vibes / Semangat Kerja / Study (Bright Chimes & Uplifting Pads)
 */

(function () {
  'use strict';

  let audioCtx = null;
  let masterGain = null;
  let isPlaying = false;
  let scheduledNodes = [];

  // ── Nada Pentatonik C Major (Bright, Morning Vibes) ─────────────────────
  const NOTES = [
    261.63, 293.66, 329.63, 392.00, 440.00,  // C4, D4, E4, G4, A4
    523.25, 587.33, 659.25, 783.99, 880.00   // C5, D5, E5, G5, A5 (oktaf atas)
  ];
  // Progresi akor yang membangkitkan semangat (C -> G -> Am -> F)
  const CHORD_SETS = [
    [261.63, 329.63, 392.00],  // C maj (C4, E4, G4)
    [293.66, 392.00, 493.88],  // G maj (D4, G4, B4)
    [220.00, 329.63, 440.00],  // A min (A3, E4, A4)
    [261.63, 349.23, 440.00],  // F maj (C4, F4, A4)
  ];

  function initAudio() {
    if (audioCtx) return;
    audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }

  // ── Pink noise generator (untuk kehangatan latar belakang, dibuat sangat pelan) ──
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
    // Sangat tipis (0.012) untuk mensimulasikan angin sepoi pagi hari yang hangat
    noiseGain.gain.value = 0.012;
    node.connect(noiseGain);
    noiseGain.connect(masterGain);
    return { node, noiseGain };
  }

  // ── Akor Latar Belakang (Soft Warm Pad) ───────────────────────────────────
  function playChord(freqs, time, duration) {
    freqs.forEach(freq => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq / 2;  // Oktaf bawah untuk kehangatan bass
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.8);
      gain.gain.linearRampToValueAtTime(0.05, time + duration - 0.5);
      gain.gain.linearRampToValueAtTime(0,    time + duration);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + duration);
      scheduledNodes.push(osc, gain);
    });
  }

  // ── Melodi Cerah / Morning Chimes (Double-oscillator Bell sound) ─────────
  function playMelodyNote(freq, time, duration) {
    const osc1  = audioCtx.createOscillator();
    const osc2  = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    const gain2 = audioCtx.createGain();
    const filt  = audioCtx.createBiquadFilter();

    filt.type            = 'lowpass';
    filt.frequency.value = 2200; // Frekuensi cutoff lebih tinggi untuk kecerahan suara pagi

    osc1.type = 'triangle';
    osc1.frequency.value = freq;

    osc2.type = 'sine';
    osc2.frequency.value = freq * 2; // Oktaf atas untuk chime bel kristal

    // Amplop plucky pagi hari
    gain1.gain.setValueAtTime(0, time);
    gain1.gain.linearRampToValueAtTime(0.06, time + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + duration);

    gain2.gain.setValueAtTime(0, time);
    gain2.gain.linearRampToValueAtTime(0.03, time + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(filt);
    osc2.connect(filt);
    filt.connect(gain1);
    filt.connect(gain2);

    gain1.connect(masterGain);
    gain2.connect(masterGain);

    osc1.start(time);
    osc1.stop(time + duration);
    osc2.start(time);
    osc2.stop(time + duration);

    scheduledNodes.push(osc1, osc2, filt, gain1, gain2);
  }

  // ── Scheduler Utama ──────────────────────────────────────────────────────
  let chordIdx    = 0;
  let schedTimer  = null;
  let noiseNodes  = null;

  function scheduleLoop() {
    if (!isPlaying) return;

    const now     = audioCtx.currentTime;
    const chords  = CHORD_SETS;
    const dur     = 3.2; // Sedikit lebih cepat (Tempo semangat belajar)

    // Akor pad bergantian setiap 3.2 detik
    playChord(chords[chordIdx % chords.length], now, dur + 0.4);
    chordIdx++;

    // Melodi cerah semi-terstruktur (arpeggio pagi)
    const step = dur / 8; // 0.4 detik per ketukan
    const beats = [0, 1, 2, 3, 4, 5, 6, 7].map(b => b * step);

    beats.forEach(beat => {
      // Peluang bermain 55% untuk ketukan ganjil, 30% untuk genap
      const probability = (beat / step) % 2 === 0 ? 0.55 : 0.3;
      if (Math.random() < probability) {
        const note = NOTES[Math.floor(Math.random() * NOTES.length)];
        playMelodyNote(note, now + beat, 0.3 + Math.random() * 0.3);
      }
    });

    schedTimer = setTimeout(scheduleLoop, dur * 1000 - 100);
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

  // ── Buat Widget UI ───────────────────────────────────────────────────────
  function createWidget() {
    const btn = document.createElement('button');
    btn.id             = 'music-toggle-btn';
    btn.setAttribute('aria-label', 'Putar musik semangat belajar');
    btn.setAttribute('title',      'Semangat Belajar (klik untuk putar)');
    btn.innerHTML      = '<span class="music-icon">&#127925;</span><span class="music-label">Musik</span>';
    btn.className      = 'music-btn';

    const ripple = document.createElement('span');
    ripple.className   = 'music-ripple';
    btn.appendChild(ripple);

    btn.addEventListener('click', () => {
      if (isPlaying) {
        stopMusic();
        btn.classList.remove('music-btn--playing');
        btn.setAttribute('aria-label', 'Putar musik semangat belajar');
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
