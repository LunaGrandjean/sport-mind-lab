import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Brain,
  ChevronRight,
  ClipboardList,
  Eye,
  Hand,
  Medal,
  MousePointer2,
  Radar as RadarIcon,
  Route as RouteIcon,
  ScanEye,
  Timer,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import {
  AXES,
  AXIS_SHORT,
  fullName,
  type Athlete,
  type Axis,
  type Result,
} from "@/lib/domain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accueil - Top performances neurocognitives" },
      {
        name: "description",
        content:
          "Tableau des meilleures performances neurocognitives du cabinet par axe radar.",
      },
    ],
  }),
  component: Accueil,
});

const AXIS_ICONS: Record<Axis, LucideIcon> = {
  "Dissociation motrice": RouteIcon,
  "Précision motrice": MousePointer2,
  "Vitesse motrice / CPS": Zap,
  "Mémoire billard": Brain,
  "Suivi visuel multi-objets": ScanEye,
  "Captation information visuelle": Eye,
  "Vision périphérique": RadarIcon,
  Attention: Hand,
  Inhibition: Activity,
  "Temps perception / traitement / décision / réaction": Timer,
};

const RANK_STYLES = [
  "border-amber-300 bg-amber-100 text-amber-700 shadow-amber-200/70",
  "border-slate-300 bg-slate-100 text-slate-600 shadow-slate-200/80",
  "border-orange-300 bg-orange-100 text-orange-700 shadow-orange-200/70",
];

const AXIS_HEADER_STYLES: Record<Axis, string> = {
  "Dissociation motrice": "from-[#073b63] to-[#137eab]",
  "Précision motrice": "from-[#064f71] to-[#1aa6c8]",
  "Vitesse motrice / CPS": "from-[#08274d] to-[#0f5f9b]",
  "Mémoire billard": "from-[#24406f] to-[#5a77b7]",
  "Suivi visuel multi-objets": "from-[#006b82] to-[#26abc2]",
  "Captation information visuelle": "from-[#087660] to-[#20a871]",
  "Vision périphérique": "from-[#0b4b8d] to-[#0aa0c4]",
  Attention: "from-[#9f161d] to-[#d33b36]",
  Inhibition: "from-[#0f5132] to-[#2aa658]",
  "Temps perception / traitement / décision / réaction": "from-[#8a5b00] to-[#d8aa16]",
};

interface TopEntry {
  athlete: Athlete;
  score: number;
  date: string;
}

function topByAxis(axis: Axis, athletes: Athlete[], results: Result[]) {
  const athletesById = new Map(athletes.map((athlete) => [athlete.id, athlete]));
  const bestByAthlete = new Map<string, TopEntry>();

  for (const result of results) {
    if (result.axis !== axis) continue;
    const athlete = athletesById.get(result.athleteId);
    if (!athlete) continue;

    const previous = bestByAthlete.get(result.athleteId);
    if (!previous || result.score > previous.score) {
      bestByAthlete.set(result.athleteId, {
        athlete,
        score: result.score,
        date: result.date,
      });
    }
  }

  return [...bestByAthlete.values()]
    .sort((a, b) => b.score - a.score || b.date.localeCompare(a.date))
    .slice(0, 3);
}

function athleteLabel(athlete: Athlete) {
  return fullName(athlete).trim() || "Sportif sans nom";
}

function athleteMeta(athlete: Athlete) {
  return [athlete.discipline, athlete.poste || athlete.niveau]
    .filter(Boolean)
    .join(" - ");
}

function Accueil() {
  const { athletes, results, selectedAthlete } = useAppStore();
  const profileLabel = athleteLabel(selectedAthlete);
  const topBoards = AXES.map((axis) => ({
    axis,
    entries: topByAxis(axis, athletes, results),
  }));

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-cyan-100 bg-white shadow-[var(--shadow-card)]">
        <div className="bg-[linear-gradient(100deg,#061b3c_0%,#083c68_44%,#167fa9_100%)] px-6 py-5 text-center text-white">
          <p className="text-2xl font-semibold uppercase tracking-[0.18em]">
            Top performances
          </p>
        </div>
        <div className="h-1 bg-[linear-gradient(90deg,#0a3b66_0%,#1d8fbd_38%,#f3c400_58%,#1fa64a_76%,#c60018_100%)]" />
        <div className="border-b border-cyan-100 bg-cyan-50/40 px-6 py-3 text-center">
          <p className="text-sm font-semibold text-[#08274d]">
            Cabinet Neuro-Cognitif V. Rumeau
          </p>
        </div>

        <div className="grid gap-x-7 gap-y-7 bg-[linear-gradient(180deg,#ffffff_0%,#f7fcff_100%)] p-5 sm:p-6 lg:grid-cols-2 xl:grid-cols-3">
          {topBoards.map(({ axis, entries }) => (
            <PerformancePanel key={axis} axis={axis} entries={entries} />
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-cyan-100 bg-[linear-gradient(90deg,#f0fbff_0%,#fffdf3_55%,#fff4f5_100%)] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="logo-dark-tile h-14 w-14 rounded-xl">
              <img src="/logo.png" alt="Logo du cabinet" className="h-12 w-12" />
            </span>
            <div>
              <p className="text-sm font-semibold">Profil actif : {profileLabel}</p>
              <p className="text-xs text-muted-foreground">
                {results.length} résultat(s) enregistré(s) pour {athletes.length} sportif(s).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/tests">
                Lancer un test
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-2">
              <Link to="/resultats">
                Voir le dashboard
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat
          icon={Users}
          label="Sportifs suivis"
          value={athletes.length}
          color="bg-cyan-100 text-cyan-800"
        />
        <MiniStat
          icon={ClipboardList}
          label="Résultats enregistrés"
          value={results.length}
          color="bg-red-100 text-red-700"
        />
        <MiniStat
          icon={Trophy}
          label="Axes classés"
          value={AXES.length}
          color="bg-amber-100 text-amber-700"
        />
      </div>
    </div>
  );
}

function PerformancePanel({ axis, entries }: { axis: Axis; entries: TopEntry[] }) {
  const Icon = AXIS_ICONS[axis];
  const rows = [0, 1, 2];

  return (
    <article className="min-w-0">
      <div
        className={`flex items-center justify-between border-b-2 border-[#071b3d] bg-gradient-to-r px-3 py-1.5 text-white ${AXIS_HEADER_STYLES[axis]}`}
      >
        <h2 className="truncate text-sm font-semibold italic">{AXIS_SHORT[axis]}</h2>
        <Icon className="h-4 w-4 shrink-0 text-cyan-100" />
      </div>

      <div className="divide-y divide-slate-300 border-b border-slate-400">
        {rows.map((rank) => {
          const entry = entries[rank];
          return (
            <div
              key={rank}
              className="grid grid-cols-[32px_minmax(0,1fr)_44px] items-center gap-2 py-2"
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-full border shadow-sm ${RANK_STYLES[rank]}`}
                title={`Rang ${rank + 1}`}
              >
                <Medal className="h-4 w-4" />
              </span>

              {entry ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {athleteLabel(entry.athlete)}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {athleteMeta(entry.athlete) || "Profil à compléter"}
                  </p>
                </div>
              ) : (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-300">
                    Aucune donnée
                  </p>
                  <p className="truncate text-[11px] text-slate-300">Score à enregistrer</p>
                </div>
              )}

              <span className="text-right text-lg font-semibold tabular-nums text-[#c60018]">
                {entry ? `${entry.score}/20` : "-"}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-cyan-100 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
      <span className={`grid h-9 w-9 place-items-center rounded-md ${color}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
