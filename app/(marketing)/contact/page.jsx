import { PageShell, Prose } from "@/components/shared/page-shell";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Contact",
  description: "Get in touch with the AI Studio team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const email = siteConfig.contactEmail;
  return (
    <PageShell title="Contact" intro="Questions about plans, agency features or the API?" narrow>
      {email ? (
        <Prose title="Email us">
          <p><a className="text-primary underline" href={`mailto:${email}`}>{email}</a></p>
        </Prose>
      ) : (
        <div role="note" className="rounded-lg border border-dashed p-6">
          <p className="font-medium">Contact details are not set yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Set NEXT_PUBLIC_CONTACT_EMAIL in the environment to show an email address here. A contact form will be added with the email service.</p>
        </div>
      )}
    </PageShell>
  );
}
