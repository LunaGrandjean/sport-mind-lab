import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Printer, Upload } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AXES, AXIS_SHORT, fullName, type Athlete, type Result } from "@/lib/domain";
import { RADAR_MAX_SCORE } from "@/lib/scoring";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/bilan")({
  head: () => ({
    meta: [
      { title: "Fichier client et bilan" },
      {
        name: "description",
        content:
          "Fiche client, historique des seances, synthese de prise en charge et exports PDF / Excel.",
      },
    ],
  }),
  component: Bilan,
});

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function escapeHtml(value: string | number | undefined | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadBlob(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function latestResultsByAxis(results: Result[]) {
  return AXES.map((axis) => {
    const latest = results
      .filter((result) => result.axis === axis)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return {
      axis,
      result: latest,
    };
  });
}

function scoreTone(score: number | undefined) {
  if (score === undefined) {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }
  if (score < 8) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (score <= 12) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-green-200 bg-green-50 text-green-700";
}

function buildExcelExport({
  athlete,
  results,
  observations,
  summary,
  recommendations,
  startDate,
  endDate,
}: {
  athlete: Athlete;
  results: Result[];
  observations: string;
  summary: string;
  recommendations: string;
  startDate: string;
  endDate: string;
}) {
  const latest = latestResultsByAxis(results);
  const rows = results
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <h1>Fichier client - ${escapeHtml(fullName(athlete))}</h1>
  <table border="1">
    <tr><th>Nom</th><td>${escapeHtml(athlete.nom)}</td><th>Prenom</th><td>${escapeHtml(athlete.prenom)}</td></tr>
    <tr><th>Age</th><td>${escapeHtml(athlete.age)}</td><th>Sexe</th><td>${escapeHtml(athlete.sexe)}</td></tr>
    <tr><th>Discipline</th><td>${escapeHtml(athlete.discipline)}</td><th>Poste</th><td>${escapeHtml(athlete.poste)}</td></tr>
    <tr><th>Pathologie</th><td>${escapeHtml(athlete.pathologie)}</td><th>Niveau</th><td>${escapeHtml(athlete.niveau)}</td></tr>
    <tr><th>Debut</th><td>${escapeHtml(startDate)}</td><th>Fin</th><td>${escapeHtml(endDate)}</td></tr>
  </table>
  <h2>Profil radar</h2>
  <table border="1">
    <tr><th>Axe</th><th>Note /20</th><th>Score brut</th><th>Date</th><th>Mode</th><th>Commentaire</th></tr>
    ${latest
      .map(
        ({ axis, result }) =>
          `<tr><td>${escapeHtml(axis)}</td><td>${escapeHtml(result?.score ?? "")}</td><td>${escapeHtml(
            result?.rawScore ?? "",
          )}</td><td>${escapeHtml(result ? formatDateTime(result.date) : "")}</td><td>${escapeHtml(
            result?.mode ?? "",
          )}</td><td>${escapeHtml(result?.commentaire ?? "")}</td></tr>`,
      )
      .join("")}
  </table>
  <h2>Historique des tests</h2>
  <table border="1">
    <tr><th>Date</th><th>Axe</th><th>Note /20</th><th>Score brut</th><th>Source</th><th>Mode</th><th>Commentaire</th></tr>
    ${rows
      .map(
        (result) =>
          `<tr><td>${escapeHtml(formatDateTime(result.date))}</td><td>${escapeHtml(
            result.axis,
          )}</td><td>${escapeHtml(result.score)}</td><td>${escapeHtml(
            result.rawScore ?? "",
          )}</td><td>${escapeHtml(result.source)}</td><td>${escapeHtml(
            result.mode,
          )}</td><td>${escapeHtml(result.commentaire ?? "")}</td></tr>`,
      )
      .join("")}
  </table>
  <h2>Bilan</h2>
  <p><strong>Observations supplementaires :</strong><br>${escapeHtml(observations).replace(/\n/g, "<br>")}</p>
  <p><strong>Synthese :</strong><br>${escapeHtml(summary).replace(/\n/g, "<br>")}</p>
  <p><strong>Recommandations :</strong><br>${escapeHtml(recommendations).replace(/\n/g, "<br>")}</p>
</body>
</html>`;
}

function Bilan() {
  const { selectedAthlete, results, exportData, importData } = useAppStore();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const selectedName = fullName(selectedAthlete).trim() || "Nouveau sportif";
  const athleteResults = useMemo(
    () => results.filter((result) => result.athleteId === selectedAthlete.id),
    [results, selectedAthlete.id],
  );
  const latest = useMemo(() => latestResultsByAxis(athleteResults), [athleteResults]);
  const radarData = useMemo(
    () =>
      latest.map(({ axis, result }) => ({
        axis: AXIS_SHORT[axis],
        score: result?.score ?? 0,
        redZone: 8,
        orangeZone: 12,
        greenZone: 20,
      })),
    [latest],
  );
  const sessions = useMemo(() => {
    const byDay = new Map<string, Result[]>();
    for (const result of athleteResults) {
      const key = formatDate(result.date);
      byDay.set(key, [...(byDay.get(key) ?? []), result]);
    }
    return [...byDay.entries()]
      .map(([date, sessionResults]) => ({
        date,
        results: sessionResults.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.results[0].date).getTime() - new Date(a.results[0].date).getTime(),
      );
  }, [athleteResults]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [observations, setObservations] = useState("");
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const exportJson = () => {
    downloadBlob(
      JSON.stringify(exportData(), null, 2),
      `sport-mind-lab-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json;charset=utf-8",
    );
    toast.success("Sauvegarde JSON exportée");
  };

  const importJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        importData(JSON.parse(String(reader.result ?? "")));
        toast.success("Sauvegarde JSON importée");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Import JSON impossible");
      }
    };
    reader.onerror = () => toast.error("Lecture du fichier impossible");
    reader.readAsText(file);
  };

  const exportExcel = () => {
    const content = buildExcelExport({
      athlete: selectedAthlete,
      results: athleteResults,
      observations,
      summary,
      recommendations,
      startDate,
      endDate,
    });
    downloadBlob(
      content,
      `fichier-client-${safeFileName(selectedName) || "sportif"}.xls`,
      "application/vnd.ms-excel;charset=utf-8",
    );
    toast.success("Fichier Excel généré");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fichier client / Bilan"
        description="Historique des séances, synthèse de prise en charge et exports."
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={importJson}
            />
            <Button variant="outline" className="gap-2" onClick={exportJson}>
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => importInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import JSON
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportExcel}>
              <FileSpreadsheet className="h-4 w-4" />
              Télécharger Excel
            </Button>
            <Button className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Télécharger PDF
            </Button>
          </div>
        }
      />

      <section className="print-area overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="bg-[#08274d] px-5 py-5 text-center text-white">
          <p className="text-2xl font-semibold uppercase tracking-[0.35em]">
            Bilan de prise en charge
          </p>
          <p className="mt-2 text-sm text-white/80">
            Cabinet Neurocognitif Valentin Rumeau
          </p>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedAthlete.discipline || "Discipline à compléter"}
                    {selectedAthlete.poste ? ` - ${selectedAthlete.poste}` : ""}
                  </p>
                </div>
                <img src="/logo.png" alt="" className="h-12 w-12 object-contain" />
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Âge" value={selectedAthlete.age || "-"} />
                <Info label="Sexe" value={selectedAthlete.sexe} />
                <Info label="Niveau" value={selectedAthlete.niveau || "-"} />
                <Info label="Pathologie" value={selectedAthlete.pathologie || "-"} />
              </dl>
            </section>

            <section className="rounded-lg border border-border p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Période et séances
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Début</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Fin</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniStat label="Séances" value={sessions.length} />
                <MiniStat label="Résultats" value={athleteResults.length} />
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-border p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Profil radar
            </h2>
            <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
              <div className="mx-auto w-full max-w-[720px] rounded-lg border border-cyan-100 bg-white p-3">
                <div className="mb-2 flex flex-wrap justify-center gap-2 text-[11px] font-medium">
                  <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">
                    &lt; 8 rouge
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                    8 à 12 orange
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                    &gt; 12 vert
                  </span>
                </div>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="72%">
                      <PolarGrid stroke="rgba(8,39,77,0.16)" />
                      <PolarAngleAxis
                        dataKey="axis"
                        tick={{ fill: "#b39b00", fontSize: 12, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, RADAR_MAX_SCORE]}
                        tick={{ fill: "#6b4b4b", fontSize: 11 }}
                        axisLine={false}
                      />
                      <Radar
                        dataKey="greenZone"
                        stroke="none"
                        fill="#dff4d3"
                        fillOpacity={0.78}
                        legendType="none"
                        isAnimationActive={false}
                      />
                      <Radar
                        dataKey="orangeZone"
                        stroke="none"
                        fill="#ffefd8"
                        fillOpacity={0.9}
                        legendType="none"
                        isAnimationActive={false}
                      />
                      <Radar
                        dataKey="redZone"
                        stroke="none"
                        fill="#ffd6de"
                        fillOpacity={0.92}
                        legendType="none"
                        isAnimationActive={false}
                      />
                      <Radar
                        name={selectedName}
                        dataKey="score"
                        stroke="#004b7a"
                        fill="#138fbd"
                        fillOpacity={0.28}
                      />
                      <Tooltip
                        formatter={(value, name) =>
                          ["greenZone", "orangeZone", "redZone"].includes(String(name))
                            ? null
                            : [`${value}/20`, "Note"]
                        }
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          fontSize: 12,
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {latest.map(({ axis, result }) => (
                  <div
                    key={axis}
                    className={`rounded-md border p-3 ${scoreTone(result?.score)}`}
                  >
                    <p className="text-xs font-medium opacity-80">{AXIS_SHORT[axis]}</p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums">
                      {result ? `${result.score}/20` : "-/20"}
                    </p>
                    <p className="mt-1 text-xs opacity-70">
                      {result ? formatDate(result.date) : "Non renseigné"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <TextBlock
              label="Observations supplémentaires"
              value={observations}
              onChange={setObservations}
              placeholder="Ex : meilleur contrôle, points forts observés..."
            />
            <TextBlock
              label="Bilan"
              value={summary}
              onChange={setSummary}
              placeholder="Ex : niveau neurocognitif, évolution, objectif de prise en charge..."
            />
            <TextBlock
              label="Recommandations"
              value={recommendations}
              onChange={setRecommendations}
              placeholder="Ex : continuité du travail, rappels, exercices à intégrer..."
            />
          </section>

          <section className="overflow-x-auto rounded-lg border border-border">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Historique des séances
              </h2>
            </div>
            {sessions.length ? (
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Tests</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium">Commentaires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sessions.map((session) => (
                    <tr key={session.date} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {session.date}
                      </td>
                      <td className="px-4 py-3">
                        {session.results.map((result) => AXIS_SHORT[result.axis]).join(", ")}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {session.results
                          .map((result) => `${AXIS_SHORT[result.axis]} ${result.score}/20`)
                          .join(" - ")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {session.results
                          .map((result) => result.commentaire)
                          .filter(Boolean)
                          .join(" - ") || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Aucun résultat enregistré pour ce sportif.
              </p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-cyan-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-cyan-900/70">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-primary">{value}</p>
    </div>
  );
}

function TextBlock({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        className="min-h-32"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
