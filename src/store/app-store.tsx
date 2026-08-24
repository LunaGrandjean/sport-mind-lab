import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Athlete, Result } from "@/lib/domain";
import { INITIAL_ATHLETES, INITIAL_RESULTS } from "@/lib/mock-data";

interface AppStore {
  athletes: Athlete[];
  results: Result[];
  selectedAthleteId: string;
  selectedAthlete: Athlete;
  selectAthlete: (id: string) => void;
  updateAthlete: (id: string, patch: Partial<Athlete>) => void;
  addResults: (results: Omit<Result, "id" | "date">[]) => void;
}

const StoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [athletes, setAthletes] = useState<Athlete[]>(INITIAL_ATHLETES);
  const [results, setResults] = useState<Result[]>(INITIAL_RESULTS);
  const [selectedAthleteId, setSelectedAthleteId] = useState(INITIAL_ATHLETES[0].id);

  const selectAthlete = useCallback((id: string) => setSelectedAthleteId(id), []);

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
      updateAthlete,
      addResults,
    };
  }, [athletes, results, selectedAthleteId, selectAthlete, updateAthlete, addResults]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore doit être utilisé dans AppStoreProvider");
  return ctx;
}
