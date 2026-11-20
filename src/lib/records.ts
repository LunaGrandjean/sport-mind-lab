import { isScoredResult, type Athlete, type Axis, type Result } from "@/lib/domain";

type ScoredResult = Result & { score: number };

export interface TopEntry {
  athlete: Athlete;
  score: number;
  date: string;
  side?: "G" | "D";
  rawScore?: number;
}

export function usesWeakerSide(axis: Axis) {
  return axis === "Vitesse motrice / CPS" || axis === "Précision motrice";
}

function comparePerformance(a: ScoredResult, b: ScoredResult) {
  return (
    a.score - b.score ||
    (a.rawScore !== undefined && b.rawScore !== undefined ? a.rawScore - b.rawScore : 0)
  );
}

/** Record personnel par côté, puis classement sur le moins performant des deux. */
export function topByAxis(axis: Axis, athletes: Athlete[], results: Result[]): TopEntry[] {
  const athletesById = new Map(athletes.map((athlete) => [athlete.id, athlete]));
  const bestByAthlete = new Map<string, Partial<Record<"G" | "D" | "overall", ScoredResult>>>();
  const bilateral = usesWeakerSide(axis);

  for (const result of results) {
    if (result.axis !== axis || !isScoredResult(result) || !athletesById.has(result.athleteId))
      continue;
    if (bilateral && result.side !== "G" && result.side !== "D") continue;
    const key = bilateral ? result.side! : "overall";
    const best = bestByAthlete.get(result.athleteId) ?? {};
    const previous = best[key];
    if (
      !previous ||
      (bilateral ? comparePerformance(result, previous) > 0 : result.score > previous.score)
    ) {
      best[key] = result;
    }
    bestByAthlete.set(result.athleteId, best);
  }

  const entries: TopEntry[] = [];
  for (const [athleteId, best] of bestByAthlete) {
    const result = bilateral
      ? best.G && best.D
        ? comparePerformance(best.G, best.D) <= 0
          ? best.G
          : best.D
        : undefined
      : best.overall;
    const athlete = athletesById.get(athleteId);
    if (!result || !athlete) continue;
    entries.push({
      athlete,
      score: result.score,
      date: result.date,
      ...(bilateral && result.side ? { side: result.side } : {}),
      ...(result.rawScore !== undefined ? { rawScore: result.rawScore } : {}),
    });
  }

  return entries.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date)).slice(0, 3);
}
