import { BookOpen, House, Moon, Sparkles } from "lucide-react";
import GlassSelector from "./GlassSelector";

const tabs = [
  { value: "today", label: "Today", icon: House },
  { value: "journal", label: "Journal", icon: BookOpen },
  { value: "discover", label: "Discover", icon: Sparkles },
  { value: "tonight", label: "Wind down", icon: Moon },
] as const;

export type Tab = (typeof tabs)[number]["value"];
export const tabIndex = (tab: Tab) =>
  tabs.findIndex(({ value }) => value === tab);

export default function BottomNav({
  tab,
  onSelect,
}: {
  tab: Tab;
  onSelect: (tab: Tab) => void;
}) {
  return (
    <GlassSelector
      options={tabs}
      value={tab}
      onSelect={onSelect}
      label="Main navigation"
      navigation
    />
  );
}
