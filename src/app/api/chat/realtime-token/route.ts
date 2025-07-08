import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedFamilyFromToken } from "@/lib/supabase-auth";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated family
    const family = await getAuthenticatedFamilyFromToken();
    if (!family) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get child ID from query params
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    
    if (!childId) {
      return NextResponse.json(
        { error: "Child ID is required" },
        { status: 400 }
      );
    }

    // Generate OpenAI Realtime session token
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "alloy", // Child-friendly voice
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI Realtime session creation failed:", errorData);
      return NextResponse.json(
        { error: "Failed to create realtime session" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log("✅ OpenAI Realtime session token generated for child:", childId);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating realtime token:", error);
    return NextResponse.json(
      { error: "Failed to generate session token" },
      { status: 500 }
    );
  }
} 