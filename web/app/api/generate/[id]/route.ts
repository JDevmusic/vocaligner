import { getGenerationById } from "@/lib/store/generationStore";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const generation = await getGenerationById(id);

  if (!generation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(generation, { status: 200 });
}
