import Link from "next/link";
import { logout } from "@/app/admin/login/actions";

export const metadata = { title: "Acesso negado" };

// Conta logada sem papel admin. Nao mostra dado nenhum; so oferece sair.
export default function Page() {
  return (
    <main className="adm-login">
      <p className="eyebrow">Acesso negado</p>
      <h1>Esta conta não tem acesso ao Adm.</h1>
      <p className="muted-text">O Adm é restrito à equipe da Viver de Obra. Se você faz parte da equipe, peça ao responsável para liberar seu acesso.</p>
      <div className="form-actions">
        <form action={logout}>
          <button className="btn pri" type="submit">Sair desta conta</button>
        </form>
        <Link className="btn" href="/">Voltar ao site</Link>
      </div>
    </main>
  );
}
