const volume = document.getElementById("volume");
const bass = document.getElementById("bass");
const mid = document.getElementById("mid");
const trebble = document.getElementById("trebble");
const visualizer = document.getElementById("visualizer");

const context = new AudioContext();
const analyserNode = new AnalyserNode(context, { fftSize: 256 });
const gainNode = new GainNode(context, { gain: volume.value });
const bassEQ = new BiquadFilterNode(context, {
  type: "lowshelf",
  frequency: 200,
  gain: bass.value,
});
const midEQ = new BiquadFilterNode(context, {
  type: "peaking",
  Q: Math.SQRT1_2,
  frequency: 440,
  gain: mid.value,
});
const trebbleEQ = new BiquadFilterNode(context, {
  type: "highshelf",
  frequency: 600,
  gain: trebble.value,
});

setupEventListeners();
setupContext();
resize();
drawVisualizer();

function setupEventListeners() {
  window.addEventListener("resize", resize);

  volume.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    gainNode.gain.setTargetAtTime(value, context.currentTime, 0.005);
  });

  bass.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    bassEQ.gain.setTargetAtTime(value, context.currentTime, 0.005);
  });

  mid.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    midEQ.gain.setTargetAtTime(value, context.currentTime, 0.005);
  });

  trebble.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    trebbleEQ.gain.setTargetAtTime(value, context.currentTime, 0.005);
  });
}

async function setupContext() {
  const sound = await getSound();
  if (context.state === "suspended") {
    await context.resume();
  }
  const source = context.createMediaStreamSource(sound);
  source
    .connect(bassEQ)
    .connect(midEQ)
    .connect(trebbleEQ)
    .connect(gainNode)
    .connect(analyserNode)
    .connect(context.destination);
}

function getSound() {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      autoGainControl: false,
      noiseSuppression: true,
      latency: 0,
    },
  });
}

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyserNode.getByteFrequencyData(dataArray);
  const width = visualizer.width;
  const height = visualizer.height;
  const barWidth = width / bufferLength;

  const canvasContext = visualizer.getContext("2d");
  canvasContext.clearRect(0, 0, width, height); 

  dataArray.forEach((item, index) => {
    const y = 1 + ((item / 255) * height) / 2;
    const x = barWidth * index;

    let color = `hsl(${(y / height - 360) * 450}, 100%, 50%)`;

    canvasContext.fillStyle = color;
    canvasContext.fillRect(x, height / 2, barWidth / 2, y);
    canvasContext.fillRect(x, height / 2 - y, barWidth / 2, y);
  });
}

function resize() {
  visualizer.width = visualizer.clientWidth * window.devicePixelRatio;
  visualizer.height = visualizer.clientHeight * window.devicePixelRatio;
}
