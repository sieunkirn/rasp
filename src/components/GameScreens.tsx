import type { AudioStatus } from "../hooks/useAudioMeter";

export type RoundResult = {
  target: number;
  measured: [number, number];
  differences: [number, number];
  winner: 0 | 1 | 2;
};

type Scores = [number, number];

function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="22" y="7" width="20" height="34" rx="10" fill="currentColor" />
      <path d="M14 31c0 11 8 19 18 19s18-8 18-19M32 50v8M22 58h20" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="trophy-icon" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M30 14h40v20c0 15-8 27-20 27S30 49 30 34V14Z" fill="#ffd33d" stroke="#17162f" strokeWidth="5" />
      <path d="M30 23H16v8c0 11 7 18 18 18M70 23h14v8c0 11-7 18-18 18M50 61v14M35 86h30M41 75h18" fill="none" stroke="#17162f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m50 24 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z" fill="#ff6b39" />
    </svg>
  );
}

function Bolt({ side }: { side: "left" | "right" }) {
  return <span className={`bolt bolt-${side}`} aria-hidden="true" />;
}

function Waveform({ level, player }: { level: number; player: 1 | 2 }) {
  const normalized = Math.max(0.1, (level - 45) / 60);
  return (
    <div className="waveform" aria-hidden="true">
      {Array.from({ length: 17 }, (_, index) => {
        const rhythm = 0.32 + Math.abs(Math.sin(index * 1.7)) * 0.68;
        return (
          <span
            key={index}
            style={{
              height: `${Math.max(12, normalized * rhythm * 88)}%`,
              animationDelay: `${index * -45}ms`,
            }}
            className={`wave-bar wave-p${player}`}
          />
        );
      })}
    </div>
  );
}

function ScorePill({ scores, inverted = false }: { scores: Scores; inverted?: boolean }) {
  return (
    <div className={`score-pill ${inverted ? "score-inverted" : ""}`}>
      <span>P1</span><strong>{scores[0]}</strong>
      <i />
      <strong>{scores[1]}</strong><span>P2</span>
    </div>
  );
}

function AudioBadge({ status }: { status: AudioStatus }) {
  const text =
    status === "ready" ? "ONE MIC READY" :
    status === "requesting" ? "CONNECTING MIC..." :
    status === "unavailable" ? "KEYBOARD MODE" :
    "MIC CHECK ON START";
  return <div className={`audio-badge status-${status}`}><span />{text}</div>;
}

export function StartScreen({
  audioStatus,
  onStart,
}: {
  audioStatus: AudioStatus;
  onStart: () => void;
}) {
  return (
    <section className="screen start-screen">
      <div className="top-ribbon">
        <AudioBadge status={audioStatus} />
        <span>5 ROUNDS · TAKE TURNS · 1 CHAMPION</span>
      </div>
      <Bolt side="left" />
      <Bolt side="right" />
      <div className="start-content">
        <div className="kicker">THE ULTIMATE VOLUME BATTLE</div>
        <div className="logo-lockup">
          <MicIcon className="logo-mic" />
          <h1><span>LOUD</span><br />CHALLENGE</h1>
        </div>
        <p className="tagline">숨겨진 목표 데시벨에<br className="mobile-break" /> 가장 가까운 소리를 만들어라!</p>
        <button className="primary-button" onClick={onStart}>
          <span>GAME START</span><b aria-hidden="true">›</b>
        </button>
        <div className="player-preview">
          <div className="preview-player p1">
            <span className="player-dot">1</span>
            <div><small>READY?</small><strong>PLAYER 1</strong></div>
            <kbd>A</kbd>
          </div>
          <div className="vs-badge">VS</div>
          <div className="preview-player p2">
            <kbd>L</kbd>
            <div><small>READY?</small><strong>PLAYER 2</strong></div>
            <span className="player-dot">2</span>
          </div>
        </div>
        <p className="keyboard-hint">DEV CONTROL · 게임 중 A / L 키를 누르면 소리를 테스트할 수 있어요</p>
      </div>
    </section>
  );
}

export function ReadyScreen({
  round,
  countdown,
  player,
}: {
  round: number;
  countdown: number;
  player: 1 | 2;
}) {
  return (
    <section className="screen ready-screen">
      <div className="round-chip">ROUND {round} <span>/ 5</span></div>
      <div className="secret-card">
        <div className="secret-icon"><MicIcon /></div>
        <p>PLAYER {player} 차례 · 목표 데시벨은 비밀입니다</p>
        <div className="secret-value">??? <span>dB</span></div>
        <div className="secret-line" />
        <small>LISTEN FOR THE SIGNAL</small>
      </div>
      <div className="countdown-orbit" key={countdown}>
        <div className="orbit-ring" />
        <strong>{countdown}</strong>
      </div>
      <h2>GET READY!</h2>
      <p className="ready-help">PLAYER {player}, 마이크 가까이에서 준비하세요</p>
    </section>
  );
}

function PlayerPanel({
  player,
  level,
  peak,
  active,
}: {
  player: 1 | 2;
  level: number;
  peak: number;
  active: boolean;
}) {
  const gauge = Math.max(4, Math.min(100, ((level - 45) / 60) * 100));
  return (
    <div className={`player-panel player-${player} ${active ? "active-player" : "waiting-player"}`}>
      <div className="panel-heading">
        <span className="number-box">{player}</span>
        <div><small>{active ? "YOUR TURN" : peak > 45 ? "RECORDED" : "PLEASE WAIT"}</small><h2>PLAYER {player}</h2></div>
      </div>
      <div className="db-reading">
        <strong>{Math.round(level)}</strong>
        <span>dB</span>
      </div>
      {active ? <Waveform level={level} player={player} /> : <div className="waiting-message">{peak > 45 ? "DONE" : "WAIT"}</div>}
      <div className="gauge-shell">
        <div className="gauge-fill" style={{ width: `${gauge}%` }} />
        <span className="target-tick" />
      </div>
      <div className="gauge-labels"><span>45</span><b>PEAK {peak.toFixed(1)}</b><span>105</span></div>
      <div className="key-control">HOLD <kbd>{player === 1 ? "A" : "L"}</kbd> TO SIMULATE</div>
    </div>
  );
}

export function GameScreen({
  round,
  activePlayer,
  levels,
  peaks,
  scores,
  time,
  audioStatus,
}: {
  round: number;
  activePlayer: 1 | 2;
  levels: Scores;
  peaks: Scores;
  scores: Scores;
  time: number;
  audioStatus: AudioStatus;
}) {
  return (
    <section className="screen game-screen">
      <PlayerPanel player={1} level={levels[0]} peak={peaks[0]} active={activePlayer === 1} />
      <PlayerPanel player={2} level={levels[1]} peak={peaks[1]} active={activePlayer === 2} />
      <div className="game-hud">
        <div className="round-mini">ROUND {round}/5</div>
        <ScorePill scores={scores} />
        <div className="noise-callout"><small>PLAYER {activePlayer} · GO!</small>MAKE SOME<br />NOISE!</div>
        <div className="timer-box">
          <small>TIME LEFT</small>
          <strong>{Math.ceil(time).toString().padStart(2, "0")}</strong>
          <span>SEC</span>
          <div className="timer-track"><i style={{ width: `${(time / 5) * 100}%` }} /></div>
        </div>
        <AudioBadge status={audioStatus} />
      </div>
    </section>
  );
}

export function ResultScreen({
  round,
  result,
  scores,
  isLastRound,
  onContinue,
}: {
  round: number;
  result: RoundResult;
  scores: Scores;
  isLastRound: boolean;
  onContinue: () => void;
}) {
  const heading = result.winner === 0 ? "DRAW!" : `PLAYER ${result.winner} WINS!`;
  return (
    <section className="screen result-screen">
      <div className="result-header">
        <div><small>ROUND {round} COMPLETE</small><h1>ROUND RESULT</h1></div>
        <ScorePill scores={scores} inverted />
      </div>
      <div className="target-reveal">
        <small>SECRET TARGET</small>
        <strong>{result.target}</strong><span>dB</span>
      </div>
      <div className="result-grid">
        {[0, 1].map((index) => {
          const player = (index + 1) as 1 | 2;
          const isWinner = result.winner === player;
          return (
            <div className={`result-player result-p${player} ${isWinner ? "winner" : ""}`} key={player}>
              {isWinner && <div className="winner-ribbon">+1 POINT</div>}
              <div className="result-player-title"><span>{player}</span> PLAYER {player}</div>
              <div className="result-measurement">
                <strong>{result.measured[index].toFixed(1)}</strong><span>dB</span>
              </div>
              <div className="difference"><small>OFF TARGET BY</small><b>{result.differences[index].toFixed(1)} dB</b></div>
            </div>
          );
        })}
      </div>
      <h2 className={`winner-announcement winner-${result.winner}`}>{heading}</h2>
      <button className="secondary-button" onClick={onContinue}>
        {isLastRound ? "VIEW FINAL RESULT" : "NEXT ROUND"} <span>›</span>
      </button>
    </section>
  );
}

export function FinalScreen({
  scores,
  onAgain,
  onHome,
}: {
  scores: Scores;
  onAgain: () => void;
  onHome: () => void;
}) {
  const winner = scores[0] === scores[1] ? 0 : scores[0] > scores[1] ? 1 : 2;
  return (
    <section className="screen final-screen">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 22 }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}
      </div>
      <div className="final-kicker">5 ROUNDS COMPLETE</div>
      <TrophyIcon />
      <h1>FINAL RESULT</h1>
      <div className={`champion-text champion-${winner}`}>
        {winner === 0 ? "IT'S A DRAW!" : `PLAYER ${winner} WIN!`}
      </div>
      <div className="final-scoreboard">
        <div className={`final-player final-p1 ${winner === 1 ? "champion" : ""}`}>
          <small>PLAYER 1</small><strong>{scores[0]}</strong><span>POINTS</span>
        </div>
        <div className="final-divider"><span>FINAL</span><b>:</b></div>
        <div className={`final-player final-p2 ${winner === 2 ? "champion" : ""}`}>
          <small>PLAYER 2</small><strong>{scores[1]}</strong><span>POINTS</span>
        </div>
      </div>
      <div className="final-actions">
        <button className="primary-button compact" onClick={onAgain}>PLAY AGAIN <b>↻</b></button>
        <button className="home-button" onClick={onHome}>HOME</button>
      </div>
    </section>
  );
}
