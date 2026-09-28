import { useCallback, useState } from "react";
import LoudChallenge from "./components/LoudChallenge";
import {
  BalanceGame,
  FoodGame,
  OlympicFinal,
  OlympicMenu,
  RaceGame,
  SportIntro,
  type NewSport,
  type Ranking,
} from "./components/OlympicGames";
import { sound } from "./game/sound";

type View = "menu" | "intro" | "playing" | "final";
type Results = Partial<Record<NewSport, Ranking>>;
const ORDER: NewSport[] = ["loud", "race", "balance", "food"];

export default function App() {
  const [view, setView] = useState<View>("menu");
  const [sport, setSport] = useState<NewSport>("loud");
  const [results, setResults] = useState<Results>({});

  const selectSport = (nextSport: NewSport) => {
    void sound.unlock();
    setSport(nextSport);
    setView("intro");
  };

  const saveResult = (game: NewSport, ranking: Ranking) => {
    setResults((current) => ({ ...current, [game]: ranking }));
  };

  const nextSport = () => {
    const currentIndex = ORDER.indexOf(sport);
    const next = ORDER.slice(currentIndex + 1).find((item) => !results[item]);
    if (next) {
      setSport(next);
      setView("intro");
    } else {
      setView(Object.keys(results).length >= 4 ? "final" : "menu");
    }
  };

  const goMenu = useCallback(() => {
    sound.stopBgm();
    setView("menu");
  }, []);

  return (
    <main className="app-shell olympic-app">
      {view === "menu" && (
        <OlympicMenu
          results={results}
          onSelect={selectSport}
          onFinal={() => setView("final")}
        />
      )}
      {view === "intro" && (
        <SportIntro
          sport={sport}
          onBack={goMenu}
          onStart={() => {
            sound.play("go");
            setView("playing");
          }}
        />
      )}
      {view === "playing" && sport === "loud" && (
        <LoudChallenge
          autoStart
          onHome={goMenu}
          onResult={(ranking) => saveResult("loud", ranking)}
          onNext={nextSport}
        />
      )}
      {view === "playing" && sport === "race" && (
        <RaceGame
          onResult={(ranking) => saveResult("race", ranking)}
          onNext={nextSport}
          onHome={goMenu}
        />
      )}
      {view === "playing" && sport === "balance" && (
        <BalanceGame
          onResult={(ranking) => saveResult("balance", ranking)}
          onNext={nextSport}
          onHome={goMenu}
        />
      )}
      {view === "playing" && sport === "food" && (
        <FoodGame
          onResult={(ranking) => saveResult("food", ranking)}
          onNext={nextSport}
          onHome={goMenu}
        />
      )}
      {view === "final" && (
        <OlympicFinal
          results={results}
          onHome={goMenu}
          onReset={() => {
            setResults({});
            setView("menu");
          }}
        />
      )}
    </main>
  );
}
