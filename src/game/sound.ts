/**
 * Named sound cues. Web build synthesizes them.
 * Raspberry Pi / Pygame: load the same cue names from assets/sfx/{cue}.wav
 * and assets/bgm/{game}.wav.
 */
export type SoundCue =
  | "countdown"
  | "go"
  | "miss"
  | "correct"
  | "danger"
  | "fall"
  | "round-win"
  | "round-lose"
  | "champion"
  | "taunt"
  | "buzz";

export type BgmId = "menu" | "loud" | "race" | "balance" | "food";
export type SoundAssets = {
  cues?: Partial<Record<SoundCue, string>>;
  bgm?: Partial<Record<BgmId, string>>;
};

type OscType = OscillatorType;

let context: AudioContext | null = null;
let bgmNodes: { osc: OscillatorNode; gain: GainNode; timer: number } | null = null;
let bgmAudio: HTMLAudioElement | null = null;
let soundAssets: SoundAssets = {};
let muted = false;
const lastPlayed: Partial<Record<SoundCue, number>> = {};

export function configureSoundAssets(assets: SoundAssets) {
  soundAssets = assets;
}

function ctx() {
  if (!context) {
    const AudioContextClass = window.AudioContext;
    context = new AudioContextClass();
  }
  return context;
}

async function resume() {
  const audio = ctx();
  if (audio.state === "suspended") await audio.resume();
  return audio;
}

function beep(frequency: number, duration: number, type: OscType, volume = 0.08, slide = 0) {
  const audio = ctx();
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (slide) osc.frequency.linearRampToValueAtTime(Math.max(40, frequency + slide), now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function noiseBurst(duration: number, volume = 0.04) {
  const audio = ctx();
  const length = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = 900;
  gain.gain.value = volume;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  source.start();
}

const CUES: Record<SoundCue, () => void> = {
  countdown: () => beep(520, 0.12, "square", 0.06),
  go: () => {
    beep(220, 0.12, "square", 0.07);
    beep(440, 0.16, "square", 0.07);
    beep(880, 0.2, "sawtooth", 0.05);
  },
  miss: () => {
    beep(430, 0.16, "triangle", 0.07, -310);
    window.setTimeout(() => beep(120, 0.1, "square", 0.06, 45), 95);
    noiseBurst(0.1, 0.025);
  },
  correct: () => {
    beep(660, 0.08, "square", 0.06);
    beep(990, 0.12, "square", 0.05);
  },
  danger: () => beep(140, 0.09, "sawtooth", 0.05, 40),
  fall: () => {
    beep(760, 0.1, "square", 0.06, -350);
    window.setTimeout(() => beep(300, 0.4, "triangle", 0.08, -250), 85);
    noiseBurst(0.18, 0.04);
  },
  "round-win": () => {
    [523, 659, 784, 1046].forEach((note, index) => {
      window.setTimeout(() => beep(note, 0.12, "square", 0.06), index * 80);
    });
  },
  "round-lose": () => {
    [392, 349, 294, 220].forEach((note, index) => {
      window.setTimeout(() => beep(note, 0.2, index === 3 ? "square" : "triangle", 0.07, -25), index * 145);
    });
    window.setTimeout(() => beep(110, 0.24, "sawtooth", 0.035, -35), 580);
  },
  champion: () => {
    [392, 523, 659, 784, 659, 1046, 330].forEach((note, index) => {
      window.setTimeout(() => beep(note, index === 6 ? 0.3 : 0.11, "square", 0.055, index === 6 ? -90 : 0), index * 90);
    });
  },
  taunt: () => beep(700, 0.05, "square", 0.04, 200),
  buzz: () => beep(180, 0.05, "square", 0.05),
};

const BGM_RIFFS: Record<BgmId, number[]> = {
  menu: [262, 370, 392, 330, 233, 349, 262, 185],
  loud: [196, 262, 220, 311, 196, 349, 247, 175],
  race: [392, 440, 392, 587, 349, 392, 294, 370],
  balance: [220, 247, 185, 262, 174, 233, 147, 196],
  food: [330, 392, 349, 466, 294, 349, 262, 370],
};

export const sound = {
  async unlock() {
    muted = false;
    await resume();
  },
  mute() {
    muted = true;
    this.stopBgm();
  },
  play(cue: SoundCue) {
    if (muted) return;
    const now = performance.now();
    const cooldown = cue === "danger" ? 500 : 90;
    if ((lastPlayed[cue] ?? 0) + cooldown > now) return;
    lastPlayed[cue] = now;
    const source = soundAssets.cues?.[cue];
    if (source) {
      const audio = new Audio(source);
      audio.volume = 0.8;
      void audio.play().catch(() => resume().then(() => CUES[cue]()));
      return;
    }
    void resume().then(() => CUES[cue]());
  },
  startBgm(id: BgmId) {
    if (muted) return;
    this.stopBgm();
    const source = soundAssets.bgm?.[id];
    if (source) {
      const audio = new Audio(source);
      audio.loop = true;
      audio.volume = 0.22;
      bgmAudio = audio;
      void audio.play().catch(() => {
        if (bgmAudio === audio) {
          bgmAudio = null;
          startSynthBgm(id);
        }
      });
      return;
    }
    startSynthBgm(id);
  },
  stopBgm() {
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
      bgmAudio = null;
    }
    stopSynthBgm();
  },
};

function startSynthBgm(id: BgmId) {
  void resume().then((audio) => {
    const riff = BGM_RIFFS[id];
    let step = 0;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "square";
    gain.gain.value = 0.035;
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    const tick = () => {
      osc.frequency.setValueAtTime(riff[step % riff.length], audio.currentTime);
      step += 1;
    };
    tick();
    const timer = window.setInterval(tick, id === "race" ? 180 : 260);
    bgmNodes = { osc, gain, timer };
  });
}

function stopSynthBgm() {
  if (!bgmNodes) return;
  window.clearInterval(bgmNodes.timer);
  try {
    bgmNodes.osc.stop();
  } catch {
    /* already stopped */
  }
  bgmNodes.osc.disconnect();
  bgmNodes.gain.disconnect();
  bgmNodes = null;
}
