/**
 * music.js — Floating ambient music player
 * Menggunakan Web Audio API untuk menghasilkan musik R&B Pagi (Morning Chill R&B / Neo-Soul)
 * Terinspirasi dari: Beyonce, SZA, TLC, Ne-Yo (Tempo santai, Rhodes pad, Bassline, & Beat R&B)
 */

(function () {
  'use strict';

  let audioCtx = null;
  let masterGain = null;
  let isPlaying = false;
  let scheduledNodes = [];
  let chordIdx = 0;
  let schedTimer = null;

  // ── Tangga Nada A Minor / C Major Pentatonic (Neo-Soul / R&B) ───────────
  const NOTES = [
    220.00, 246.94, 261.63, 293.66, 329.63,  // A3, B3, C4, D4, E4
    392.00, 440.00, 493.88, 523.25, 587.33,  // G4, A4, B4, C5, D5
    659.25, 783.99, 880.00                   // E5, G5, A5
  ];

  // Progresi akor Neo-Soul (Am7 -> Dm7 -> G7 -> Cmaj7)
  const CHORD_SETS = [
    // Am7: A3 (220.00), C4 (261.63), E4 (329.63), G4 (392.00)
    { root: 220.00, freqs: [220.00, 261.63, 329.63, 392.00] },
    // Dm7: D3 (146.83), F4 (349.23), A4 (440.00), C5 (523.25)
    { root: 146.83, freqs: [146.83, 349.23, 440.00, 523.25] },
    // G7: G3 (196.00), B3 (246.94), D4 (293.66), F4 (349.23)
    { root: 196.00, freqs: [196.00, 246.94, 293.66, 349.23] },
    // Cmaj7: C3 (130.81), E4 (329.63), G4 (392.00), B4 (493.88)
    { root: 130.81, freqs: [130.81, 329.63, 392.00, 493.88] }
  ];

  function initAudio() {
    if (audioCtx) return;
    audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }

  // ── Procedural Kick Drum ──────────────────────────────────────────────────
  function playKick(time) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);

    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.16);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.start(time);
    osc.stop(time + 0.17);
    scheduledNodes.push(osc, gain);
  }

  // ── Procedural Snare / Snap ────────────────────────────────────────────────
  function playSnap(time) {
    // Generate white noise buffer
    const bufferSize = audioCtx.sampleRate * 0.08; // 80ms
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100;
    filter.Q.value = 2.5;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(time);
    noise.stop(time + 0.09);
    scheduledNodes.push(noise, filter, gain);
  }

  // ── Smooth Rhodes Chords (with LFO Tremolo) ──────────────────────────────
  function playRhodesChord(freqs, time, duration) {
    freqs.forEach(freq => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      // Tremolo effect using LFO (modulating gain)
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.value = 4.2; // 4.2Hz tremolo speed
      lfoGain.gain.value = 0.15; // Tremolo depth
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      // Base gain envelope
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.04, time + 0.12);
      gain.gain.linearRampToValueAtTime(0.03, time + duration - 0.4);
      gain.gain.linearRampToValueAtTime(0, time + duration);
      
      // Connect LFO to gain
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain); // Modulate gain
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(time);
      osc.stop(time + duration);
      lfo.start(time);
      lfo.stop(time + duration);
      
      scheduledNodes.push(osc, lfo, lfoGain, gain);
    });
  }

  // ── Smooth Bassline (Deep Sine) ──────────────────────────────────────────
  function playBass(freq, time, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.08);
    gain.gain.linearRampToValueAtTime(0.08, time + duration - 0.2);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + duration);
    scheduledNodes.push(osc, gain);
  }

  // ── R&B Melody Note (Chill Rhodes Pluck) ──────────────────────────────────
  function playMelody(freq, time, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filt = audioCtx.createBiquadFilter();
    
    filt.type = 'lowpass';
    filt.frequency.value = 1600;
    
    osc.type = 'triangle';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.05, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.connect(filt);
    filt.connect(gain);
    gain.connect(masterGain);
    
    osc.start(time);
    osc.stop(time + duration);
    scheduledNodes.push(osc, filt, gain);
  }

  // ── Scheduler Utama ──────────────────────────────────────────────────────
  function scheduleLoop() {
    if (!isPlaying) return;

    const now = audioCtx.currentTime;
    const dur = 3.6; // 80 BPM (Sangat santai dan ber-groove)
    const step = dur / 8; // 0.45s per beat
    
    const activeChord = CHORD_SETS[chordIdx % CHORD_SETS.length];
    chordIdx++;

    // 1. Play Rhodes Chord
    playRhodesChord(activeChord.freqs, now, dur - 0.2);

    // 2. Play Bassline
    // Beat 0: Root note
    playBass(activeChord.root / 2, now, step * 4 - 0.1);
    // Beat 4: Fifth note
    playBass(activeChord.root * 1.5 / 2, now + step * 4, step * 4 - 0.1);

    // 3. Play Drum Beat (R&B Groove)
    playKick(now);                   // Beat 0
    playSnap(now + step * 2);        // Beat 2
    playKick(now + step * 4);        // Beat 4
    playKick(now + step * 4.5);      // Beat 4.5
    playSnap(now + step * 6);        // Beat 6

    // 4. Play Chill Melody (Neo-Soul Chimes)
    const melodyBeats = [1, 3, 5, 7];
    melodyBeats.forEach(beat => {
      // Peluang bermain 40%
      if (Math.random() < 0.4) {
        const note = NOTES[Math.floor(Math.random() * NOTES.length)];
        playMelody(note, now + beat * step, 0.4 + Math.random() * 0.4);
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
      }, 1200);
    }
  }

  // ── Buat Widget UI ───────────────────────────────────────────────────────
  function createWidget() {
    const btn = document.createElement('button');
    btn.id             = 'music-toggle-btn';
    btn.setAttribute('aria-label', 'Putar musik Morning R&B');
    btn.setAttribute('title',      'Morning R&B (klik untuk putar)');
    btn.innerHTML      = '<span class="music-icon">&#127925;</span><span class="music-label">Musik</span>';
    btn.className      = 'music-btn';

    const ripple = document.createElement('span');
    ripple.className   = 'music-ripple';
    btn.appendChild(ripple);

    btn.addEventListener('click', () => {
      if (isPlaying) {
        stopMusic();
        btn.classList.remove('music-btn--playing');
        btn.setAttribute('aria-label', 'Putar musik Morning R&B');
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
