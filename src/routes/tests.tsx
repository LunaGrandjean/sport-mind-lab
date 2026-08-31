import { useEffect, useState } from "react";
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
import { baremeForAxis, noteFromRaw } from "@/lib/scoring";
import {
  HTML_TESTS,
  toolUrlWithAthlete,
  type HtmlTool,
} from "@/lib/test-definitions";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/tests")({
  head: () => ({
    meta: [
      { title: "Tests neurocognitifs - cabinet sportif" },
      {
        name: "description",
        content:
          "Batterie de tests neurocognitifs avec conversion automatique des résultats bruts en note radar /20.",
      },
    ],
  }),
  component: Tests,
});

function Tests() {
  const { selectedAthlete, addResults } = useAppStore();
  const [active, setActive] = useState<HtmlTool | null>(null);
  const [rawScore, setRawScore] = useState("");
  const [mode, setMode] = useState("Standard");
  const [commentaire, setCommentaire] = useState("");

  const activeBareme = active?.axis ? baremeForAxis(active.axis) : null;
  const computedScore =
    active?.axis && rawScore !== "" ? noteFromRaw(active.axis, Number(rawScore)) : null;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "sport-mind-lab:test-result") return;
      setRawScore(String(event.data.rawScore));
      toast.success(`${event.data.label ?? "Résultat"} détecté automatiquement`);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const launch = (test: HtmlTool) => {
    setActive(test);
    setRawScore("");
    setMode("Standard");
    setCommentaire("");
  };

  const save = () => {
    if (!active?.axis) return;
    const numericRawScore = Number(rawScore);
    if (rawScore === "" || Number.isNaN(numericRawScore)) {
      toast.error("Résultat brut invalide");
      return;
    }

    const note = noteFromRaw(active.axis, numericRawScore);
    if (note === null) {
      toast.error("Aucune note trouvée dans le barème pour ce résultat");
      return;
    }

    addResults([
      {
        athleteId: selectedAthlete.id,
        axis: active.axis,
        score: note,
        rawScore: numericRawScore,
        mode,
        niveau: selectedAthlete.niveau,
        commentaire,
        source: "test",
      },
    ]);
    toast.success(`Résultat enregistré - ${active.title} : ${note}/20`);
    setActive(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        description="Lance le test, lis son résultat brut, puis l'application calcule automatiquement la note radar /20."
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
                /20
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
              {test.axis && (
                <p>
                  <span className="font-medium text-foreground">Barème :</span>{" "}
                  {baremeForAxis(test.axis).label}
                </p>
              )}
            </div>
            <Button className="mt-4 w-full gap-2" onClick={() => launch(test)}>
              <Play className="h-4 w-4" />
              Lancer le test
            </Button>
          </article>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="flex max-h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription>
              Le test HTML est chargé dans l'application. Le panneau sons flottant peut
              rester actif en parallèle.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-h-[60vh] overflow-hidden bg-muted lg:min-h-0">
              {active && (
                <iframe
                  title={active.title}
                  src={toolUrlWithAthlete(active.htmlPath, selectedAthlete)}
                  className="h-[68vh] w-full border-0 bg-white lg:h-full"
                  allow="fullscreen; autoplay"
                />
              )}
            </div>

            <aside className="max-h-[68vh] space-y-4 overflow-y-auto border-l border-border bg-card p-5 lg:max-h-none">
              <div>
                <p className="text-sm font-semibold">Conversion barème</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Renseigne le résultat brut affiché par le test. La note radar /20 est
                  calculée automatiquement.
                </p>
              </div>

              <div className="space-y-2">
                <Label>{activeBareme?.rawLabel ?? "Résultat brut"}</Label>
                <Input
                  type="number"
                  step="any"
                  value={rawScore}
                  onChange={(event) => setRawScore(event.target.value)}
                />
              </div>

              <div className="rounded-md border border-cyan-100 bg-cyan-50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-cyan-900">
                  Note radar
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
                  {computedScore === null ? "-/20" : `${computedScore}/20`}
                </p>
                {activeBareme && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Barème utilisé : {activeBareme.label}
                  </p>
                )}
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

          <DialogFooter className="shrink-0 border-t border-border px-5 py-4">
            <Button variant="outline" onClick={() => setActive(null)}>
              Fermer
            </Button>
            <Button className="gap-2" onClick={save}>
              <Save className="h-4 w-4" />
              Enregistrer la note /20
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
