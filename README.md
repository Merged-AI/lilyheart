# Heart Harbour - AI-Powered Child Therapy Platform

🧠 **Compassionate AI therapy support for children's emotional well-being**

Heart Harbour provides personalized AI therapy sessions with Dr. Emma, sophisticated family analytics, and evidence-based therapeutic interventions for children's mental health support.

## 🚀 Key Features

### Core Capabilities
- **AI Therapy Sessions**: GPT-4 powered therapeutic conversations with Dr. Emma
- **Dashboard Analytics**: Real-time insights into communication patterns and emotional growth
- **Family Dashboard**: Live monitoring of children's emotional states and therapy progress
- **Therapeutic Memory**: Persistent conversation context using Pinecone vector database
- **Crisis Detection**: Automated alerts for concerning behavioral patterns
- **Evidence-Based Interventions**: RAG-powered recommendations from child psychology database
- **Profile-Gated Access**: Comprehensive child profiles required before therapy access

### The Competitive Moat
- **Advanced AI Therapy**: Sophisticated therapeutic conversations beyond basic chatbots
- **Dashboard Analytics System**: Real-time monitoring, mood tracking, and family insights
- **Pinecone RAG**: Instant access to 10,000+ therapeutic interventions
- **Supabase Real-time**: Live family dashboard with instant updates
- **Stripe Integration**: Complete payment processing for subscription management

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** for components
- **Recharts** for data visualization
- **Framer Motion** for animations

### Backend & AI
- **Node.js/Express** for real-time processing
- **OpenAI GPT-4** for therapeutic conversations and analysis
- **Pinecone** for vector storage and therapeutic memory
- **Supabase** for real-time database, auth, and analytics

### Key Integrations
- OpenAI API for therapy sessions and sentiment analysis
- Pinecone for therapeutic context and intervention recommendations
- Supabase for real-time family dashboards and session storage
- Stripe for subscription management and payments

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- Pinecone account
- Stripe account

### Setup Instructions

1. **Clone and Install**
   ```bash
   git clone https://github.com/Merged-AI/heartharbour.git
   cd heartharbour
   npm install
   ```

2. **Environment Configuration**
   Create a `.env.local` file with:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # Pinecone Configuration
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=therapeutic-memory

   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Application Configuration
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Database Setup**
   - Set up Supabase project
   - Run the database migrations (see `/scripts/`)
   - Enable real-time subscriptions

4. **Pinecone Setup**
   - Create index for therapeutic memory
   - Upload therapeutic knowledge base
   - Configure embeddings

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🏗 Architecture Overview

### AI Therapy Pipeline
```
Child Message → Therapeutic Context (Pinecone) → GPT-4 Analysis → Dr. Emma Response → Memory Storage
```

### Dashboard Analytics
- Communication pattern analysis
- Confidence scoring and growth metrics
- Family benefit tracking
- Longitudinal progress monitoring

### Data Flow
1. **Authentication**: User login and family verification
2. **Profile Validation**: Comprehensive child questionnaires required
3. **Therapy Sessions**: AI-powered conversations with Dr. Emma
4. **Analysis**: Real-time dashboard analytics and insight generation
5. **Dashboard**: Real-time family communication insights

## 💰 Business Model

### Subscription Tiers
- **Free Trial**: 3 therapy sessions, basic insights
- **Family Plan ($29/month)**: Unlimited sessions, dashboard analytics
- **Premium Family ($49/month)**: Multiple children, advanced insights
- **Professional ($99/month)**: School/clinic integration, reporting tools

### Key Metrics
- Therapeutic engagement rates
- Communication pattern improvements
- Family satisfaction scores
- Clinical outcome tracking

## 🔒 Privacy & Security

### Privacy-First Approach
- COPPA and GDPR compliant
- Parent consent required for all data collection
- Secure therapeutic memory storage
- Transparent privacy controls

### Data Protection
- End-to-end encryption for therapy sessions
- Minimal data retention policies
- Secure Pinecone vector storage
- Regular security audits

## 📊 Key Components

### Family Dashboard (`/src/components/dashboard/child-mental-health-dashboard.tsx`)
- Real-time therapy session monitoring
- Real-time communication pattern analysis
- Family growth insights and recommendations
- Professional conversation organization tools

### AI Therapy Engine (`/src/app/api/chat/route.ts`)
- Personalized therapeutic conversations
- Pinecone memory integration
- Mood analysis and tracking
- Crisis detection and response

### Dashboard Analytics (`/src/lib/dashboard-analytics.ts`)
- Real-time session monitoring
- Weekly progress tracking
- Mood analysis and trends
- Family communication insights

## 🚦 Getting Started

### Demo Account
The application includes demo family data for testing therapeutic features and analytics.

### Development Workflow
1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Register a family account
4. Complete child profile questionnaire
5. Begin therapy sessions with Dr. Emma
6. Monitor progress through family dashboard

### Production Deployment
- Deploy to Vercel or similar platform
- Configure production environment variables
- Set up Stripe webhooks for payments
- Implement monitoring and alerting

## 🤝 Contributing

### Development Guidelines
- Follow TypeScript best practices
- Implement comprehensive error handling
- Maintain therapeutic conversation quality
- Add comprehensive tests for AI features

### Code Structure
```
src/
├── app/                 # Next.js App Router
├── components/          # React components
├── lib/                 # AI analysis and utilities
├── types/               # TypeScript definitions
└── scripts/             # Database setup scripts
```

## 📈 Roadmap

### Phase 1: Core Platform ✅
- ✅ AI therapy sessions with Dr. Emma
- ✅ Dashboard analytics system
- ✅ Family dashboard and insights
- ✅ Stripe payment integration
- ✅ Profile validation system

### Phase 2: Advanced Features
- [ ] Multi-child family support
- [ ] Therapist collaboration tools
- [ ] Advanced crisis intervention
- [ ] Mobile app development

### Phase 3: Scale & Growth
- [ ] School district partnerships
- [ ] Healthcare provider integrations
- [ ] Research collaboration platform
- [ ] International expansion

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or business inquiries:
- Email: support@heartharbour.ai
- Documentation: [docs.heartharbour.ai]
- Community: [community.heartharbour.ai]

---

**Built with ❤️ for children's mental health and family wellness**
