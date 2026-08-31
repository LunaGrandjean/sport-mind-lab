import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, ClipboardList, Radar as RadarIcon, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { RadarPerformance } from "@/components/dashboard/RadarPerformance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";
import {
  AXES,
  AXIS_SHORT,
  GROUP_LABELS,
  averageByAxis,
  fullName,
  matchesGroup,
  type GroupKey,
} from "@/lib/domain";
import { RADAR_MAX_SCORE } from "@/lib/scoring";

export const Route = createFileRoute("/resultats")({
  head: () => ({
    meta: [
      { title: "Résultats & dashboard neurocognitif" },
      {
        name: "description",
        content:
          "Diagramme radar 10 axes, statistiques du cabinet, comparaison par groupe et meilleurs scores du sportif.",
      },
    ],
  }),
  component: Resultats,
});

function Resultats() {
  const { athletes, results, selectedAthlete } = useAppStore();
  const [group, setGroup] = useState<GroupKey>("tous");
  const selectedName = fullName(selectedAthlete).trim() || "Nouveau sportif";
  const profileMeta = [selectedAthlete.discipline, selectedAthlete.niveau]
    .filter(Boolean)
    .join(" · ");

  const athleteResults = useMemo(
    () => results.filter((r) => r.athleteId === selectedAthlete.id),
    [results, selectedAthlete.id],
  );

  const groupIds = useMemo(
    () =>
      new Set(
        athletes.filter((a) => matchesGroup(selectedAthlete, a, group)).map((a) => a.id),
      ),
    [athletes, selectedAthlete, group],
  );

  const radarData = useMemo(() => {
    const mine = averageByAxis(athleteResults);
    const theirs = averageByAxis(results.filter((r) => groupIds.has(r.athleteId)));
    return AXES.map((axis) => ({
      axis: AXIS_SHORT[axis],
      athlete: mine[axis],
      group: theirs[axis],
    }));
  }, [athleteResults, results, groupIds]);

  const usedAxes = radarData.filter((d) => d.athlete !== null).length;

  const best = useMemo(
    () =>
      [...radarData]
        .filter((d) => d.athlete !== null)
        .sort((a, b) => (b.athlete ?? 0) - (a.athlete ?? 0))
        .slice(0, 5),
    [radarData],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Résultats / Dashboard"
        description={`${selectedName}${profileMeta ? ` · ${profileMeta}` : ""}`}
        actions={
          <div className="w-64">
            <Select value={group} onValueChange={(v) => setGroup(v as GroupKey)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(GROUP_LABELS) as GroupKey[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {GROUP_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sportifs" value={athletes.length} icon={Users} />
        <StatCard label="Résultats" value={results.length} icon={ClipboardList} />
        <StatCard
          label="Scores dans l'araignée"
          value={`${usedAxes} / ${AXES.length}`}
          icon={RadarIcon}
        />
        <StatCard
          label="Comparaison"
          value={groupIds.size}
          hint={GROUP_LABELS[group]}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="text-sm font-semibold">Profil neurocognitif — 10 axes /20</h2>
          <RadarPerformance
            data={radarData}
            athleteName={selectedName}
            groupLabel={GROUP_LABELS[group]}
          />
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Meilleurs scores</h2>
          <div className="mt-4 space-y-3">
            {best.length ? (
              best.map((item) => (
                <div key={item.axis}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.axis}</span>
                    <span className="font-medium tabular-nums">{item.athlete}/20</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{
                        width: `${((item.athlete ?? 0) / RADAR_MAX_SCORE) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun score enregistré pour le moment.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="overflow-x-auto rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Axe</th>
              <th className="px-4 py-3 font-medium">Note sportif /20</th>
              <th className="px-4 py-3 font-medium">Moyenne groupe /20</th>
              <th className="px-4 py-3 font-medium">Écart /20</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {radarData.map((item) => {
              const delta =
                item.athlete !== null && item.group !== null
                  ? item.athlete - item.group
                  : null;
              return (
                <tr key={item.axis}>
                  <td className="px-4 py-2.5">{item.axis}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {item.athlete === null ? "-" : `${item.athlete}/20`}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                    {item.group === null ? "-" : `${item.group}/20`}
                  </td>
                  <td
                    className={`px-4 py-2.5 tabular-nums ${
                      delta !== null && delta < 0 ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {delta === null ? "-" : `${delta > 0 ? "+" : ""}${delta}/20`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
