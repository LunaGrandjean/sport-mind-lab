import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/app-store";
import { MANUAL_SCORE_AXES } from "@/lib/test-definitions";
import { fullName, type Axis } from "@/lib/domain";

function emptyManualScores() {
  return Object.fromEntries(MANUAL_SCORE_AXES.map((axis) => [axis, ""])) as Record<
    Axis,
    string
  >;
}

export const Route = createFileRoute("/saisie")({
  head: () => ({
    meta: [
      { title: "Saisie manuelle — scores neurocognitifs" },
      {
        name: "description",
        content:
          "Saisie des scores réalisés au cabinet avec haltères, pods ou protocoles externes.",
      },
    ],
  }),
  component: Saisie,
});

function Saisie() {
  const { selectedAthlete, addResults } = useAppStore();
  const selectedName = fullName(selectedAthlete).trim() || "Nouveau sportif";

  const [scores, setScores] = useState<Record<Axis, string>>(emptyManualScores);
  const [mode, setMode] = useState("Cabinet");
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    setScores(emptyManualScores());
    setMode("Cabinet");
    setCommentaire("");
  }, [selectedAthlete.id]);

  const save = () => {
    const entries = MANUAL_SCORE_AXES.flatMap((axis) => {
      const value = scores[axis];
      if (!value) return [];
      const score = Math.max(0, Math.min(100, Number(value)));
      if (Number.isNaN(score)) return [];
      return [
        {
          athleteId: selectedAthlete.id,
          axis,
          score,
          mode,
          niveau: selectedAthlete.niveau,
          commentaire,
          source: "manuel" as const,
        },
      ];
    });

    if (!entries.length) {
      toast.warning("Aucun score valide à enregistrer");
      return;
    }

    addResults(entries);
    toast.success(`${entries.length} score(s) enregistré(s)`);
    setScores(emptyManualScores());
    setCommentaire("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saisie manuelle"
        description={`Scores cabinet pour ${selectedName} : haltères, pods, attention, inhibition et temps de traitement.`}
        actions={
          <Button asChild variant="outline">
            <Link to="/resultats">Voir le dashboard</Link>
          </Button>
        }
      />

      <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MANUAL_SCORE_AXES.map((axis) => (
            <div key={axis} className="space-y-2">
              <Label>{axis}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Score 0-100"
                value={scores[axis]}
                onChange={(event) =>
                  setScores((prev) => ({ ...prev, [axis]: event.target.value }))
                }
              />
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label>Mode / protocole</Label>
            <Input value={mode} onChange={(event) => setMode(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Commentaire commun</Label>
            <Textarea
              value={commentaire}
              onChange={(event) => setCommentaire(event.target.value)}
              placeholder="Optionnel"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button className="gap-2" onClick={save}>
            <Save className="h-4 w-4" />
            Enregistrer les scores
          </Button>
        </div>
      </section>
    </div>
  );
}
