import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PartyFace from "./PartyFace";
import { PLAYER_COLORS, PLAYERS, type PlayerId, type Ranking, type SportId } from "../game/constants";
import { balanceMood, podiumMood, raceMood, type FaceMood } from "../game/faces";
import { BALANCE_KEYS, FOOD_KEYS, NUMBER_KEYS, useKeyPressMap } from "../game/input";
import { sound } from "../game/sound";
import { loseLine, roastLine, winLine } from "../game/taunts";

export type NewSport = SportId;
export type { PlayerId, Ranking };

type ResultsMap = Partial<Record<NewSport, Ranking>>;
type GameProps = {
  onResult: (ranking: Ranking) => void;
  onNext: () => void;
  onHome: () => void;
};

const SPORT_META: Record<
  NewSport,
  { number: string; title: string; english: string; description: string; controls: string }
> = {
  loud: {
    number: "01",
    title: "데시벨",
    english: "LOUD CHALLENGE",
    description: "목표 데시벨에 가장 가깝게 소리 지르세요. P1부터 P3까지 한 명씩 차례로 도전합니다.",
    controls: "마이크 자동 측정 · 미연결 시 P1 A / P2 J / P3 L",
  },
  race: {
    number: "02",
    title: "빨리 가기",
    english: "NUMBER DASH",
    description: "화면의 숫자를 누구보다 빠르게 찾아 캐릭터를 결승선까지 보내세요. 틀리면 뒤로 갑니다.",
    controls: "P1 · 1 2 3  /  P2 · 4 5 6  /  P3 · 7 8 9 0",
  },
  balance: {
    number: "03",
    title: "오래 걷기",
    english: "TIGHTROPE",
    description: "좌우로 버티세요. 흔들릴수록 표정이 먼저 무너집니다.",
    controls: "P1 · A D  /  P2 · J L  /  P3 · ← →",
  },
  food: {
    number: "04",
    title: "음식 분류",
    english: "FOOD SORT",
    description: "20초 안에 목표 음식만 눌러 점수 챙기세요. 오답은 친구들 앞에서 바로 박제.",
    controls: "P1 · A  /  P2 · J  /  P3 · L",
  },
};

function ArcadeButton({
  children,
  onClick,
  variant = "dark",
  disabled = false,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "dark" | "light" | "yellow";
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={`arcade-button arcade-button-${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function ScreenHeader({
  number,
  title,
  right,
  onHome,
}: {
  number: string;
  title: string;
  right?: React.ReactNode;
  onHome: () => void;
}) {
  return (
    <div className="olympic-header">
      <button type="button" className="olympic-brand" onClick={onHome} aria-label="Raspberry Olympics 홈으로">
        <span>R</span> RASPBERRY OLYMPICS
      </button>
      <div className="sport-name"><b>GAME {number}</b><strong>{title}</strong></div>
      <div className="header-right">{right}</div>
    </div>
  );
}

function PlayerBadge({ player, compact = false }: { player: PlayerId; compact?: boolean }) {
  return (
    <div className={`olympic-player-badge player-color-${PLAYER_COLORS[player - 1]} ${compact ? "compact" : ""}`}>
      <span>P{player}</span>
      <strong>PLAYER {player}</strong>
    </div>
  );
}

function PodiumResult({
  title,
  ranking,
  detail,
  nextLabel = "다음 종목",
  onNext,
  onHome,
}: {
  title: string;
  ranking: Ranking;
  detail?: Record<PlayerId, string>;
  nextLabel?: string;
  onNext: () => void;
  onHome: () => void;
}) {
  return (
    <section className="screen olympic-result-screen">
      <button type="button" className="olympic-brand olympic-brand-floating" onClick={onHome} aria-label="Raspberry Olympics 홈으로">
        <span>R</span> RASPBERRY OLYMPICS
      </button>
      <div className="result-topline">GAME COMPLETE</div>
      <div className="display-title">경기 결과</div>
      <div className="result-subtitle">{title}</div>
      <div className="podium">
        {[ranking[1], ranking[0], ranking[2]].map((player, index) => {
          const place = index === 1 ? 1 : index === 0 ? 2 : 3;
          return (
            <div className={`podium-place podium-${place}`} key={player}>
              <div className="podium-medal">{place}</div>
              <div className={`podium-avatar player-color-${PLAYER_COLORS[player - 1]}`}>
                <PartyFace player={player} mood={podiumMood(place)} size={place === 1 ? 88 : 68} />
              </div>
              <strong>PLAYER {player}</strong>
              <small>{place === 1 ? winLine(player) : place === 3 ? loseLine(player) : roastLine(player)}</small>
              {detail && <small>{detail[player]}</small>}
              <div className="podium-block"><span>{place}위</span><b>+{4 - place}점</b></div>
            </div>
          );
        })}
      </div>
      <ArcadeButton onClick={onNext}>{nextLabel} <b>›</b></ArcadeButton>
    </section>
  );
}

export function OlympicMenu({
  results,
  onSelect,
  onFinal,
}: {
  results: ResultsMap;
  onSelect: (sport: NewSport) => void;
  onFinal: () => void;
}) {
  const complete = Object.keys(results).length;
  const [playerMoods, setPlayerMoods] = useState<Record<PlayerId, FaceMood>>({ 1: "smirk", 2: "wild", 3: "smirk" });
  const [titleJiggle, setTitleJiggle] = useState(false);
  const teaseTitle = () => {
    setTitleJiggle(false);
    window.requestAnimationFrame(() => setTitleJiggle(true));
    sound.play("taunt");
  };
  const teasePlayer = (player: PlayerId) => {
    const moods: FaceMood[] = ["smirk", "wild", "panic", "lose"];
    setPlayerMoods((current) => {
      const nextMood = moods[(moods.indexOf(current[player]) + 1) % moods.length];
      return { ...current, [player]: nextMood };
    });
    sound.play("taunt");
  };
  const cards: Array<{
    id: NewSport;
    number: string;
    title: string;
    english: string;
    icon: string;
  }> = [
    { id: "loud", number: "01", title: "데시벨 맞히기", english: "LOUD CHALLENGE", icon: "MIC" },
    { id: "race", number: "02", title: "빨리 가기", english: "NUMBER DASH", icon: "123" },
    { id: "balance", number: "03", title: "오래 걷기", english: "TIGHTROPE", icon: "BAL" },
    { id: "food", number: "04", title: "음식 분류", english: "FOOD SORT", icon: "FOOD" },
  ];
  return (
    <section className="screen olympic-menu">
      <div className="menu-stripe" />
      <div className="menu-heading">
        <div
          className={`olympic-title menu-title-interactive ${titleJiggle ? "title-jiggle" : ""}`}
          role="button"
          tabIndex={0}
          onClick={teaseTitle}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              teaseTitle();
            }
          }}
          aria-label="RASPBERRY OLYMPICS 제목 인터랙션"
        >
          <span>RASPBERRY</span> OLYMPICS
        </div>
      </div>
      <div className="menu-mascots" aria-label="플레이어 캐릭터">
        {PLAYERS.map((player) => (
          <button type="button" className={`menu-mascot player-color-${PLAYER_COLORS[player - 1]}`} key={player} onClick={() => teasePlayer(player)} aria-label={`PLAYER ${player} 표정 바꾸기`}>
            <PartyFace player={player} mood={playerMoods[player]} size={54} />
            <span>PLAYER {player}</span>
          </button>
        ))}
      </div>
      <div className="sport-card-grid">
        {cards.map((card) => {
          const done = Boolean(results[card.id]);
          return (
            <button
              type="button"
              className={`sport-card sport-card-${card.number} ${done ? "is-complete" : ""}`}
              key={card.id}
              onClick={() => onSelect(card.id)}
            >
              <span className="sport-index">GAME {card.number}</span>
              <span className="sport-icon">{card.icon}</span>
              <strong>{card.title}</strong>
              <small>{card.english}</small>
              <b>{done ? "완료" : "PLAY ›"}</b>
            </button>
          );
        })}
      </div>
      <div className="menu-footer">
        <span>2026 ipd / M:fit (메타뱅크)</span>
        <ArcadeButton onClick={onFinal} disabled={complete < 4} variant="yellow">
          FINAL RESULT · {complete}/4
        </ArcadeButton>
      </div>
    </section>
  );
}

export function SportIntro({
  sport,
  onBack,
  onStart,
}: {
  sport: NewSport;
  onBack: () => void;
  onStart: () => void;
}) {
  const meta = SPORT_META[sport];
  return (
    <section className={`screen sport-intro intro-${sport}`}>
      <ScreenHeader number={meta.number} title={meta.english} onHome={onBack} />
      <div className="intro-stage">
        <div className="intro-number">{meta.number}</div>
        <div className="intro-copy">
          <div className="intro-label">NEXT GAME</div>
          <div className="display-title">{meta.title}</div>
          <div className="intro-english">{meta.english}</div>
          <p>{meta.description}</p>
          <div className="control-guide"><small>PLAYER CONTROLS</small><strong>{meta.controls}</strong></div>
          <div className="intro-actions">
            <ArcadeButton onClick={onBack} variant="light">메뉴</ArcadeButton>
            <ArcadeButton onClick={onStart}>GAME START <b>›</b></ArcadeButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function CountdownScreen({ sport, count, onHome }: { sport: NewSport; count: number; onHome: () => void }) {
  const meta = SPORT_META[sport];
  return (
    <section className={`screen olympic-ready ready-${sport}`}>
      <ScreenHeader number={meta.number} title={meta.english} onHome={onHome} />
      <div className="ready-label">GET READY</div>
      <div className="olympic-countdown" key={count}>{count}</div>
      <div className="ready-title">{meta.title}</div>
      <p>{meta.controls}</p>
      <p className="ready-roast">{roastLine(count)}</p>
    </section>
  );
}

function useCountdown(active: boolean, onGo: () => void) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (!active) return;
    sound.play(count > 1 ? "countdown" : "go");
    const timer = window.setTimeout(() => {
      if (count > 1) setCount((value) => value - 1);
      else onGo();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [active, count, onGo]);
  return count;
}

export function RaceGame({ onResult, onNext, onHome }: GameProps) {
  const [phase, setPhase] = useState<"ready" | "playing" | "result">("ready");
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 10));
  const [positions, setPositions] = useState<[number, number, number]>([0, 0, 0]);
  const [feedback, setFeedback] = useState<{ player: PlayerId; correct: boolean } | null>(null);
  const [finishers, setFinishers] = useState<Ranking>([]);
  const [ranking, setRanking] = useState<Ranking>([1, 2, 3]);
  const [time, setTime] = useState(20);
  const positionsRef = useRef(positions);
  const finishersRef = useRef(finishers);
  const finishedRef = useRef(false);

  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { finishersRef.current = finishers; }, [finishers]);

  const finish = useCallback((ordered?: Ranking) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const finalRanking = ordered ?? [...PLAYERS].sort(
      (a, b) => positionsRef.current[b - 1] - positionsRef.current[a - 1],
    );
    setRanking(finalRanking);
    sound.stopBgm();
    sound.play("champion");
    setPhase("result");
    onResult(finalRanking);
  }, [onResult]);

  const startPlaying = useCallback(() => {
    sound.startBgm("race");
    setPhase("playing");
  }, []);
  const count = useCountdown(phase === "ready", startPlaying);

  const pressNumber = useCallback((value: number) => {
    if (phase !== "playing") return;
    const player = NUMBER_KEYS[String(value)];
    if (!player || finishersRef.current.includes(player)) return;
    const correct = value === target;
    setFeedback({ player, correct });
    sound.play(correct ? "correct" : "miss");
    window.setTimeout(() => setFeedback(null), 350);
    setPositions((current) => {
      const next = [...current] as [number, number, number];
      next[player - 1] = Math.max(0, Math.min(100, next[player - 1] + (correct ? 14 : -4)));
      positionsRef.current = next;
      if (next[player - 1] >= 100 && !finishersRef.current.includes(player)) {
        const nextFinishers = [...finishersRef.current, player] as Ranking;
        finishersRef.current = nextFinishers;
        setFinishers(nextFinishers);
        if (nextFinishers.length === 3) window.setTimeout(() => finish(nextFinishers), 250);
      }
      return next;
    });
  }, [finish, phase, target]);

  useKeyPressMap(phase === "playing", NUMBER_KEYS, (player, key) => {
    pressNumber(Number(key));
  });

  useEffect(() => {
    if (phase !== "playing") return;
    const numberTimer = window.setInterval(
      () => setTarget((current) => {
        let next = Math.floor(Math.random() * 10);
        while (next === current) next = Math.floor(Math.random() * 10);
        return next;
      }),
      700,
    );
    const gameTimer = window.setInterval(() => {
      setTime((value) => {
        if (value <= 1) {
          window.setTimeout(() => finish(), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(numberTimer);
      window.clearInterval(gameTimer);
    };
  }, [finish, phase]);

  if (phase === "ready") return <CountdownScreen sport="race" count={count} onHome={onHome} />;
  if (phase === "result") {
    const details = Object.fromEntries(
      PLAYERS.map((player) => [player, `${Math.round(positions[player - 1])}% 도착`]),
    ) as Record<PlayerId, string>;
    return <PodiumResult title="NUMBER DASH" ranking={ranking} detail={details} onNext={onNext} onHome={onHome} />;
  }

  return (
    <section className="screen race-game">
      <ScreenHeader number="02" title="NUMBER DASH" right={<div className="header-timer">{time}s</div>} onHome={onHome} />
      <div className="number-command">
        <small>FIND THIS NUMBER</small>
        <strong key={target}>{target}</strong>
        <span>{feedback ? `P${feedback.player} ${feedback.correct ? "ㅋ 맞았지?" : "ㅋㅋ 그게 아니야"}` : roastLine(target)}</span>
      </div>
      <div className="race-track">
        {PLAYERS.map((player) => {
          const progress = positions[player - 1];
          const leader = Math.max(...positions);
          const place = finishers.indexOf(player);
          return (
          <div className="race-lane" key={player}>
            <PlayerBadge player={player} compact />
            <div className="lane-road">
              <div className="lane-dashes" />
              <div className="finish-line">FINISH</div>
              <div
                className={`race-runner player-color-${PLAYER_COLORS[player - 1]}`}
                style={{ "--progress": `${progress}%` } as React.CSSProperties}
              >
                <PartyFace
                  player={player}
                  mood={raceMood(progress, progress === leader && progress > 0, place >= 0 ? place + 1 : undefined)}
                  size={46}
                />
              </div>
            </div>
            <div className="race-progress">{Math.round(progress)}%</div>
          </div>
          );
        })}
      </div>
      <div className="number-controls">
        {PLAYERS.map((player) => (
          <div key={player}>
            <span>P{player}</span>
            {Object.entries(NUMBER_KEYS).filter(([, owner]) => owner === player).map(([key]) => (
              <button type="button" key={key} onClick={() => pressNumber(Number(key))}>{key}</button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function BalanceGame({ onResult, onNext, onHome }: GameProps) {
  const [phase, setPhase] = useState<"ready" | "playing" | "result">("ready");
  const [balances, setBalances] = useState<[number, number, number]>([0, 0, 0]);
  const [alive, setAlive] = useState<[boolean, boolean, boolean]>([true, true, true]);
  const [survival, setSurvival] = useState<[number, number, number]>([0, 0, 0]);
  const [ranking, setRanking] = useState<Ranking>([1, 2, 3]);
  const [elapsed, setElapsed] = useState(0);
  const aliveRef = useRef(alive);
  const balanceRef = useRef(balances);
  const survivalRef = useRef(survival);
  const finishedRef = useRef(false);
  useEffect(() => { aliveRef.current = alive; }, [alive]);
  useEffect(() => { balanceRef.current = balances; }, [balances]);
  useEffect(() => { survivalRef.current = survival; }, [survival]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const finalRanking = [...PLAYERS].sort((a, b) => {
      if (aliveRef.current[a - 1] !== aliveRef.current[b - 1]) return aliveRef.current[a - 1] ? -1 : 1;
      if (survivalRef.current[a - 1] !== survivalRef.current[b - 1]) {
        return survivalRef.current[b - 1] - survivalRef.current[a - 1];
      }
      return Math.abs(balanceRef.current[a - 1]) - Math.abs(balanceRef.current[b - 1]);
    });
    setRanking(finalRanking);
    sound.stopBgm();
    sound.play("champion");
    setPhase("result");
    onResult(finalRanking);
  }, [onResult]);

  const startPlaying = useCallback(() => {
    sound.startBgm("balance");
    setPhase("playing");
  }, []);
  const count = useCountdown(phase === "ready", startPlaying);

  const correct = useCallback((player: PlayerId, direction: -1 | 1) => {
    if (phase !== "playing" || !aliveRef.current[player - 1]) return;
    setBalances((current) => {
      const next = [...current] as [number, number, number];
      next[player - 1] = Math.max(-99, Math.min(99, next[player - 1] + direction * 17));
      balanceRef.current = next;
      return next;
    });
  }, [phase]);

  useKeyPressMap(phase === "playing", BALANCE_KEYS, (control) => {
    correct(control.player, control.direction);
  });

  useEffect(() => {
    if (phase !== "playing") return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const seconds = (Date.now() - started) / 1000;
      setElapsed(seconds);
      setSurvival((current) => {
        const next = current.map((value, index) => aliveRef.current[index] ? seconds : value) as [number, number, number];
        survivalRef.current = next;
        return next;
      });
      setBalances((current) => {
        const intensity = 5 + seconds * 0.5;
        const next = current.map((value, index) => {
          if (!aliveRef.current[index]) return value;
          const bias = value === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(value);
          return value + bias * (Math.random() * intensity) + (Math.random() - 0.5) * 5;
        }) as [number, number, number];
        const nextAlive = [...aliveRef.current] as [boolean, boolean, boolean];
        next.forEach((value, index) => {
          if (Math.abs(value) >= 78 && Math.abs(value) < 100) sound.play("danger");
          if (Math.abs(value) >= 100 && nextAlive[index]) {
            nextAlive[index] = false;
            sound.play("fall");
          }
        });
        aliveRef.current = nextAlive;
        balanceRef.current = next;
        setAlive(nextAlive);
        if (nextAlive.filter(Boolean).length <= 1 || seconds >= 30) window.setTimeout(finish, 0);
        return next;
      });
    }, 180);
    return () => window.clearInterval(timer);
  }, [finish, phase]);

  if (phase === "ready") return <CountdownScreen sport="balance" count={count} onHome={onHome} />;
  if (phase === "result") {
    const details = Object.fromEntries(
      PLAYERS.map((player) => [player, `${survival[player - 1].toFixed(1)}초 생존`]),
    ) as Record<PlayerId, string>;
    return <PodiumResult title="TIGHTROPE" ranking={ranking} detail={details} onNext={onNext} onHome={onHome} />;
  }

  return (
    <section className={`screen balance-game ${balances.some((value) => Math.abs(value) > 78) ? "danger-mode" : ""}`}>
      <ScreenHeader number="03" title="TIGHTROPE" right={<div className="header-timer">{elapsed.toFixed(1)}s</div>} onHome={onHome} />
      <div className="balance-alert">{balances.some((value) => Math.abs(value) > 70) ? "곧 떨어진다ㅋㅋ" : "KEEP IT CENTERED!"}</div>
      <div className="tightrope-stage">
        {PLAYERS.map((player) => {
          const value = balances[player - 1];
          const isAlive = alive[player - 1];
          return (
            <div className={`rope-player ${!isAlive ? "eliminated" : ""}`} key={player}>
              <PlayerBadge player={player} compact />
              <div className="walker-space">
                <div
                  className={`walker walker-face player-color-${PLAYER_COLORS[player - 1]} mood-tilt-${Math.abs(value) >= 92 ? "wild" : Math.abs(value) > 70 ? "panic" : "ok"}`}
                  style={{ "--tilt": `${Math.max(-38, Math.min(38, value * 0.38))}deg` } as React.CSSProperties}
                >
                  <i />
                  <PartyFace player={player} mood={balanceMood(value, isAlive)} size={58} />
                  <b />
                </div>
                <div className="rope-line" />
                {!isAlive && <div className="out-stamp">OUT</div>}
              </div>
              <div className="balance-gauge">
                <div className="gauge-danger left">DANGER</div>
                <div className="gauge-safe">SAFE</div>
                <div className="gauge-danger right">DANGER</div>
                <i style={{ "--balance": `${(value + 100) / 2}%` } as React.CSSProperties} />
              </div>
              <div className="balance-value">BALANCE <strong>{Math.max(0, 100 - Math.abs(Math.round(value)))}</strong></div>
              <div className="balance-buttons">
                <button type="button" onClick={() => correct(player, -1)}>←</button>
                <button type="button" onClick={() => correct(player, 1)}>→</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type Category = "과일" | "채소" | "패스트푸드";
type Food = { name: string; image: string; category: Category };
const FOODS: Food[] = [
  { name: "사과", image: "🍎", category: "과일" },
  { name: "바나나", image: "🍌", category: "과일" },
  { name: "포도", image: "🍇", category: "과일" },
  { name: "당근", image: "🥕", category: "채소" },
  { name: "브로콜리", image: "🥦", category: "채소" },
  { name: "옥수수", image: "🌽", category: "채소" },
  { name: "햄버거", image: "🍔", category: "패스트푸드" },
  { name: "피자", image: "🍕", category: "패스트푸드" },
  { name: "감자튀김", image: "🍟", category: "패스트푸드" },
];

export function FoodGame({ onResult, onNext, onHome }: GameProps) {
  const foodDuration = 20;
  const [phase, setPhase] = useState<"ready" | "playing" | "result">("ready");
  const [target] = useState<Category>(() => (["과일", "채소", "패스트푸드"] as Category[])[Math.floor(Math.random() * 3)]);
  const [foodIndex, setFoodIndex] = useState(0);
  const [scores, setScores] = useState<[number, number, number]>([0, 0, 0]);
  const [time, setTime] = useState(foodDuration);
  const [feedback, setFeedback] = useState<Record<number, "correct" | "wrong">>({});
  const [ranking, setRanking] = useState<Ranking>([1, 2, 3]);
  const buzzed = useRef(new Set<PlayerId>());
  const scoresRef = useRef(scores);
  const finishedRef = useRef(false);
  useEffect(() => { scoresRef.current = scores; }, [scores]);
  const food = FOODS[foodIndex];

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const finalRanking = [...PLAYERS].sort((a, b) => scoresRef.current[b - 1] - scoresRef.current[a - 1]);
    setRanking(finalRanking);
    sound.stopBgm();
    sound.play("champion");
    setPhase("result");
    onResult(finalRanking);
  }, [onResult]);
  const startPlaying = useCallback(() => {
    sound.startBgm("food");
    setPhase("playing");
  }, []);
  const count = useCountdown(phase === "ready", startPlaying);

  const buzz = useCallback((player: PlayerId) => {
    if (phase !== "playing" || buzzed.current.has(player)) return;
    buzzed.current.add(player);
    const correct = food.category === target;
    setScores((current) => {
      const next = [...current] as [number, number, number];
      next[player - 1] += correct ? 1 : -1;
      scoresRef.current = next;
      return next;
    });
    setFeedback((current) => ({ ...current, [player]: correct ? "correct" : "wrong" }));
    sound.play(correct ? "correct" : "miss");
  }, [food.category, phase, target]);

  useKeyPressMap(phase === "playing", FOOD_KEYS, (player) => {
    buzz(player);
  });

  useEffect(() => {
    if (phase !== "playing") return;
    const foodTimer = window.setInterval(() => {
      setFoodIndex((current) => {
        let next = Math.floor(Math.random() * FOODS.length);
        while (next === current) next = Math.floor(Math.random() * FOODS.length);
        return next;
      });
      buzzed.current.clear();
      setFeedback({});
    }, 1200);
    const gameTimer = window.setInterval(() => {
      setTime((value) => {
        if (value <= 1) {
          window.setTimeout(finish, 0);
          return 0;
        }
        if (value <= 6) sound.play("danger");
        return value - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(foodTimer);
      window.clearInterval(gameTimer);
    };
  }, [finish, phase]);

  if (phase === "ready") return <CountdownScreen sport="food" count={count} onHome={onHome} />;
  if (phase === "result") {
    const details = Object.fromEntries(
      PLAYERS.map((player) => [player, `${scores[player - 1]}점`]),
    ) as Record<PlayerId, string>;
    return <PodiumResult title="FOOD SORT" ranking={ranking} detail={details} nextLabel="결과 보기" onNext={onNext} onHome={onHome} />;
  }

  return (
    <section className="screen food-game">
      <ScreenHeader number="04" title="FOOD SORT" right={<div className={`food-timer ${time <= 5 ? "food-timer-urgent" : ""}`}><small>TIME LEFT</small><strong>{time}</strong><span>SEC</span></div>} onHome={onHome} />
      <div className="target-category"><small>TARGET CATEGORY</small><strong>{target}{target === "과일" ? "이" : "가"} 나오면 누르세요!</strong></div>
      <div className="food-playfield">
        <div className="food-image-slot" data-image-slot="food-image">
          <small>FOOD IMAGE</small>
          <div key={food.name}>{food.image}</div>
          <strong>{food.name}</strong>
        </div>
        <div className="food-player-scores">
          {PLAYERS.map((player) => (
            <div className={`food-score-card player-color-${PLAYER_COLORS[player - 1]} ${feedback[player] ?? ""}`} key={player}>
              <PlayerBadge player={player} compact />
              <PartyFace player={player} mood={feedback[player] === "correct" ? "win" : feedback[player] === "wrong" ? "lose" : "smirk"} size={44} />
              <strong>{scores[player - 1]}</strong><span>POINTS</span>
              <button type="button" onClick={() => buzz(player)}>
                {feedback[player] === "correct" ? "+1 맞췄네ㅋㅋ" : feedback[player] === "wrong" ? "-1 왜 눌렀어ㅋㅋ" : `BUZZ · ${["A", "J", "L"][player - 1]}`}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="category-legend"><span>과일</span><span>채소</span><span>패스트푸드</span></div>
    </section>
  );
}

export function OlympicFinal({
  results,
  onHome,
  onReset,
}: {
  results: ResultsMap;
  onHome: () => void;
  onReset: () => void;
}) {
  const points = useMemo(() => {
    const totals: Record<PlayerId, number> = { 1: 0, 2: 0, 3: 0 };
    (Object.keys(results) as NewSport[]).forEach((sport) => {
      results[sport]?.forEach((player, index) => { totals[player] += 3 - index; });
    });
    return totals;
  }, [results]);
  const finalRanking = [...PLAYERS].sort((a, b) => points[b] - points[a]);
  const coffeePlayer = finalRanking[finalRanking.length - 1];
  const gameLabels: Record<NewSport, string> = {
    loud: "데시벨",
    race: "빨리 가기",
    balance: "오래 걷기",
    food: "음식 분류",
  };
  const scoreFor = (sport: NewSport, player: PlayerId) => {
    const place = results[sport]?.indexOf(player);
    return place === undefined || place < 0 ? "—" : `${3 - place}점`;
  };
  return (
    <section className="screen olympic-final">
      <ScreenHeader number="FINAL" title="TOTAL RANKING" onHome={onHome} />
      <div className="final-title-row">
        <div><small>ALL GAMES COMPLETE</small><div className="display-title">최종 순위</div></div>
        <div className="champion-chip">CHAMPION · PLAYER {finalRanking[0]}</div>
      </div>
      <div className="total-table">
        <div className="table-row table-head">
          <span>RANK</span><span>PLAYER</span>
          {(Object.keys(gameLabels) as NewSport[]).map((game) => <span key={game}>{gameLabels[game]}</span>)}
          <span>TOTAL</span>
        </div>
        {finalRanking.map((player, index) => (
          <div className={`table-row table-player player-color-${PLAYER_COLORS[player - 1]}`} key={player}>
            <span><b>{index + 1}</b>위</span>
            <span><PlayerBadge player={player} compact /></span>
            {(Object.keys(gameLabels) as NewSport[]).map((game) => <span key={game}>{scoreFor(game, player)}</span>)}
            <span><strong>{points[player]}</strong>점</span>
          </div>
        ))}
      </div>
      <div className="coffee-result">
        <div className="coffee-cup"><i /><span /></div>
        <div><small>THE SPECIAL HONOR GOES TO...</small><strong>PLAYER {coffeePlayer}</strong><p>오늘의 커피 담당</p></div>
      </div>
      <div className="final-menu-actions">
        <ArcadeButton onClick={onHome} variant="light">메인 메뉴</ArcadeButton>
        <ArcadeButton onClick={onReset}>처음부터 다시 <b>↻</b></ArcadeButton>
      </div>
    </section>
  );
}
