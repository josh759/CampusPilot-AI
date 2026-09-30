import { db } from "@/lib/db";

export const DEMO_USER_EMAIL = "joshua@example.com";

export async function getDemoUser() {
  const user = await db.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
  });

  if (!user) {
    throw new Error("Demo user was not found. Run the database seed first.");
  }

  return user;
}
