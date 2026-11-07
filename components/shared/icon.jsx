import {
  ImageIcon, Clapperboard, PenLine, AudioLines, FileText, Code2, MessagesSquare, Megaphone, Palette,
  ListChecks, ShoppingBag, Workflow, LineChart, Search, Languages, Sparkles,
} from "lucide-react";

const icons = { ImageIcon, Clapperboard, PenLine, AudioLines, FileText, Code2, MessagesSquare, Megaphone, Palette,
  ListChecks, ShoppingBag, Workflow, LineChart, Search, Languages };

export function CategoryIcon({ name, className }) {
  const Cmp = icons[name] || Sparkles;
  return <Cmp className={className} aria-hidden="true" />;
}
