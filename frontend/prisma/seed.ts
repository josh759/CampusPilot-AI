import { PrismaClient, AssignmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "joshua@example.com" },
    update: {
      name: "Joshua",
      semester: "Fall 2026",
      date: new Date("2026-09-30T00:00:00-04:00"),
      studyHours: 12.5,
      studyGoal: 16,
      jobApplications: 6,
      interviews: 2,
    },
    create: {
      name: "Joshua",
      email: "joshua@example.com",
      semester: "Fall 2026",
      date: new Date("2026-09-30T00:00:00-04:00"),
      studyHours: 12.5,
      studyGoal: 16,
      jobApplications: 6,
      interviews: 2,
    },
  });

  await prisma.assignment.deleteMany({ where: { userId: user.id } });
  await prisma.scheduleEvent.deleteMany({ where: { userId: user.id } });
  await prisma.course.deleteMany({ where: { userId: user.id } });

  const courses = await Promise.all([
    prisma.course.create({
      data: {
        userId: user.id,
        title: "Operating Systems",
        courseCode: "COSC 439",
        instructor: "Dr. Chen",
        progress: 5,
        totalModules: 14,
      },
    }),
    prisma.course.create({
      data: {
        userId: user.id,
        title: "Programming Languages",
        courseCode: "COSC 455",
        instructor: "Dr. Williams",
        progress: 6,
        totalModules: 14,
      },
    }),
    prisma.course.create({
      data: {
        userId: user.id,
        title: "Intro to Abstract Math",
        courseCode: "MATH 267",
        instructor: "Dr. Patel",
        progress: 4,
        totalModules: 12,
      },
    }),
    prisma.course.create({
      data: {
        userId: user.id,
        title: "Abstract Algebra",
        courseCode: "MATH 470",
        instructor: "Dr. Rivera",
        progress: 5,
        totalModules: 12,
      },
    }),
  ]);

  const [operatingSystems, programmingLanguages, abstractMath] = courses;

  await prisma.assignment.createMany({
    data: [
      {
        userId: user.id,
        courseId: operatingSystems.id,
        title: "Process scheduling lab",
        dueDate: new Date("2026-10-01T23:59:00-04:00"),
        status: AssignmentStatus.IN_PROGRESS,
      },
      {
        userId: user.id,
        courseId: abstractMath.id,
        title: "Problem set 4: induction",
        dueDate: new Date("2026-10-02T17:00:00-04:00"),
        status: AssignmentStatus.NOT_STARTED,
      },
      {
        userId: user.id,
        courseId: programmingLanguages.id,
        title: "Functional programming exercises",
        dueDate: new Date("2026-10-04T23:59:00-04:00"),
        status: AssignmentStatus.IN_PROGRESS,
      },
    ],
  });

  await prisma.scheduleEvent.createMany({
    data: [
      {
        userId: user.id,
        title: "Operating Systems",
        startTime: new Date("2026-09-30T09:00:00-04:00"),
        endTime: new Date("2026-09-30T09:50:00-04:00"),
        location: "Lecture · Science Complex 210",
        type: "Class",
      },
      {
        userId: user.id,
        title: "Proof practice",
        startTime: new Date("2026-09-30T11:00:00-04:00"),
        endTime: new Date("2026-09-30T12:00:00-04:00"),
        location: "Study block · Library, floor 3",
        type: "Focus",
      },
      {
        userId: user.id,
        title: "Abstract Algebra",
        startTime: new Date("2026-09-30T14:00:00-04:00"),
        endTime: new Date("2026-09-30T15:15:00-04:00"),
        location: "Lecture · Mathematics Building 104",
        type: "Class",
      },
    ],
  });

  console.log(`Seeded CampusPilot for ${user.email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
