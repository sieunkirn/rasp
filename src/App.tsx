import { useState } from "react";
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

type View = "menu" | "intro" | "playing" | "loud" | "final";
type Results = Partial<Record<NewSport, Ranking>>;

export default function App() {
  const [view, setView] = useState<View>("menu");
  const [sport, setSport] = useState<NewSport>("race");
  const [results, setResults] = useState<Results>({});

  const selectSport = (nextSport: NewSport | "loud") => {
    if (nextSport === "loud") {
      setView("loud");
      return;
    }
    setSport(nextSport);
    setView("intro");
  };

  const saveResult = (game: NewSport, ranking: Ranking) => {
    setResults((current) => ({ ...current, [game]: ranking }));
  };

  const nextSport = () => {
    const order: NewSport[] = ["race", "balance", "food"];
    const currentIndex = order.indexOf(sport);
    const next = order.slice(currentIndex + 1).find((item) => !results[item]);
    if (next) {
      setSport(next);
      setView("intro");
    } else {
      setView(Object.keys(results).length >= 3 ? "final" : "menu");
    }
  };

  if (view === "loud") {
    return <LoudChallenge onHome={() => setView("menu")} />;
  }

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
          onBack={() => setView("menu")}
          onStart={() => setView("playing")}
        />
      )}
      {view === "playing" && sport === "race" && (
        <RaceGame
          onResult={(ranking) => saveResult("race", ranking)}
          onNext={nextSport}
        />
      )}
      {view === "playing" && sport === "balance" && (
        <BalanceGame
          onResult={(ranking) => saveResult("balance", ranking)}
          onNext={nextSport}
        />
      )}
      {view === "playing" && sport === "food" && (
        <FoodGame
          onResult={(ranking) => saveResult("food", ranking)}
          onNext={nextSport}
        />
      )}
      {view === "final" && (
        <OlympicFinal
          results={results}
          onHome={() => setView("menu")}
          onReset={() => {
            setResults({});
            setView("menu");
          }}
        />
      )}
    </main>
  );
}
