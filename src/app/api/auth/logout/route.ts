import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { getCookieConfig } from "@/lib/utils";

// Force dynamic rendering since this route uses cookies
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Get cookie configuration for production deployment
  const cookieConfig = getCookieConfig(request);

  // Clear the custom auth token cookie
  response.cookies.set("auth_token", "", {
    ...cookieConfig,
    maxAge: 0, // Expire immediately
  });

  // Clear Supabase session cookies
  const supabase = createServerSupabaseClient(request, response);
  await supabase.auth.signOut();

  return response;
}
