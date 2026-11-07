import { PageShell, Prose } from "@/components/shared/page-shell";

export const metadata = {
  title: "Terms and conditions",
  description: "The terms for using AI Studio.",
  alternates: { canonical: "/terms" },
};

// DRAFT: have it reviewed by a qualified lawyer and complete the governing law and company details before launch.
export default function TermsPage() {
  return (
    <PageShell title="Terms and conditions" intro="Effective date: to be set at launch." narrow>
      <Prose title="Using the service">
        <p>You must provide accurate account information and keep your credentials secure. You are responsible for activity on your account.</p>
      </Prose>
      <Prose title="Acceptable use">
        <p>You may not use the service to create illegal content, infringe others’ rights, impersonate people without consent, or abuse the platform. Voice cloning requires the voice owner’s explicit consent. Watermark removal is only for content you own or are authorized to edit.</p>
      </Prose>
      <Prose title="Credits and payments">
        <p>Credits are consumed by tool runs at the cost shown for each tool. Eligible failed jobs are refunded to your wallet. Subscription terms, renewals and refunds will be described at checkout.</p>
      </Prose>
      <Prose title="Generated content">
        <p>Results may be inaccurate. You are responsible for reviewing outputs before use and for having the rights to the content you upload.</p>
      </Prose>
      <Prose title="Availability">
        <p>Tools depend on third-party providers and may change or be unavailable. Tools marked Coming soon are not part of the service yet.</p>
      </Prose>
    </PageShell>
  );
}
