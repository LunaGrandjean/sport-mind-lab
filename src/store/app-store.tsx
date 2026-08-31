import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Athlete, Result } from "@/lib/domain";
import { INITIAL_ATHLETES, INITIAL_RESULTS } from "@/lib/mock-data";
import { clampRadarScore, RADAR_MAX_SCORE } from "@/lib/scoring";

interface AppStore {
  athletes: Athlete[];
  results: Result[];
  selectedAthleteId: string;
  selectedAthlete: Athlete;
  selectAthlete: (id: string) => void;
  addAthlete: () => void;
  updateAthlete: (id: string, patch: Partial<Athlete>) => void;
  addResults: (results: Omit<Result, "id" | "date">[]) => void;
}

const StoreContext = createContext<AppStore | null>(null);
const STORAGE_KEY = "sport-mind-lab-store";

interface PersistedStore {
  athletes: Athlete[];
  results: Result[];
  selectedAthleteId: string;
}

function createEmptyAthlete(): Athlete {
  return {
    id: `athlete-${Date.now()}`,
    nom: "",
    prenom: "",
    age: 0,
    sexe: "Homme",
    discipline: "",
    poste: "",
    pathologie: "",
    niveau: "",
  };
}

function loadPersistedStore(): PersistedStore {
  if (typeof window === "undefined") {
    return {
      athletes: INITIAL_ATHLETES,
      results: INITIAL_RESULTS,
      selectedAthleteId: INITIAL_ATHLETES[0].id,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("No persisted store");
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    const athletes = parsed.athletes?.length ? parsed.athletes : INITIAL_ATHLETES;
    const selectedAthleteId =
      parsed.selectedAthleteId && athletes.some((a) => a.id === parsed.selectedAthleteId)
        ? parsed.selectedAthleteId
        : athletes[0].id;

    const results = (parsed.results ?? INITIAL_RESULTS).map((result) => ({
      ...result,
      score: clampRadarScore(
        result.score > RADAR_MAX_SCORE ? Math.round(result.score / 5) : result.score,
      ),
    }));

    return {
      athletes,
      results,
      selectedAthleteId,
    };
  } catch {
    return {
      athletes: INITIAL_ATHLETES,
      results: INITIAL_RESULTS,
      selectedAthleteId: INITIAL_ATHLETES[0].id,
    };
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const initialStore = useMemo(loadPersistedStore, []);
  const [athletes, setAthletes] = useState<Athlete[]>(initialStore.athletes);
  const [results, setResults] = useState<Result[]>(initialStore.results);
  const [selectedAthleteId, setSelectedAthleteId] = useState(
    initialStore.selectedAthleteId,
  );

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ athletes, results, selectedAthleteId }),
    );
  }, [athletes, results, selectedAthleteId]);

  const selectAthlete = useCallback((id: string) => setSelectedAthleteId(id), []);

  const addAthlete = useCallback(() => {
    const athlete = createEmptyAthlete();
    setAthletes((prev) => [...prev, athlete]);
    setSelectedAthleteId(athlete.id);
  }, []);

  const updateAthlete = useCallback((id: string, patch: Partial<Athlete>) => {
    setAthletes((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const addResults = useCallback((entries: Omit<Result, "id" | "date">[]) => {
    const date = new Date().toISOString();
    setResults((prev) => [
      ...prev,
      ...entries.map((entry, index) => ({
        ...entry,
        id: `r-${Date.now()}-${index}`,
        date,
      })),
    ]);
  }, []);

  const value = useMemo<AppStore>(() => {
    const selectedAthlete =
      athletes.find((a) => a.id === selectedAthleteId) ?? athletes[0];
    return {
      athletes,
      results,
      selectedAthleteId,
      selectedAthlete,
      selectAthlete,
      addAthlete,
      updateAthlete,
      addResults,
    };
  }, [
    athletes,
    results,
    selectedAthleteId,
    selectAthlete,
    addAthlete,
    updateAthlete,
    addResults,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore doit être utilisé dans AppStoreProvider");
  return ctx;
}
