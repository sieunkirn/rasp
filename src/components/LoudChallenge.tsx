import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FinalScreen,
  GameScreen,
  ReadyScreen,
  ResultScreen,
  StartScreen,
  type RoundResult,
} from "./GameScreens";
import { useAudioMeter } from "../hooks/useAudioMeter";

type Phase = "start" | "ready" | "game" | "result" | "final";

const TOTAL_ROUNDS = 5;
const ROUND_TICKS = 50;
const FLOOR_DB = 45;

const makeTarget = () => Math.floor(Math.random() * 26) + 68;

export default function LoudChallenge({ onHome }: { onHome: () => void }) {
  const [phase, setPhase] = useState<Phase>("start");
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState(makeTarget);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [countdown, setCountdown] = useState(3);
  const [timeTicks, setTimeTicks] = useState(ROUND_TICKS);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [peaks, setPeaks] = useState<[number, number]>([FLOOR_DB, FLOOR_DB]);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [simulated, setSimulated] = useState<[number, number]>([FLOOR_DB, FLOOR_DB]);
  const pressedKeys = useRef(new Set<string>());
  const peakRef = useRef<[number, number]>([FLOOR_DB, FLOOR_DB]);
  const phaseRef = useRef<Phase>("start");
  const { levels, status, start, stop } = useAudioMeter();

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const activeLevel = useMemo(
    () => Math.max(levels[0], simulated[turn - 1]),
    [levels, simulated, turn],
  );
  const liveLevels: [number, number] =
    turn === 1 ? [activeLevel, peaks[1]] : [peaks[0], activeLevel];

  useEffect(() => {
    if (phase !== "game") return;
    const next: [number, number] = [...peakRef.current];
    next[turn - 1] = Math.max(next[turn - 1], activeLevel);
    peakRef.current = next;
    setPeaks(next);
  }, [activeLevel, phase, turn]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "a" || key === "l") {
        event.preventDefault();
        pressedKeys.current.add(key);
      }
    };
    const up = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.key.toLowerCase());
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSimulated((current) => {
        const active = phaseRef.current === "game";
        const p1 = active && pressedKeys.current.has("a");
        const p2 = active && pressedKeys.current.has("l");
        return [
          p1 ? 72 + Math.random() * 29 : Math.max(FLOOR_DB, current[0] - 5),
          p2 ? 72 + Math.random() * 29 : Math.max(FLOOR_DB, current[1] - 5),
        ];
      });
    }, 90);
    return () => window.clearInterval(id);
  }, []);

  const finishRound = useCallback(() => {
    const measured: [number, number] = [
      Math.round(peakRef.current[0] * 10) / 10,
      Math.round(peakRef.current[1] * 10) / 10,
    ];
    const differences: [number, number] = [
      Math.round(Math.abs(measured[0] - target) * 10) / 10,
      Math.round(Math.abs(measured[1] - target) * 10) / 10,
    ];
    const winner: 0 | 1 | 2 =
      Math.abs(differences[0] - differences[1]) < 0.5
        ? 0
        : differences[0] < differences[1]
          ? 1
          : 2;
    if (winner) {
      setScores((previous) => {
        const next: [number, number] = [...previous];
        next[winner - 1] += 1;
        return next;
      });
    }
    setResult({ target, measured, differences, winner });
    setPhase("result");
  }, [target]);

  const finishTurn = useCallback(() => {
    if (turn === 1) {
      setTurn(2);
      setCountdown(3);
      setPhase("ready");
    } else {
      finishRound();
    }
  }, [finishRound, turn]);

  useEffect(() => {
    if (phase !== "ready") return;
    const id = window.setTimeout(() => {
      if (countdown > 1) {
        setCountdown((value) => value - 1);
      } else {
        peakRef.current[turn - 1] = FLOOR_DB;
        setPeaks([...peakRef.current]);
        setTimeTicks(ROUND_TICKS);
        setPhase("game");
      }
    }, 1000);
    return () => window.clearTimeout(id);
  }, [countdown, phase, turn]);

  useEffect(() => {
    if (phase !== "game") return;
    const id = window.setInterval(() => {
      setTimeTicks((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          window.setTimeout(finishTurn, 0);
          return 0;
        }
        return value - 1;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [finishTurn, phase]);

  const startRound = useCallback((roundNumber: number) => {
    setRound(roundNumber);
    setTarget(makeTarget());
    setTurn(1);
    peakRef.current = [FLOOR_DB, FLOOR_DB];
    setPeaks([FLOOR_DB, FLOOR_DB]);
    setCountdown(3);
    setResult(null);
    setPhase("ready");
  }, []);

  const beginGame = async () => {
    await start();
    setScores([0, 0]);
    startRound(1);
  };

  const continueGame = () => {
    if (round >= TOTAL_ROUNDS) {
      setPhase("final");
    } else {
      startRound(round + 1);
    }
  };

  const playAgain = () => {
    setScores([0, 0]);
    startRound(1);
  };

  const goHome = () => {
    stop();
    pressedKeys.current.clear();
    setScores([0, 0]);
    setRound(1);
    setPhase("start");
    onHome();
  };

  return (
    <main className="app-shell">
      {phase === "start" && <StartScreen audioStatus={status} onStart={beginGame} />}
      {phase === "ready" && <ReadyScreen round={round} countdown={countdown} player={turn} />}
      {phase === "game" && (
        <GameScreen
          round={round}
          activePlayer={turn}
          levels={liveLevels}
          peaks={peaks}
          scores={scores}
          time={timeTicks / 10}
          audioStatus={status}
        />
      )}
      {phase === "result" && result && (
        <ResultScreen
          round={round}
          result={result}
          scores={scores}
          isLastRound={round === TOTAL_ROUNDS}
          onContinue={continueGame}
        />
      )}
      {phase === "final" && (
        <FinalScreen scores={scores} onAgain={playAgain} onHome={goHome} />
      )}
    </main>
  );
}
