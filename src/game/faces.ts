import type { PlayerId } from "./constants";

export type FaceMood = "smug" | "smirk" | "sweat" | "panic" | "wild" | "win" | "lose";

export function raceMood(progress: number, isLeader: boolean, finishedPlace?: number): FaceMood {
  if (finishedPlace === 1) return "win";
  if (finishedPlace && finishedPlace > 1) return finishedPlace === 3 ? "lose" : "smirk";
  if (progress >= 92) return "wild";
  if (progress >= 76) return "panic";
  if (progress < 12) return "smug";
  if (isLeader) return "smirk";
  if (progress > 58) return "sweat";
  return "smug";
}

export function balanceMood(tilt: number, alive: boolean): FaceMood {
  if (!alive) return "lose";
  const danger = Math.abs(tilt);
  if (danger >= 88) return "wild";
  if (danger >= 70) return "panic";
  if (danger >= 42) return "sweat";
  return "smirk";
}

export function loudMood(diff: number, winning: boolean): FaceMood {
  if (winning && diff < 3) return "win";
  if (diff > 18) return "panic";
  if (diff > 8) return "sweat";
  return "smirk";
}

export function podiumMood(place: number): FaceMood {
  if (place === 1) return "win";
  if (place === 3) return "lose";
  return "smirk";
}

export function playerAccent(player: PlayerId) {
  return ["#ff674f", "#4665ff", "#8ad62a"][player - 1];
}
