import type { User } from "@/lib/types";

export const currentUser: User = {
  id: "student-17",
  username: "temuujin",
  role: "student",
  classCode: "7А",
  pet: { lineId: "wrougon", level: 2, xp: 60 },
};

export const teacherUser: User = {
  id: "teacher-1",
  username: "bagsh",
  role: "teacher",
  classCode: "7А",
};
