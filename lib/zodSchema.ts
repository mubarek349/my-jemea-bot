import { z } from "zod";

export const loginSchema = z.object({
  phoneno: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
  passcode: z.string().min(8),
});

export const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
});
export type Course = z.infer<typeof courseSchema>;

export const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  videoUrl: z.string().url("Invalid URL"),
  order: z.number().int().positive("Order must be a positive integer"),
  courseId: z.string().min(1, "Course ID is required"),
});
export type Lesson = z.infer<typeof lessonSchema>;

// question
export const questionSchema = z.object({
  id: z.string({}).optional(),
  question: z.string({}).nonempty("question is required"),
  options: z
    .array(z.string({}).nonempty("option is required"), {})
    .min(1, "option is required"),
  answers: z
    .array(z.string({}).nonempty("at least 1 answer is required"), {})
    .min(1, "answer is required"),
});
export type TQuestion = z.infer<typeof questionSchema>;
