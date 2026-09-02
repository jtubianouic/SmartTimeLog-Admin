import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serverKey?.startsWith("sb_secret_")) {
  console.error("Supabase server configuration is invalid.");
  process.exit(1);
}

let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) {
  input += chunk;
}

try {
  const { email, password, email_confirm, app_metadata } = JSON.parse(input);
  const supabase = createClient(supabaseUrl, serverKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm,
    app_metadata,
  });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to create administrator.");
  process.exit(1);
}