/* AudioManager.ts - Ludo King Style Dice Sounds */

const diceRollAudio = new Audio("/sound/dice-roll.mp3");
const diceStopAudio = new Audio("/sound/dice-stop.mp3");

let audioCtx: AudioContext | null = null;

// Initialize or resume the AudioContext (solves mobile unlock issue)
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Export a public initialize function to be called on game mount/click
export function initializeAudio() {
  console.log("AUDIO_INIT");
  getAudioContext();
  
  // Pre-load to avoid first-play delay on mobile
  diceRollAudio.load();
  diceStopAudio.load();
}

/**
 * Option 2: Synthesized fallback (Ludo King style tumbling)
 */
function playSynthesizedRoll() {
  const ctx = getAudioContext();
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  for (let i = 0; i < 8; i++) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 500 + Math.random() * 800;

    const g = ctx.createGain();
    g.gain.value = 0.15;

    osc.connect(g);
    g.connect(gain);

    const t = ctx.currentTime + i * 0.03;

    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.start(t);
    osc.stop(t + 0.05);
  }
}

/**
 * Option 2: Synthesized fallback (Ludo King style stop)
 */
function playSynthesizedStop() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

export function playRollSound() {
  console.log("ROLL_SOUND_TRIGGERED");
  
  diceRollAudio.currentTime = 0;
  diceRollAudio.volume = 0.8;
  const promise = diceRollAudio.play();
  
  if (promise !== undefined) {
    promise.catch(err => {
      console.warn("MP3 failed (likely Autoplay blocked), using Ludo King WebAudio fallback:", err);
      playSynthesizedRoll();
    });
  }
  
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

export function playStopSound() {
  console.log("STOP_SOUND_TRIGGERED");
  
  diceStopAudio.currentTime = 0;
  diceStopAudio.volume = 0.9;
  const promise = diceStopAudio.play();
  
  if (promise !== undefined) {
    promise.catch(err => {
      console.warn("MP3 failed (likely Autoplay blocked), using Ludo King WebAudio fallback:", err);
      playSynthesizedStop();
    });
  }
}
