import { redirect } from "next/navigation";

// /admin -> lista de obras (o proxy ja manda quem nao esta logado para o login).
export default function Page() {
  redirect("/admin/obras");
}
