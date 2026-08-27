import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Catalogue from "./Catalogue";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <Catalogue userEmail={user.email} />;
}
