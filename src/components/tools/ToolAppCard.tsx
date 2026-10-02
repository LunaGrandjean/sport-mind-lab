import type { ReactNode } from "react";
import {
  Activity,
  BrainCircuit,
  CircleDot,
  Ear,
  Eye,
  Hand,
  Hourglass,
  Keyboard,
  MousePointerClick,
  Orbit,
  Play,
  Shuffle,
  Target,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HtmlTool } from "@/lib/test-definitions";

type IconTone = "blue" | "cyan" | "green" | "amber" | "red" | "slate" | "violet";

const toolImages: Record<string, string> = {
  "attention": "/attention.png",
  "captation-visuelle": "/captation-inof-visuelle.png",
  "cps": "/cps.png",
  "defilement-ballons": "/defilement-ballon.png",
  "des-basiques": "/d%C3%A9s-basiques.png",
  "des-rotation": "/d%C3%A9s-rotation.png",
  "inhibition": "/inhibition.png",
  "komboid": "/komboid.png",
  "memoire-billard": "/memoire.png",
  "memoire-defilement": "/m%C3%A9moire-en-defilement.png",
  "precision-motrice": "/precision-motrice.png",
  "son-aleatoire": "/son-al%C3%A9atoire.png",
  "suivi-laser": "/suivi-de-laser.png",
  "suivi-multi-objets": "/suivi%20visuel.png",
  "temps-perception": "/temps-de-perception.png",
  "triple-tache": "/triple-tache.png",
  "vision-peripherique": "/vision-periph%C3%A9rique.png",
};

const toneClass: Record<IconTone, string> = {
  blue: "from-[#dff7ff] via-[#74d8ff] to-[#00518a]",
  cyan: "from-[#e8fbff] via-[#59d7ef] to-[#0b7a8f]",
  green: "from-[#effde9] via-[#90e56d] to-[#1c7b3c]",
  amber: "from-[#fff8d9] via-[#ffd05f] to-[#c46a1b]",
  red: "from-[#fff0f1] via-[#ff8a9a] to-[#b60018]",
  slate: "from-[#f7fafc] via-[#b7c4d1] to-[#1f2f46]",
  violet: "from-[#f2eaff] via-[#b997ff] to-[#4d2fa4]",
};

function iconConfig(id: string): { tone: IconTone; art: ReactNode } {
  switch (id) {
    case "cps":
      return {
        tone: "blue",
        art: (
          <>
            <Hand className="absolute bottom-3 left-3 h-8 w-8 text-white drop-shadow" />
            <Hourglass className="absolute right-3 top-3 h-5 w-5 text-[#083458]" />
            <span className="absolute bottom-4 right-4 h-7 w-11 rounded-full bg-white/85 shadow-inner" />
          </>
        ),
      };
    case "captation-visuelle":
      return {
        tone: "cyan",
        art: (
          <>
            <span className="absolute right-2 top-3 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-[#19a873] shadow">
              BLEU
            </span>
            <Hand className="absolute bottom-2 left-4 h-8 w-8 text-white drop-shadow" />
            <CircleDot className="absolute left-4 top-5 h-9 w-9 text-[#083458]" />
          </>
        ),
      };
    case "suivi-multi-objets":
      return {
        tone: "red",
        art: (
          <>
            <BrainCircuit className="absolute bottom-3 right-3 h-9 w-9 text-[#111827]" />
            {[0, 1, 2, 3, 4].map((index) => (
              <span
                key={index}
                className="absolute h-2.5 w-2.5 rounded-full bg-white shadow"
                style={{
                  left: `${22 + index * 11}%`,
                  top: `${24 + (index % 2) * 24}%`,
                }}
              />
            ))}
            <span className="absolute right-4 top-3 grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-bold text-[#111827] shadow">
              7
            </span>
          </>
        ),
      };
    case "vision-peripherique":
      return {
        tone: "cyan",
        art: (
          <>
            <Eye className="absolute left-4 top-5 h-11 w-11 text-[#0f5567]" />
            <Orbit className="absolute inset-3 h-14 w-14 text-white/90" />
            <span className="absolute bottom-4 left-4 h-1 w-10 rounded-full bg-white/80" />
          </>
        ),
      };
    case "memoire-billard":
      return {
        tone: "blue",
        art: (
          <>
            <BrainCircuit className="absolute inset-3 h-14 w-14 text-[#064067]" />
            {[1, 3, 6, 8, 9].map((number, index) => (
              <span
                key={number}
                className="absolute grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-bold text-[#064067] shadow"
                style={{
                  left: `${18 + (index % 3) * 24}%`,
                  top: `${20 + Math.floor(index / 3) * 30}%`,
                }}
              >
                {number}
              </span>
            ))}
          </>
        ),
      };
    case "defilement-ballons":
    case "memoire-defilement":
      return {
        tone: "amber",
        art: (
          <>
            <Shuffle className="absolute right-3 top-3 h-7 w-7 text-[#6b3f08]" />
            <BrainCircuit className="absolute bottom-3 left-3 h-9 w-9 text-white drop-shadow" />
            <span className="absolute bottom-5 right-4 h-5 w-5 rounded-full bg-white/90 shadow" />
          </>
        ),
      };
    case "suivi-laser":
      return {
        tone: "green",
        art: (
          <>
            <Target className="absolute inset-3 h-14 w-14 text-[#0d4b2a]" />
            <MousePointerClick className="absolute bottom-2 right-3 h-7 w-7 text-white drop-shadow" />
          </>
        ),
      };
    case "triple-tache":
    case "komboid":
      return {
        tone: "violet",
        art: (
          <>
            {[0, 1, 2, 3, 4].map((index) => (
              <span
                key={index}
                className="absolute h-5 w-5 rounded-md bg-white/80 shadow"
                style={{
                  left: `${14 + (index % 3) * 26}%`,
                  top: `${16 + Math.floor(index / 3) * 34}%`,
                }}
              />
            ))}
            <Hand className="absolute bottom-2 left-6 h-9 w-9 text-white drop-shadow" />
          </>
        ),
      };
    case "son-aleatoire":
      return {
        tone: "green",
        art: (
          <>
            <Volume2 className="absolute bottom-3 left-3 h-9 w-9 text-white drop-shadow" />
            <Ear className="absolute right-3 top-3 h-8 w-8 text-[#103b1d]" />
          </>
        ),
      };
    case "des-basiques":
      return {
        tone: "slate",
        art: (
          <>
            <Keyboard className="absolute left-3 top-6 h-11 w-11 text-white drop-shadow" />
            <span className="absolute bottom-3 right-3 h-8 w-8 rounded-lg bg-[#182436] shadow">
              <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-white" />
              <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-white" />
            </span>
          </>
        ),
      };
    case "des-rotation":
      return {
        tone: "slate",
        art: (
          <>
            <span className="absolute left-4 top-6 grid h-9 w-9 place-items-center rounded-lg bg-[#102216] text-xs font-bold text-green-300 shadow">
              G
            </span>
            <span className="absolute right-4 top-6 grid h-9 w-9 place-items-center rounded-lg bg-[#2d1518] text-xs font-bold text-red-300 shadow">
              D
            </span>
          </>
        ),
      };
    default:
      return {
        tone: "blue",
        art: <Activity className="h-10 w-10 text-white drop-shadow" />,
      };
  }
}

function ToolIcon({ id }: { id: string }) {
  const imageSrc = toolImages[id];
  const config = iconConfig(id);

  return (
    <div
      className={`relative grid h-[84px] w-[84px] shrink-0 place-items-center overflow-hidden rounded-[18px] bg-gradient-to-br ${toneClass[config.tone]} shadow-[0_10px_22px_rgba(8,39,77,0.14),inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-cyan-100/80`}
    >
      {imageSrc ? (
        <>
          <span className="absolute inset-0 bg-white" />
          <img
            src={imageSrc}
            alt=""
            aria-hidden="true"
            className="relative h-full w-full object-contain p-2"
            loading="lazy"
          />
        </>
      ) : (
        <>
          <span className="absolute inset-x-2 top-1 h-8 rounded-full bg-white/35 blur-xl" />
          {config.art}
        </>
      )}
    </div>
  );
}

export function ToolAppCard({
  tool,
  badge,
  actionLabel,
  onLaunch,
  details,
}: {
  tool: HtmlTool;
  badge: string;
  actionLabel: string;
  onLaunch: () => void;
  details: ReactNode;
}) {
  return (
    <article className="group flex h-full min-h-[254px] flex-col rounded-2xl border border-cyan-100/90 bg-white p-4 shadow-[0_1px_2px_rgba(8,39,77,0.05),0_14px_32px_rgba(8,39,77,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_8px_18px_rgba(8,39,77,0.08),0_18px_42px_rgba(8,39,77,0.08)]">
      <div className="flex items-start gap-4">
        <ToolIcon id={tool.id} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[15px] font-semibold leading-snug text-[#08274d]">
              {tool.title}
            </h2>
            <span className="shrink-0 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-[#0b7a8f] ring-1 ring-cyan-100">
              {badge}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
            {tool.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex-1 border-t border-cyan-100/80 pt-3 text-xs leading-relaxed text-muted-foreground">
        {details}
      </div>

      <Button
        size="sm"
        className="mt-4 h-9 w-full rounded-xl bg-[#08274d] font-semibold shadow-[0_8px_18px_rgba(8,39,77,0.16)] hover:bg-[#06335f] hover:shadow-[0_10px_22px_rgba(8,39,77,0.2)]"
        onClick={onLaunch}
      >
        <Play className="h-4 w-4" />
        {actionLabel}
      </Button>
    </article>
  );
}
