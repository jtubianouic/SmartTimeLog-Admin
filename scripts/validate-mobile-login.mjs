import { hash } from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase environment variables");

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const token = Date.now();
const username = `mobile_login_${token}`;
const plainPassword = `ValidPassword-${token}`;
let employeeId;

async function post(body) {
  return fetch("http://127.0.0.1:3010/api/mobile/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

try {
  const { data: employee, error } = await db
    .from("employee")
    .insert({
      username,
      password: await hash(plainPassword, 12),
      firstname: "Mobile",
      lastname: "Validation",
      isDeleted: false,
    })
    .select("employee_id")
    .single();
  if (error) throw error;
  employeeId = employee.employee_id;

  const malformed = await post("not-json");
  if (malformed.status !== 400) throw new Error(`Expected malformed request 400, received ${malformed.status}`);

  const invalid = await post({ username, plainPassword: "wrong-password" });
  if (invalid.status !== 401) throw new Error(`Expected invalid credentials 401, received ${invalid.status}`);

  const valid = await post({ username, plainPassword });
  const validBody = await valid.json();
  if (valid.status !== 200 || validBody.ok !== true || validBody.employee?.employeeId !== employeeId) {
    throw new Error(`Expected valid credentials 200, received ${valid.status}`);
  }
  if (JSON.stringify(validBody).includes("password")) throw new Error("Authentication response leaked password data");

  const { error: removeError } = await db
    .from("employee")
    .update({ isDeleted: true })
    .eq("employee_id", employeeId);
  if (removeError) throw removeError;

  const removed = await post({ username, plainPassword });
  if (removed.status !== 401) throw new Error(`Expected removed employee 401, received ${removed.status}`);

  console.log("Mobile login endpoint passed malformed, invalid, valid, and removed-user checks.");
} finally {
  if (employeeId) await db.from("employee").delete().eq("employee_id", employeeId);
}
