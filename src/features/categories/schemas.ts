import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  slug: z
    .string()
    .trim()
    .min(1, "El slug es obligatorio")
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Usá minúsculas, números y guiones"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")
    .default("#6b7280"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
