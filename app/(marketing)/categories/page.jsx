import { FeaturedCategories } from "@/components/marketing/home-sections";

export const metadata = {
  title: "AI Tool Categories",
  description: "Browse AI Studio by studio: image, video, writing, audio, documents, developer, marketing and more.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <div className="pt-12">
      <div className="container"><h1 className="text-3xl font-bold md:text-4xl">Categories</h1></div>
      <div className="-mt-12"><FeaturedCategories /></div>
    </div>
  );
}
