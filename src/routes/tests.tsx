import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";
import type { Axis } from "@/lib/domain";

interface TestDef {
  axis: Axis;
  objectif: string;
  consigne: string;
}

const TESTS: TestDef[] = [
  {
    axis: "Vitesse motrice / CPS",
    objectif: "Mesurer la fréquence maximale de clics et la stabilité motrice.",
    consigne: "Cliquer le plus vite possible pendant 10 secondes sans rompre le rythme.",
  },
  {
    axis: "Captation information visuelle",
    objectif: "Évaluer la vitesse de prise d'information sur stimulus bref.",
    consigne: "Identifier la cible affichée brièvement puis répondre immédiatement.",
  },
  {
    axis: "Suivi visuel multi-objets",
    objectif: "Évaluer la capacité de suivi simultané de plusieurs mobiles.",
    consigne: "Mémoriser les cibles puis les désigner après déplacement.",
  },
  {
    axis: "Vision périphérique",
    objectif: "Mesurer la détection en champ visuel périphérique.",
    consigne: "Fixer le point central et signaler chaque apparition latérale.",
  },
  {
    axis: "Mémoire billard",
    objectif: "Évaluer la mémoire spatiale de positions et de trajectoires.",
    consigne: "Retenir la position des billes puis les replacer après masquage.",
  },
];

export const Route = createFileRoute("/tests")({
  head: () => ({
    meta: [
      { title: "Tests neurocognitifs — cabinet sportif" },
      {
        name: "description",
        content:
          "Batterie de tests neurocognitifs lançables : vitesse motrice, captation visuelle, suivi multi-objets, vision périphérique, mémoire billard.",
      },
      { property: "og:title", content: "Tests neurocognitifs — cabinet sportif" },
      {
        property: "og:description",
        content: "Lancer les tests et enregistrer les scores dans le profil radar.",
      },
    ],
  }),
  component: Tests,
});

function Tests() {
  const { selectedAthlete, addResults } = useAppStore();
  const [active, setActive] = useState<TestDef | null>(null);
  const [score, setScore] = useState("75");

  const save = () => {
    if (!active) return;
    addResults([
      {
        athleteId: selectedAthlete.id,
        axis: active.axis,
        score: Math.max(0, Math.min(100, Number(score))),
        mode: "Standard",
        niveau: selectedAthlete.niveau,
        source: "test",
      },
    ]);
    toast.success(`Résultat enregistré — ${active.axis}`);
    setActive(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        description="Tests générant un score sur les axes du diagramme radar."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TESTS.map((t) => (
          <article
            key={t.axis}
            className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          >
            <h2 className="text-sm font-semibold">{t.axis}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.objectif}</p>
            <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              {t.consigne}
            </p>
            <Button
              className="mt-4 w-full gap-2"
              onClick={() => {
                setActive(t);
                setScore("75");
              }}
            >
              <Play className="h-4 w-4" />
              Lancer
            </Button>
          </article>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{active?.axis}</DialogTitle>
            <DialogDescription>{active?.consigne}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Score obtenu (0-100)</Label>
            <Input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Le module de passation sera branché ici ; le score est pour l'instant
              validé manuellement.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Annuler
            </Button>
            <Button onClick={save}>Enregistrer le résultat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
