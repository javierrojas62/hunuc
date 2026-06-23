import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getSession } from "@/lib/auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Restablecer contraseña" };

export default async function ResetPasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="items-center text-center">
        <Image
          src="/logo.jpeg"
          alt="Hunuc Pachacutek"
          width={72}
          height={72}
          priority
          className="rounded-xl"
        />
        <CardTitle className="text-xl">Nueva contraseña</CardTitle>
        <CardDescription>
          Elegí una contraseña segura para tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
