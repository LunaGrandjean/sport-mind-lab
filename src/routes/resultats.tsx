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

export const Route = createFileRoute("/resultats")({
  head: () => ({
    meta: [
      { title: "Résultats & dashboard neurocognitif" },
      {
        name: "description",
        content:
          "Diagramme radar 10 axes, statistiques du cabinet, comparaison par groupe et meilleurs scores du sportif.",
      },
      { property: "og:title", content: "Résultats & dashboard neurocognitif" },
      {
        property: "og:description",
        content: "Radar 10 axes, comparaisons par groupe et meilleurs scores.",
      },
    ],
  }),
  component: Resultats,
});

function Resultats() {
  const { athletes, results, selectedAthlete } = useAppStore();
  const [group, setGroup] = useState<GroupKey>("tous");

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
        description={`${fullName(selectedAthlete)} · ${selectedAthlete.discipline} · ${selectedAthlete.niveau}`}
        actions={
          <div className="w-64">
            <Select value={group} onValueChange={(v) => setGroup(v as GroupKey)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(GROUP_LABELS) as GroupKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {GROUP_LABELS[k]}
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
          <h2 className="text-sm font-semibold">Profil neurocognitif — 10 axes</h2>
          <RadarPerformance
            data={radarData}
            athleteName={fullName(selectedAthlete)}
            groupLabel={GROUP_LABELS[group]}
          />
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Meilleurs scores</h2>
          <div className="mt-4 space-y-3">
            {best.map((b) => (
              <div key={b.axis}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{b.axis}</span>
                  <span className="font-medium tabular-nums">{b.athlete}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${b.athlete ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-x-auto rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Axe</th>
              <th className="px-4 py-3 font-medium">Score sportif</th>
              <th className="px-4 py-3 font-medium">Moyenne groupe</th>
              <th className="px-4 py-3 font-medium">Écart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {radarData.map((d) => {
              const delta =
                d.athlete !== null && d.group !== null ? d.athlete - d.group : null;
              return (
                <tr key={d.axis}>
                  <td className="px-4 py-2.5">{d.axis}</td>
                  <td className="px-4 py-2.5 tabular-nums">{d.athlete ?? "—"}</td>
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                    {d.group ?? "—"}
                  </td>
                  <td
                    className={`px-4 py-2.5 tabular-nums ${
                      delta !== null && delta < 0 ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
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
