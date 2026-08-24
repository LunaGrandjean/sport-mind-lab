import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Play, Save } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/app-store";
import {
  HTML_TESTS,
  toolUrlWithAthlete,
  type HtmlTool,
} from "@/lib/test-definitions";

export const Route = createFileRoute("/tests")({
  head: () => ({
    meta: [
      { title: "Tests neurocognitifs — cabinet sportif" },
      {
        name: "description",
        content:
          "Batterie de tests neurocognitifs lançables avec score radar : CPS, captation visuelle, suivi multi-objets, vision périphérique, mémoire billard.",
      },
    ],
  }),
  component: Tests,
});

function Tests() {
  const { selectedAthlete, addResults } = useAppStore();
  const [active, setActive] = useState<HtmlTool | null>(null);
  const [score, setScore] = useState("75");
  const [mode, setMode] = useState("Standard");
  const [commentaire, setCommentaire] = useState("");

  const launch = (test: HtmlTool) => {
    setActive(test);
    setScore("75");
    setMode("Standard");
    setCommentaire("");
  };

  const save = () => {
    if (!active?.axis) return;
    const numericScore = Math.max(0, Math.min(100, Number(score)));
    if (Number.isNaN(numericScore)) {
      toast.error("Score invalide");
      return;
    }
    addResults([
      {
        athleteId: selectedAthlete.id,
        axis: active.axis,
        score: numericScore,
        mode,
        niveau: selectedAthlete.niveau,
        commentaire,
        source: "test",
      },
    ]);
    toast.success(`Résultat enregistré — ${active.title}`);
    setActive(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        description="Tests qui alimentent le diagramme radar. Le module sons reste utilisable pendant la passation."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {HTML_TESTS.map((test) => (
          <article
            key={test.id}
            className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">{test.title}</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                Radar
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{test.description}</p>
            <div className="mt-4 space-y-2 rounded-md bg-muted px-3 py-3 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Objectif :</span>{" "}
                {test.objective}
              </p>
              <p>
                <span className="font-medium text-foreground">Consigne :</span>{" "}
                {test.instructions}
              </p>
            </div>
            <Button className="mt-4 w-full gap-2" onClick={() => launch(test)}>
              <Play className="h-4 w-4" />
              Lancer le test
            </Button>
          </article>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription>
              Le test HTML est chargé dans l'application. Le panneau sons flottant peut
              rester actif en parallèle.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-[70vh] gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-h-[60vh] bg-muted">
              {active && (
                <iframe
                  title={active.title}
                  src={toolUrlWithAthlete(active.htmlPath, selectedAthlete)}
                  className="h-full min-h-[70vh] w-full border-0 bg-white"
                  allow="fullscreen; autoplay"
                />
              )}
            </div>

            <aside className="space-y-4 border-l border-border bg-card p-5">
              <div>
                <p className="text-sm font-semibold">Enregistrement radar</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  En attendant une extraction automatique JS de chaque test, renseigne le
                  score global à conserver.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Score obtenu (0-100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(event) => setScore(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Mode / protocole</Label>
                <Input value={mode} onChange={(event) => setMode(event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Commentaire</Label>
                <Textarea
                  value={commentaire}
                  onChange={(event) => setCommentaire(event.target.value)}
                  placeholder="Optionnel"
                />
              </div>

              {active && (
                <Button asChild variant="outline" className="w-full gap-2">
                  <a
                    href={toolUrlWithAthlete(active.htmlPath, selectedAthlete)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir dans un onglet
                  </a>
                </Button>
              )}
            </aside>
          </div>

          <DialogFooter className="border-t border-border px-5 py-4">
            <Button variant="outline" onClick={() => setActive(null)}>
              Fermer
            </Button>
            <Button className="gap-2" onClick={save}>
              <Save className="h-4 w-4" />
              Enregistrer le résultat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
