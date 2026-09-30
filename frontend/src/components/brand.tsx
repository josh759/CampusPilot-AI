import Link from "next/link";
import { Icon } from "@/components/icon";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="CampusPilot AI home" className={`inline-flex w-fit items-center gap-2.5 rounded-md ${light ? "text-white" : "text-ink"}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1b28d] text-ink"><Icon name="compass" className="h-6 w-6" /></span>
      <span className="text-lg font-bold tracking-tight">CampusPilot<span className={`ml-1 text-xs font-medium ${light ? "text-[#f1b28d]" : "text-coral"}`}>AI</span></span>
    </Link>
  );
}
