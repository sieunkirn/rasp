import { useEffect, useRef } from "react";
import type { PlayerId } from "./constants";

export type InputEvent = { key: string; pressed: boolean; repeat: boolean };
export type InputListener = (event: InputEvent) => void;

export interface InputAdapter {
  subscribe(listener: InputListener): () => void;
}

export class KeyboardInputAdapter implements InputAdapter {
  subscribe(listener: InputListener) {
    const down = (event: KeyboardEvent) => listener({ key: event.key.toLowerCase(), pressed: true, repeat: event.repeat });
    const up = (event: KeyboardEvent) => listener({ key: event.key.toLowerCase(), pressed: false, repeat: false });
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }
}

let activeInputAdapter: InputAdapter = new KeyboardInputAdapter();

export function setInputAdapter(adapter: InputAdapter) {
  activeInputAdapter = adapter;
}

/** Replace with an adapter that emits the same logical keys from GPIO or a joystick. */

export const SHOUT_KEYS: Record<string, PlayerId> = { a: 1, j: 2, l: 3 };
export const FOOD_KEYS: Record<string, PlayerId> = { a: 1, j: 2, l: 3 };
export const NUMBER_KEYS: Record<string, PlayerId> = {
  "1": 1, "2": 1, "3": 1,
  "4": 2, "5": 2, "6": 2,
  "7": 3, "8": 3, "9": 3, "0": 3,
};
export const BALANCE_KEYS: Record<string, { player: PlayerId; direction: -1 | 1 }> = {
  a: { player: 1, direction: -1 },
  d: { player: 1, direction: 1 },
  j: { player: 2, direction: -1 },
  l: { player: 2, direction: 1 },
  arrowleft: { player: 3, direction: -1 },
  arrowright: { player: 3, direction: 1 },
};

export function useHeldShoutKeys(enabled: boolean) {
  const held = useRef(new Set<PlayerId>());
  useEffect(() => {
    const unsubscribe = activeInputAdapter.subscribe(({ key, pressed }) => {
      const player = SHOUT_KEYS[key];
      if (!player) return;
      if (pressed && enabled) held.current.add(player);
      else held.current.delete(player);
    });
    return () => {
      unsubscribe();
      held.current.clear();
    };
  }, [enabled]);
  return held;
}

export function useKeyPressMap<T>(
  enabled: boolean,
  map: Record<string, T>,
  onPress: (value: T, key: string) => void,
) {
  useEffect(() => {
    if (!enabled) return;
    return activeInputAdapter.subscribe(({ key, pressed, repeat }) => {
      if (!pressed || repeat) return;
      if (!(key in map)) return;
      onPress(map[key], key);
    });
  }, [enabled, map, onPress]);
}
