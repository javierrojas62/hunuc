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
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Ingresar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const { message, error } = await searchParams;

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
      <CardContent className="flex flex-col gap-4">
        {message === "clave-actualizada" && (
          <Alert>
            <AlertDescription>
              Contraseña actualizada. Podés iniciar sesión.
            </AlertDescription>
          </Alert>
        )}
        {error === "link-invalido" && (
          <Alert variant="destructive">
            <AlertDescription>
              El enlace es inválido o ya expiró. Solicitá uno nuevo.
            </AlertDescription>
          </Alert>
        )}
        <LoginForm />
      </CardContent>
    </Card>
  );
}
