import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Athlete, BilanNote, Result, SessionNote } from "@/lib/domain";
import { INITIAL_ATHLETES, INITIAL_RESULTS } from "@/lib/mock-data";
import { clampRadarScore, RADAR_MAX_SCORE } from "@/lib/scoring";

interface AppStore {
  athletes: Athlete[];
  results: Result[];
  sessionNotes: SessionNote[];
  bilanNotes: BilanNote[];
  selectedAthleteId: string;
  selectedAthlete: Athlete;
  selectAthlete: (id: string) => void;
  addAthlete: () => void;
  updateAthlete: (id: string, patch: Partial<Athlete>) => void;
  addResults: (results: Omit<Result, "id" | "date">[]) => void;
  addSessionNote: (session: Omit<SessionNote, "id">) => void;
  saveBilanNote: (bilan: Omit<BilanNote, "updatedAt">) => void;
  exportData: () => PersistedStore & { exportedAt: string; version: 1 };
  importData: (data: unknown) => void;
}

const StoreContext = createContext<AppStore | null>(null);
const STORAGE_KEY = "sport-mind-lab-store";

interface PersistedStore {
  athletes: Athlete[];
  results: Result[];
  sessionNotes: SessionNote[];
  bilanNotes: BilanNote[];
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
      sessionNotes: [],
      bilanNotes: [],
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
      sessionNotes: parsed.sessionNotes ?? [],
      bilanNotes: parsed.bilanNotes ?? [],
      selectedAthleteId,
    };
  } catch {
    return {
      athletes: INITIAL_ATHLETES,
      results: INITIAL_RESULTS,
      sessionNotes: [],
      bilanNotes: [],
      selectedAthleteId: INITIAL_ATHLETES[0].id,
    };
  }
}

function isPersistedStore(data: unknown): data is PersistedStore {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<PersistedStore>;
  return (
    Array.isArray(candidate.athletes) &&
    Array.isArray(candidate.results) &&
    (candidate.sessionNotes === undefined || Array.isArray(candidate.sessionNotes)) &&
    (candidate.bilanNotes === undefined || Array.isArray(candidate.bilanNotes)) &&
    typeof candidate.selectedAthleteId === "string"
  );
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const initialStore = useMemo(loadPersistedStore, []);
  const [athletes, setAthletes] = useState<Athlete[]>(initialStore.athletes);
  const [results, setResults] = useState<Result[]>(initialStore.results);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>(
    initialStore.sessionNotes,
  );
  const [bilanNotes, setBilanNotes] = useState<BilanNote[]>(initialStore.bilanNotes);
  const [selectedAthleteId, setSelectedAthleteId] = useState(
    initialStore.selectedAthleteId,
  );

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ athletes, results, sessionNotes, bilanNotes, selectedAthleteId }),
    );
  }, [athletes, results, sessionNotes, bilanNotes, selectedAthleteId]);

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

  const addSessionNote = useCallback((session: Omit<SessionNote, "id">) => {
    setSessionNotes((prev) => [
      ...prev,
      {
        ...session,
        id: `s-${Date.now()}`,
      },
    ]);
  }, []);

  const saveBilanNote = useCallback((bilan: Omit<BilanNote, "updatedAt">) => {
    const nextBilan = {
      ...bilan,
      updatedAt: new Date().toISOString(),
    };
    setBilanNotes((prev) => [
      ...prev.filter((entry) => entry.athleteId !== bilan.athleteId),
      nextBilan,
    ]);
  }, []);

  const exportData = useCallback(
    () => ({
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      athletes,
      results,
      sessionNotes,
      bilanNotes,
      selectedAthleteId,
    }),
    [athletes, results, sessionNotes, bilanNotes, selectedAthleteId],
  );

  const importData = useCallback((data: unknown) => {
    if (!isPersistedStore(data) || !data.athletes.length) {
      throw new Error("Format de sauvegarde invalide");
    }

    const selectedId = data.athletes.some((a) => a.id === data.selectedAthleteId)
      ? data.selectedAthleteId
      : data.athletes[0].id;

    setAthletes(data.athletes);
    setResults(
      data.results.map((result) => ({
        ...result,
        score: clampRadarScore(
          result.score > RADAR_MAX_SCORE ? Math.round(result.score / 5) : result.score,
        ),
      })),
    );
    setSessionNotes(data.sessionNotes ?? []);
    setBilanNotes(data.bilanNotes ?? []);
    setSelectedAthleteId(selectedId);
  }, []);

  const value = useMemo<AppStore>(() => {
    const selectedAthlete =
      athletes.find((a) => a.id === selectedAthleteId) ?? athletes[0];
    return {
      athletes,
      results,
      sessionNotes,
      bilanNotes,
      selectedAthleteId,
      selectedAthlete,
      selectAthlete,
      addAthlete,
      updateAthlete,
      addResults,
      addSessionNote,
      saveBilanNote,
      exportData,
      importData,
    };
  }, [
    athletes,
    results,
    sessionNotes,
    bilanNotes,
    selectedAthleteId,
    selectAthlete,
    addAthlete,
    updateAthlete,
    addResults,
    addSessionNote,
    saveBilanNote,
    exportData,
    importData,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore doit être utilisé dans AppStoreProvider");
  return ctx;
}
