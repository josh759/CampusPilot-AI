import { db } from "@/lib/db";
import { getDemoUser } from "@/lib/db/users";

export async function getSchedule() {
  const user = await getDemoUser();

  return db.scheduleEvent.findMany({
    where: { userId: user.id },
    orderBy: { startTime: "asc" },
  });
}
