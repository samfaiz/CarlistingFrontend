import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-brand">
        carsens<span className="text-brand-border">.</span>
      </h1>
      <p className="text-sm text-muted">
        Frontend scaffold ready — Next.js 15 (Pages Router) + React 19 + Tailwind v4.
      </p>
      <Button asChild variant="secondary" size="sm">
        <Link href="/dev/ui-kit">Open the UI Kit</Link>
      </Button>
    </main>
  );
}
