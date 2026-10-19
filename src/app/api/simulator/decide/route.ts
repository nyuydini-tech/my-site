import { NextResponse } from "next/server";
import { saveLatest, type CandidateSummary } from "@/lib/simulator-store";

const N_PATHS = 20_000;

function percentile(sorted: ArrayLike<number>, p: number) {
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - i) + sorted[hi] * (i - lo);
}

function simulateStake(
  fraction: number,
  up: number,
  down: number,
  years: number,
  buyIn: number
): CandidateSummary {
  const finals = new Float64Array(N_PATHS);
  const upFactor = 1 + up * fraction;
  const downFactor = 1 - down * fraction;
  for (let i = 0; i < N_PATHS; i++) {
    let wealth = buyIn;
    for (let t = 0; t < years; t++) {
      wealth *= Math.random() < 0.5 ? upFactor : downFactor;
    }
    finals[i] = wealth;
  }
  finals.sort();
  let losses = 0;
  for (let i = 0; i < N_PATHS; i++) {
    if (finals[i] < buyIn) losses++;
  }
  return {
    fraction,
    p5: percentile(finals, 0.05),
    p25: percentile(finals, 0.25),
    median: percentile(finals, 0.5),
    p75: percentile(finals, 0.75),
    p95: percentile(finals, 0.95),
    probLoss: losses / N_PATHS,
  };
}

export async function POST(req: Request) {
  const game = await req.json().catch(() => null);
  if (!game || game.type !== "investment-game") {
    return NextResponse.json(
      { error: "expected a JSON investment-game with candidateFractions" },
      { status: 400 }
    );
  }
  const fractions: number[] = game.candidateFractions;
  if (!Array.isArray(fractions) || fractions.length === 0) {
    return NextResponse.json({ error: "candidateFractions required" }, { status: 400 });
  }

  const up = Number(game.upPct) / 100;
  const down = Number(game.downPct) / 100;
  const years = Number(game.horizonYears);
  const buyIn = Number(game.buyIn);

  const candidates = fractions.map((f) => simulateStake(f, up, down, years, buyIn));
  const best = candidates.reduce((a, b) => (b.median > a.median ? b : a));

  const answer = {
    recommendedFraction: best.fraction,
    medianFinalBalance: best.median,
    probLoss: best.probLoss,
    reasoning: `Of the ${candidates.length} stakes simulated, staking ${Math.round(best.fraction * 100)}% each year left the typical investor with the most: about $${Math.round(best.median).toLocaleString("en-US")} after ${years} years, from a $${Math.round(buyIn).toLocaleString("en-US")} buy-in. ${Math.round(best.probLoss * 100)}% of simulated investors still ended below the buy-in.`,
  };

  await saveLatest(game, answer, candidates);
  return NextResponse.json(answer);
}
