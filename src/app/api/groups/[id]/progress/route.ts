import { groupProgress } from "@/server/buyer-queries";

/** Live group progress for the pool page (polled by TanStack Query). Public: no buyer data. */
export async function GET(_req: Request, ctx: RouteContext<"/api/groups/[id]/progress">) {
  const { id } = await ctx.params;
  const progress = await groupProgress(id);
  if (!progress) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  return Response.json(progress, { headers: { "Cache-Control": "no-store" } });
}
