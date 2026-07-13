import { z } from "zod";

export const producerSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  code_prefix: z
    .string()
    .trim()
    .max(20)
    .transform((v) => v.toUpperCase())
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type ProducerInput = z.infer<typeof producerSchema>;
