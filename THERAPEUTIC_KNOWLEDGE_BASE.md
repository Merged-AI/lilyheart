# ⚠️ DEPRECATED - Use EMBEDDED_KNOWLEDGE_SETUP.md Instead

**This manual setup approach has been replaced with an automatic embedded system.**

**See `EMBEDDED_KNOWLEDGE_SETUP.md` for the current setup instructions.**

---

# Therapeutic Knowledge Base Integration (LEGACY)

This document explains the old manual integration approach that has been superseded by the embedded system.

## Overview

The therapeutic knowledge base enhances Dr. Emma's responses by providing access to evidence-based therapeutic frameworks, age-appropriate interventions, and clinical guidance. The system automatically retrieves relevant therapeutic content based on the child's message, age, and concerns.

## Features

### 🧠 Evidence-Based Therapeutic Frameworks
- **Cognitive Behavioral Therapy (CBT)** techniques adapted for children
- **Play Therapy** principles and "I wonder" statements  
- **Trauma-Informed Care** approaches with safe language
- **Attachment Theory** and secure relationship building
- **Emotion Coaching** (Gottman's framework)
- **Mindfulness** and grounding techniques

### 📋 Clinical Diagnostic Support
- DSM-5-TR cross-cutting symptom measures
- Child Behavior Checklist (CBCL) categories
- Strengths and Difficulties Questionnaire (SDQ) integration
- Anxiety and depression screening tools
- Crisis detection and response protocols

### 🎯 Age-Appropriate Content
- **Young Children (4-8)**: Simple language, basic emotions, play-based approaches
- **Preteens (9-12)**: Expanded emotional vocabulary, cognitive strategies
- **Teenagers (11-17)**: Complex emotional processing, independence building

### 🗣️ Communication Best Practices
- Developmentally appropriate tone and language
- Reflective listening techniques
- Validation and empathy responses
- Crisis intervention protocols
- Memory and continuity strategies

## Setup Instructions

### 1. Prerequisites

Ensure you have the following environment variables set in your `.env.local` file:
```env
PINECONE_API_KEY=your_pinecone_api_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### 2. Knowledge Base File

Ensure the `Therapeutic Chatbot Knowledge Base for Children.md` file is in your project root directory. This file contains all the therapeutic knowledge that will be processed and stored.

### 3. Pinecone Index Setup

Create a Pinecone index named `therapeutic-knowledge` with the following specifications:
- **Dimensions**: 1536 (for text-embedding-3-large)
- **Metric**: cosine
- **Cloud Provider**: As per your preference

### 4. Initialize the Knowledge Base

You have several options to initialize the knowledge base:

#### Option A: Via Dashboard UI
1. Start your development server: `npm run dev`
2. Navigate to the dashboard
3. Look for the "Therapeutic Knowledge Base" section
4. Click "Initialize Knowledge Base"
5. Wait for the process to complete

#### Option B: Via API Endpoint
```bash
curl -X POST http://localhost:3000/api/knowledge/init \
  -H "Content-Type: application/json"
```

#### Option C: Via Script
```bash
# Make sure your dev server is running first
npm run dev

# In another terminal, run:
node scripts/init-knowledge-base.js
```

## How It Works

### 1. Content Parsing
The system parses the markdown knowledge base into structured chunks:
- Each major section becomes a category (frameworks, diagnostics, emotional-literacy, etc.)
- Content is split into manageable chunks
- Keywords and therapeutic approaches are extracted automatically
- Age groups are identified and tagged

### 2. Semantic Storage
- Each chunk is converted to embeddings using OpenAI's text-embedding-3-large model
- Embeddings are stored in Pinecone with rich metadata for filtering
- Content is categorized by therapeutic approach, age group, and keywords

### 3. Contextual Retrieval
During chat sessions, the system:
- Analyzes the child's message for emotional content and topics
- Considers the child's age and known concerns
- Retrieves the most relevant therapeutic guidance
- Integrates this guidance into Dr. Emma's system prompt

### 4. Enhanced Responses
Dr. Emma's responses are enhanced with:
- Evidence-based therapeutic techniques
- Age-appropriate communication strategies
- Trauma-informed language patterns
- Crisis intervention protocols
- Continuity and memory management

## API Reference

### Initialize Knowledge Base
```
POST /api/knowledge/init
```

Parses the markdown file and stores all therapeutic knowledge in Pinecone.

**Response:**
```json
{
  "success": true,
  "message": "Therapeutic knowledge base successfully initialized and stored in Pinecone"
}
```

### Knowledge Base Integration

The knowledge base is automatically integrated into the chat API (`/api/chat`) and provides enhanced context for every conversation.

## File Structure

```
src/
├── lib/
│   ├── therapeutic-knowledge.ts    # Main knowledge base service
│   └── pinecone.ts                # Existing therapeutic memory
├── app/
│   └── api/
│       ├── chat/route.ts          # Enhanced with knowledge base
│       └── knowledge/
│           └── init/route.ts      # Initialization endpoint
└── components/
    └── dashboard/
        └── KnowledgeBaseManager.tsx # UI management component

scripts/
└── init-knowledge-base.js         # CLI initialization script

Therapeutic Chatbot Knowledge Base for Children.md # Source knowledge
```

## Troubleshooting

### Common Issues

1. **"Knowledge base file not found"**
   - Ensure `Therapeutic Chatbot Knowledge Base for Children.md` is in your project root
   - Check file permissions

2. **"Pinecone index not found"**
   - Create the `therapeutic-knowledge` index in Pinecone
   - Verify your API key has the correct permissions

3. **"OpenAI API error"**
   - Check your OpenAI API key is valid
   - Ensure you have sufficient credits

4. **"No therapeutic guidance found"**
   - Verify the knowledge base was initialized successfully
   - Check Pinecone index contains data

### Debugging

Enable debug logging by checking the console output during chat sessions:
- `✅ Using therapeutic memory context from Pinecone` - Memory system working
- `🧠 Using therapeutic knowledge base guidance` - Knowledge base working
- Look for error messages in the server logs

## Monitoring

### Success Indicators
- Knowledge base initialization completes without errors
- Chat responses include relevant therapeutic techniques
- Age-appropriate content is selected automatically
- Crisis situations trigger appropriate responses

### Performance Considerations
- Initial setup takes 2-5 minutes depending on content size
- Each chat query performs 1-2 semantic searches
- Embeddings are cached for performance
- Consider rate limiting for production use

## Updating the Knowledge Base

To update the therapeutic knowledge:

1. Edit the `Therapeutic Chatbot Knowledge Base for Children.md` file
2. Re-run the initialization process
3. The new content will overwrite the existing knowledge base
4. No downtime required - updates take effect immediately

## Security and Privacy

- All therapeutic knowledge is stored securely in Pinecone
- No personal information is included in the knowledge base
- Child conversation context is handled separately from knowledge retrieval
- Follow your organization's data privacy policies

## Contributing

To add new therapeutic content:

1. Edit the markdown file following the existing structure
2. Add appropriate section headers (##)
3. Include evidence-based sources and citations
4. Test with various child scenarios
5. Re-initialize the knowledge base

## Support

For technical issues:
- Check the troubleshooting section above
- Review server logs for error messages
- Verify all environment variables are set
- Ensure external APIs (Pinecone, OpenAI) are accessible

---

**Note**: This knowledge base is designed to enhance therapeutic conversations but does not replace professional clinical judgment. Always follow your organization's protocols for crisis situations and clinical decision-making. 