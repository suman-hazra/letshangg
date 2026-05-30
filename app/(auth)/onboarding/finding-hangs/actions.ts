"use server";

import { createClient } from "@/lib/supabase/server";
import { generateHangsForUser } from "@/lib/hang-manager";

export async function runHangManager(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await generateHangsForUser(user.id);
}
