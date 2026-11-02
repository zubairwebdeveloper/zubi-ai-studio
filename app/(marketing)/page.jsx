import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/marketing/hero-search";
import { JsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/config/site";
import { tools } from "@/lib/tools/registry";
import {
  PopularTools, FeaturedCategories, TrendingTools, NewTools, MediaShowcase, WorkflowShowcase,
  HowItWorks, Benefits, UseCases, PricingPreview, Testimonials, Faqs, Newsletter,
} from "@/components/marketing/home-sections";

export const metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: siteConfig.name, url: siteConfig.url,
        potentialAction: { "@type": "SearchAction", target: `${siteConfig.url}/tools?q={search_term_string}`, "query-input": "required name=search_term_string" } }} />
      <section className="container pb-4 pt-16 md:pt-24">
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] md:text-6xl">
          Every AI tool you need, on one credit wallet.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Images, video, voice, documents, code and automation. Search {tools.length} tools and see exactly what each one costs before you run it.
        </p>
        <div className="mt-8"><HeroSearch /></div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/register">Start free</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/tools">Browse all tools</Link></Button>
        </div>
      </section>
      <PopularTools />
      <FeaturedCategories />
      <TrendingTools />
      <NewTools />
      <MediaShowcase />
      <WorkflowShowcase />
      <HowItWorks />
      <Benefits />
      <UseCases />
      <PricingPreview />
      <Testimonials />
      <Faqs />
      <Newsletter />
    </>
  );
}
