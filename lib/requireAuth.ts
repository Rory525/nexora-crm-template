import { auth } from "@/auth";
import DeleteButton from "@/components/DeleteButton";
import { deleteContact } from "@/lib/actions/deleteContact";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return session;
}