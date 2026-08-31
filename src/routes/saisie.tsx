import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fullName, type Axis } from "@/lib/domain";
import { baremeForAxis, noteFromRaw } from "@/lib/scoring";
import { MANUAL_SCORE_AXES } from "@/lib/test-definitions";
import { useAppStore } from "@/store/app-store";

function emptyManualScores() {
  return Object.fromEntries(MANUAL_SCORE_AXES.map((axis) => [axis, ""])) as Record<
    Axis,
    string
  >;
}

export const Route = createFileRoute("/saisie")({
  head: () => ({
    meta: [
      { title: "Saisie manuelle - scores neurocognitifs" },
      {
        name: "description",
        content:
          "Saisie des résultats bruts réalisés au cabinet avec conversion automatique en note /20.",
      },
    ],
  }),
  component: Saisie,
});

function Saisie() {
  const { selectedAthlete, addResults } = useAppStore();
  const selectedName = fullName(selectedAthlete).trim() || "Nouveau sportif";

  const [rawScores, setRawScores] = useState<Record<Axis, string>>(emptyManualScores);
  const [mode, setMode] = useState("Cabinet");
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    setRawScores(emptyManualScores());
    setMode("Cabinet");
    setCommentaire("");
  }, [selectedAthlete.id]);

  const save = () => {
    const entries = MANUAL_SCORE_AXES.flatMap((axis) => {
      const value = rawScores[axis];
      if (!value) return [];
      const rawScore = Number(value);
      if (Number.isNaN(rawScore)) return [];
      const note = noteFromRaw(axis, rawScore);
      if (note === null) return [];
      return [
        {
          athleteId: selectedAthlete.id,
          axis,
          score: note,
          rawScore,
          mode,
          niveau: selectedAthlete.niveau,
          commentaire,
          source: "manuel" as const,
        },
      ];
    });

    if (!entries.length) {
      toast.warning("Aucun résultat brut valide à enregistrer");
      return;
    }

    addResults(entries);
    toast.success(`${entries.length} note(s) /20 enregistrée(s)`);
    setRawScores(emptyManualScores());
    setCommentaire("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saisie manuelle"
        description={`Résultats bruts cabinet pour ${selectedName}. La note radar /20 est calculée automatiquement avec le barème.`}
        actions={
          <Button asChild variant="outline">
            <Link to="/resultats">Voir le dashboard</Link>
          </Button>
        }
      />

      <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MANUAL_SCORE_AXES.map((axis) => {
            const bareme = baremeForAxis(axis);
            const rawScore = rawScores[axis];
            const note = rawScore === "" ? null : noteFromRaw(axis, Number(rawScore));

            return (
              <div key={axis} className="space-y-2 rounded-md border border-border p-3">
                <div>
                  <Label>{axis}</Label>
                  <p className="mt-1 text-xs text-muted-foreground">{bareme.label}</p>
                </div>
                <Input
                  type="number"
                  step="any"
                  placeholder={bareme.rawLabel}
                  value={rawScore}
                  onChange={(event) =>
                    setRawScores((prev) => ({
                      ...prev,
                      [axis]: event.target.value,
                    }))
                  }
                />
                <div className="flex items-center justify-between rounded-md bg-cyan-50 px-3 py-2 text-sm">
                  <span className="text-cyan-900">Note radar</span>
                  <span className="font-semibold tabular-nums text-primary">
                    {note === null ? "-/20" : `${note}/20`}
                  </span>
                </div>
              </div>
            );
          })}
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
            Enregistrer les notes /20
          </Button>
        </div>
      </section>
    </div>
  );
}
