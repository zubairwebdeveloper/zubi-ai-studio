import {
  Image,
  Video,
  FileText,
  Code2,
  MessageSquare,
  AudioLines,
  Music2,
  BriefcaseBusiness,
  GraduationCap,
  Palette,
  BrainCircuit,
  Bot,
  Sparkles,
  Camera,
  Languages,
  Database,
  Search,
  WandSparkles,
  Layers3,
  Globe,
  Cpu,
} from "lucide-react";

const iconMap = {
  image: Image,
  images: Image,
  photo: Camera,
  photography: Camera,
  video: Video,
  writing: FileText,
  text: FileText,
  content: FileText,
  coding: Code2,
  code: Code2,
  developer: Code2,
  development: Code2,
  chat: MessageSquare,
  chatbot: Bot,
  chatbots: Bot,
  audio: AudioLines,
  voice: AudioLines,
  music: Music2,
  business: BriefcaseBusiness,
  education: GraduationCap,
  learning: GraduationCap,
  design: Palette,
  art: Palette,
  ai: BrainCircuit,
  artificialintelligence: BrainCircuit,
  productivity: Sparkles,
  marketing: Globe,
  translation: Languages,
  language: Languages,
  data: Database,
  research: Search,
  tools: WandSparkles,
  automation: Layers3,
  technology: Cpu,
};

export function CategoryIcon({ category, className = "h-5 w-5" }) {
  const rawValue =
    typeof category === "string"
      ? category
      : category?.icon ||
        category?.slug ||
        category?.id ||
        category?.name ||
        category?.title;

  const normalizedValue = String(rawValue || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const Icon = iconMap[normalizedValue] || Sparkles;

  return <Icon className={className} aria-hidden="true" />;
}

export default CategoryIcon;
