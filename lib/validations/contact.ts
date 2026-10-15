import { z } from "zod";
export const contactInputSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name.").max(120),
    email: z.email("Enter a valid email.").max(254),
    message: z
      .string()
      .trim()
      .min(10, "Write at least 10 characters.")
      .max(5000),
    company: z.literal("", "Leave this field empty."),
  })
  .strict();
