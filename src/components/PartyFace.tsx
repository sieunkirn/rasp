import type { FaceMood } from "../game/faces";
import { playerAccent } from "../game/faces";
import type { PlayerId } from "../game/constants";

export default function PartyFace({
  player,
  mood,
  size = 72,
  label,
}: {
  player: PlayerId;
  mood: FaceMood;
  size?: number;
  label?: string;
}) {
  const skin = playerAccent(player);
  const expression = mood === "lose"
    ? ["🤡", "😵‍💫", "😭"][player - 1]
    : {
        smug: "😑",
        smirk: "😬",
        sweat: "😫",
        panic: "😩",
        wild: "🤪",
        win: "🥴",
        lose: "😩",
      }[mood];
  return (
    <div
      className={`party-face mood-${mood}`}
      style={{ width: size, height: size, "--skin": skin, "--face-size": `${size}px` } as React.CSSProperties}
      aria-hidden="true"
    >
      <span className="party-emoji">{expression}</span>
      {label && <b className="face-label">{label}</b>}
    </div>
  );
}
