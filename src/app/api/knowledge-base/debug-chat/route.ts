import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Pinecone for knowledge base queries
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || ''
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

// Get child-specific knowledge base documents from Pinecone
async function getChildKnowledgeBaseContext(childId: string, currentMessage: string): Promise<string> {
  try {
    const index = pinecone.index(INDEX_NAME)
    
    // Create embedding for the current message to find relevant knowledge base documents
    const queryEmbedding = await createEmbedding(currentMessage)
    
    // Search for knowledge base documents specific to this child
    const results = await index.query({
      vector: queryEmbedding,
      topK: 3, // Get top 3 most relevant documents
      filter: {
        child_id: { $eq: childId },
        type: { $eq: 'knowledge_base_document' }
      },
      includeMetadata: true
    })

    if (!results.matches || results.matches.length === 0) {
      console.log('📚 No child-specific knowledge base documents found')
      return ''
    }

    let knowledgeContext = 'CHILD-SPECIFIC KNOWLEDGE BASE CONTEXT:\n\n'
    
    results.matches.forEach((match, index) => {
      const metadata = match.metadata
      const filename = metadata?.filename || 'Unknown document'
      const contentPreview = metadata?.content_preview || ''
      const similarity = match.score || 0
      
      knowledgeContext += `${index + 1}. Document: ${filename} (Relevance: ${(similarity * 100).toFixed(1)}%)\n`
      knowledgeContext += `   Content: ${contentPreview}\n\n`
    })

    console.log(`📚 Found ${results.matches.length} relevant knowledge base documents for child ${childId}`)
    return knowledgeContext

  } catch (error) {
    console.error('Error querying child knowledge base:', error)
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, childId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Debug chat request for child ${childId}: "${message}"`)

    // Get child-specific knowledge base documents from Pinecone
    let childKnowledgeContext = ""
    try {
      childKnowledgeContext = await getChildKnowledgeBaseContext(childId, message)
      if (childKnowledgeContext && childKnowledgeContext.length > 50) {
        console.log('📚 Using child-specific knowledge base documents')
      }
    } catch (error) {
      console.error('Error accessing child knowledge base:', error)
      childKnowledgeContext = ""
    }

    // Create system prompt with knowledge base context
    const systemPrompt = `You are Dr. Emma AI, a child therapist. Use the knowledge base context provided below to give specific, helpful responses.

${childKnowledgeContext}

CRITICAL INSTRUCTION: If knowledge base documents are provided above, you MUST reference and use the specific techniques, exercises, and strategies from those documents in your response. Do not make up new techniques - use the ones provided in the knowledge base context.

Be warm, supportive, and use age-appropriate language.`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-2025-04-14',
      messages: messages as any,
      max_tokens: 500,
      temperature: 0.7,
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    // Check if response mentions techniques from our document
    const responseText = aiResponse.toLowerCase()
    const documentKeywords = [
      '4-7-8', 'box breathing', 'belly breathing', 'progressive muscle relaxation',
      '5-4-3-2-1', 'grounding', 'emotion thermometer', 'stop technique',
      'butterfly hug', 'hand on heart', 'anxiety management', 'breathing exercises'
    ]
    
    const foundKeywords = documentKeywords.filter(keyword => responseText.includes(keyword))

    return NextResponse.json({
      response: aiResponse,
      knowledgeBaseUsed: childKnowledgeContext.length > 0,
      foundKeywords: foundKeywords,
      knowledgeContext: childKnowledgeContext
    })

  } catch (error) {
    console.error('Error in debug chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 