import { z } from "zod";

export const producerSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type ProducerInput = z.infer<typeof producerSchema>;
