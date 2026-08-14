import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Bootstraps the store admin account.
 * The admin signs in with a username; it is mapped server-side to an internal
 * email address. The account is created (and granted the admin role) on the
 * first successful sign-in attempt with the configured default credentials.
 * Passwords are always hashed and stored by the auth service — never here.
 */
export const ensureAdminAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) =>
    z
      .object({ username: z.string().trim().min(3).max(60), password: z.string().min(1).max(72) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const adminUsername = process.env["ADMIN_USERNAME"] ?? "shahin.admin";
    const defaultPassword = process.env["ADMIN_DEFAULT_PASSWORD"] ?? "1234";
    const domain = "shahinmart.admin";

    if (data.username.toLowerCase() !== adminUsername.toLowerCase()) {
      return { ok: false as const, email: null, message: "Unknown admin username" };
    }

    const email = `${adminUsername.toLowerCase()}@${domain}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = existing?.users?.find((u) => u.email?.toLowerCase() === email);

    if (!found) {
      if (data.password !== defaultPassword) {
        return { ok: false as const, email: null, message: "Invalid credentials" };
      }
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { full_name: "Store Administrator" },
      });
      if (error || !created.user) {
        return { ok: false as const, email: null, message: error?.message ?? "Could not create admin" };
      }
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: created.user.id, role: "admin" },
        { onConflict: "user_id,role" },
      );
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: created.user.id, full_name: "Store Administrator", email }, { onConflict: "id" });
      return { ok: true as const, email, message: "Admin account ready" };
    }

    await supabaseAdmin.from("user_roles").upsert(
      { user_id: found.id, role: "admin" },
      { onConflict: "user_id,role" },
    );
    return { ok: true as const, email, message: "Admin account ready" };
  });
