import { Button } from "@/components/ui/button";

// Placeholder home page until the buyer flow is built (see docs/ROADMAP.md).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">BunDeals</h1>
      <p className="text-muted-foreground">Buy together, pay less.</p>
      <Button disabled>Coming soon</Button>
    </main>
  );
}
