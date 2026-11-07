export const siteConfig = {
  name: "AI Studio",
  tagline:
    "Image, video, audio, writing and automation tools on one credit wallet.",
  description:
    "AI Studio brings image, video, audio, writing, document, developer and business automation tools into one workspace with unified credits.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",

  nav: [
    { label: "Tools", href: "/tools" },
    { label: "Categories", href: "/categories" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
    { label: "Docs", href: "/documentation" },
  ],

  footer: {
    Product: [
      { label: "All tools", href: "/tools" },
      { label: "Categories", href: "/categories" },
      { label: "Pricing", href: "/pricing" },
    ],
    Resources: [
      { label: "Documentation", href: "/documentation" },
      { label: "Blog", href: "/blog" },
      { label: "Affiliate program", href: "/affiliate" },
    ],
    Company: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    Legal: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms and conditions", href: "/terms" },
    ],
  },
};

export const categories = [
  {
    name: "Image Generation",
    slug: "image",
    icon: "image",
    description: "Create and edit stunning AI images.",
  },
  {
    name: "Video Generation",
    slug: "video",
    icon: "video",
    description: "Generate engaging AI videos.",
  },
  {
    name: "Writing",
    slug: "writing",
    icon: "writing",
    description: "Create quality content with AI.",
  },
  {
    name: "Developer Tools",
    slug: "developer",
    icon: "code",
    description: "Build and improve code with AI.",
  },
  {
    name: "Audio & Voice",
    slug: "audio",
    icon: "audio",
    description: "Create AI voices and audio.",
  },
  {
    name: "Business",
    slug: "business",
    icon: "business",
    description: "Automate everyday business tasks.",
  },
];

export const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    credits: "50 credits",
    description: "Explore AI tools and get started.",
    features: [
      "50 starter credits",
      "Access to free tools",
      "Basic generation features",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "month",
    credits: "1,000 credits",
    description: "For creators and professionals.",
    popular: true,
    features: [
      "1,000 monthly credits",
      "Access to premium tools",
      "Faster generation",
      "High-quality exports",
      "Priority support",
    ],
  },
  {
    name: "Business",
    price: "$49",
    period: "month",
    credits: "5,000 credits",
    description: "For teams and growing businesses.",
    features: [
      "5,000 monthly credits",
      "All premium tools",
      "Advanced AI features",
      "Team workflows",
      "Priority support",
    ],
  },
];

export const faqs = [
  {
    question: "What is AI Studio?",
    answer:
      "AI Studio is an AI-powered workspace that brings image, video, audio, writing and automation tools together in one place.",
  },
  {
    question: "How do credits work?",
    answer:
      "Credits are used when you run supported AI tools. The credit cost can vary depending on the tool and generation settings.",
  },
  {
    question: "Can I use AI Studio for free?",
    answer:
      "Yes. You can start with the free plan and explore available tools using your starter credits.",
  },
  {
    question: "Do I need separate accounts for different tools?",
    answer:
      "No. AI Studio is designed to provide one workspace and a unified credit wallet for supported tools.",
  },
  {
    question: "Can I upgrade my plan later?",
    answer:
      "Yes. You can upgrade your subscription as your usage and requirements grow.",
  },
];
