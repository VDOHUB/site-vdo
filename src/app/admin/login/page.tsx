import Image from "next/image";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Entrar" };

export default function Page() {
  return (
    <main className="adm-login">
      <Image src="/brand/logo-preto-amarelo.png" alt="Viver de Obra" width={75} height={64} className="logo" style={{ height: 64, width: "auto" }} priority />
      <h1>Adm Viver de Obra</h1>
      <p className="muted-text">Área interna da equipe. Acesso apenas para administradores.</p>
      <LoginForm />
    </main>
  );
}
