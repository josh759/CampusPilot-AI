import { NextResponse } from "next/server";
import { getCourses } from "@/lib/db/courses";

export async function GET() {
  try {
    const courses = await getCourses();
    return NextResponse.json({ data: courses });
  } catch (error) {
    console.error("GET /api/courses failed", error);
    return NextResponse.json({ error: "Unable to load courses." }, { status: 500 });
  }
}
