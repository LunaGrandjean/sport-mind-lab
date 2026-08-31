import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Mode = "aleatoire" | "sequence";
type Palette = "voix" | "instruments" | "foule";

const VOICES = ["ha", "hé", "ho"] as const;
const CROWD_ANNOUNCEMENTS = ["À gauche", "À droite", "Change"] as const;
const INSTRUMENTS: Record<string, number> = {
  Cloche: 880,
  Bip: 1200,
  Grave: 220,
  Bois: 440,
};

const DEFAULT_SEQUENCES: Record<Palette, string> = {
  voix: "ha, hé, ho, ha",
  instruments: "Cloche, Bip, Grave",
  foule: "À gauche, À droite, Change",
};

interface CrowdLoop {
  source: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
}

export function SoundPanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("aleatoire");
  const [palette, setPalette] = useState<Palette>("voix");
  const [sequence, setSequence] = useState(DEFAULT_SEQUENCES.voix);
  const [intervalMs, setIntervalMs] = useState(2000);
  const [playing, setPlaying] = useState(false);
  const [last, setLast] = useState<string>("-");

  const ctxRef = useRef<AudioContext | null>(null);
  const crowdRef = useRef<CrowdLoop | null>(null);
  const stepRef = useRef(0);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  };

  const speak = useCallback((word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "fr-FR";
    utterance.rate = 1.08;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const tone = useCallback((freq: number, duration = 0.4, volume = 0.25) => {
    const ctx = getCtx();
    void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }, []);

  const startCrowd = useCallback(() => {
    if (crowdRef.current) return;

    const ctx = getCtx();
    void ctx.resume();
    const seconds = 2.5;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      const wave = Math.sin(i * 0.012) * 0.08 + Math.sin(i * 0.031) * 0.05;
      data[i] = (Math.random() * 2 - 1) * 0.42 + wave;
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 950;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.075, ctx.currentTime + 0.4);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    crowdRef.current = { source, filter, gain };
  }, []);

  const stopCrowd = useCallback(() => {
    const crowd = crowdRef.current;
    if (!crowd || !ctxRef.current) return;

    const ctx = ctxRef.current;
    crowd.gain.gain.cancelScheduledValues(ctx.currentTime);
    crowd.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    window.setTimeout(() => {
      try {
        crowd.source.stop();
      } catch {
        // Already stopped.
      }
      crowd.source.disconnect();
      crowd.filter.disconnect();
      crowd.gain.disconnect();
    }, 280);
    crowdRef.current = null;
  }, []);

  const getPool = useCallback(() => {
    if (palette === "voix") return [...VOICES];
    if (palette === "foule") return [...CROWD_ANNOUNCEMENTS];
    return Object.keys(INSTRUMENTS);
  }, [palette]);

  const fire = useCallback(() => {
    const seq = sequence
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const pool = getPool();
    const value =
      mode === "sequence" && seq.length
        ? seq[stepRef.current++ % seq.length]
        : pool[Math.floor(Math.random() * pool.length)];

    setLast(value);

    if (palette === "instruments") {
      tone(INSTRUMENTS[value] ?? 660);
      return;
    }

    if (palette === "foule") {
      tone(1480, 0.14, 0.12);
    }
    speak(value);
  }, [getPool, mode, palette, sequence, speak, tone]);

  useEffect(() => {
    if (playing && palette === "foule") {
      startCrowd();
    } else {
      stopCrowd();
    }
  }, [palette, playing, startCrowd, stopCrowd]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(fire, Math.max(400, intervalMs));
    return () => window.clearInterval(id);
  }, [playing, intervalMs, fire]);

  useEffect(() => {
    return () => {
      stopCrowd();
      window.speechSynthesis?.cancel();
    };
  }, [stopCrowd]);

  useEffect(() => {
    if (!open) {
      setPlaying(false);
      stopCrowd();
    }
  }, [open, stopCrowd]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      if (event.code === "Space") {
        event.preventDefault();
        fire();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, fire]);

  const changePalette = (value: Palette) => {
    setPalette(value);
    setSequence(DEFAULT_SEQUENCES[value]);
    setLast("-");
    stepRef.current = 0;
  };

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
            <Select value={mode} onValueChange={(value) => setMode(value as Mode)}>
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
            <Select value={palette} onValueChange={(value) => changePalette(value as Palette)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voix">Voix (ha / hé / ho)</SelectItem>
                <SelectItem value="instruments">Instruments</SelectItem>
                <SelectItem value="foule">Foule sportive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {mode === "sequence" && (
          <div className="space-y-1">
            <Label className="text-[11px] uppercase text-muted-foreground">
              Séquence, séparée par des virgules
            </Label>
            <Input
              className="h-8 text-sm"
              value={sequence}
              onChange={(event) => setSequence(event.target.value)}
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
            onChange={(event) => setIntervalMs(Number(event.target.value))}
          />
        </div>

        {palette === "foule" && (
          <p className="rounded-md bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
            En lecture, un fond de foule reste actif et les annonces sont envoyées par
            dessus.
          </p>
        )}

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
          Dernier signal : <span className="font-medium text-foreground">{last}</span> -
          barre d'espace pour déclencher
        </p>
      </div>
    </div>
  );
}
