import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-auth";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering since this route uses cookies
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password, familyData } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const serverSupabase = createServerSupabase();

    // Check if user exists in auth.users
    const { data: authUsers, error: authError } =
      await serverSupabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error checking auth users:", authError);
      return NextResponse.json(
        { error: "Failed to check user status" },
        { status: 500 }
      );
    }

    const user = authUsers.users.find((u) => u.email === email.toLowerCase());

    if (!user) {
      console.log("❌ User not found in auth.users for email:", email);

      // If we have family data, try to create the user directly as a fallback
      if (familyData && password) {
        console.log("🔄 Attempting to create user directly as fallback...");

        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          // Create the user
          const { data: newUser, error: createError } =
            await supabase.auth.admin.createUser({
              email: email.toLowerCase(),
              password: password,
              email_confirm: true,
              user_metadata: {
                name: familyData.parentName,
                family_name: familyData.familyName,
              },
            });

          if (createError || !newUser.user) {
            console.error("❌ Failed to create user directly:", createError);
            return NextResponse.json(
              { exists: false, message: "User not created yet" },
              { status: 404 }
            );
          }

          console.log("✅ User created directly:", newUser.user.id);

          // Create family record
          const { data: family, error: familyError } = await supabase
            .from("families")
            .insert({
              name: familyData.familyName,
              family_name: familyData.familyName,
              parent_name: familyData.parentName,
              parent_email: email.toLowerCase(),
              user_id: newUser.user.id,
              subscription_plan: "family_communication_coach",
              subscription_status: "trialing",
              trial_ends_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toISOString(), // 7 days from now
            })
            .select()
            .single();

          if (familyError || !family) {
            console.error("❌ Failed to create family record:", familyError);
            // Clean up the user if family creation fails
            await supabase.auth.admin.deleteUser(newUser.user.id);
            return NextResponse.json(
              { exists: false, message: "Family record not created yet" },
              { status: 404 }
            );
          }

          console.log("✅ Family record created:", family.id);

          // Create children records if provided
          if (familyData.children && familyData.children.length > 0) {
            const childrenRecords = familyData.children.map((child: any) => ({
              family_id: family.id,
              name: child.name,
              age: Number(child.age),
              current_concerns: child.concerns || null,
              is_active: true,
              created_at: new Date().toISOString(),
            }));

            const { error: childrenError } = await supabase
              .from("children")
              .insert(childrenRecords);

            if (childrenError) {
              console.error("⚠️ Error creating children:", childrenError);
              // Continue anyway - children can be added later
            } else {
              console.log(
                "✅ Children records created:",
                childrenRecords.length
              );
            }
          }

          // Return success
          return NextResponse.json({
            exists: true,
            userId: newUser.user.id,
            familyId: family.id,
            email: newUser.user.email,
            message: "User account created successfully",
          });
        } catch (fallbackError) {
          console.error("❌ Fallback user creation failed:", fallbackError);
          return NextResponse.json(
            { exists: false, message: "User not created yet" },
            { status: 404 }
          );
        }
      }

      // User not created yet
      return NextResponse.json(
        { exists: false, message: "User not created yet" },
        { status: 404 }
      );
    }

    console.log("✅ User found in auth.users:", user.id);

    // Check if family record exists
    const { data: family, error: familyError } = await serverSupabase
      .from("families")
      .select("id, user_id")
      .eq("user_id", user.id)
      .single();

    if (familyError || !family) {
      console.log(
        "❌ Family record not found for user:",
        user.id,
        "Error:",
        familyError
      );
      // Family not created yet
      return NextResponse.json(
        { exists: false, message: "Family record not created yet" },
        { status: 404 }
      );
    }

    console.log("✅ Family record found:", family.id);

    // User and family both exist - ready!
    return NextResponse.json({
      exists: true,
      userId: user.id,
      familyId: family.id,
      email: user.email,
      message: "User account ready",
    });
  } catch (error) {
    console.error("❌ Check user error:", error);
    return NextResponse.json(
      { error: "Failed to check user status" },
      { status: 500 }
    );
  }
}
