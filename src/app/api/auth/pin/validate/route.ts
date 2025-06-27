import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabase,
  getAuthenticatedFamilyFromToken,
} from "@/lib/supabase-auth";

// POST - Validate PIN for session lock access
export async function POST(request: NextRequest) {
  try {
    const family = await getAuthenticatedFamilyFromToken();

    if (!family) {
      console.log("No authenticated family found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { pin } = await request.json();

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "Invalid PIN format" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    // Get the stored PIN for this family
    const { data: user, error } = await supabase
      .from("families")
      .select("parent_pin")
      .eq("id", family.id)
      .single();

    if (error) {
      console.error("Error fetching PIN:", error);
      return NextResponse.json(
        { error: "Failed to validate PIN" },
        { status: 500 }
      );
    }

    if (!user.parent_pin) {
      return NextResponse.json({ error: "PIN not set up" }, { status: 404 });
    }

    // Compare the provided PIN with the stored PIN
    if (pin === user.parent_pin) {
      return NextResponse.json({
        success: true,
        message: "PIN validated successfully",
      });
    } else {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }
  } catch (error) {
    console.error("PIN validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
