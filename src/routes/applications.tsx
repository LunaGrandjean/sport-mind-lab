import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Play } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PRACTICE_APPS, type HtmlTool } from "@/lib/test-definitions";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Applications de travail — cabinet sportif" },
      {
        name: "description",
        content:
          "Applications d'entraînement et de double tâche : sons, dés, défilement, laser, Komboid et mémoire en mouvement.",
      },
    ],
  }),
  component: Applications,
});

function Applications() {
  const [active, setActive] = useState<HtmlTool | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications de travail"
        description="Outils d'entraînement et de double tâche. Ils peuvent être utilisés avec le panneau sons flottant."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PRACTICE_APPS.map((app) => (
          <article
            key={app.id}
            className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">{app.title}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Travail
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{app.description}</p>
            <div className="mt-4 space-y-2 rounded-md bg-muted px-3 py-3 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Objectif :</span>{" "}
                {app.objective}
              </p>
              <p>
                <span className="font-medium text-foreground">Consigne :</span>{" "}
                {app.instructions}
              </p>
            </div>
            <Button className="mt-4 w-full gap-2" onClick={() => setActive(app)}>
              <Play className="h-4 w-4" />
              Lancer l'application
            </Button>
          </article>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle>{active?.title}</DialogTitle>
                <DialogDescription>
                  Application chargée dans l'interface. Le panneau sons peut rester ouvert
                  pendant l'exercice.
                </DialogDescription>
              </div>
              {active && (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={active.htmlPath} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Onglet
                  </a>
                </Button>
              )}
            </div>
          </DialogHeader>
          {active && (
            <iframe
              title={active.title}
              src={active.htmlPath}
              className="h-[75vh] w-full border-0 bg-white"
              allow="fullscreen; autoplay"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
