/**
 * Pinecone Setup Script for ChildHealthAI
 * 
 * This script initializes the Pinecone vector database with child psychology
 * intervention strategies for the RAG system.
 * 
 * Run with: node scripts/pinecone-setup.js
 */

import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'child-health-interventions'

// Sample intervention strategies database
const interventionStrategies = [
  {
    id: 'social-anxiety-001',
    title: 'Social Anxiety Management for Pre-teens',
    content: 'Gradual exposure therapy combined with breathing exercises. Start with low-stakes social situations and gradually increase complexity. Practice deep breathing before social interactions.',
    age_range_min: 10,
    age_range_max: 13,
    intervention_type: 'anxiety_management',
    effectiveness_score: 85,
    evidence_level: 'high',
    keywords: ['social anxiety', 'peer interaction', 'breathing exercises', 'exposure therapy'],
    implementation_difficulty: 'medium',
    parent_involvement: 'high'
  },
  {
    id: 'friendship-building-001',
    title: 'Building Healthy Friendships',
    content: 'Teach children to identify positive friendship qualities. Role-play social scenarios including introducing oneself, joining conversations, and handling disagreements respectfully.',
    age_range_min: 8,
    age_range_max: 15,
    intervention_type: 'social_skills',
    effectiveness_score: 78,
    evidence_level: 'medium',
    keywords: ['friendship', 'social skills', 'role playing', 'communication'],
    implementation_difficulty: 'low',
    parent_involvement: 'medium'
  },
  {
    id: 'emotional-regulation-001',
    title: 'Emotional Regulation Techniques',
    content: 'Implement the STOP technique: Stop, Take a breath, Observe feelings, Proceed mindfully. Use emotion thermometers to help children identify intensity levels.',
    age_range_min: 3,
    age_range_max: 16,
    intervention_type: 'emotional_regulation',
    effectiveness_score: 82,
    evidence_level: 'high',
    keywords: ['emotional regulation', 'mindfulness', 'coping strategies', 'self-awareness'],
    implementation_difficulty: 'low',
    parent_involvement: 'high'
  },
  {
    id: 'cyberbullying-response-001',
    title: 'Cyberbullying Response Protocol',
    content: 'Immediate documentation of incidents, blocking perpetrators, reporting to platforms and school authorities. Focus on emotional support and rebuilding confidence through positive online interactions.',
    age_range_min: 10,
    age_range_max: 17,
    intervention_type: 'crisis_response',
    effectiveness_score: 73,
    evidence_level: 'medium',
    keywords: ['cyberbullying', 'online safety', 'documentation', 'emotional support'],
    implementation_difficulty: 'high',
    parent_involvement: 'high'
  },
  {
    id: 'peer-pressure-resistance-001',
    title: 'Peer Pressure Resistance Training',
    content: 'Practice assertiveness techniques and "broken record" method. Develop personal values statement and role-play scenarios where values are challenged.',
    age_range_min: 11,
    age_range_max: 16,
    intervention_type: 'resilience_building',
    effectiveness_score: 79,
    evidence_level: 'high',
    keywords: ['peer pressure', 'assertiveness', 'values', 'decision making'],
    implementation_difficulty: 'medium',
    parent_involvement: 'medium'
  },
  {
    id: 'social-withdrawal-001',
    title: 'Addressing Social Withdrawal',
    content: 'Gradual re-engagement plan starting with one-on-one interactions. Identify underlying causes (anxiety, depression, trauma). Use interests and strengths as social bridges.',
    age_range_min: 8,
    age_range_max: 17,
    intervention_type: 'engagement_strategies',
    effectiveness_score: 71,
    evidence_level: 'medium',
    keywords: ['social withdrawal', 'gradual exposure', 'interests', 'underlying causes'],
    implementation_difficulty: 'high',
    parent_involvement: 'high'
  },
  {
    id: 'conflict-resolution-001',
    title: 'Peer Conflict Resolution Skills',
    content: 'Teach the PEACE method: Pause, Empathize, Ask questions, Communicate feelings, Establish solutions. Practice active listening and perspective-taking exercises.',
    age_range_min: 7,
    age_range_max: 15,
    intervention_type: 'communication_skills',
    effectiveness_score: 86,
    evidence_level: 'high',
    keywords: ['conflict resolution', 'empathy', 'communication', 'problem solving'],
    implementation_difficulty: 'low',
    parent_involvement: 'medium'
  },
  {
    id: 'self-esteem-building-001',
    title: 'Self-Esteem Enhancement Program',
    content: 'Daily affirmations, strength identification exercises, and achievement journals. Focus on effort over outcome and develop growth mindset through challenges.',
    age_range_min: 3,
    age_range_max: 16,
    intervention_type: 'self_concept',
    effectiveness_score: 81,
    evidence_level: 'high',
    keywords: ['self-esteem', 'affirmations', 'strengths', 'growth mindset'],
    implementation_difficulty: 'low',
    parent_involvement: 'high'
  },
  {
    id: 'digital-wellness-001',
    title: 'Digital Wellness and Screen Time Balance',
    content: 'Establish clear boundaries for device usage, create tech-free zones and times. Promote real-world social activities and hobbies as alternatives to excessive screen time.',
    age_range_min: 8,
    age_range_max: 17,
    intervention_type: 'lifestyle_management',
    effectiveness_score: 74,
    evidence_level: 'medium',
    keywords: ['digital wellness', 'screen time', 'boundaries', 'real-world activities'],
    implementation_difficulty: 'medium',
    parent_involvement: 'high'
  },
  {
    id: 'empathy-development-001',
    title: 'Empathy Development Activities',
    content: 'Perspective-taking games, emotion recognition exercises, and community service projects. Use literature and films to discuss different viewpoints and experiences.',
    age_range_min: 5,
    age_range_max: 14,
    intervention_type: 'social_emotional_learning',
    effectiveness_score: 83,
    evidence_level: 'high',
    keywords: ['empathy', 'perspective taking', 'emotion recognition', 'community service'],
    implementation_difficulty: 'low',
    parent_involvement: 'medium'
  }
]

async function createIndex() {
  try {
    console.log('🔧 Creating Pinecone index...')
    
    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: 2048, // Updated to match text-embedding-3-large
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    })
    
    console.log('✅ Index created successfully')
    
    // Wait for index to be ready
    console.log('⏳ Waiting for index to be ready...')
    await new Promise(resolve => setTimeout(resolve, 10000))
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('📝 Index already exists, continuing...')
    } else {
      throw error
    }
  }
}

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large', // Updated to match upload route
    input: text,
    dimensions: 2048 // Explicitly set dimensions
  })
  
  return response.data[0].embedding
}

async function upsertInterventions() {
  console.log('📊 Generating embeddings and upserting interventions...')
  
  const index = pinecone.index(INDEX_NAME)
  
  for (let i = 0; i < interventionStrategies.length; i++) {
    const intervention = interventionStrategies[i]
    
    console.log(`Processing ${i + 1}/${interventionStrategies.length}: ${intervention.title}`)
    
    // Create text for embedding
    const embeddingText = `
      ${intervention.title}
      ${intervention.content}
      Age range: ${intervention.age_range_min}-${intervention.age_range_max}
      Type: ${intervention.intervention_type}
      Keywords: ${intervention.keywords.join(', ')}
    `.trim()
    
    // Generate embedding
    const embedding = await generateEmbedding(embeddingText)
    
    // Upsert to Pinecone
    await index.upsert([{
      id: intervention.id,
      values: embedding,
      metadata: {
        title: intervention.title,
        content: intervention.content,
        age_range_min: intervention.age_range_min,
        age_range_max: intervention.age_range_max,
        intervention_type: intervention.intervention_type,
        effectiveness_score: intervention.effectiveness_score,
        evidence_level: intervention.evidence_level,
        keywords: intervention.keywords,
        implementation_difficulty: intervention.implementation_difficulty,
        parent_involvement: intervention.parent_involvement
      }
    }])
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log('✅ All interventions upserted successfully')
}

async function testQuery() {
  console.log('🧪 Testing query functionality...')
  
  const index = pinecone.index(INDEX_NAME)
  
  // Test query
  const queryText = "12 year old child showing signs of social anxiety and withdrawal from friends"
  const queryEmbedding = await generateEmbedding(queryText)
  
  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK: 3,
    includeMetadata: true,
    filter: {
      age_range_min: { $lte: 12 },
      age_range_max: { $gte: 12 }
    }
  })
  
  console.log('🔍 Query results:')
  queryResponse.matches.forEach((match, i) => {
    console.log(`${i + 1}. ${match.metadata.title} (Score: ${match.score.toFixed(3)})`)
    console.log(`   Type: ${match.metadata.intervention_type}`)
    console.log(`   Effectiveness: ${match.metadata.effectiveness_score}%`)
    console.log('')
  })
}

async function getIndexStats() {
  const index = pinecone.index(INDEX_NAME)
  const stats = await index.describeIndexStats()
  
  console.log('📈 Index Statistics:')
  console.log(`Total vectors: ${stats.totalVectorCount}`)
  console.log(`Index fullness: ${stats.indexFullness}`)
  console.log('')
}

async function main() {
  try {
    console.log('🚀 Starting Pinecone setup for ChildHealthAI...')
    console.log('')
    
    await createIndex()
    await upsertInterventions()
    await getIndexStats()
    await testQuery()
    
    console.log('🎉 Pinecone setup completed successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Your intervention database is ready for RAG queries')
    console.log('2. The AI analysis system can now provide contextual recommendations')
    console.log('3. Add more intervention strategies as needed')
    console.log('')
    
  } catch (error) {
    console.error('❌ Error during setup:', error)
    process.exit(1)
  }
}

// Run the setup
main() 