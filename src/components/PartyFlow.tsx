import { useCallback, useEffect, useRef, useState } from "react";
import PartyFace from "./PartyFace";
import { sound } from "../game/sound";
import { useAudioMeter } from "../hooks/useAudioMeter";

type GameId = "loud" | "walk" | "food";
type Screen = "home" | "rules" | "roulette" | "game-intro" | "player-count" | "nickname" | "tutorial" | "countdown" | "playing" | "player-result" | "final";
type PlayerResult = { name: string; score?: number; decibels?: number };
type GameInfo = {
  name: string;
  english: string;
  icon: string;
  goal: string;
  controls: string;
  scoring: string;
  how: string;
  caution: string;
  tutorial: string[];
};

const GAMES: Record<GameId, GameInfo> = {
  loud: {
    name: "데시벨 맞히기", english: "LOUD CHALLENGE", icon: "🎤",
    goal: "게임이 끝난 뒤 공개되는 목표 데시벨에 가장 가까우면 이겨요.",
    controls: "마이크에 소리 내기. 마이크가 없으면 화면의 소리 버튼을 길게 누르세요.",
    scoring: "내 차례에 5초 동안 소리를 재요. 목표와 차이가 작을수록 유리해요.", how: "모든 참가자의 측정이 끝나면 목표 데시벨과 각자의 기록을 비교해요.",
    caution: "마이크가 연결되지 않아도 소리 버튼으로 참여할 수 있어요.",
    tutorial: ["내 차례가 오면 5초 동안 소리를 내세요.", "마이크가 안 되면 화면의 소리 버튼을 꾹 누르세요.", "모든 차례가 끝난 뒤 목표에 가장 가까운 사람이 승리해요."],
  },
  walk: {
    name: "오래 걷기", english: "TIGHTROPE SURVIVAL", icon: "🚶",
    goal: "넘어지지 않고 가장 오래 버티면 이겨요.",
    controls: "화면의 왼쪽·오른쪽 버튼을 누르세요. 키보드는 A / D예요.", scoring: "버틴 1초마다 5점. 넘어지면 게임이 끝나요.",
    how: "캐릭터가 기우는 쪽의 반대 버튼을 눌러 중심을 잡아요. 5초마다 속도가 빨라져요.", caution: "제한 시간은 없어요. 균형을 잃으면 바로 종료돼요.",
    tutorial: ["캐릭터가 왼쪽이나 오른쪽으로 기울어요.", "넘어지는 쪽 반대 버튼을 눌러 중심을 잡으세요.", "오래 버티세요. 5초마다 더 빨라져요."],
  },
  food: {
    name: "음식 분류", english: "FOOD BUZZER", icon: "🍎",
    goal: "화면 위 목표 종류에 맞는 음식만 골라 점수를 얻으세요.",
    controls: "맞는 음식이 나오면 BUZZER 버튼을 누르세요. 키보드는 스페이스바예요.", scoring: "맞히면 +5점, 잘못 누르면 -1점이에요.",
    how: "위에 표시된 목표 종류를 확인하고, 15초 동안 맞는 음식이 나올 때마다 버저를 눌러요.", caution: "음식 하나마다 한 번만 누를 수 있어요. 다음 음식이 나오면 다시 누르세요.",
    tutorial: ["화면 위에 나온 목표 종류를 확인하세요.", "목표에 맞는 음식이 나오면 버저를 누르세요.", "15초 동안 많이 맞힐수록 높은 점수를 얻어요."],
  },
};
const GAME_IDS: GameId[] = ["loud", "walk", "food"];
const PLAYER_EMOJIS = ["🐻", "🐱", "🐼", "🐸", "🦊", "🐰", "🐯", "🐵", "🐧", "🐨", "🦁", "🐙"];
const FOOD_ITEMS = [
  { name: "사과", image: "🍎", category: "과일" }, { name: "바나나", image: "🍌", category: "과일" },
  { name: "당근", image: "🥕", category: "채소" }, { name: "브로콜리", image: "🥦", category: "채소" },
  { name: "햄버거", image: "🍔", category: "패스트푸드" }, { name: "피자", image: "🍕", category: "패스트푸드" },
  { name: "포도", image: "🍇", category: "과일" }, { name: "옥수수", image: "🌽", category: "채소" },
  { name: "감자튀김", image: "🍟", category: "패스트푸드" },
  { name: "라면", image: "🍜", category: "패스트푸드" }, { name: "치킨", image: "🍗", category: "패스트푸드" },
  { name: "토마토", image: "🍅", category: "채소" }, { name: "감자", image: "🥔", category: "채소" },
  { name: "복숭아", image: "🍑", category: "과일" }, { name: "딸기", image: "🍓", category: "과일" },
];
const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export default function PartyFlow() {
  const [screen, setScreen] = useState<Screen>("home");
  const [countdown, setCountdown] = useState(3);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [nameIndex, setNameIndex] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [game, setGame] = useState<GameId>("loud");
  const [loudTarget, setLoudTarget] = useState<number | null>(null);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [rouletteWinner, setRouletteWinner] = useState<GameId | null>(null);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [targetRevealCount, setTargetRevealCount] = useState(0);
  const [targetRevealed, setTargetRevealed] = useState(false);
  const [targetRevealVisible, setTargetRevealVisible] = useState(false);
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [lastResult, setLastResult] = useState<PlayerResult | null>(null);
  const [finalSpotlight, setFinalSpotlight] = useState<"off" | "searching" | "fireworks">("off");
  const spinRef = useRef<number | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (spinRef.current !== null) window.clearInterval(spinRef.current);
    if (spinTimeoutRef.current !== null) window.clearTimeout(spinTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (screen !== "countdown") return;
    sound.play(countdown > 1 ? "countdown" : "go");
    const timer = window.setTimeout(() => {
      if (countdown > 1) setCountdown((value) => value - 1);
      else setScreen("playing");
    }, 800);
    return () => window.clearTimeout(timer);
  }, [countdown, screen]);

  useEffect(() => {
    if (screen !== "final" || game !== "loud" || loudTarget === null) return;
    if (targetRevealCount === 0) {
      if (!targetRevealed) {
        sound.play("reveal");
        setTargetRevealed(true);
      }
      return;
    }
    sound.play("drumroll");
    const timer = window.setTimeout(() => setTargetRevealCount((count) => Math.max(0, count - 1)), 420);
    return () => window.clearTimeout(timer);
  }, [game, loudTarget, screen, targetRevealCount, targetRevealed]);

  useEffect(() => {
    if (screen !== "final" || game !== "loud" || !targetRevealVisible || !targetRevealed) return;
    const timer = window.setTimeout(() => setTargetRevealVisible(false), 2600);
    return () => window.clearTimeout(timer);
  }, [game, screen, targetRevealVisible, targetRevealed]);


  useEffect(() => {
    if (screen !== "final" || (game === "loud" && targetRevealVisible)) return;
    setFinalSpotlight("searching");
    sound.stopBgm();
    sound.play("drumroll");
    const roll = window.setInterval(() => sound.play("drumroll"), 115);
    const reveal = window.setTimeout(() => {
      window.clearInterval(roll);
      setFinalSpotlight("fireworks");
    }, 1900);
    return () => {
      window.clearInterval(roll);
      window.clearTimeout(reveal);
    };
  }, [game, screen, targetRevealVisible]);
  const chooseGame = (selectedGame: GameId) => {
    void sound.unlock();
    setRouletteWinner(null);
    setNames([]);
    setResults([]);
    setPlayerIndex(0);
    setNameIndex(0);
    setEmojis([]);
    setNameInput("");
    setNicknameInput("");
    setGame(selectedGame);
    setLoudTarget(selectedGame === "loud" ? Math.floor(Math.random() * 36) + 65 : null);
    setScreen("game-intro");
  };

  const startRoulette = () => {
    void sound.unlock();
    if (spinRef.current !== null) window.clearInterval(spinRef.current);
    if (spinTimeoutRef.current !== null) window.clearTimeout(spinTimeoutRef.current);
    spinRef.current = null;
    spinTimeoutRef.current = null;
    setRouletteRotation(0);
    setRouletteWinner(null);
    setRouletteSpinning(false);
    setNames([]);
    setResults([]);
    setPlayerIndex(0);
    setNameIndex(0);
    setEmojis([]);
    setNameInput("");
    setNicknameInput("");
    setLoudTarget(null);
    setScreen("roulette");
  };

  const spinRoulette = () => {
    if (rouletteSpinning) return;
    void sound.unlock();
    setRouletteWinner(null);
    setRouletteSpinning(true);
    const winner = Math.floor(Math.random() * GAME_IDS.length);
    const sectorCenter = 60 + winner * 120;
    const adjustment = ((360 - sectorCenter - rouletteRotation) % 360 + 360) % 360;
    const targetRotation = rouletteRotation + 360 * 6 + adjustment;
    window.requestAnimationFrame(() => setRouletteRotation(targetRotation));
    spinRef.current = window.setInterval(() => {
      sound.play("countdown");
    }, 260);
    spinTimeoutRef.current = window.setTimeout(() => {
      if (spinRef.current !== null) window.clearInterval(spinRef.current);
      spinRef.current = null;
      setRouletteSpinning(false);
      setRouletteWinner(GAME_IDS[winner]);
      sound.play("champion");
      spinTimeoutRef.current = window.setTimeout(() => {
        spinTimeoutRef.current = null;
        chooseGame(GAME_IDS[winner]);
      }, 2400);
    }, 5200);
  };

  const confirmName = () => {
    const nextNames = [...names];
    const nextEmojis = [...emojis];
    nextNames[nameIndex] = nicknameInput.trim() || `PLAYER ${nameIndex + 1}`;
    nextEmojis[nameIndex] = nameInput;
    setNameInput("");
    setNicknameInput("");
    if (nameIndex + 1 < playerCount) {
      setNames(nextNames);
      setEmojis(nextEmojis);
      setNameIndex((current) => current + 1);
      return;
    }
    setNames(nextNames);
    setEmojis(nextEmojis);
    setPlayerIndex(0);
    setCountdown(3);
    setScreen("countdown");
  };

  const finishPlayer = useCallback((score: number) => {
    const result: PlayerResult = game === "loud"
      ? { name: names[playerIndex] ?? `PLAYER ${playerIndex + 1}`, decibels: Math.round(score * 10) / 10 }
      : { name: names[playerIndex] ?? `PLAYER ${playerIndex + 1}`, score: Math.round(score) };
    setLastResult(result);
    setResults((current) => [...current, result]);
    if (game !== "loud") {
      sound.play("round-win");
    }
    setScreen("player-result");
  }, [emojis, game, names, playerIndex]);

  const nextPlayer = () => {
    if (playerIndex + 1 >= playerCount) {
      if (game === "loud") {
        setTargetRevealCount(4);
        setTargetRevealed(false);
        setTargetRevealVisible(true);
      }
      setScreen("final");
    }
    else {
      setPlayerIndex((current) => current + 1);
      setScreen("playing");
    }
  };

  const reset = () => {
    setScreen("home");
    setNames([]);
    setEmojis([]);
    setResults([]);
    setPlayerIndex(0);
    setNameIndex(0);
    setNameInput("");
    setNicknameInput("");
    setLoudTarget(null);
  };

  const teaseTitle = (title: HTMLDivElement) => {
    title.classList.remove("title-jiggle", "spotlight-show");
    const home = title.closest<HTMLElement>(".party-home-legacy");
    home?.classList.remove("spotlight-active");
    void title.offsetWidth;
    if (home) void home.offsetWidth;
    title.classList.add("title-jiggle", "spotlight-show");
    home?.classList.add("spotlight-active");
    sound.play("drumroll");
    window.setTimeout(() => {
      sound.play("champion");
      sound.play("applause");
    }, 520);
  };

  const activeName = names[playerIndex] ?? `PLAYER ${playerIndex + 1}`;
  const gameInfo = GAMES[game];
  const rankingMetric = (result: PlayerResult) => game === "loud"
    ? Math.abs((result.decibels ?? 45) - (loudTarget ?? 0))
    : -(result.score ?? 0);
  const sortedResults = [...results].sort((a, b) => rankingMetric(a) - rankingMetric(b));
  const podiumResults = sortedResults.length >= 3
    ? [sortedResults[1], sortedResults[0], ...sortedResults.slice(2)]
    : [...sortedResults].reverse();

  return (
    <main className="app-shell party-flow">
      {screen === "home" && <section className="screen olympic-menu party-home-legacy">
        <div className="menu-stripe" />
        <div className="menu-heading">
          <div className="olympic-title menu-title-interactive" role="button" tabIndex={0} onClick={(event) => teaseTitle(event.currentTarget)} onAnimationEnd={(event) => { if (event.animationName === "home-spotlight-hit") { event.currentTarget.classList.remove("title-jiggle", "spotlight-show"); event.currentTarget.closest(".party-home-legacy")?.classList.remove("spotlight-active"); } }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); teaseTitle(event.currentTarget); } }} aria-label="RASPBERRY OLYMPICS 인터랙션"><span>RASPBERRY</span><br />OLYMPICS</div>
          <button className="arcade-button arcade-button-yellow home-start-button" type="button" onClick={startRoulette}>{"\uAC8C\uC784 \uC2DC\uC791"} <b>▶</b></button>
          <p>돌림판으로 종목을 정하고, 한 명씩 도전해 오늘의 승자를 가려보세요.</p>
        </div>
        <div className="sport-card-grid sport-card-grid-three">
          {GAME_IDS.map((id, index) => <button type="button" className={`sport-card sport-card-0${index + 1}`} key={id} onClick={() => chooseGame(id)}>
            <span className="sport-index">GAME 0{index + 1}</span>
            <span className="sport-icon">{id === "loud" ? "MIC" : id === "walk" ? "BAL" : "FOOD"}</span>
            <strong>{GAMES[id].name}</strong><small>{GAMES[id].english}</small><b>CHOOSE GAME ›</b>
          </button>)}
        </div>
        
      </section>}

      {screen === "rules" && <section className="screen olympic-menu legacy-rules-screen">
        <div className="menu-stripe" />
        <div className="menu-heading"><div className="olympic-kicker">RASPBERRY OLYMPICS · RULE BOOK</div><h1 className="olympic-title"><span>GAME</span><br />GUIDE</h1><p>목표 · 조작 · 점수 · 주의 사항</p></div>
        <div className="sport-card-grid sport-card-grid-three legacy-rules-grid">{GAME_IDS.map((id, index) => {
          const item = GAMES[id];
          return <article className={`sport-card sport-card-0${index + 1} legacy-rule-card`} key={id}>
            <span className="sport-index">GAME 0{index + 1}</span><span className="sport-icon">{id === "loud" ? "MIC" : id === "walk" ? "BAL" : "FOOD"}</span>
            <strong>{item.name}</strong><small>{item.english}</small>
            <div className="legacy-rule-details"><p><b>목표</b>{item.goal}</p><p><b>조작</b>{item.controls}</p><p><b>{id === "loud" ? "승리" : "점수"}</b>{item.scoring}</p><p><b>진행</b>{item.how}</p><p><b>주의</b>{item.caution}</p></div>
          </article>;
        })}</div>
        <div className="menu-footer"><span>3 GAMES · ONE PLAYER AT A TIME</span><button className="arcade-button arcade-button-dark" type="button" onClick={() => setScreen("home")}>메인 메뉴 <b>›</b></button></div>
      </section>}

      {screen === "roulette" && <section className={`screen roulette-full-screen ${rouletteWinner ? "roulette-revealed" : ""} ${rouletteSpinning ? "roulette-spinning" : ""}`}>
        
        <div className={`roulette-draw-title ${rouletteSpinning ? "is-spinning" : ""}`}>
          <span>{rouletteSpinning ? "운명의 게임 선택 중" : "오늘의 랜덤 게임"}</span>
          {rouletteSpinning && <i aria-hidden="true">•••</i>}
        </div>
        <div className="roulette-wheel-frame">
          <div className="wheel-pointer">▼</div>
          <div className="roulette-wheel" style={{ transform: `rotate(${rouletteRotation}deg)` }} aria-label="3종목 돌림판">
            <div className={`roulette-sector-label wheel-sector-loud ${rouletteWinner === "loud" ? "is-winner" : ""}`}><div className="wheel-sector-content"><span>{GAMES.loud.icon}</span><b>{GAMES.loud.name}</b></div></div>
            <div className={`roulette-sector-label wheel-sector-walk ${rouletteWinner === "walk" ? "is-winner" : ""}`}><div className="wheel-sector-content"><span>{GAMES.walk.icon}</span><b>{GAMES.walk.name}</b></div></div>
            <div className={`roulette-sector-label wheel-sector-food ${rouletteWinner === "food" ? "is-winner" : ""}`}><div className="wheel-sector-content"><span>{GAMES.food.icon}</span><b>{GAMES.food.name}</b></div></div>
          </div>
          <button className="roulette-hub" type="button" onClick={spinRoulette} disabled={rouletteSpinning} aria-label={rouletteSpinning ? "돌림판이 돌아가는 중" : "돌림판 돌리기"}><span className={rouletteSpinning ? "is-spinning" : ""}>{rouletteSpinning ? "돌아가는 중" : "눌러서\n돌리기"}</span></button>
        </div>
        {rouletteWinner && <div className="roulette-result-overlay" role="status" aria-live="assertive">
          <div className="roulette-modal-confetti" aria-hidden="true" />
          <article className="roulette-result-modal">
            <div className="roulette-modal-kicker"><span aria-hidden="true">🏆</span> RANDOM GAME</div>
            <div className="roulette-modal-emblem" aria-hidden="true">{GAMES[rouletteWinner].icon}</div>
            <p>오늘의 종목은</p>
            <h2>{GAMES[rouletteWinner].name}</h2>
            <small>GAME 0{GAME_IDS.indexOf(rouletteWinner) + 1} · GET READY!</small>
          </article>
        </div>}
        
      </section>}

      {screen === "game-intro" && <section className={`screen game-explanation-screen explanation-${game}`}>
        <div className="explanation-hills" aria-hidden="true" />
        <article className="game-explanation-board">
          <div className="wood-plaque">게임 방법</div>
          <header className="explanation-game-title"><span>{gameInfo.icon}</span><div><small>GAME 0{GAME_IDS.indexOf(game) + 1} · {gameInfo.english}</small><h1>{gameInfo.name}</h1></div></header>
          <div className="explanation-goal"><span>🎯</span><div><b>목표</b><p>{gameInfo.goal}</p></div></div>
          <div className="explanation-rules">
            <div><span>🕹️</span><b>조작 방법</b><p>{gameInfo.controls}</p></div>
            <div><span>⭐</span><b>{game === "loud" ? "승리 조건" : "점수 계산"}</b><p>{gameInfo.scoring}</p></div>
            <div><span>📋</span><b>진행 방법</b><p>{gameInfo.how}</p></div>
            <div><span>⚠️</span><b>주의할 점</b><p>{gameInfo.caution}</p></div>
          </div>
          <div className="explanation-steps-caption">이렇게 플레이해요</div>
          <div className="explanation-steps">{gameInfo.tutorial.map((step, index) => <div key={step}><b>{index + 1}</b><span>{step}</span></div>)}</div>
          <div className="explanation-actions"><button type="button" className="wood-button wood-button-secondary" onClick={startRoulette}>룰렛 다시 돌리기</button><button type="button" className="wood-button" onClick={() => setScreen("player-count")}>다음 <span>▶</span></button></div>
        </article>
      </section>}

      {screen === "player-count" && <section className={`screen sport-intro intro-player-count intro-${game === "walk" ? "balance" : game}`}>
        <div className="intro-stage"><div className="intro-number">{playerCount}</div><div className="intro-copy">
          <div className="intro-label">PARTY SETUP · {gameInfo.english}</div><h1 className="display-title">몇 명이<br />참가하나요?</h1>
          <p>모든 플레이어가 같은 종목을 한 명씩 플레이합니다.</p>
          <div className="party-count-control"><button type="button" aria-label="참가 인원 감소" onClick={() => setPlayerCount((count) => Math.max(1, count - 1))}>−</button><strong>{playerCount}<small>명</small></strong><button type="button" aria-label="참가 인원 증가" onClick={() => setPlayerCount((count) => Math.min(8, count + 1))}>＋</button></div>
          <div className="intro-actions"><button className="arcade-button arcade-button-light" type="button" onClick={() => setScreen("game-intro")}>뒤로</button><button className="arcade-button arcade-button-dark" type="button" onClick={() => { setNameIndex(0); setNames([]); setEmojis([]); setNameInput(""); setNicknameInput(""); setScreen("nickname"); }}>이모지 선택 <b>›</b></button></div>
        </div></div>
      </section>}

      {screen === "nickname" && <section className={`screen sport-intro intro-nickname intro-${game === "walk" ? "balance" : game}`}>
        <div className="intro-stage"><div className="intro-number">0{nameIndex + 1}</div><div className="intro-copy">
          <div className="intro-label">PLAYER SELECT · {String(nameIndex + 1).padStart(2, "0")} / {String(playerCount).padStart(2, "0")}</div><h1 className="display-title">캐릭터 선택</h1>
          <form className="emoji-select-form" onSubmit={(event) => { event.preventDefault(); confirmName(); }}>
            <div className="emoji-selection-grid" role="group" aria-label="플레이어 이모지 선택">
              {PLAYER_EMOJIS.map((emoji) => {
                const selected = nameInput === emoji;
                const taken = emojis.includes(emoji);
                return <button className="emoji-choice" type="button" key={emoji} disabled={taken} aria-label={`${emoji} ${taken ? "이미 선택됨" : "이모지 선택"}`} aria-pressed={selected} onClick={() => setNameInput(emoji)}>
                  <span className="emoji-character">{emoji}</span><span className="emoji-choice-check" aria-hidden="true">{selected ? "✓" : ""}</span>
                </button>;
              })}
            </div>
            <div className={`character-nameplate${nameInput ? " is-selected" : ""}`} data-port={nameIndex % 4} aria-live="polite">
              <div className="character-nameplate-port">
                <span className="character-nameplate-p">P{nameIndex + 1}</span>
                <span className="character-nameplate-emoji">{nameInput || "❔"}</span>
              </div>
              <label className="character-nameplate-field">
                <span>닉네임 입력</span>
                <input className="emoji-nickname-input" type="text" autoFocus autoComplete="nickname" maxLength={12} value={nicknameInput} onChange={(event) => setNicknameInput(event.target.value)} placeholder={`  PLAYER ${nameIndex + 1}`} />
              </label>
              <span className={`character-nameplate-ready${nameInput ? " is-on" : ""}`}>{nameInput ? "OK" : "WAIT"}</span>
            </div>
            <div className="intro-actions"><button className="arcade-button arcade-button-light" type="button" onClick={() => { setNames([]); setEmojis([]); setNameIndex(0); setNameInput(""); setNicknameInput(""); setScreen("player-count"); }}>뒤로</button><button className="arcade-button arcade-button-dark" type="submit" disabled={!nameInput}>{nameIndex + 1 === playerCount ? "선택 완료 · 시작" : "다음 플레이어"} <b>›</b></button></div>
          </form>
        </div></div>
      </section>}

      {screen === "countdown" && <section className={`screen olympic-ready ready-${game === "walk" ? "balance" : game}`} aria-live="polite">
        <div className="ready-label">GET READY</div>
        <div className="olympic-countdown" key={countdown}>{countdown}</div>
        <div className="ready-title">{gameInfo.name}</div>
        <p>{activeName} 차례</p>
      </section>}

      {screen === "tutorial" && <section className={`screen sport-intro intro-${game === "walk" ? "balance" : game}`}>
        <div className="intro-stage"><div className="intro-number">{playerIndex + 1}</div><div className="intro-copy">
          <div className="intro-label">INPUT ORDER · PLAYER {playerIndex + 1}/{playerCount}</div><h1 className="display-title">{activeName} 차례</h1>
          <div className="intro-english">{gameInfo.english} · HOW TO PLAY</div>
          <ol className="legacy-tutorial-list">{gameInfo.tutorial.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}</ol>
          <div className="control-guide"><small>SCORING</small><strong>{gameInfo.scoring}</strong></div>
          <div className="intro-actions"><button className="arcade-button arcade-button-dark" type="button" onClick={() => { sound.play("go"); setScreen("playing"); }}>준비 완료 <b>›</b></button></div>
        </div></div>
      </section>}

      {screen === "playing" && <SoloGame key={`${game}-${playerIndex}`} game={game} playerName={activeName} playerEmoji={emojis[playerIndex] ?? "🐻"} playerNumber={playerIndex + 1} playerCount={playerCount} loudTarget={loudTarget} onComplete={finishPlayer} />}

      {screen === "player-result" && lastResult && <section className={`screen olympic-result-screen legacy-player-result result-${game === "walk" ? "balance" : game}`}>
        <div className="result-topline">PLAYER {playerIndex + 1} COMPLETE · {playerIndex + 1}/{playerCount}</div><div className="display-title">{game === "loud" ? "측정 결과" : "경기 결과"}</div><div className="result-subtitle"><span className="result-player-emoji" aria-hidden="true">{emojis[playerIndex]}</span>{lastResult.name} · {gameInfo.name}</div>
        <div className="legacy-score-reveal"><strong>{game === "loud" ? (lastResult.decibels ?? 0).toFixed(1) : `${(lastResult.score ?? 0) > 0 ? "+" : ""}${lastResult.score ?? 0}`}</strong><span>{game === "loud" ? "dB" : "점"}</span></div>
        <div className="result-progress"><span style={{ width: `${((playerIndex + 1) / playerCount) * 100}%` }} /></div>
        <button className="arcade-button arcade-button-dark" type="button" onClick={nextPlayer}>{playerIndex + 1 === playerCount ? "최종 순위 보기" : "다음 플레이어"} <b>›</b></button>
      </section>}

      {screen === "final" && game === "loud" && targetRevealVisible && <div className={`decibel-result-overlay ${targetRevealed ? "is-revealed" : "is-counting"}`} role="status" aria-live="assertive">
        <div className="decibel-result-confetti" aria-hidden="true" />
        <article className="decibel-result-modal">
          <span className="decibel-result-kicker">SECRET TARGET · FINAL REVEAL</span>
          <h2>시크릿 데시벨은???</h2>
          <div className="decibel-result-value"><strong key={targetRevealed ? "target" : targetRevealCount}>{targetRevealed ? loudTarget : "???"}</strong><span>dB</span></div>
          <p>{targetRevealed ? "이였습니당!" : "두구두구두구두구~~"}</p>
          {targetRevealed && <b className="decibel-result-boom">다음!</b>}
        </article>
      </div>}

      {screen === "final" && <section className={`screen olympic-final legacy-final final-${game === "walk" ? "balance" : game} final-spotlights-${finalSpotlight}`}>
        <div className="final-spotlight-stage" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="final-title-row"><div><div className="display-title">최종 순위</div></div><button className="arcade-button arcade-button-dark final-retry-button" type="button" onClick={reset}>{"\uB2E4\uC2DC\uD558\uAE30"} <b>↻</b></button></div>
        <div className="olympic-final-podium-scroll">
          <div className="olympic-final-podium" aria-label="최종 순위 단상">
            {podiumResults.map((result) => {
              const rank = sortedResults.indexOf(result) + 1;
              const sourceIndex = results.indexOf(result);
              const facePlayer = (sourceIndex % 3 + 1) as 1 | 2 | 3;
              const podiumHeight = Math.max(68, 164 - (rank - 1) * 27);
              return <article className="olympic-podium-place" data-rank={rank} key={`${sourceIndex}-${rank}`} role={rank === 1 ? "button" : undefined} tabIndex={rank === 1 ? 0 : undefined} aria-label={rank === 1 ? "우승자 효과음 재생" : undefined} onClick={rank === 1 ? () => sound.playFile("/sounds/9925344A5CF5A16020.mp3") : undefined} onKeyDown={rank === 1 ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); sound.playFile("/sounds/9925344A5CF5A16020.mp3"); } } : undefined}>
                <div className="olympic-podium-avatar">
          <PartyFace player={facePlayer} mood={rank === 1 ? "win" : "smirk"} size={rank === 1 ? 92 : 76} characterEmoji={emojis[sourceIndex]} />
                  <span className="olympic-podium-medal">{rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}</span>
                </div>
                <strong className="olympic-podium-name">{names[sourceIndex] ?? result.name}</strong>
                <small className="olympic-podium-difference">{game === "loud" ? `${Math.abs((result.decibels ?? 0) - (loudTarget ?? 0)).toFixed(1)} dB 차이` : "최종 점수"}</small>
                <div className="olympic-podium-block" style={{ "--podium-height": `${podiumHeight}px` } as React.CSSProperties}>
                  <span>RANK</span><b>{rank}</b>
                  <strong>{game === "loud" ? `${(result.decibels ?? 0).toFixed(1)} dB` : `${result.score ?? 0}점`}</strong>
                </div>
              </article>;
            })}
          </div>
        </div>
        <div className="final-honors">
          <article className="final-honor-card final-honor-first">
    <div className="final-honor-effects" aria-hidden="true"><span>🎉</span><span>✨</span><span>🎊</span><span>✨</span><span>🎉</span></div>
            <small>1등</small>
            <strong>{sortedResults[0]?.name}</strong>
            <span className="final-honor-caption">CHAMPION</span>
          </article>
          <article className="final-honor-card final-honor-last">
            <div className="final-honor-rain" aria-hidden="true" />
            <small>꼴등</small>
            <strong>{sortedResults[sortedResults.length - 1]?.name}</strong>
            <span className="final-honor-caption">BETTER LUCK NEXT TIME</span>
          </article>
        </div>
        
      </section>}
    </main>
  );
}

function SoloGame({ game, playerName, playerEmoji, playerNumber, playerCount, loudTarget, onComplete }: { game: GameId; playerName: string; playerEmoji: string; playerNumber: number; playerCount: number; loudTarget: number | null; onComplete: (score: number) => void }) {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const completed = useRef(false);
  const { level, status, start } = useAudioMeter();

  const complete = useCallback((points: number) => {
    if (completed.current) return;
    completed.current = true;
    sound.stopBgm();
    onComplete(points);
  }, [onComplete]);

  if (game === "loud") return <LoudSolo playerName={playerName} playerEmoji={playerEmoji} playerNumber={playerNumber} playerCount={playerCount} onComplete={complete} level={level} status={status} startMic={start} />;
  if (game === "walk") return <WalkSolo playerName={playerName} playerEmoji={playerEmoji} playerNumber={playerNumber} playerCount={playerCount} onComplete={complete} />;
  return <FoodSolo playerName={playerName} playerEmoji={playerEmoji} playerNumber={playerNumber} playerCount={playerCount} onComplete={complete} score={score} setScore={setScore} feedback={feedback} setFeedback={setFeedback} />;
}

function GameHud({ playerName, playerEmoji, playerNumber, playerCount, score, time }: { game: GameId; playerName: string; playerEmoji: string; playerNumber: number; playerCount: number; score?: number; time?: number }) {
  return (
    <div className="game-player-indicators"><div className="header-right"><span className="current-player-identity"><span className="current-player-emoji" aria-hidden="true">{playerEmoji}</span><span className="current-player-label">{playerName} · {playerNumber}/{playerCount}</span></span>{time !== undefined && <div className={`food-timer ${time <= 5 ? "food-timer-urgent" : ""}`}><small>TIME LEFT</small><strong>{Math.ceil(time)}</strong><span>SEC</span></div>}{score !== undefined && <strong className="header-timer">{score}<small>PT</small></strong>}</div>
    </div>
  );
}

function LoudSolo({ playerName, playerEmoji, playerNumber, playerCount, onComplete, level, status, startMic }: { playerName: string; playerEmoji: string; playerNumber: number; playerCount: number; onComplete: (score: number) => void; level: number; status: string; startMic: () => Promise<boolean> }) {
  const peak = useRef(45);
  const pressed = useRef(false);
  const [time, setTime] = useState(5);
  const [fallbackLevel, setFallbackLevel] = useState(45);
  const levelRef = useRef(level);
  const statusRef = useRef(status);
  levelRef.current = level;
  statusRef.current = status;
  useEffect(() => { void startMic(); }, [startMic]);
  useEffect(() => { sound.stopBgm(); const started = Date.now();
    const poll = window.setInterval(() => {
      const seconds = (Date.now() - started) / 1000;
      setTime(Math.max(0, 5 - seconds));
      const hasMicrophone = statusRef.current === "ready";
      const measured = hasMicrophone ? levelRef.current : pressed.current ? 65 + Math.random() * 34 : 45;
      if (!hasMicrophone) {
        setFallbackLevel((current) => pressed.current ? current + (measured - current) * .45 : Math.max(45, current - 3));
      }
      peak.current = Math.max(peak.current, measured);
      if (seconds >= 5) {
        window.clearInterval(poll);
        onComplete(Math.round(peak.current * 10) / 10);
      }
    }, 60);
    return () => { window.clearInterval(poll); sound.stopBgm(); };
  }, [onComplete]);
  const avatar = (((playerNumber - 1) % 3) + 1) as 1 | 2 | 3;
  const displayLevel = status === "ready" ? level : fallbackLevel;
  const currentDb = Math.max(45, Math.min(105, displayLevel));
  const needleRotation = (currentDb - 75) * 3;
  const mood = currentDb >= 88 ? "wild" : currentDb >= 68 ? "panic" : "smirk";
  const meterFill = ((currentDb - 45) / 60) * 100;
  return (
    <section className="screen game-screen game-screen-solo loud-solo-legacy">
      <div className="player-panel player-1 active-player decibel-board" style={{
        "--db-scale": .9 + Math.pow(meterFill / 100, 1.7) * .78,
        "--db-glow": `${4 + (meterFill / 100) * 42}px`,
      } as React.CSSProperties}>
        <div className="panel-heading"><PartyFace player={avatar} mood={mood} size={56} characterEmoji={playerEmoji} /><div><small>{status === "ready" ? "🎙 MIC LIVE" : status === "requesting" ? "CONNECTING MIC…" : "BUTTON SHOUT MODE"}</small><h2>{playerName}</h2></div></div>
        <div className="decibel-meter-stage">
        <svg className="decibel-gauge" viewBox="0 0 800 400" preserveAspectRatio="none" role="meter" aria-label="현재 데시벨" aria-valuemin={45} aria-valuemax={105} aria-valuenow={Math.round(currentDb)} aria-valuetext={`${Math.round(currentDb)} dB`}>
            <defs><linearGradient id="decibel-arc-colors" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4f8df4" /><stop offset="38%" stopColor="#5cdb83" /><stop offset="58%" stopColor="#a3e84f" /><stop offset="77%" stopColor="#ffd33d" /><stop offset="100%" stopColor="#ff624f" /></linearGradient></defs>
            <path d="M 90 350 A 310 310 0 0 1 710 350" fill="none" stroke="#f1eee7" strokeWidth="48" strokeLinecap="round" />
            <path d="M 90 350 A 310 310 0 0 1 710 350" fill="none" stroke="url(#decibel-arc-colors)" strokeWidth="38" strokeLinecap="round" />
            {Array.from({ length: 31 }, (_, index) => {
              const angle = (index / 30) * Math.PI;
              const major = index % 5 === 0;
              const inner = major ? 266 : 281;
              const outer = major ? 302 : 296;
              const x1 = 400 - inner * Math.cos(angle);
              const y1 = 350 - inner * Math.sin(angle);
              const x2 = 400 - outer * Math.cos(angle);
              const y2 = 350 - outer * Math.sin(angle);
              return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={major ? "#c9c2b7" : "#ded9d1"} strokeWidth={major ? 7 : 4} strokeLinecap="round" />;
            })}
            {["45", "60", "75", "90", "105"].map((label, index) => {
              const angle = (index / 4) * Math.PI;
              const x = 400 - 355 * Math.cos(angle);
              const y = 350 - 355 * Math.sin(angle);
              return <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="decibel-gauge-label">{label}</text>;
            })}
          </svg>
          <div className="decibel-gauge-needle" style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }} aria-hidden="true" />
          <div className="decibel-gauge-hub" aria-hidden="true"><span>{playerEmoji}</span></div>
          <div className="db-reading"><strong>{Math.round(currentDb)}</strong><span>dB</span></div>
        </div>
        <div className="noise-callout loud-target-callout"><span aria-hidden="true">📣</span><strong>타겟 데시벨을 잘 예측하여 소리를 내주세요!</strong><i aria-hidden="true">✦</i></div>
        {status !== "ready" && <button className="secondary-button loud-hold-button" type="button" onPointerDown={() => { pressed.current = true; }} onPointerUp={() => { pressed.current = false; }} onPointerLeave={() => { pressed.current = false; }} onContextMenu={(event) => event.preventDefault()}>🎤 꾹 눌러서 소리 내기</button>}
      </div>
      <div className="game-hud"><div className="timer-box"><small>남은 시간</small><strong>{time.toFixed(1)}</strong><span>초</span><div className="timer-track"><i style={{ width: `${(time / 5) * 100}%` }} /></div></div></div>
    </section>
  );
}

function WalkSolo({ playerName, playerEmoji, playerNumber, playerCount, onComplete }: { playerName: string; playerEmoji: string; playerNumber: number; playerCount: number; onComplete: (score: number) => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [balance, setBalance] = useState(0);
  const [alive, setAlive] = useState(true);
  const balanceRef = useRef(0);
  const aliveRef = useRef(true);
  const elapsedRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => { sound.startBgm("walk"); const started = Date.now();
    const timer = window.setInterval(() => {
      const seconds = (Date.now() - started) / 1000;
      elapsedRef.current = seconds;
      setElapsed(seconds);
      setBalance((previous) => {
        const difficulty = 8 + Math.floor(seconds / 5) * 4;
        const direction = previous === 0 ? (Math.random() > .5 ? 1 : -1) : Math.sign(previous);
        const next = previous + direction * Math.random() * difficulty + (Math.random() - .5) * difficulty;
        balanceRef.current = next;
        if (Math.abs(next) >= 100 && aliveRef.current) {
          aliveRef.current = false;
          setAlive(false);
          sound.stopBgm();
          sound.play("fall");
          window.setTimeout(() => onCompleteRef.current(Math.floor(elapsedRef.current * 5)), 800);
        } else if (Math.abs(next) > 78) sound.play("danger");
        return next;
      });
    }, 160);
    const onKey = (event: KeyboardEvent) => {
      if (!aliveRef.current || !["a", "d", "arrowleft", "arrowright"].includes(event.key.toLowerCase())) return;
      event.preventDefault();
      correct(event.key.toLowerCase() === "a" || event.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKey);
    return () => { window.clearInterval(timer); window.removeEventListener("keydown", onKey); sound.stopBgm(); };
  }, []);
  const correct = (direction: number) => {
    if (!aliveRef.current) return;
    setBalance((current) => { const next = current + direction * 14; balanceRef.current = next; return next; });
  };
  const difficulty = Math.min(4, Math.floor(elapsed / 5));
  const phases = ["쉬움", "조금 어려움", "어려움", "매우 어려움", "극한 난이도"];
  const avatar = (((playerNumber - 1) % 3) + 1) as 1 | 2 | 3;
  const faceMood = !alive ? "lose" : Math.abs(balance) > 78 ? "panic" : Math.abs(balance) > 48 ? "sweat" : "smirk";
  return (
    <section className={`screen balance-game ${Math.abs(balance) > 78 ? "danger-mode" : ""}`}>
      <GameHud game="walk" playerName={playerName} playerEmoji={playerEmoji} playerNumber={playerNumber} playerCount={playerCount} score={Math.floor(elapsed * 5)} />
      <div className="balance-alert">{phases[difficulty]} · LEVEL {difficulty + 1}</div>
      <div className="tightrope-stage tightrope-stage-solo">
        <article className={`rope-player ${!alive ? "eliminated" : ""}`}>
          <div className="panel-heading"><PartyFace player={avatar} mood={faceMood} size={72} characterEmoji={playerEmoji} /><div><small>{alive ? "KEEP YOUR BALANCE" : "GAME OVER"}</small><h2>{playerName}</h2></div></div>
          <div className="walker-space"><div className="rope-line" /><div className={`walker player-color-${["coral", "blue", "green"][avatar - 1]} mood-tilt-${Math.abs(balance) > 88 ? "wild" : Math.abs(balance) > 70 ? "panic" : "ok"}`} style={{ "--tilt": `${Math.max(-38, Math.min(38, balance * .38))}deg` } as React.CSSProperties}><i /><div className="walker-head"><PartyFace player={avatar} mood={faceMood} size={118} characterEmoji={playerEmoji} /></div><b /><span /></div>{!alive && <div className="out-stamp">OUT</div>}</div>
          <div className="balance-gauge"><div className="gauge-danger left">DANGER</div><div className="gauge-safe">SAFE</div><div className="gauge-danger right">DANGER</div><i style={{ "--balance": `${(balance + 100) / 2}%` } as React.CSSProperties} /></div>
          <div className="balance-value"><span>SURVIVAL TIME</span><strong>{elapsed.toFixed(1)} SEC</strong><small>+{Math.floor(elapsed * 5)} PTS</small></div>
          <div className="balance-buttons"><button type="button" disabled={!alive} onClick={() => correct(-1)}>←</button><button type="button" disabled={!alive} onClick={() => correct(1)}>→</button></div>
        </article>
      </div>
    </section>
  );
}

function FoodSolo({ playerName, playerEmoji, playerNumber, playerCount, onComplete, score, setScore, feedback, setFeedback }: { playerName: string; playerEmoji: string; playerNumber: number; playerCount: number; onComplete: (score: number) => void; score: number; setScore: (value: number | ((current: number) => number)) => void; feedback: string; setFeedback: (value: string) => void }) {
  const [target] = useState(() => randomItem(["과일", "채소", "패스트푸드"]));
  const [food, setFood] = useState(() => randomItem(FOOD_ITEMS));
  const [time, setTime] = useState(15);
  const buzzed = useRef(false);
  const scoreRef = useRef(score);
  useEffect(() => { sound.startBgm("food"); const startAt = Date.now();
    const clock = window.setInterval(() => {
      const remaining = Math.max(0, 15 - (Date.now() - startAt) / 1000);
      setTime(remaining);
      if (remaining <= 0) { window.clearInterval(clock); onComplete(scoreRef.current); }
    }, 100);
    const nextFood = window.setInterval(() => {
      setFood((current) => { let next = randomItem(FOOD_ITEMS); while (next.name === current.name) next = randomItem(FOOD_ITEMS); return next; });
      buzzed.current = false;
      setFeedback("");
    }, 650);
    return () => { window.clearInterval(clock); window.clearInterval(nextFood); sound.stopBgm(); };
  }, [onComplete, setFeedback]);
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.code === "Space" && !event.repeat) { event.preventDefault(); buzz(); } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); });
  const buzz = () => {
    if (buzzed.current) return;
    buzzed.current = true;
    const correct = food.category === target;
    const points = correct ? 5 : -1;
    setScore((current) => { const next = current + points; scoreRef.current = next; return next; });
    setFeedback(correct ? "+5 PERFECT!" : "-1 삐이익!");
    sound.play(correct ? "correct" : "miss");
  };
  return (
    <section className="screen food-game solo-food-layout">
      <GameHud game="food" playerName={playerName} playerEmoji={playerEmoji} playerNumber={playerNumber} playerCount={playerCount} score={score} time={time} />
      <div className="food-instruction-line"><span>TARGET CATEGORY</span><strong>{target}</strong><small>일치하면 아래 버저를 누르세요</small></div>
      <div className={`food-center-item ${feedback ? feedback.startsWith("-") ? "food-item-wrong" : "food-item-correct" : ""}`} aria-live="polite">
        <div key={food.name} className="food-center-emoji">{food.image}</div><strong>{food.name}</strong>
        {feedback && <b className={`food-feedback ${feedback.startsWith("-") ? "wrong" : "correct"}`} role="img" aria-label={feedback}>{feedback.startsWith("-") ? "✕" : "○"}</b>}
      </div>
      <button type="button" className={`food-buzzer ${buzzed.current ? "buzzer-pressed" : ""}`} onClick={buzz} disabled={buzzed.current}>🔴 BUZZER</button>
    </section>
  );
}
