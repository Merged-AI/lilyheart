import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getAuthenticatedFamilyFromToken,
  createServerSupabase,
} from "@/lib/supabase-auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verify that child belongs to the authenticated family
async function verifyChildBelongsToFamily(
  childId: string,
  familyId: string
): Promise<boolean> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select("id, family_id")
      .eq("id", childId)
      .eq("family_id", familyId)
      .eq("is_active", true)
      .single();

    if (error || !child) {
      console.error("Error verifying child belongs to family:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in verifyChildBelongsToFamily:", error);
    return false;
  }
}

// Convert audio to text using OpenAI GPT-4o Transcribe
async function transcribeAudio(audioData: string): Promise<string> {
  try {
    console.log("Transcribing audio data with OpenAI GPT-4o Transcribe...");
    console.log("Audio data length:", audioData.length);

    // Convert base64 audio data to buffer
    const audioBuffer = Buffer.from(audioData, "base64");
    console.log("Audio buffer size:", audioBuffer.length);

    // Check if audio buffer is too small (less than 1KB might indicate no meaningful audio)
    if (audioBuffer.length < 1024) {
      console.log("Audio buffer too small, likely no meaningful audio content");
      return ""; // Return empty string for very small audio chunks
    }

    // Create a temporary file using fs
    const fs = require("fs");
    const path = require("path");
    const os = require("os");

    const tempDir = os.tmpdir();
    // Use WebM extension to match the recorded format
    const tempFile = path.join(tempDir, `audio_${Date.now()}.webm`);

    // Write the audio buffer to a temporary file
    fs.writeFileSync(tempFile, audioBuffer);
    console.log("Temporary file created:", tempFile);
    console.log("File size:", fs.statSync(tempFile).size, "bytes");

    // Create a file stream for OpenAI
    const fileStream = fs.createReadStream(tempFile);

    // Log the file details before sending
    console.log("Sending file to OpenAI:", {
      path: tempFile,
      size: fs.statSync(tempFile).size,
      exists: fs.existsSync(tempFile),
    });

    // Try with different model first to test compatibility
    let transcription;
    try {
      // Use OpenAI GPT-4o Transcribe API for better accuracy
      transcription = await openai.audio.transcriptions.create({
        file: fileStream,
        model: "gpt-4o-transcribe", // Use the latest and most accurate model
        language: "en", // Specify English for better accuracy
        response_format: "text", // Get plain text response
        temperature: 0.0, // Lower temperature for more accurate transcription
      });
    } catch (error: any) {
      console.log(
        "GPT-4o Transcribe failed, trying Whisper as fallback:",
        error.message
      );
      // Fallback to Whisper if GPT-4o Transcribe fails
      const fallbackStream = fs.createReadStream(tempFile);
      transcription = await openai.audio.transcriptions.create({
        file: fallbackStream,
        model: "whisper-1", // Fallback to Whisper
        language: "en",
        response_format: "text",
        temperature: 0.0,
      });
    }

    // Clean up the temporary file
    fs.unlinkSync(tempFile);
    console.log("Temporary file cleaned up");

    console.log("Transcription completed:", transcription);

    // Clean up the transcription text
    const cleanedTranscription =
      typeof transcription === "string" ? transcription.trim() : "";

    console.log("Cleaned transcription:", cleanedTranscription);

    // For real-time mode, we want to be more lenient about short transcriptions
    // but still filter out meaningless results
    if (cleanedTranscription.length < 3) {
      console.log(
        "Transcription too short, likely background noise or silence"
      );
      return "";
    }

    // Filter out common transcription artifacts for short audio
    const artifacts = [
      "you",
      "thank you",
      "thanks",
      "um",
      "uh",
      "hmm",
      "ah",
      "oh",
    ];
    if (artifacts.includes(cleanedTranscription.toLowerCase())) {
      console.log("Transcription appears to be artifact/filler word, ignoring");
      return "";
    }

    return cleanedTranscription;
  } catch (error: any) {
    console.error("Error transcribing audio with OpenAI:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      type: error.type,
      status: error.status,
    });

    // Clean up temp file if it exists
    try {
      const fs = require("fs");
      const path = require("path");
      const os = require("os");
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `audio_${Date.now()}.webm`);
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temp file:", cleanupError);
    }

    // For real-time mode, we want to be more resilient to transcription errors
    // Return empty string instead of throwing to allow continuation
    console.log(
      "Transcription failed, returning empty string to continue real-time flow"
    );
    return "";
  }
}

// Convert text to speech using OpenAI TTS
async function textToSpeech(text: string): Promise<string | null> {
  try {
    console.log("Converting text to speech with OpenAI TTS:", text);

    // Use OpenAI TTS API
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy", // Options: alloy, echo, fable, onyx, nova, shimmer
      input: text,
    });

    // Convert the response to base64
    const arrayBuffer = await speech.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    console.log("TTS conversion completed");
    return base64Audio;
  } catch (error: any) {
    console.error("Error converting text to speech with OpenAI:", error);

    // Check if it's a model access error
    if (
      error.code === "model_not_found" ||
      error.message?.includes("does not have access to model")
    ) {
      console.log("TTS model not available, returning text-only response");
      return null; // Return null to indicate no audio available
    }

    throw new Error("Failed to convert text to speech");
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated family
    const family = await getAuthenticatedFamilyFromToken();
    if (!family) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { audioData, childId, sessionId, messageHistory = [] } = body;

    if (!audioData) {
      return NextResponse.json(
        { error: "Audio data is required" },
        { status: 400 }
      );
    }

    // Verify child access
    if (childId) {
      const hasAccess = await verifyChildBelongsToFamily(childId, family.id);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Child not found or access denied" },
          { status: 404 }
        );
      }
    }

    console.log("Voice chat API called with:", {
      childId,
      sessionId,
      audioDataLength: audioData ? audioData.length : 0,
      familyId: family.id,
      isRealTimeMode: sessionId?.includes("realtime-voice-session"),
    });

    // Log audio data details for debugging
    if (audioData) {
      console.log(
        "Audio data received, first 100 chars:",
        audioData.substring(0, 100)
      );
      console.log(
        "Audio data ends with:",
        audioData.substring(audioData.length - 50)
      );
      console.log(
        "Audio data valid base64:",
        /^[A-Za-z0-9+/]*={0,2}$/.test(audioData)
      );

      // For real-time mode, we expect shorter audio chunks
      if (sessionId?.includes("realtime-voice-session")) {
        console.log("Real-time mode detected - processing audio chunk");
      } else {
        // Check if audio data looks valid for traditional mode
        if (audioData.length < 1000) {
          console.warn("Audio data seems very short for traditional mode");
        }
      }

      // Log more details about the audio data
      console.log("Audio data length:", audioData.length);
      console.log(
        "Expected decoded size:",
        Math.ceil((audioData.length * 3) / 4)
      );
    }

    // Step 1: Transcribe audio to text
    const transcribedText = await transcribeAudio(audioData);

    // If transcription is empty (silence, noise, or error), return gracefully for real-time mode
    if (!transcribedText || transcribedText.trim().length === 0) {
      console.log("No transcribable content found, returning empty response");
      return NextResponse.json({
        success: true,
        transcribedText: "",
        aiResponse: "",
        audioResponse: null,
        useClientTTS: false,
        sessionId: sessionId || `voice-${Date.now()}`,
        timestamp: new Date().toISOString(),
        isEmpty: true, // Flag to indicate no meaningful content
      });
    }

    // Step 2: Process through existing chat logic ONLY if there's transcribed text
    // Use OpenAI Chat Completions for AI response
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Dr. Emma AI, a warm and empathetic child therapist. Provide supportive, age-appropriate responses to children's concerns. Keep responses concise but meaningful, warm, and encouraging. For real-time conversations, maintain natural flow and don't repeat previous responses unnecessarily.",
        },
        ...messageHistory.map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        {
          role: "user",
          content: transcribedText,
        },
      ],
      max_tokens: 200, // Slightly longer for more complete responses
      temperature: 0.8, // Slightly higher for more natural conversation
    });

    const aiResponseText = aiResponse.choices[0]?.message?.content || "";

    // Step 3: Convert AI response to speech (or indicate client-side TTS)
    let audioResponse = null;
    try {
      audioResponse = await textToSpeech(aiResponseText);
    } catch (error) {
      console.error("TTS failed, will use client-side TTS:", error);
      // audioResponse remains null, client will use TTS
    }

    // Step 4: Save session data (placeholder for future implementation)
    // TODO: Save voice session data to database with real-time session tracking

    return NextResponse.json({
      success: true,
      transcribedText,
      aiResponse: aiResponseText,
      audioResponse,
      useClientTTS: !audioResponse, // Flag to use client-side TTS if server TTS failed
      sessionId: sessionId || `voice-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isEmpty: false,
    });
  } catch (error) {
    console.error("Error in voice chat API:", error);

    // For real-time mode, return a more graceful error response
    const isRealTimeMode = request.url.includes("realtime-voice-session");

    if (isRealTimeMode) {
      return NextResponse.json(
        {
          success: false,
          error: "Processing error occurred",
          transcribedText: "",
          aiResponse: "",
          audioResponse: null,
          useClientTTS: false,
          sessionId: `voice-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isEmpty: true,
        },
        { status: 200 } // Return 200 to allow real-time flow to continue
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process voice chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint for voice chat service
  return NextResponse.json({
    success: true,
    message: "Voice chat API is available",
    status: "ready",
    timestamp: new Date().toISOString(),
  });
}
