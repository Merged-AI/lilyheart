export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          created_at: string
          name: string
          subscription_tier: 'free' | 'premium' | 'family' | 'crisis'
          subscription_status: 'active' | 'inactive' | 'trial'
          trial_ends_at?: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          subscription_tier?: 'free' | 'premium' | 'family' | 'crisis'
          subscription_status?: 'active' | 'inactive' | 'trial'
          trial_ends_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          subscription_tier?: 'free' | 'premium' | 'family' | 'crisis'
          subscription_status?: 'active' | 'inactive' | 'trial'
          trial_ends_at?: string
        }
      }
      children: {
        Row: {
          id: string
          created_at: string
          family_id: string
          name: string
          age: number
          personality_profile?: Record<string, any>
          privacy_settings: Record<string, boolean>
          consent_given: boolean
          is_active?: boolean
          current_mood?: {
            happiness: number
            anxiety: number
            sadness: number
            stress: number
            confidence: number
          }
          last_session_at?: string
          current_concerns?: string
          parent_goals?: string
          reason_for_adding?: string
          profile_completed?: boolean
          ai_context?: string
          triggers?: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          family_id: string
          name: string
          age: number
          personality_profile?: Record<string, any>
          privacy_settings?: Record<string, boolean>
          consent_given?: boolean
          is_active?: boolean
          current_mood?: {
            happiness: number
            anxiety: number
            sadness: number
            stress: number
            confidence: number
          }
          last_session_at?: string
          current_concerns?: string
          parent_goals?: string
          reason_for_adding?: string
          profile_completed?: boolean
          ai_context?: string
          triggers?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          family_id?: string
          name?: string
          age?: number
          personality_profile?: Record<string, any>
          privacy_settings?: Record<string, boolean>
          consent_given?: boolean
          is_active?: boolean
          current_mood?: {
            happiness: number
            anxiety: number
            sadness: number
            stress: number
            confidence: number
          }
          last_session_at?: string
          current_concerns?: string
          parent_goals?: string
          reason_for_adding?: string
          profile_completed?: boolean
          ai_context?: string
          triggers?: string[]
        }
      }
      mood_tracking: {
        Row: {
          id: string
          created_at: string
          child_id: string
          happiness: number
          anxiety: number
          sadness: number
          stress: number
          confidence: number
          notes?: string
          recorded_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          child_id: string
          happiness: number
          anxiety: number
          sadness: number
          stress: number
          confidence: number
          notes?: string
          recorded_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          child_id?: string
          happiness?: number
          anxiety?: number
          sadness?: number
          stress?: number
          confidence?: number
          notes?: string
          recorded_at?: string
        }
      }
      therapy_sessions: {
        Row: {
          id: string
          created_at: string
          child_id: string
          user_message?: string
          ai_response?: string
          messages?: any[]
          mood_analysis?: {
            happiness: number
            anxiety: number
            sadness: number
            stress: number
            confidence: number
            insights?: string
          }
          session_summary?: string
          session_duration?: number
          topics?: string[]
          has_alert?: boolean
          alert_level?: 'high' | 'medium'
          alert_message?: string
        }
        Insert: {
          id?: string
          created_at?: string
          child_id: string
          user_message?: string
          ai_response?: string
          messages?: any[]
          mood_analysis?: {
            happiness: number
            anxiety: number
            sadness: number
            stress: number
            confidence: number
            insights?: string
          }
          session_summary?: string
          session_duration?: number
          topics?: string[]
          has_alert?: boolean
          alert_level?: 'high' | 'medium'
          alert_message?: string
        }
        Update: {
          id?: string
          created_at?: string
          child_id?: string
          user_message?: string
          ai_response?: string
          messages?: any[]
          mood_analysis?: {
            happiness: number
            anxiety: number
            sadness: number
            stress: number
            confidence: number
            insights?: string
          }
          session_summary?: string
          session_duration?: number
          topics?: string[]
          has_alert?: boolean
          alert_level?: 'high' | 'medium'
          alert_message?: string
        }
      }
      social_health_analyses: {
        Row: {
          id: string
          created_at: string
          child_id: string
          analysis_date: string
          mood_score: number
          social_score: number
          emotional_state: string
          friendship_dynamics: Record<string, any>
          intervention_recommendations: string[]
          ai_insights: Record<string, any>
          data_sources: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          child_id: string
          analysis_date: string
          mood_score: number
          social_score: number
          emotional_state: string
          friendship_dynamics?: Record<string, any>
          intervention_recommendations?: string[]
          ai_insights?: Record<string, any>
          data_sources?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          child_id?: string
          analysis_date?: string
          mood_score?: number
          social_score?: number
          emotional_state?: string
          friendship_dynamics?: Record<string, any>
          intervention_recommendations?: string[]
          ai_insights?: Record<string, any>
          data_sources?: string[]
        }
      }
      intervention_history: {
        Row: {
          id: string
          created_at: string
          child_id: string
          intervention_type: string
          intervention_content: string
          effectiveness_rating?: number
          parent_feedback?: string
          follow_up_date?: string
        }
        Insert: {
          id?: string
          created_at?: string
          child_id: string
          intervention_type: string
          intervention_content: string
          effectiveness_rating?: number
          parent_feedback?: string
          follow_up_date?: string
        }
        Update: {
          id?: string
          created_at?: string
          child_id?: string
          intervention_type?: string
          intervention_content?: string
          effectiveness_rating?: number
          parent_feedback?: string
          follow_up_date?: string
        }
      }
      crisis_alerts: {
        Row: {
          id: string
          created_at: string
          child_id: string
          alert_type: 'mild' | 'moderate' | 'severe' | 'crisis'
          alert_message: string
          is_resolved: boolean
          resolved_at?: string
          action_taken?: string
        }
        Insert: {
          id?: string
          created_at?: string
          child_id: string
          alert_type: 'mild' | 'moderate' | 'severe' | 'crisis'
          alert_message: string
          is_resolved?: boolean
          resolved_at?: string
          action_taken?: string
        }
        Update: {
          id?: string
          created_at?: string
          child_id?: string
          alert_type?: 'mild' | 'moderate' | 'severe' | 'crisis'
          alert_message?: string
          is_resolved?: boolean
          resolved_at?: string
          action_taken?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: 'free' | 'premium' | 'family' | 'crisis'
      alert_type: 'mild' | 'moderate' | 'severe' | 'crisis'
    }
  }
}

// Type helpers
export type Family = Database['public']['Tables']['families']['Row']
export type Child = Database['public']['Tables']['children']['Row']
export type MoodTracking = Database['public']['Tables']['mood_tracking']['Row']
export type TherapySession = Database['public']['Tables']['therapy_sessions']['Row']
export type SocialHealthAnalysis = Database['public']['Tables']['social_health_analyses']['Row']
export type InterventionHistory = Database['public']['Tables']['intervention_history']['Row']
export type CrisisAlert = Database['public']['Tables']['crisis_alerts']['Row'] 