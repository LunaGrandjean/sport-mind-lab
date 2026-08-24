import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Mode = "aleatoire" | "sequence";

const VOICES = ["ha", "hé", "ho"] as const;
const INSTRUMENTS: Record<string, number> = {
  Cloche: 880,
  Bip: 1200,
  Grave: 220,
  Bois: 440,
};

/**
 * Panneau flottant "Sons / double tâche".
 * Synthèse audio via Web Audio API (aucun fichier externe requis).
 */
export function SoundPanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("aleatoire");
  const [palette, setPalette] = useState<"voix" | "instruments">("voix");
  const [sequence, setSequence] = useState("ha, hé, ho, ha");
  const [intervalMs, setIntervalMs] = useState(2000);
  const [playing, setPlaying] = useState(false);
  const [last, setLast] = useState<string>("—");

  const ctxRef = useRef<AudioContext | null>(null);
  const stepRef = useRef(0);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  };

  const speak = useCallback((word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "fr-FR";
    u.rate = 1.1;
    window.speechSynthesis.speak(u);
  }, []);

  const tone = useCallback((freq: number) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }, []);

  const fire = useCallback(() => {
    const seq = sequence
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const pool = palette === "voix" ? [...VOICES] : Object.keys(INSTRUMENTS);
    const value =
      mode === "sequence" && seq.length
        ? seq[stepRef.current++ % seq.length]
        : pool[Math.floor(Math.random() * pool.length)];

    setLast(value);
    if (palette === "voix" || VOICES.includes(value as (typeof VOICES)[number])) {
      speak(value);
    } else {
      tone(INSTRUMENTS[value] ?? 660);
    }
  }, [mode, palette, sequence, speak, tone]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(fire, Math.max(400, intervalMs));
    return () => window.clearInterval(id);
  }, [playing, intervalMs, fire]);

  // Déclenchement manuel à la barre d'espace.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        fire();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, fire]);

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 gap-2 shadow-lg"
      >
        <Volume2 className="h-4 w-4" />
        Sons / double tâche
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-lg border border-border bg-card p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Sons / double tâche</p>
        <button
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Fermer le panneau sons"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] uppercase text-muted-foreground">Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aleatoire">Aléatoire</SelectItem>
                <SelectItem value="sequence">Séquence préparée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase text-muted-foreground">Sons</Label>
            <Select
              value={palette}
              onValueChange={(v) => setPalette(v as "voix" | "instruments")}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voix">Voix (ha / hé / ho)</SelectItem>
                <SelectItem value="instruments">Instruments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {mode === "sequence" && (
          <div className="space-y-1">
            <Label className="text-[11px] uppercase text-muted-foreground">
              Séquence (séparée par des virgules)
            </Label>
            <Input
              className="h-8 text-sm"
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-[11px] uppercase text-muted-foreground">
            Intervalle (ms)
          </Label>
          <Input
            type="number"
            step={100}
            className="h-8 text-sm"
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-2" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Lecture"}
          </Button>
          <Button size="sm" variant="outline" onClick={fire}>
            Déclencher
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Dernier signal : <span className="font-medium text-foreground">{last}</span> ·
          barre d'espace pour déclencher
        </p>
      </div>
    </div>
  );
}
