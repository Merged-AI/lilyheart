import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedFamilyFromToken,
  createServerSupabase,
} from "@/lib/supabase-auth";

// Get the most recent active child from the authenticated family
async function getMostRecentChild(familyId: string): Promise<string | null> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select("id")
      .eq("family_id", familyId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !child) {
      return null;
    }

    return child.id;
  } catch (error) {
    return null;
  }
}

// Verify that child has completed comprehensive therapeutic profile
async function verifyChildProfileComplete(childId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select(
        "name, current_concerns, parent_goals, reason_for_adding, profile_completed"
      )
      .eq("id", childId)
      .single();

    if (error || !child) {
      return false;
    }

    // Check if essential therapeutic fields are completed
    const hasRequiredFields = !!(
      child.name?.trim() &&
      child.current_concerns?.trim() &&
      child.parent_goals?.trim() &&
      child.reason_for_adding?.trim()
    );

    // Also check the profile_completed flag if it exists
    const isMarkedComplete = child.profile_completed === true;

    return hasRequiredFields && isMarkedComplete;
  } catch (error) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')

    const family = await getAuthenticatedFamilyFromToken()
    
    if (!family) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabase()

    // If childId is provided, check that specific child
    if (childId) {
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('id, name, profile_completed, family_id')
        .eq('id', childId)
        .eq('family_id', family.id)
        .eq('is_active', true)
        .single()

      if (childError || !child) {
        return NextResponse.json(
          { error: 'Child not found' },
          { status: 404 }
        )
      }

      if (!child.profile_completed) {
        return NextResponse.json(
          { 
            requiresProfileCompletion: true,
            childId: child.id,
            message: 'Child profile needs completion'
          },
          { status: 422 }
        )
      }

      return NextResponse.json({
        success: true,
        child: {
          id: child.id,
          name: child.name,
          profileCompleted: child.profile_completed
        }
      })
    }

    // If no childId, check if family has any children with completed profiles
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, name, profile_completed')
      .eq('family_id', family.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (childrenError) {
      return NextResponse.json(
        { error: 'Failed to check children' },
        { status: 500 }
      )
    }

    if (!children || children.length === 0) {
      return NextResponse.json(
        { 
          requiresChildRegistration: true,
          message: 'No children found. Please add a child first.'
        },
        { status: 404 }
      )
    }

    // Check if any child has a completed profile
    const childWithProfile = children.find(child => child.profile_completed)
    
    if (!childWithProfile) {
      return NextResponse.json(
        { 
          requiresProfileCompletion: true,
          childId: children[0].id, // Return first child for profile completion
          message: 'Child profile needs completion'
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      children: children.map(child => ({
        id: child.id,
        name: child.name,
        profileCompleted: child.profile_completed
      }))
    })

  } catch (error) {
    console.error('Profile check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
