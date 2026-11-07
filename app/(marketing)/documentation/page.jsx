import { PageShell, Prose } from "@/components/shared/page-shell";

export const metadata = {
  title: "Documentation",
  description: "How tools, credits, job status and provider keys work in AI Studio.",
  alternates: { canonical: "/documentation" },
};

export default function DocumentationPage() {
  return (
    <PageShell title="Documentation" intro="How the platform works today. The developer API reference will be added when the API ships." narrow>
      <Prose title="Tool status">
        <p>Live means a provider is connected and the tool has been tested. Coming soon means no provider is connected yet, so the tool cannot be run.</p>
      </Prose>
      <Prose title="Credits">
        <p>Each tool has a credit cost shown on its page. When you start a job, the credits are reserved. When the job finishes, the final cost is recorded. If an eligible job fails, the reserved credits are returned.</p>
        <p>Credit amounts are always calculated on the server.</p>
      </Prose>
      <Prose title="Long-running jobs">
        <p>Video and other long generations run as background jobs. You can leave the page and return to the result in your history.</p>
      </Prose>
      <Prose title="Voice and likeness tools">
        <p>Voice cloning needs consent from the voice owner. Watermark removal is only for content you own or are authorized to edit.</p>
      </Prose>
      <Prose title="Privacy of provider keys">
        <p>Provider API keys are kept on the server and never sent to your browser.</p>
      </Prose>
    </PageShell>
  );
}
