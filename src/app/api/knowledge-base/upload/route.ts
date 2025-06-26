import { NextRequest, NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'dremma'

interface KnowledgeBaseDocument {
  id: string
  child_id: string
  filename: string
  content: string
  file_type: string
  file_size: number
  uploaded_at: string
  metadata: {
    topics?: string[]
    summary?: string
    therapeutic_relevance?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const childId = formData.get('childId') as string

    console.log(`Upload request received for child: ${childId}`)
    console.log(`Number of files received: ${files.length}`)
    files.forEach((file, index) => {
      console.log(`File ${index + 1}: ${file.name}, type: ${file.type}, size: ${file.size}`)
    })

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
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
    const uploadedDocuments: KnowledgeBaseDocument[] = []

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`)
        
        // Validate file type - expand to support more types
        const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(file.type)) {
          console.warn(`Skipping file ${file.name}: Unsupported file type ${file.type}`)
          continue
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
          console.warn(`Skipping file ${file.name}: File too large (${file.size} bytes)`)
          continue
        }

        // Read file content based on type
        let content = ''
        if (file.type === 'text/plain') {
          content = await file.text()
        } else {
          // For now, skip non-text files but log them
          console.warn(`Skipping file ${file.name}: Non-text file processing not implemented yet (type: ${file.type})`)
          continue
        }

        if (!content.trim()) {
          console.warn(`Skipping file ${file.name}: Empty content`)
          continue
        }

        console.log(`File ${file.name} content length: ${content.length} characters`)

        // Generate document ID
        const documentId = `kb-${childId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Create embedding for the document content
        const embedding = await createEmbedding(content)

        // Store in Pinecone
        await index.upsert([
          {
            id: documentId,
            values: embedding,
            metadata: {
              type: 'knowledge_base_document',
              child_id: childId,
              filename: file.name,
              file_type: file.type,
              file_size: file.size,
              uploaded_at: new Date().toISOString(),
              content_preview: content.substring(0, 500)
            }
          }
        ])

        // Create document record
        const document: KnowledgeBaseDocument = {
          id: documentId,
          child_id: childId,
          filename: file.name,
          content: content,
          file_type: file.type,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
          metadata: {
            topics: [],
            summary: 'Document uploaded for therapeutic reference',
            therapeutic_relevance: 'General therapeutic document'
          }
        }

        uploadedDocuments.push(document)

        console.log(`✅ Successfully uploaded knowledge base document: ${file.name} for child ${childId}`)

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
      }
    }

    if (uploadedDocuments.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid files were uploaded',
          details: 'Please ensure you are uploading .txt files only. Other file types (PDF, DOC, DOCX) are not yet supported.',
          receivedFiles: files.map(f => ({ name: f.name, type: f.type, size: f.size }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedDocuments.length} document(s)`,
      documents: uploadedDocuments.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        file_type: doc.file_type,
        file_size: doc.file_size,
        uploaded_at: doc.uploaded_at,
        metadata: doc.metadata
      }))
    })

  } catch (error) {
    console.error('Error in knowledge base upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create embedding for text content
async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text.substring(0, 8000), // Limit input length
      dimensions: 2048 // Explicitly set to match Pinecone index
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error creating embedding:', error)
    throw new Error('Failed to create embedding')
  }
}

// Analyze document content using OpenAI
async function analyzeDocument(content: string): Promise<{
  topics: string[]
  summary: string
  therapeuticRelevance: string
}> {
  try {
    const prompt = `
    Analyze this therapeutic document and provide:
    1. Key topics discussed (comma-separated list)
    2. Brief summary (2-3 sentences)
    3. Therapeutic relevance for child therapy (1-2 sentences)

    Document content:
    ${content.substring(0, 3000)} // Limit content for analysis

    Respond in JSON format:
    {
      "topics": ["topic1", "topic2"],
      "summary": "brief summary",
      "therapeuticRelevance": "relevance description"
    }
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a therapeutic document analyzer. Provide structured analysis in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    const analysisText = response.choices[0]?.message?.content
    if (!analysisText) {
      throw new Error('No analysis response received')
    }

    // Try to parse JSON response
    try {
      const analysis = JSON.parse(analysisText)
      return {
        topics: analysis.topics || [],
        summary: analysis.summary || 'Document uploaded for therapeutic reference',
        therapeuticRelevance: analysis.therapeuticRelevance || 'General therapeutic document'
      }
    } catch (parseError) {
      console.warn('Failed to parse analysis JSON, using fallback:', parseError)
      return {
        topics: ['therapeutic_document'],
        summary: 'Document uploaded for therapeutic reference',
        therapeuticRelevance: 'General therapeutic document'
      }
    }

  } catch (error) {
    console.error('Error analyzing document:', error)
    return {
      topics: ['therapeutic_document'],
      summary: 'Document uploaded for therapeutic reference',
      therapeuticRelevance: 'General therapeutic document'
    }
  }
} 