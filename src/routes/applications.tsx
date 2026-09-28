import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ToolAppCard } from "@/components/tools/ToolAppCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PRACTICE_APPS,
  toolUrlWithAthlete,
  type HtmlTool,
} from "@/lib/test-definitions";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Applications de travail - cabinet sportif" },
      {
        name: "description",
        content:
          "Applications d'entrainement et de double tache : sons, des, defilement, laser, Komboid et memoire en mouvement.",
      },
    ],
  }),
  component: Applications,
});

function Applications() {
  const { selectedAthlete } = useAppStore();
  const [active, setActive] = useState<HtmlTool | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications de travail"
        description="Outils d'entrainement et de double tache. Ils peuvent etre utilises avec le panneau sons flottant."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PRACTICE_APPS.map((app) => (
          <ToolAppCard
            key={app.id}
            tool={app}
            badge="Travail"
            actionLabel="Lancer l'application"
            onLaunch={() => setActive(app)}
            details={
              <div className="space-y-2">
                <p>
                  <span className="font-medium text-foreground">Objectif :</span>{" "}
                  {app.objective}
                </p>
                <p>
                  <span className="font-medium text-foreground">Consigne :</span>{" "}
                  {app.instructions}
                </p>
              </div>
            }
          />
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle>{active?.title}</DialogTitle>
                <DialogDescription>
                  Application chargee dans l'interface. Le panneau sons peut rester ouvert
                  pendant l'exercice.
                </DialogDescription>
              </div>
              {active && (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a
                    href={toolUrlWithAthlete(active.htmlPath, selectedAthlete)}
                    target="_blank"
                    rel="noreferrer"
                  >
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
              src={toolUrlWithAthlete(active.htmlPath, selectedAthlete)}
              className="h-[75vh] w-full border-0 bg-white"
              allow="fullscreen; autoplay"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
