import { PageShell, Prose } from "@/components/shared/page-shell";

export const metadata = {
  title: "Privacy policy",
  description: "How AI Studio handles your data.",
  alternates: { canonical: "/privacy-policy" },
};

// DRAFT: describes the intended architecture. Have it reviewed by a qualified lawyer and
// complete the effective date, company details and contact before launch.
export default function PrivacyPage() {
  return (
    <PageShell title="Privacy policy" intro="Effective date: to be set at launch." narrow>
      <Prose title="Data we collect">
        <p>Account details (name, email, sign-in method), the files and prompts you submit to tools, the results generated for you, and usage records such as credit transactions and job status.</p>
      </Prose>
      <Prose title="How we use it">
        <p>To run the tools you choose, show your history, account for credits, process payments, prevent abuse and keep the service secure.</p>
      </Prose>
      <Prose title="AI providers">
        <p>When you run a tool, your input is sent to the third-party AI provider mapped to that tool so it can produce the result. Each provider applies its own terms and policies.</p>
      </Prose>
      <Prose title="Storage and retention">
        <p>Uploads and generated files are stored while your account is active, subject to retention limits that depend on your plan. You can delete items from your history.</p>
      </Prose>
      <Prose title="Your choices">
        <p>You can request access to or deletion of your data once account features are available.</p>
      </Prose>
    </PageShell>
  );
}
