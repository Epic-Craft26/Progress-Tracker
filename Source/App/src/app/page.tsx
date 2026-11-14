import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/reset-password");
  }

  if (session.role === "CEO") {
    redirect("/ceo");
  } else {
    redirect("/employee");
  }
}
