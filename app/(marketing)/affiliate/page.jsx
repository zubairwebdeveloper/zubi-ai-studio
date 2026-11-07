import { PageShell } from "@/components/shared/page-shell";

export const metadata = {
  title: "Affiliate program",
  description: "The AI Studio affiliate program.",
  alternates: { canonical: "/affiliate" },
};

export default function AffiliatePage() {
  return (
    <PageShell title="Affiliate program" intro="Referral tracking and payouts are planned for a later release." narrow>
      <div role="note" className="rounded-lg border border-dashed p-6">
        <p className="font-medium">The program is not open yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">Commission terms and sign-up will be published here when affiliate accounts are available.</p>
      </div>
    </PageShell>
  );
}
