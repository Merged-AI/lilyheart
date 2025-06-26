/**
 * Check Pinecone index contents
 * 
 * This script checks what documents are currently in the Pinecone index
 * Run with: node scripts/check-pinecone-index.mjs
 */

import { Pinecone } from '@pinecone-database/pinecone'
import dotenv from 'dotenv'

dotenv.config()

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || ''
})

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'dremma'

async function checkPineconeIndex() {
  console.log('🔍 Checking Pinecone Index Contents...\n')

  try {
    const index = pinecone.index(INDEX_NAME)
    
    // Query with a dummy vector to get all documents
    const dummyVector = new Array(2048).fill(0)
    
    console.log('📊 Querying index for all documents...')
    
    const results = await index.query({
      vector: dummyVector,
      topK: 100, // Get up to 100 documents
      includeMetadata: true
    })

    if (!results.matches || results.matches.length === 0) {
      console.log('📭 No documents found in the index')
      console.log('\nPossible issues:')
      console.log('1. Documents were not uploaded successfully')
      console.log('2. Wrong index name being used')
      console.log('3. Pinecone API key issues')
      console.log('4. Index is empty')
      return
    }

    console.log(`📚 Found ${results.matches.length} documents in index\n`)

    // Group documents by type
    const knowledgeBaseDocs = results.matches.filter(match => 
      match.metadata?.type === 'knowledge_base_document'
    )
    
    const therapeuticMemories = results.matches.filter(match => 
      match.metadata?.type !== 'knowledge_base_document'
    )

    console.log('📄 KNOWLEDGE BASE DOCUMENTS:')
    if (knowledgeBaseDocs.length > 0) {
      knowledgeBaseDocs.forEach((doc, index) => {
        console.log(`\n${index + 1}. ${doc.metadata?.filename || 'Unknown'}`)
        console.log(`   Child ID: ${doc.metadata?.child_id || 'Unknown'}`)
        console.log(`   Type: ${doc.metadata?.file_type || 'Unknown'}`)
        console.log(`   Uploaded: ${doc.metadata?.uploaded_at || 'Unknown'}`)
        console.log(`   Preview: ${doc.metadata?.content_preview?.substring(0, 100) || 'No preview'}...`)
      })
    } else {
      console.log('   No knowledge base documents found')
    }

    console.log('\n🧠 THERAPEUTIC MEMORIES:')
    if (therapeuticMemories.length > 0) {
      therapeuticMemories.forEach((doc, index) => {
        console.log(`\n${index + 1}. ${doc.id}`)
        console.log(`   Child ID: ${doc.metadata?.child_id || 'Unknown'}`)
        console.log(`   Date: ${doc.metadata?.session_date || 'Unknown'}`)
        console.log(`   Topics: ${doc.metadata?.topics?.join(', ') || 'None'}`)
      })
    } else {
      console.log('   No therapeutic memories found')
    }

    console.log('\n🔧 DEBUGGING INFO:')
    console.log(`   Index Name: ${INDEX_NAME}`)
    console.log(`   Total Documents: ${results.matches.length}`)
    console.log(`   Knowledge Base Docs: ${knowledgeBaseDocs.length}`)
    console.log(`   Therapeutic Memories: ${therapeuticMemories.length}`)

  } catch (error) {
    console.error('❌ Error checking Pinecone index:', error)
    console.log('\nPossible issues:')
    console.log('1. Invalid Pinecone API key')
    console.log('2. Index does not exist')
    console.log('3. Network connectivity issues')
  }
}

// Run the check
checkPineconeIndex() 