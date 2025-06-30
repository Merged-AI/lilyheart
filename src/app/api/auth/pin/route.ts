import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabase,
  getAuthenticatedFamilyFromToken,
} from "@/lib/supabase-auth";

// GET - Check if user has set up a PIN
export async function GET(request: NextRequest) {
  try {
    const family = await getAuthenticatedFamilyFromToken();

    if (!family) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = createServerSupabase();

    // Check if user has a PIN set up
    const { data: user, error } = await supabase
      .from("families")
      .select("parent_pin")
      .eq("id", family.id)
      .single();

    if (error) {
      console.error("Error fetching PIN:", error);
      return NextResponse.json(
        { error: "Failed to check PIN status" },
        { status: 500 }
      );
    }

    if (!user.parent_pin) {
      return NextResponse.json({ error: "PIN not set up" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hasPin: true,
    });
  } catch (error) {
    console.error("PIN check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Save user PIN
export async function POST(request: NextRequest) {
  try {
    const family = await getAuthenticatedFamilyFromToken();

    if (!family) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { pin } = await request.json();

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    // Save PIN to database (in production, this should be hashed)
    const { error } = await supabase
      .from("families")
      .update({ parent_pin: pin })
      .eq("id", family.id);

    if (error) {
      console.error("Error saving PIN:", error);
      return NextResponse.json(
        { error: "Failed to save PIN" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "PIN saved successfully",
    });
  } catch (error) {
    console.error("PIN save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update user PIN (requires current PIN verification)
export async function PUT(request: NextRequest) {
  try {
    const family = await getAuthenticatedFamilyFromToken();

    if (!family) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { currentPin, newPin } = await request.json();

    if (!currentPin || !newPin) {
      return NextResponse.json(
        { error: "Current PIN and new PIN are required" },
        { status: 400 }
      );
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: "New PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    // First, verify the current PIN
    const { data: user, error: fetchError } = await supabase
      .from("families")
      .select("parent_pin")
      .eq("id", family.id)
      .single();

    if (fetchError) {
      console.error("Error fetching current PIN:", fetchError);
      return NextResponse.json(
        { error: "Failed to verify current PIN" },
        { status: 500 }
      );
    }

    if (!user.parent_pin) {
      return NextResponse.json(
        { error: "No PIN set up. Use POST method to create initial PIN." },
        { status: 400 }
      );
    }

    if (user.parent_pin !== currentPin) {
      return NextResponse.json(
        { error: "Current PIN is incorrect" },
        { status: 400 }
      );
    }

    // Update to new PIN
    const { error: updateError } = await supabase
      .from("families")
      .update({ parent_pin: newPin })
      .eq("id", family.id);

    if (updateError) {
      console.error("Error updating PIN:", updateError);
      return NextResponse.json(
        { error: "Failed to update PIN" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "PIN updated successfully",
    });
  } catch (error) {
    console.error("PIN update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
