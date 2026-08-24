import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, ClipboardList, Activity, Radar as RadarIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { AXES, fullName } from "@/lib/domain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accueil — Performance neurocognitive sportive" },
      {
        name: "description",
        content:
          "Vue d'ensemble du cabinet : sportifs suivis, résultats enregistrés et accès rapide aux tests neurocognitifs.",
      },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  const { athletes, results, selectedAthlete } = useAppStore();
  const athleteResults = results.filter((r) => r.athleteId === selectedAthlete.id);
  const profileLabel = fullName(selectedAthlete).trim() || "Nouveau sportif";
  const profileMeta = [selectedAthlete.discipline, selectedAthlete.poste]
    .filter(Boolean)
    .join(" · ");

  const cards = [
    {
      to: "/resultats",
      title: "Résultats / Dashboard",
      text: "Profil radar 10 axes, comparaison par groupe et meilleurs scores.",
    },
    {
      to: "/tests",
      title: "Tests",
      text: "Batterie de tests neurocognitifs générant des scores radar.",
    },
    {
      to: "/applications",
      title: "Applications de travail",
      text: "Outils d'entraînement et de double tâche sans score radar.",
    },
    {
      to: "/saisie",
      title: "Saisie manuelle",
      text: "Scores cabinet réalisés avec haltères, pods ou protocoles externes.",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accueil"
        description={`Profil actif : ${profileLabel}${profileMeta ? ` · ${profileMeta}` : ""}`}
        actions={
          <Button asChild>
            <Link to="/tests">Lancer un test</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sportifs suivis" value={athletes.length} icon={Users} />
        <StatCard label="Résultats enregistrés" value={results.length} icon={ClipboardList} />
        <StatCard
          label="Résultats du profil"
          value={athleteResults.length}
          icon={Activity}
        />
        <StatCard label="Axes du radar" value={AXES.length} icon={RadarIcon} />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40"
          >
            <p className="text-sm font-semibold">{card.title}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{card.text}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold">Derniers résultats du profil</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {athleteResults
            .slice(-6)
            .reverse()
            .map((result) => (
              <li key={result.id} className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">{result.axis}</span>
                <span className="font-medium tabular-nums">{result.score}</span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
