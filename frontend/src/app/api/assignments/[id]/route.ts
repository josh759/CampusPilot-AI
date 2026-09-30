import { NextResponse } from "next/server";
import { completeAssignment, deleteAssignment } from "@/lib/db/assignments";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body: unknown = await request.json();
    const status = body && typeof body === "object" ? (body as { status?: unknown }).status : undefined;
    if (status !== "COMPLETED") {
      return NextResponse.json({ error: "Only completion is supported." }, { status: 400 });
    }

    const { id } = await params;
    const result = await completeAssignment(id);
    if (result.count === 0) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    return NextResponse.json({ data: { id, status: "COMPLETED" } });
  } catch (error) {
    console.error("PATCH /api/assignments/[id] failed", error);
    return NextResponse.json({ error: "Unable to complete assignment." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await deleteAssignment(id);
    if (result.count === 0) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/assignments/[id] failed", error);
    return NextResponse.json({ error: "Unable to delete assignment." }, { status: 500 });
  }
}
