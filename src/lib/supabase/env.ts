const publicEnvironment = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

export function getSupabaseEnvironment() {
  if (!publicEnvironment.url || !publicEnvironment.publishableKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return publicEnvironment as { url: string; publishableKey: string };
}