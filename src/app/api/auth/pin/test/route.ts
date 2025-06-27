import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, getAuthenticatedFamilyFromToken } from "@/lib/supabase-auth";

// GET - Test PIN system
export async function GET(request: NextRequest) {
  try {
    const family = await getAuthenticatedFamilyFromToken();
    
    if (!family) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabase();
    
    // Test if parent_pin column exists
    const { data: user, error } = await supabase
      .from('families')
      .select('id, parent_pin')
      .eq('id', family.id)
      .single();

    if (error) {
      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      familyId: family.id,
      hasPinColumn: 'parent_pin' in user,
      currentPin: user.parent_pin || null,
      message: 'PIN system test completed'
    });

  } catch (error) {
    console.error('PIN test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 