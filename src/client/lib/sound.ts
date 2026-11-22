// Sons sintetizados com Web Audio (sem arquivos de áudio, nada para baixar).
// Celulares só liberam o áudio depois de um toque na página. Por isso, `installAudioUnlock`
// cria o AudioContext no primeiro toque, e os sons tocados depois funcionam sem novo toque.

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function installAudioUnlock() {
  const unlock = () => {
    const c = getCtx();
    if (!c) return;
    // Um som mudo de 1 amostra "acorda" o áudio no iOS.
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, 22050);
    src.connect(c.destination);
    src.start();
    if (c.state === "running") {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    }
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

function noiseBuffer(c: AudioContext) {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** Uma batida de caixa: chiado filtrado com ataque rápido. */
function snareHit(c: AudioContext, out: AudioNode, t: number, gain: number) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const band = c.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1700 + Math.random() * 400;
  band.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  src.connect(band).connect(g).connect(out);
  src.start(t, Math.random() * 1.5, 0.1);

  // Corpo do tambor: um tom grave curtinho.
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(190, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
  const og = c.createGain();
  og.gain.setValueAtTime(gain * 0.5, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  osc.connect(og).connect(out);
  osc.start(t);
  osc.stop(t + 0.08);
}

/** Rufar de tambores que vai crescendo. Devolve uma função para parar antes da hora. */
export function playDrumroll(seconds: number) {
  const c = getCtx();
  if (!c) return () => {};
  const master = c.createGain();
  master.gain.value = 0.32;
  master.connect(c.destination);
  const start = c.currentTime + 0.05;
  let t = start;
  while (t < start + seconds) {
    const p = (t - start) / seconds; // 0 → 1
    snareHit(c, master, t, 0.18 + p * 0.55);
    // Começa com ~8 batidas por segundo e acelera pouco, até ~11 no fim.
    t += 0.125 - p * 0.035 + (Math.random() - 0.5) * 0.008;
  }
  return () => {
    master.gain.cancelScheduledValues(c.currentTime);
    master.gain.setTargetAtTime(0, c.currentTime, 0.03);
    setTimeout(() => master.disconnect(), 300);
  };
}

/** Prato + bumbo + acorde de "tcharam!" para a revelação. */
export function playReveal() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.45;
  out.connect(c.destination);

  // Prato: chiado agudo com cauda longa.
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 4500;
  const cg = c.createGain();
  cg.gain.setValueAtTime(0.55, t);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
  src.connect(hp).connect(cg).connect(out);
  src.start(t, 0, 2.3);

  // Bumbo.
  const kick = c.createOscillator();
  kick.frequency.setValueAtTime(140, t);
  kick.frequency.exponentialRampToValueAtTime(45, t + 0.25);
  const kg = c.createGain();
  kg.gain.setValueAtTime(0.9, t);
  kg.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  kick.connect(kg).connect(out);
  kick.start(t);
  kick.stop(t + 0.45);

  // Acorde maior (dó-mi-sol-dó) bem rápido, tipo fanfarra.
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = c.createGain();
    const at = t + 0.05 + i * 0.03;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.12, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, at + 1.3);
    o.connect(g).connect(out);
    o.start(at);
    o.stop(at + 1.4);
  });
}

/** Tique curto, para os últimos segundos do cronômetro. */
export function playTick(high = false) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + 0.01;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.value = high ? 1320 : 880;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.1);
}

/** "Plim-plim!" de acerto. */
export function playCorrect() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + 0.01;
  [784, 1175].forEach((f, i) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = c.createGain();
    const at = t + i * 0.12;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.16, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    o.connect(g).connect(c.destination);
    o.start(at);
    o.stop(at + 0.55);
  });
}

// ---------------------------------------------------------------- áudios gravados

const samples = new Map<string, Promise<AudioBuffer | null>>();

/** Baixa e decodifica um áudio de public/ uma vez só (chame cedo para já estar pronto na hora). */
export function preloadSample(url: string) {
  if (!samples.has(url)) {
    const c = getCtx();
    samples.set(
      url,
      c
        ? fetch(url)
            .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
            .then((b) => c.decodeAudioData(b))
            .catch(() => null)
        : Promise.resolve(null),
    );
  }
  return samples.get(url)!;
}

/** Toca um áudio gravado. Devolve uma função para parar, ou null se não deu para tocar. */
export async function playSample(url: string, volume = 0.6): Promise<(() => void) | null> {
  const c = getCtx();
  const buffer = await preloadSample(url);
  if (!c || !buffer) return null;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.value = volume;
  src.connect(g).connect(c.destination);
  src.start();
  return () => {
    g.gain.setTargetAtTime(0, c.currentTime, 0.05);
    setTimeout(() => src.stop(), 300);
  };
}

/** Só a fanfarra curta (sem prato nem bumbo), para tocar junto da batida final do rufar gravado. */
export function playFanfare() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + 0.02;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = c.createGain();
    const at = t + 0.05 + i * 0.03;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.06, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, at + 1.3);
    o.connect(g).connect(c.destination);
    o.start(at);
    o.stop(at + 1.4);
  });
}
