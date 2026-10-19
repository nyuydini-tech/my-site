import { ComingSoon } from "@/components/ComingSoon";
import { loadLatest } from "@/lib/simulator-store";
import { CandidateOutcomes } from "@/components/simulator/CandidateOutcomes";

export const metadata = { title: "Decision Simulator" };

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const latest = await loadLatest();

  if (!latest) {
    return (
      <ComingSoon
        lane={3}
        title="Decision Simulator"
        description="A service that simulates investment games and recommends the growth-optimal stake. Built after Lane 3."
      />
    );
  }

  const { problem, answer, candidates } = latest;
  const buyIn = Number(problem.buyIn);
  const recommended = Number(answer.recommendedFraction);

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
        Lane 3 · live decision service
      </p>
      <h1 className="mt-3 text-4xl font-bold">
        Stake{" "}
        <span data-simulator="recommended-fraction">
          {recommended.toFixed(2)}
        </span>{" "}
        of wealth each year
      </h1>
      <p className="mt-4 max-w-prose text-muted">
        I simulate thousands of investors for every stake on the list, then pick
        the one that leaves the typical (median) investor best off — not the one
        with the flashiest average.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">The latest game</h2>
        <p className="mt-3 max-w-prose text-muted">{String(problem.scenario)}</p>
        <p className="mt-4 text-lg">
          Typical final balance: $
          <strong data-simulator="median-final" className="text-accent">
            {Math.round(Number(answer.medianFinalBalance))}
          </strong>
        </p>
        <p className="mt-2 text-lg">
          Chance of ending below the buy-in:{" "}
          <strong data-simulator="prob-loss" className="text-accent">
            {Number(answer.probLoss).toFixed(3)}
          </strong>
        </p>
        <p className="mt-3 max-w-prose text-sm text-muted">{String(answer.reasoning)}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Every candidate, simulated</h2>
        <CandidateOutcomes
          candidates={candidates}
          buyIn={buyIn}
          recommended={recommended}
        />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">The model, as a DAG</h2>
        <p className="mt-3 max-w-prose text-sm text-muted">
          The rectangle is the decision: what fraction of current wealth to stake
          each year. Circles are uncertain quantities — the coin, then wealth.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-simulator="dag"
          src="/images/dag.svg"
          alt="Investment-game DAG: buy-in, stake decision, yearly coin, and final wealth"
          className="mt-4 w-full rounded-lg border border-line bg-surface p-4"
        />
      </section>
    </main>
  );
}
