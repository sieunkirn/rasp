import { useCallback, useEffect, useRef, useState } from "react";

export type AudioStatus = "idle" | "requesting" | "ready" | "unavailable";

const MIN_DB = 45;
const MAX_DB = 105;

function readDecibels(analyser: AnalyserNode, buffer: Float32Array<ArrayBuffer>) {
  analyser.getFloatTimeDomainData(buffer);
  let sum = 0;
  for (const sample of buffer) sum += sample * sample;
  const rms = Math.sqrt(sum / buffer.length);
  if (rms < 0.0001) return MIN_DB;
  // Web Audio exposes dBFS, not calibrated SPL. The +100 mapping gives a
  // practical arcade meter range and can be calibrated at the OS input level.
  return Math.min(MAX_DB, Math.max(MIN_DB, 20 * Math.log10(rms) + 100));
}

export function useAudioMeter() {
  const [levels, setLevels] = useState<[number, number]>([MIN_DB, MIN_DB]);
  const [status, setStatus] = useState<AudioStatus>("idle");
  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream[]>([]);
  const frameRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
    streamRef.current = [];
    contextRef.current?.close().catch(() => undefined);
    contextRef.current = null;
    setLevels([MIN_DB, MIN_DB]);
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current.length) return true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return false;
    }

    setStatus("requesting");
    try {
      const audioConstraints: MediaTrackConstraints = {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      const AudioContextClass = window.AudioContext;
      const context = new AudioContextClass();
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      const analysers = [context.createAnalyser(), context.createAnalyser()];
      analysers.forEach((analyser) => {
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.58;
      });

      source.connect(analysers[0]);
      source.connect(analysers[1]);

      const buffers = [
        new Float32Array(analysers[0].fftSize),
        new Float32Array(analysers[1].fftSize),
      ] as [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>];
      let smooth: [number, number] = [MIN_DB, MIN_DB];

      const update = () => {
        const raw: [number, number] = [
          readDecibels(analysers[0], buffers[0]),
          readDecibels(analysers[1], buffers[1]),
        ];
        smooth = [
          smooth[0] * 0.58 + raw[0] * 0.42,
          smooth[1] * 0.58 + raw[1] * 0.42,
        ];
        setLevels(smooth);
        frameRef.current = requestAnimationFrame(update);
      };

      streamRef.current = [stream];
      contextRef.current = context;
      setStatus("ready");
      update();
      return true;
    } catch {
      setStatus("unavailable");
      return false;
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { levels, status, start, stop };
}
