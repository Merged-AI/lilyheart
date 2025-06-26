import { NextRequest, NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import { createClient } from '@supabase/supabase-js'

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'dremma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = params.fileId
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')

    console.log(`Delete request received for file: ${fileId}, child: ${childId}`)

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 }
      )
    }

    const index = pinecone.index(INDEX_NAME)

    // Delete the document from Pinecone
    try {
      await index.deleteOne(fileId)
      console.log(`✅ Successfully deleted knowledge base document: ${fileId} for child ${childId}`)
    } catch (error) {
      console.error(`Error deleting document from Pinecone: ${fileId}`, error)
      // Continue even if Pinecone deletion fails, as the document might not exist
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted knowledge base document: ${fileId}`,
      deletedFileId: fileId
    })

  } catch (error) {
    console.error('Error in knowledge base document deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 