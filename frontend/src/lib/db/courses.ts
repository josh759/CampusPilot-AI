import { db } from "@/lib/db";
import { getDemoUser } from "@/lib/db/users";

export async function getCourses() {
  const user = await getDemoUser();

  return db.course.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
}
