import Link from "next/link";
import { PageShell, Prose } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { tools } from "@/lib/tools/registry";
import { categories } from "@/config/categories";

export const metadata = {
  title: "About",
  description: "What AI Studio is, how it works, and the principles behind it.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageShell
      title="About AI Studio"
      intro="One account, one dashboard and one credit wallet for AI tools across images, video, audio, documents, code and automation."
      narrow
    >
      <Prose title="What we are building">
        <p>
          AI Studio connects to several AI providers behind a single interface.
          The directory lists {tools.length} tools across {categories.length}{" "}
          studios. You pick a tool, see its credit cost, and run it. Results are
          saved to your history.
        </p>
      </Prose>
      <Prose title="Principles">
        <p>
          <strong className="text-foreground">Honest status.</strong> A tool is
          marked Live only when a provider is connected and tested. Everything
          else says Coming soon.
        </p>
        <p>
          <strong className="text-foreground">Keys stay on the server.</strong>{" "}
          Provider credentials are never sent to your browser.
        </p>
        <p>
          <strong className="text-foreground">Consent for voices.</strong> Voice
          cloning requires permission from the voice owner.
        </p>
        <p>
          <strong className="text-foreground">Credits you can trust.</strong>{" "}
          Credits are calculated on the server, reserved when a job starts, and
          recorded in a transaction history.
        </p>
      </Prose>
      <Button>
        <Link href="/tools">Browse tools</Link>
      </Button>
    </PageShell>
  );
}
