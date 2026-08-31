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

const DEFAULT_CROWD_VOLUME = 0.28;

interface CrowdLoop {
  source: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  cheerTimer: number;
}

export function SoundPanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("aleatoire");
  const [palette, setPalette] = useState<Palette>("voix");
  const [sequence, setSequence] = useState(DEFAULT_SEQUENCES.voix);
  const [intervalMs, setIntervalMs] = useState(2000);
  const [crowdVolume, setCrowdVolume] = useState(DEFAULT_CROWD_VOLUME);
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

  const cheerBurst = useCallback((ctx: AudioContext, destination: AudioNode) => {
    const duration = 0.7 + Math.random() * 0.55;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      const t = i / ctx.sampleRate;
      const chant = Math.sin(t * 2 * Math.PI * (150 + Math.random() * 16)) * 0.2;
      const murmur = Math.sin(t * 2 * Math.PI * 95) * 0.12;
      const envelope = Math.sin(Math.PI * (i / data.length));
      data[i] = ((Math.random() * 2 - 1) * 0.8 + chant + murmur) * envelope;
    }

    const source = ctx.createBufferSource();
    const bandpass = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;
    bandpass.type = "bandpass";
    bandpass.frequency.value = 850 + Math.random() * 900;
    bandpass.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.08);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);

    source.connect(bandpass).connect(gain).connect(destination);
    source.start();
    source.stop(ctx.currentTime + duration + 0.02);
  }, []);

  const startCrowd = useCallback(() => {
    if (crowdRef.current) return;

    const ctx = getCtx();
    void ctx.resume();
    const seconds = 3.5;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      const t = i / ctx.sampleRate;
      const vowelWave =
        Math.sin(t * 2 * Math.PI * 118) * 0.18 +
        Math.sin(t * 2 * Math.PI * 176) * 0.1 +
        Math.sin(t * 2 * Math.PI * 232) * 0.08;
      const chantPulse = Math.sin(t * 2 * Math.PI * 1.65) > 0.35 ? 0.28 : 0;
      const swell = 0.58 + Math.sin(t * 2 * Math.PI * 0.42) * 0.28;
      data[i] = ((Math.random() * 2 - 1) * 0.55 + vowelWave + chantPulse) * swell;
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;
    source.loop = true;
    filter.type = "bandpass";
    filter.frequency.value = 1250;
    filter.Q.value = 0.55;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(crowdVolume, ctx.currentTime + 0.25);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();

    const scheduleCheer = () => {
      cheerBurst(ctx, gain);
    };
    const cheerTimer = window.setInterval(scheduleCheer, 850);
    scheduleCheer();

    crowdRef.current = { source, filter, gain, cheerTimer };
  }, [cheerBurst, crowdVolume]);

  const stopCrowd = useCallback(() => {
    const crowd = crowdRef.current;
    if (!crowd || !ctxRef.current) return;

    const ctx = ctxRef.current;
    window.clearInterval(crowd.cheerTimer);
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
      tone(1480, 0.14, 0.2);
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
    const crowd = crowdRef.current;
    const ctx = ctxRef.current;
    if (!crowd || !ctx) return;
    crowd.gain.gain.cancelScheduledValues(ctx.currentTime);
    crowd.gain.gain.linearRampToValueAtTime(crowdVolume, ctx.currentTime + 0.08);
  }, [crowdVolume]);

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
          <div className="space-y-2 rounded-md bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
            <p>
              En lecture, un brouhaha de stade avec encouragements reste actif et les
              annonces sont envoyées par dessus.
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] uppercase text-cyan-900">
                  Volume foule
                </Label>
                <span className="font-medium tabular-nums">
                  {Math.round(crowdVolume * 100)}%
                </span>
              </div>
              <Input
                type="range"
                min={0.08}
                max={0.6}
                step={0.02}
                value={crowdVolume}
                onChange={(event) => setCrowdVolume(Number(event.target.value))}
                className="h-8 cursor-pointer"
              />
            </div>
          </div>
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
