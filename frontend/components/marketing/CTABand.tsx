import { ArrowRight } from "lucide-react";
import { Button } from "./Button";
import { GithubIcon } from "./icons/GithubIcon";

const GITHUB_URL = "https://github.com/praveen-89/AI-Candidate-Discovery-Intelligent-Ranking-System";

export function CTABand() {
  return (
    <section className="border-t border-mkt-border bg-mkt-surface">
      <div className="mx-auto max-w-[1280px] px-6 py-20 text-center lg:px-8">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-mkt-text sm:text-4xl">
          Ready to find your next 100?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-mkt-text-secondary">
          Open source, self-hostable, and running on CPU-only infrastructure.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/login" icon={<ArrowRight className="h-4 w-4" />}>
            Get Started
          </Button>
          <Button href={GITHUB_URL} variant="secondary" external icon={<GithubIcon className="h-4 w-4" />}>
            View on GitHub
          </Button>
        </div>
      </div>
    </section>
  );
}
