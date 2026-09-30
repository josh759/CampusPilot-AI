import { NextResponse } from "next/server";
import { createAssignment, getAssignments } from "@/lib/db/assignments";

function isCreateAssignmentBody(value: unknown): value is { title: string; dueDate: string; courseId: string } {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return typeof body.title === "string" && typeof body.dueDate === "string" && typeof body.courseId === "string";
}

export async function GET() {
  try {
    const assignments = await getAssignments();
    return NextResponse.json({ data: assignments });
  } catch (error) {
    console.error("GET /api/assignments failed", error);
    return NextResponse.json({ error: "Unable to load assignments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isCreateAssignmentBody(body) || !body.title.trim() || !body.courseId.trim()) {
      return NextResponse.json({ error: "Title, due date, and course are required." }, { status: 400 });
    }

    const dueDate = new Date(body.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      return NextResponse.json({ error: "Due date must be valid." }, { status: 400 });
    }

    const assignment = await createAssignment({
      title: body.title.trim(),
      dueDate,
      courseId: body.courseId,
    });
    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/assignments failed", error);
    return NextResponse.json({ error: "Unable to create assignment." }, { status: 500 });
  }
}
