import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { ToolAppCard } from "@/components/tools/ToolAppCard";
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
          "Batterie de tests neurocognitifs avec conversion automatique des resultats bruts en note radar /20.",
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
      toast.success(`${event.data.label ?? "Resultat"} detecte automatiquement`);
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
      toast.error("Resultat brut invalide");
      return;
    }

    const note = noteFromRaw(active.axis, numericRawScore);
    if (note === null) {
      toast.error("Aucune note trouvee dans le bareme pour ce resultat");
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
    toast.success(`Resultat enregistre - ${active.title} : ${note}/20`);
    setActive(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tests"
        description="Lance le test, lis son resultat brut, puis l'application calcule automatiquement la note radar /20."
        actions={
          <span className="rounded-full border border-cyan-100 bg-white px-3 py-1 text-xs font-semibold text-[#0b7a8f] shadow-sm">
            {HTML_TESTS.length} tests disponibles
          </span>
        }
      />

      <div className="grid items-stretch gap-4 md:grid-cols-2">
        {HTML_TESTS.map((test) => (
          <ToolAppCard
            key={test.id}
            tool={test}
            badge="/20"
            actionLabel="Lancer le test"
            onLaunch={() => launch(test)}
            details={
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0b7a8f]">
                    Objectif
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-slate-700">
                    {test.objective}
                  </p>
                </div>
                <p className="text-[12px] leading-snug text-muted-foreground">
                  {test.instructions}
                </p>
                {test.axis && (
                  <p className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-medium text-[#0b7a8f] ring-1 ring-cyan-100">
                    {baremeForAxis(test.axis).label}
                  </p>
                )}
              </div>
            }
          />
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="flex max-h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription>
              Le test HTML est charge dans l'application. Le panneau sons flottant peut
              rester actif en parallele.
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
                <p className="text-sm font-semibold">Conversion bareme</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Renseigne le resultat brut affiche par le test. La note radar /20 est
                  calculee automatiquement.
                </p>
              </div>

              <div className="space-y-2">
                <Label>{activeBareme?.rawLabel ?? "Resultat brut"}</Label>
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
                    Bareme utilise : {activeBareme.label}
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
