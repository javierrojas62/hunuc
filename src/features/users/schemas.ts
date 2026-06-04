import { z } from "zod";
import { ROLES } from "@/lib/constants";

export const createUserSchema = z.object({
  full_name: z.string().trim().min(2, "Nombre muy corto").max(120),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum([ROLES.ADMIN, ROLES.SELLER]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
