// Display config only. Real limits and prices will come from Firestore (Phase 10/11).
// Prices are intentionally null until the business sets them and a payment gateway is chosen.
export const plans = [
  { id: "free", name: "Free", price: null, priceNote: "No card required", credits: "Starter credits on signup",
    features: ["Basic tools", "Basic generation history", "Standard models"] },
  { id: "starter", name: "Starter", price: null, priceNote: "Monthly or yearly", credits: "Monthly credits",
    features: ["More monthly credits", "Standard AI models", "Longer generation history"] },
  { id: "pro", name: "Pro", price: null, priceNote: "Monthly or yearly", credits: "Higher monthly credits", highlighted: true,
    features: ["Advanced models", "Video generation", "Bulk processing", "Brand memory", "Advanced tools"] },
  { id: "agency", name: "Agency", price: null, priceNote: "Monthly or yearly", credits: "Shared team credits",
    features: ["Team members", "Client workspaces", "Shared credits", "Agency workflows", "Eligible white-label features"] },
  { id: "business", name: "Business", price: null, priceNote: "Talk to us", credits: "Custom limits",
    features: ["Custom usage limits", "Advanced analytics", "API access", "Support options"] },
];

export const faqs = [
  { q: "Do all tools work today?", a: "A tool shows a Live badge only when a provider is connected and tested. Everything else is marked Coming soon." },
  { q: "How do credits work?", a: "Every tool has a credit cost. Credits are reserved when a job starts and finalized when it finishes. Eligible failed jobs are refunded." },
  { q: "Is voice cloning allowed for any voice?", a: "No. Voice cloning requires explicit consent from the voice owner." },
  { q: "Can I use my own brand style?", a: "Brand Memory lets you save logos, colors, fonts and voice, then apply them in supported tools." },
  { q: "Are my API keys exposed in the browser?", a: "No. Provider keys stay on the server and are never sent to the client." },
];
