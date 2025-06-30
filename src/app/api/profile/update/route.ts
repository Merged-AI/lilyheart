import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedFamilyFromToken, createServerSupabase } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated family
    const family = await getAuthenticatedFamilyFromToken();
    
    if (!family) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the request body
    const { parent_name, family_name } = await request.json();

    // Validate input
    if (!parent_name || !family_name) {
      return NextResponse.json(
        { message: "Parent name and family name are required" },
        { status: 400 }
      );
    }

    // Update the family information in the database using the family's id
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("families")
      .update({
        parent_name: parent_name.trim(),
        family_name: family_name.trim(),
      })
      .eq("id", family.id) // Update based on the family's own id
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json(
        { message: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      family: {
        parent_name: data.parent_name,
        family_name: data.family_name,
        children: data.children || [],
      },
    });

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 