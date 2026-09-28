export type PlayerId = 1 | 2 | 3;
export type SportId = "loud" | "race" | "balance" | "food";
export type Ranking = PlayerId[];

export const PLAYERS: PlayerId[] = [1, 2, 3];
export const PLAYER_COUNT = 3;
export const LOUD_ROUNDS = 1;
export const FLOOR_DB = 45;
export const CEIL_DB = 105;

export const PLAYER_COLORS = ["coral", "blue", "green"] as const;
export const PLAYER_KEYS = {
  1: { shout: "A", left: "A", right: "D", food: "A", numbers: "1 2 3" },
  2: { shout: "J", left: "J", right: "L", food: "J", numbers: "4 5 6" },
  3: { shout: "L", left: "←", right: "→", food: "L", numbers: "7 8 9 0" },
} as const;

export type Triple = [number, number, number];
export const ZERO_TRIPLE: Triple = [0, 0, 0];
export const FLOOR_TRIPLE: Triple = [FLOOR_DB, FLOOR_DB, FLOOR_DB];
