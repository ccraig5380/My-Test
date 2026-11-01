import { assertBookable, listOpenSlots } from "@/lib/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const band = searchParams.get("band") ?? "";
  try {
    assertBookable(type, band);
    const slots = await listOpenSlots(band);
    return Response.json({ slots });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unavailable";
    return Response.json({ error: message }, { status: 400 });
  }
}
