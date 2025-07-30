import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCookieConfig } from '@/lib/utils'

// Force dynamic rendering since this route uses cookies
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, verify the user exists in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

    if (authError || !authData.user) {
      console.error("Auto-login failed:", authError);
      return NextResponse.json(
        { error: "Failed to authenticate" },
        { status: 401 }
      );
    }

    console.log("Auto-login successful for:", email);

    // Find family by email (same as regular login)
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("*")
      .eq("parent_email", email.toLowerCase())
      .single();

    if (familyError || !family) {
      console.error("Family not found for auto-login:", familyError);
      return NextResponse.json(
        { error: "Family record not found" },
        { status: 404 }
      );
    }

    // Generate session token (same as regular login)
    const sessionToken = generateSessionToken(family.id);

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      family: {
        id: family.id,
        name: family.family_name,
        parent_name: family.parent_name,
      },
      message: "Authentication successful",
    });

    // Get cookie configuration for production deployment
    const cookieConfig = getCookieConfig(request)

    // Set the custom auth_token cookie (same as regular login)
    response.cookies.set("auth_token", sessionToken, {
      ...cookieConfig,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Auto-login error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate" },
      { status: 500 }
    );
  }
}

function generateSessionToken(familyId: string): string {
  // In a production app, use proper JWT or secure session tokens
  return Buffer.from(`${familyId}:${Date.now()}`).toString("base64");
}
