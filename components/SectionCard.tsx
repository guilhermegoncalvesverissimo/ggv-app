import { cn } from "@/lib/utils";

export function SectionCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("card p-5", className)}>{children}</section>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="pb-3 text-3xl font-semibold tracking-tight text-ink">
      {children}
    </h1>
  );
}
