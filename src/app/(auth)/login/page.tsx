import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSession } from "@/lib/auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Ingresar" };

export default async function LoginPage() {
  // Si ya hay sesión, no mostrar el login
  const session = await getSession();
  if (session) redirect("/");

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
        <CardTitle className="text-xl">Hunuc Pachacutek</CardTitle>
        <CardDescription>Ingresá para gestionar el almacén</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
