import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Athlete, Result } from "@/lib/domain";
import { MOCK_ATHLETES, MOCK_RESULTS } from "@/lib/mock-data";

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

/**
 * Source de vérité front. Les mocks peuvent être remplacés par des appels
 * serveur (loader / server functions) sans changer l'API du store.
 */
export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [athletes, setAthletes] = useState<Athlete[]>(MOCK_ATHLETES);
  const [results, setResults] = useState<Result[]>(MOCK_RESULTS);
  const [selectedAthleteId, setSelectedAthleteId] = useState(MOCK_ATHLETES[0].id);

  const selectAthlete = useCallback((id: string) => setSelectedAthleteId(id), []);

  const updateAthlete = useCallback((id: string, patch: Partial<Athlete>) => {
    setAthletes((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const addResults = useCallback((entries: Omit<Result, "id" | "date">[]) => {
    const date = new Date().toISOString();
    setResults((prev) => [
      ...prev,
      ...entries.map((e, i) => ({
        ...e,
        id: `r-${Date.now()}-${i}`,
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
