import { NextRequest, NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'dremma'

// Create embedding for text content
async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text.substring(0, 8000),
      dimensions: 2048
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error creating embedding:', error)
    throw new Error('Failed to create embedding')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, childId, limit = 3 } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Testing knowledge base query for child ${childId}: "${query}"`)

    const index = pinecone.index(INDEX_NAME)
    
    // Create embedding for the query
    const queryEmbedding = await createEmbedding(query)
    
    // Search for knowledge base documents specific to this child
    const results = await index.query({
      vector: queryEmbedding,
      topK: limit,
      filter: {
        child_id: { $eq: childId },
        type: { $eq: 'knowledge_base_document' }
      },
      includeMetadata: true
    })

    if (!results.matches || results.matches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No relevant knowledge base documents found',
        results: [],
        query: query,
        childId: childId
      })
    }

    const formattedResults = results.matches.map((match, index) => ({
      rank: index + 1,
      similarity: match.score,
      document: {
        id: match.id,
        filename: match.metadata?.filename || 'Unknown',
        content_preview: match.metadata?.content_preview || '',
        file_type: match.metadata?.file_type || '',
        uploaded_at: match.metadata?.uploaded_at || ''
      }
    }))

    console.log(`📚 Found ${results.matches.length} relevant documents for query`)

    return NextResponse.json({
      success: true,
      message: `Found ${results.matches.length} relevant documents`,
      results: formattedResults,
      query: query,
      childId: childId
    })

  } catch (error) {
    console.error('Error in knowledge base test query:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 