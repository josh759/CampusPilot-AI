import { NextResponse } from "next/server";
import { getSchedule } from "@/lib/db/schedule";

export async function GET() {
  try {
    const schedule = await getSchedule();
    return NextResponse.json({ data: schedule });
  } catch (error) {
    console.error("GET /api/schedule failed", error);
    return NextResponse.json({ error: "Unable to load schedule." }, { status: 500 });
  }
}
