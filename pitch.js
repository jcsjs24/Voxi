const startBtn = document.getElementById("startBtn");
const freqDisplay = document.getElementById("frequency");
const noteDisplay = document.getElementById("note");

let audioContext;
let analyser;
let buffer = new Float32Array(2048);

startBtn.onclick = async () => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;

  source.connect(analyser);
  updatePitch();
};

function updatePitch() {
  analyser.getFloatTimeDomainData(buffer);
  const pitch = autoCorrelate(buffer, audioContext.sampleRate);

  if (pitch !== -1) {
    freqDisplay.textContent = `Frequency: ${pitch.toFixed(2)} Hz`;
    noteDisplay.textContent = `Note: ${frequencyToNote(pitch)}`;
  }

  requestAnimationFrame(updatePitch);
}

// Autocorrelation pitch detection
function autoCorrelate(buffer, sampleRate) {
  let size = buffer.length;
  let rms = 0;

  for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = size - 1;
  for (let i = 0; i < size / 2; i++) { if (Math.abs(buffer[i]) < 0.2) { r1 = i; break; } }
  for (let i = 1; i < size / 2; i++) { if (Math.abs(buffer[size - i]) < 0.2) { r2 = size - i; break; } }

  buffer = buffer.slice(r1, r2);
  size = buffer.length;

  let c = new Array(size).fill(0);
  for (let i = 0; i < size; i++) for (let j = 0; j < size - i; j++) c[i] += buffer[j] * buffer[j + i];

  let d = 0;
  while (c[d] > c[d + 1]) d++;

  let maxval = -1, maxpos = -1;
  for (let i = d; i < size; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }

  let T0 = maxpos;
  return sampleRate / T0;
}

// Frequency → musical note
function frequencyToNote(freq) {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const A4 = 440;
  const semitone = 12 * Math.log2(freq / A4);
  const noteIndex = Math.round(semitone) + 9;
  const octave = Math.floor(noteIndex / 12) + 4;
  return noteNames[(noteIndex + 1200) % 12] + octave;
}
