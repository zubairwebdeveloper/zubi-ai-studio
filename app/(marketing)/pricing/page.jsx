import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { plans } from "@/config/plans";

export const metadata = {
  title: "Pricing",
  description: "Compare AI Studio plans: Free, Starter, Pro, Agency and Business.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold md:text-4xl">Pricing</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        One credit wallet for every tool. Prices and credit amounts will be published at launch, once a payment gateway is connected.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {plans.map((p) => (
          <section key={p.id} aria-labelledby={`plan-${p.id}`} className={`flex flex-col rounded-lg border bg-card p-5 ${p.highlighted ? "border-primary" : ""}`}>
            <h2 id={`plan-${p.id}`} className="text-lg font-semibold">{p.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{p.priceNote}</p>
            <p className="mt-3 text-sm font-medium">{p.credits}</p>
            <ul className="mt-4 flex-1 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />{f}</li>
              ))}
            </ul>
            <Button asChild className="mt-6" variant={p.highlighted ? "default" : "outline"}>
              <Link href="/register">{p.id === "business" ? "Contact us" : "Get started"}</Link>
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}
