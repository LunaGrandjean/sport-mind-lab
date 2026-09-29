import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Dumbbell,
  FileText,
  Home,
  LayoutDashboard,
  PencilLine,
  Trash2,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fullName } from "@/lib/domain";
import { useAppStore } from "@/store/app-store";

const NAV = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/resultats", label: "Resultats", icon: LayoutDashboard },
  { to: "/tests", label: "Tests", icon: Activity },
  { to: "/applications", label: "Applications", icon: Dumbbell },
  { to: "/saisie", label: "Saisie", icon: PencilLine },
  { to: "/bilan", label: "Fichier client / Bilan", icon: FileText },
] as const;

const ATHLETE_PANEL_ROUTES = [
  "/resultats",
  "/tests",
  "/applications",
  "/saisie",
  "/bilan",
];

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function AppSidebar() {
  const {
    athletes,
    selectedAthlete,
    selectAthlete,
    addAthlete,
    updateAthlete,
    clearAthleteData,
    deleteAthlete,
  } = useAppStore();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const showAthletePanel = ATHLETE_PANEL_ROUTES.includes(pathname);
  const [athleteSearch, setAthleteSearch] = useState("");
  const [athleteSearchOpen, setAthleteSearchOpen] = useState(false);
  const [athleteFormOpen, setAthleteFormOpen] = useState(false);

  const selectedName = fullName(selectedAthlete).trim() || "ce sportif";
  const athleteOptions = useMemo(
    () =>
      athletes.map((athlete) => ({
        athlete,
        label: fullName(athlete).trim() || "Nouveau sportif",
        search: normalizeSearch(fullName(athlete)),
      })),
    [athletes],
  );
  const filteredAthleteOptions = useMemo(() => {
    const normalized = normalizeSearch(athleteSearch);
    if (normalized.length < 2) return [];

    return athleteOptions
      .filter((option) => option.search.includes(normalized))
      .slice(0, 8);
  }, [athleteOptions, athleteSearch]);

  useEffect(() => {
    setAthleteSearch(fullName(selectedAthlete).trim());
  }, [selectedAthlete]);

  const handleAthleteSearch = (value: string) => {
    setAthleteSearch(value);
    const normalized = normalizeSearch(value);
    if (!normalized) return;

    const exact = athleteOptions.find((option) => option.search === normalized);
    if (exact) {
      selectAthlete(exact.athlete.id);
      setAthleteFormOpen(false);
      setAthleteSearchOpen(false);
      return;
    }

    setAthleteSearchOpen(normalized.length >= 2);
  };

  const handleAthleteSelect = (athleteId: string, label: string) => {
    selectAthlete(athleteId);
    setAthleteSearch(label);
    setAthleteFormOpen(false);
    setAthleteSearchOpen(false);
  };

  const handleNewAthleteToggle = (checked: boolean) => {
    setAthleteFormOpen(checked);
    if (checked) {
      addAthlete();
    }
  };

  const handleClearAthleteData = () => {
    if (
      window.confirm(
        `Supprimer tous les resultats, seances et bilans enregistres pour ${selectedName} ? Le profil sportif restera disponible.`,
      )
    ) {
      clearAthleteData(selectedAthlete.id);
    }
  };

  const handleDeleteAthlete = () => {
    if (
      window.confirm(
        `Supprimer definitivement ${selectedName} et toutes ses donnees ?`,
      )
    ) {
      deleteAthlete(selectedAthlete.id);
      setAthleteFormOpen(false);
    }
  };

  const field = (
    key: "nom" | "prenom" | "age" | "discipline" | "poste" | "pathologie",
    label: string,
    type: "text" | "number" = "text",
  ) => (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Input
        type={type}
        className="h-8 text-sm"
        value={
          type === "number" && Number(selectedAthlete[key]) === 0
            ? ""
            : String(selectedAthlete[key])
        }
        onChange={(event) =>
          updateAthlete(selectedAthlete.id, {
            [key]:
              type === "number" ? Number(event.target.value) : event.target.value,
          })
        }
      />
    </div>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-cyan-900/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="brand-logo-tile h-16 w-16">
              <img
                src="/logo.png"
                alt="Logo du cabinet"
                className="h-16 w-16"
              />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-[#08274d]">Neurocognitive</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#227ca7]">
                Performance sportive
              </p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto rounded-lg border border-cyan-100 bg-white p-1 shadow-[var(--shadow-card)]">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-slate-600 transition-colors hover:bg-cyan-50 hover:text-[#06335f] data-[status=active]:bg-[#fff0f1] data-[status=active]:font-semibold data-[status=active]:text-[#b50014]"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="h-1 rounded-full bg-[linear-gradient(90deg,#0a3b66_0%,#1d8fbd_38%,#f3c400_58%,#1fa64a_76%,#c60018_100%)]" />

        {showAthletePanel && (
          <section className="rounded-xl border border-cyan-100 bg-white/95 px-3 py-2 shadow-[0_1px_2px_rgba(8,39,77,0.05),0_10px_24px_rgba(8,39,77,0.05)]">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex w-full flex-col gap-1 md:max-w-sm md:flex-row md:items-center">
                <Label
                  htmlFor="athlete-search"
                  className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#0b7a8f] md:w-32"
                >
                  Selection du sportif
                </Label>
                <div className="relative min-w-0 flex-1">
                  <Input
                    id="athlete-search"
                    className="h-8 rounded-lg border-cyan-100 bg-cyan-50/45 text-sm shadow-none focus-visible:ring-cyan-300"
                    value={athleteSearch}
                    onChange={(event) => handleAthleteSearch(event.target.value)}
                    onFocus={() =>
                      setAthleteSearchOpen(normalizeSearch(athleteSearch).length >= 2)
                    }
                    onBlur={() => window.setTimeout(() => setAthleteSearchOpen(false), 120)}
                    placeholder="Tape les 2 premieres lettres..."
                  />
                  {athleteSearchOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-cyan-100 bg-white p-1 shadow-lg">
                      {filteredAthleteOptions.length ? (
                        filteredAthleteOptions.map(({ athlete, label }) => (
                          <button
                            key={athlete.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm text-slate-700 hover:bg-cyan-50 hover:text-[#06335f]"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleAthleteSelect(athlete.id, label)}
                          >
                            <span className="font-medium">{label}</span>
                            <span className="ml-3 truncate text-xs text-muted-foreground">
                              {[athlete.discipline, athlete.poste].filter(Boolean).join(" - ")}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          Aucun sportif trouve
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <label className="flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-cyan-100 bg-cyan-50/80 px-3 text-sm font-medium text-[#08274d] transition-colors hover:bg-cyan-100/70">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#0b7a8f]"
                  checked={athleteFormOpen}
                  onChange={(event) => handleNewAthleteToggle(event.target.checked)}
                />
                <UserPlus className="h-4 w-4" />
                Nouveau sportif
              </label>
            </div>

            {athleteFormOpen && (
              <>
                <div className="mt-3 grid gap-2 border-t border-cyan-100 pt-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                  {field("prenom", "Prenom")}
                  {field("nom", "Nom")}
                  {field("age", "Age", "number")}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Sexe
                    </Label>
                    <Select
                      value={selectedAthlete.sexe}
                      onValueChange={(value) =>
                        updateAthlete(selectedAthlete.id, {
                          sexe: value as "Homme" | "Femme",
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Homme">Homme</SelectItem>
                        <SelectItem value="Femme">Femme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {field("discipline", "Discipline")}
                  {field("poste", "Poste")}
                  {field("pathologie", "Pathologie")}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Niveau sportif
                    </Label>
                    <Input
                      className="h-8 text-sm"
                      value={selectedAthlete.niveau}
                      onChange={(event) =>
                        updateAthlete(selectedAthlete.id, { niveau: event.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-cyan-100 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={handleClearAthleteData}
                  >
                    <Trash2 className="h-4 w-4" />
                    Effacer les donnees
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={handleDeleteAthlete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer le sportif
                  </Button>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </header>
  );
}
