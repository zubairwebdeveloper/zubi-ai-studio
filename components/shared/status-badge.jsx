import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }) {
  return status === "live" ? <Badge variant="live">Live</Badge> : <Badge variant="soon">Coming soon</Badge>;
}
