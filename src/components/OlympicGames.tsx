import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type NewSport = "race" | "balance" | "food";
export type PlayerId = 1 | 2 | 3;
export type Ranking = PlayerId[];

type ResultsMap = Partial<Record<NewSport, Ranking>>;
type GameProps = {
  onResult: (ranking: Ranking) => void;
  onNext: () => void;
};

const PLAYERS: PlayerId[] = [1, 2, 3];
const SPORT_META: Record<
  NewSport,
  { number: string; title: string; english: string; description: string; controls: string }
> = {
  race: {
    number: "02",
    title: "빨리 가기",
    english: "NUMBER DASH",
    description: "화면의 숫자를 누구보다 빠르게 찾아 캐릭터를 결승선까지 보내세요.",
    controls: "P1 · 1 2 3  /  P2 · 4 5 6  /  P3 · 7 8 9 0",
  },
  balance: {
    number: "03",
    title: "오래 걷기",
    english: "TIGHTROPE",
    description: "좌우 버튼으로 흔들림을 바로잡고 외줄 위에서 마지막까지 살아남으세요.",
    controls: "P1 · A D  /  P2 · J L  /  P3 · ← →",
  },
  food: {
    number: "04",
    title: "음식 분류",
    english: "FOOD SORT",
    description: "목표 카테고리의 음식이 나타나는 순간 버튼을 누르세요. 오답은 감점입니다.",
    controls: "P1 · A  /  P2 · J  /  P3 · L",
  },
};

const PLAYER_COLORS = ["coral", "blue", "green"] as const;

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
}: {
  number: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="olympic-header">
      <div className="olympic-brand"><span>R</span> RASPBERRY OLYMPICS</div>
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
  onNext,
}: {
  title: string;
  ranking: Ranking;
  detail?: Record<PlayerId, string>;
  onNext: () => void;
}) {
  return (
    <section className="screen olympic-result-screen">
      <div className="result-topline">GAME COMPLETE</div>
      <div className="display-title">경기 결과</div>
      <div className="result-subtitle">{title}</div>
      <div className="podium">
        {[ranking[1], ranking[0], ranking[2]].map((player, index) => {
          const place = index === 1 ? 1 : index === 0 ? 2 : 3;
          return (
            <div className={`podium-place podium-${place}`} key={player}>
              <div className="podium-medal">{place}</div>
              <div className={`podium-avatar player-color-${PLAYER_COLORS[player - 1]}`}>P{player}</div>
              <strong>PLAYER {player}</strong>
              {detail && <small>{detail[player]}</small>}
              <div className="podium-block"><span>{place}위</span><b>+{4 - place}점</b></div>
            </div>
          );
        })}
      </div>
      <ArcadeButton onClick={onNext}>다음 종목 <b>›</b></ArcadeButton>
    </section>
  );
}

export function OlympicMenu({
  results,
  onSelect,
  onFinal,
}: {
  results: ResultsMap;
  onSelect: (sport: NewSport | "loud") => void;
  onFinal: () => void;
}) {
  const complete = Object.keys(results).length;
  const cards: Array<{
    id: NewSport | "loud";
    number: string;
    title: string;
    english: string;
    icon: string;
  }> = [
    { id: "loud", number: "01", title: "LOUD CHALLENGE", english: "데시벨 맞히기", icon: "MIC" },
    { id: "race", number: "02", title: "빨리 가기", english: "NUMBER DASH", icon: "123" },
    { id: "balance", number: "03", title: "오래 걷기", english: "TIGHTROPE", icon: "BAL" },
    { id: "food", number: "04", title: "음식 분류", english: "FOOD SORT", icon: "FOOD" },
  ];
  return (
    <section className="screen olympic-menu">
      <div className="menu-stripe" />
      <div className="menu-heading">
        <div className="olympic-kicker">4 GAMES · 3 PLAYERS · 1 COFFEE RUNNER</div>
        <div className="olympic-title"><span>RASPBERRY</span> OLYMPICS</div>
        <p>라즈베리 올림픽 · 오늘의 챔피언을 가려라!</p>
      </div>
      <div className="sport-card-grid">
        {cards.map((card) => {
          const done = card.id !== "loud" && Boolean(results[card.id]);
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
        <span>GPIO / KEYBOARD CONTROL READY</span>
        <ArcadeButton onClick={onFinal} disabled={complete < 3} variant="yellow">
          FINAL RESULT · {complete}/3
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
      <ScreenHeader number={meta.number} title={meta.english} />
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

function CountdownScreen({ sport, count }: { sport: NewSport; count: number }) {
  const meta = SPORT_META[sport];
  return (
    <section className={`screen olympic-ready ready-${sport}`}>
      <ScreenHeader number={meta.number} title={meta.english} />
      <div className="ready-label">GET READY</div>
      <div className="olympic-countdown" key={count}>{count}</div>
      <div className="ready-title">{meta.title}</div>
      <p>{meta.controls}</p>
    </section>
  );
}

function useCountdown(active: boolean, onGo: () => void) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      if (count > 1) setCount((value) => value - 1);
      else onGo();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [active, count, onGo]);
  return count;
}

const NUMBER_KEYS: Record<string, PlayerId> = {
  "1": 1, "2": 1, "3": 1,
  "4": 2, "5": 2, "6": 2,
  "7": 3, "8": 3, "9": 3, "0": 3,
};

export function RaceGame({ onResult, onNext }: GameProps) {
  const [phase, setPhase] = useState<"ready" | "playing" | "result">("ready");
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 10));
  const [positions, setPositions] = useState<[number, number, number]>([0, 0, 0]);
  const [feedback, setFeedback] = useState<{ player: PlayerId; correct: boolean } | null>(null);
  const [finishers, setFinishers] = useState<Ranking>([]);
  const [ranking, setRanking] = useState<Ranking>([1, 2, 3]);
  const [time, setTime] = useState(35);
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
    setPhase("result");
    onResult(finalRanking);
  }, [onResult]);

  const startPlaying = useCallback(() => setPhase("playing"), []);
  const count = useCountdown(phase === "ready", startPlaying);

  const pressNumber = useCallback((value: number) => {
    if (phase !== "playing") return;
    const player = NUMBER_KEYS[String(value)];
    if (!player || finishersRef.current.includes(player)) return;
    const correct = value === target;
    setFeedback({ player, correct });
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

  useEffect(() => {
    if (phase !== "playing") return;
    const keydown = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) pressNumber(Number(event.key));
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [phase, pressNumber]);

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

  if (phase === "ready") return <CountdownScreen sport="race" count={count} />;
  if (phase === "result") {
    const details = Object.fromEntries(
      PLAYERS.map((player) => [player, `${Math.round(positions[player - 1])}% 도착`]),
    ) as Record<PlayerId, string>;
    return <PodiumResult title="NUMBER DASH" ranking={ranking} detail={details} onNext={onNext} />;
  }

  return (
    <section className="screen race-game">
      <ScreenHeader number="02" title="NUMBER DASH" right={<div className="header-timer">{time}s</div>} />
      <div className="number-command">
        <small>FIND THIS NUMBER</small>
        <strong key={target}>{target}</strong>
        <span>{feedback ? `P${feedback.player} ${feedback.correct ? "CORRECT!" : "MISS!"}` : "PRESS YOUR MATCHING BUTTON"}</span>
      </div>
      <div className="race-track">
        {PLAYERS.map((player) => (
          <div className="race-lane" key={player}>
            <PlayerBadge player={player} compact />
            <div className="lane-road">
              <div className="lane-dashes" />
              <div className="finish-line">FINISH</div>
              <div
                className={`race-runner player-color-${PLAYER_COLORS[player - 1]}`}
                style={{ "--progress": `${positions[player - 1]}%` } as React.CSSProperties}
              >
                <span>{finishers.indexOf(player) >= 0 ? `${finishers.indexOf(player) + 1}위` : `P${player}`}</span>
              </div>
            </div>
            <div className="race-progress">{Math.round(positions[player - 1])}%</div>
          </div>
        ))}
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

const BALANCE_KEYS: Record<string, { player: PlayerId; direction: -1 | 1 }> = {
  a: { player: 1, direction: -1 }, d: { player: 1, direction: 1 },
  j: { player: 2, direction: -1 }, l: { player: 2, direction: 1 },
  arrowleft: { player: 3, direction: -1 }, arrowright: { player: 3, direction: 1 },
};

export function BalanceGame({ onResult, onNext }: GameProps) {
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
    setPhase("result");
    onResult(finalRanking);
  }, [onResult]);

  const startPlaying = useCallback(() => setPhase("playing"), []);
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

  useEffect(() => {
    if (phase !== "playing") return;
    const keydown = (event: KeyboardEvent) => {
      const control = BALANCE_KEYS[event.key.toLowerCase()];
      if (control) {
        event.preventDefault();
        correct(control.player, control.direction);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [correct, phase]);

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
          if (Math.abs(value) >= 100) nextAlive[index] = false;
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

  if (phase === "ready") return <CountdownScreen sport="balance" count={count} />;
  if (phase === "result") {
    const details = Object.fromEntries(
      PLAYERS.map((player) => [player, `${survival[player - 1].toFixed(1)}초 생존`]),
    ) as Record<PlayerId, string>;
    return <PodiumResult title="TIGHTROPE" ranking={ranking} detail={details} onNext={onNext} />;
  }

  return (
    <section className={`screen balance-game ${balances.some((value) => Math.abs(value) > 78) ? "danger-mode" : ""}`}>
      <ScreenHeader number="03" title="TIGHTROPE" right={<div className="header-timer">{elapsed.toFixed(1)}s</div>} />
      <div className="balance-alert">KEEP IT CENTERED!</div>
      <div className="tightrope-stage">
        {PLAYERS.map((player) => {
          const value = balances[player - 1];
          const isAlive = alive[player - 1];
          return (
            <div className={`rope-player ${!isAlive ? "eliminated" : ""}`} key={player}>
              <PlayerBadge player={player} compact />
              <div className="walker-space">
                <div
                  className={`walker player-color-${PLAYER_COLORS[player - 1]}`}
                  style={{ "--tilt": `${Math.max(-38, Math.min(38, value * 0.38))}deg` } as React.CSSProperties}
                >
                  <i /><span>P{player}</span><b />
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

export function FoodGame({ onResult, onNext }: GameProps) {
  const [phase, setPhase] = useState<"ready" | "playing" | "result">("ready");
  const [target] = useState<Category>(() => (["과일", "채소", "패스트푸드"] as Category[])[Math.floor(Math.random() * 3)]);
  const [foodIndex, setFoodIndex] = useState(0);
  const [scores, setScores] = useState<[number, number, number]>([0, 0, 0]);
  const [time, setTime] = useState(40);
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
    setPhase("result");
    onResult(finalRanking);
  }, [onResult]);
  const startPlaying = useCallback(() => setPhase("playing"), []);
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
  }, [food.category, phase, target]);

  useEffect(() => {
    if (phase !== "playing") return;
    const keydown = (event: KeyboardEvent) => {
      const player = ({ a: 1, j: 2, l: 3 } as Record<string, PlayerId>)[event.key.toLowerCase()];
      if (player) buzz(player);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [buzz, phase]);

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
        return value - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(foodTimer);
      window.clearInterval(gameTimer);
    };
  }, [finish, phase]);

  if (phase === "ready") return <CountdownScreen sport="food" count={count} />;
  if (phase === "result") {
    const details = Object.fromEntries(
      PLAYERS.map((player) => [player, `${scores[player - 1]}점`]),
    ) as Record<PlayerId, string>;
    return <PodiumResult title="FOOD SORT" ranking={ranking} detail={details} onNext={onNext} />;
  }

  return (
    <section className="screen food-game">
      <ScreenHeader number="04" title="FOOD SORT" right={<div className="food-timer"><small>TIME LEFT</small><strong>{time}</strong><span>SEC</span></div>} />
      <div className="target-category"><small>TARGET CATEGORY</small><strong>{target}이 나오면 누르세요!</strong></div>
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
              <strong>{scores[player - 1]}</strong><span>POINTS</span>
              <button type="button" onClick={() => buzz(player)}>
                {feedback[player] === "correct" ? "+1 CORRECT" : feedback[player] === "wrong" ? "-1 WRONG" : `BUZZ · ${["A", "J", "L"][player - 1]}`}
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
  const gameLabels: Record<NewSport, string> = { race: "빨리 가기", balance: "오래 걷기", food: "음식 분류" };
  const scoreFor = (sport: NewSport, player: PlayerId) => {
    const place = results[sport]?.indexOf(player);
    return place === undefined || place < 0 ? "—" : `${3 - place}점`;
  };
  return (
    <section className="screen olympic-final">
      <ScreenHeader number="FINAL" title="TOTAL RANKING" />
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
