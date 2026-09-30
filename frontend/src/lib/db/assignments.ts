import { AssignmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getDemoUser } from "@/lib/db/users";

export type CreateAssignmentInput = {
  title: string;
  dueDate: Date;
  courseId: string;
};

export async function getAssignments() {
  const user = await getDemoUser();

  return db.assignment.findMany({
    where: { userId: user.id },
    include: { course: { select: { title: true, courseCode: true } } },
    orderBy: { dueDate: "asc" },
  });
}

export async function createAssignment(input: CreateAssignmentInput) {
  const user = await getDemoUser();
  const course = await db.course.findFirst({
    where: { id: input.courseId, userId: user.id },
  });

  if (!course) {
    throw new Error("Course not found.");
  }

  return db.assignment.create({
    data: {
      title: input.title,
      dueDate: input.dueDate,
      courseId: course.id,
      userId: user.id,
    },
    include: { course: { select: { title: true, courseCode: true } } },
  });
}

export async function completeAssignment(id: string) {
  const user = await getDemoUser();

  return db.assignment.updateMany({
    where: { id, userId: user.id },
    data: { status: AssignmentStatus.COMPLETED },
  });
}

export async function deleteAssignment(id: string) {
  const user = await getDemoUser();

  return db.assignment.deleteMany({
    where: { id, userId: user.id },
  });
}
