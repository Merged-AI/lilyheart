import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedFamilyFromToken, createServerSupabase } from '@/lib/supabase-auth'
import { Pinecone } from '@pinecone-database/pinecone'

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'dremma'

interface KnowledgeBaseDocument {
  id: string
  filename: string
  file_type: string
  file_size: number
  uploaded_at: string
  content_preview: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  const family = await getAuthenticatedFamilyFromToken()
  
  if (!family) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const supabase = createServerSupabase()
  const { data: child, error } = await supabase
    .from('children')
    .select(`
      *,
      sessions_count:therapy_sessions(count)
    `)
    .eq('id', params.childId)
    .eq('family_id', family.id)
    .eq('is_active', true)
    .single()

  if (error || !child) {
    return NextResponse.json(
      { error: 'Child not found' },
      { status: 404 }
    )
  }

  // Fetch knowledge base documents from Pinecone
  let knowledgeBaseDocuments: KnowledgeBaseDocument[] = []
  try {
    const index = pinecone.index(INDEX_NAME)
    
    // Query for knowledge base documents for this child
    const results = await index.query({
      vector: new Array(2048).fill(0), // Dummy vector for metadata-only search
      topK: 50, // Get up to 50 documents
      filter: {
        child_id: { $eq: params.childId },
        type: { $eq: 'knowledge_base_document' }
      },
      includeMetadata: true
    })

    if (results.matches && results.matches.length > 0) {
      knowledgeBaseDocuments = results.matches.map(match => ({
        id: match.id,
        filename: String(match.metadata?.filename || 'Unknown'),
        file_type: String(match.metadata?.file_type || ''),
        file_size: Number(match.metadata?.file_size || 0),
        uploaded_at: String(match.metadata?.uploaded_at || ''),
        content_preview: String(match.metadata?.content_preview || '')
      }))
    }

    console.log(`📚 Found ${knowledgeBaseDocuments.length} knowledge base documents for child ${params.childId}`)
  } catch (error) {
    console.error('Error fetching knowledge base documents:', error)
    // Don't fail the entire request if knowledge base fetch fails
    knowledgeBaseDocuments = []
  }

  // Transform the data to include the session count and knowledge base documents
  const childWithData = {
    ...child,
    sessions_count: child.sessions_count?.[0]?.count || 0,
    knowledge_base_documents: knowledgeBaseDocuments
  }

  return NextResponse.json({ child: childWithData })
} 