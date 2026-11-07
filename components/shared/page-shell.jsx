export function PageShell({ title, intro, children, narrow = false }) {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
      {intro && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{intro}</p>}
      <div className={narrow ? "mt-8 max-w-3xl space-y-6" : "mt-8"}>{children}</div>
    </div>
  );
}

export function Prose({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}
