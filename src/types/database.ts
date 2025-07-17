export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          subscription_tier: "free" | "premium" | "family" | "crisis";
          subscription_status: "active" | "inactive" | "trial";
          trial_ends_at?: string;
          parent_pin?: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          subscription_tier?: "free" | "premium" | "family" | "crisis";
          subscription_status?: "active" | "inactive" | "trial";
          trial_ends_at?: string;
          parent_pin?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          subscription_tier?: "free" | "premium" | "family" | "crisis";
          subscription_status?: "active" | "inactive" | "trial";
          trial_ends_at?: string;
          parent_pin?: string;
        };
      };
      children: {
        Row: {
          id: string;
          created_at: string;
          family_id: string;
          name: string;
          age: number;
          personality_profile?: Record<string, any>;
          privacy_settings: Record<string, boolean>;
          consent_given: boolean;
          is_active?: boolean;
          current_mood?: {
            happiness: number;
            anxiety: number;
            sadness: number;
            stress: number;
            confidence: number;
          };
          last_session_at?: string;
          current_concerns?: string;
          parent_goals?: string;
          reason_for_adding?: string;
          profile_completed?: boolean;
          ai_context?: string;
          triggers?: string[];
        };
        Insert: {
          id?: string;
          created_at?: string;
          family_id: string;
          name: string;
          age: number;
          personality_profile?: Record<string, any>;
          privacy_settings?: Record<string, boolean>;
          consent_given?: boolean;
          is_active?: boolean;
          current_mood?: {
            happiness: number;
            anxiety: number;
            sadness: number;
            stress: number;
            confidence: number;
          };
          last_session_at?: string;
          current_concerns?: string;
          parent_goals?: string;
          reason_for_adding?: string;
          profile_completed?: boolean;
          ai_context?: string;
          triggers?: string[];
        };
        Update: {
          id?: string;
          created_at?: string;
          family_id?: string;
          name?: string;
          age?: number;
          personality_profile?: Record<string, any>;
          privacy_settings?: Record<string, boolean>;
          consent_given?: boolean;
          is_active?: boolean;
          current_mood?: {
            happiness: number;
            anxiety: number;
            sadness: number;
            stress: number;
            confidence: number;
          };
          last_session_at?: string;
          current_concerns?: string;
          parent_goals?: string;
          reason_for_adding?: string;
          profile_completed?: boolean;
          ai_context?: string;
          triggers?: string[];
        };
      };
      mood_tracking: {
        Row: {
          id: string;
          created_at: string;
          child_id: string;
          happiness: number;
          anxiety: number;
          sadness: number;
          stress: number;
          confidence: number;
          notes?: string;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          child_id: string;
          happiness: number;
          anxiety: number;
          sadness: number;
          stress: number;
          confidence: number;
          notes?: string;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          child_id?: string;
          happiness?: number;
          anxiety?: number;
          sadness?: number;
          stress?: number;
          confidence?: number;
          notes?: string;
          recorded_at?: string;
        };
      };
      therapy_sessions: {
        Row: {
          id: string;
          created_at: string;
          child_id: string;
          messages?: {
            sender: "child" | "ai";
            content: string;
            timestamp: string;
          }[];
          mood_analysis?: {
            happiness: number;
            anxiety: number;
            sadness: number;
            stress: number;
            confidence: number;
            insights?: string;
          };
          session_summary?: string;
          session_duration?: number;
          topics?: string[];
          has_alert?: boolean;
          alert_level?: "high" | "medium";
          alert_message?: string;
          status: "active" | "completed";
        };
        Insert: {
          id?: string;
          created_at?: string;
          child_id: string;
          messages?: {
            sender: "child" | "ai";
            content: string;
            timestamp: string;
          }[];
          mood_analysis?: {
            happiness: number;
            anxiety: number;
            sadness: number;
            stress: number;
            confidence: number;
            insights?: string;
          };
          session_summary?: string;
          session_duration?: number;
          topics?: string[];
          has_alert?: boolean;
          alert_level?: "high" | "medium";
          alert_message?: string;
          status?: "active" | "completed";
        };
        Update: {
          id?: string;
          created_at?: string;
          child_id?: string;
          messages?: {
            sender: "child" | "ai";
            content: string;
            timestamp: string;
          }[];
          mood_analysis?: {
            happiness: number;
            anxiety: number;
            sadness: number;
            stress: number;
            confidence: number;
            insights?: string;
          };
          session_summary?: string;
          session_duration?: number;
          topics?: string[];
          has_alert?: boolean;
          alert_level?: "high" | "medium";
          alert_message?: string;
          status?: "active" | "completed";
        };
      };
      social_health_analyses: {
        Row: {
          id: string;
          created_at: string;
          child_id: string;
          analysis_date: string;
          mood_score: number;
          social_score: number;
          emotional_state: string;
          friendship_dynamics: Record<string, any>;
          intervention_recommendations: string[];
          ai_insights: Record<string, any>;
          data_sources: string[];
        };
        Insert: {
          id?: string;
          created_at?: string;
          child_id: string;
          analysis_date: string;
          mood_score: number;
          social_score: number;
          emotional_state: string;
          friendship_dynamics?: Record<string, any>;
          intervention_recommendations?: string[];
          ai_insights?: Record<string, any>;
          data_sources?: string[];
        };
        Update: {
          id?: string;
          created_at?: string;
          child_id?: string;
          analysis_date?: string;
          mood_score?: number;
          social_score?: number;
          emotional_state?: string;
          friendship_dynamics?: Record<string, any>;
          intervention_recommendations?: string[];
          ai_insights?: Record<string, any>;
          data_sources?: string[];
        };
      };
      intervention_history: {
        Row: {
          id: string;
          created_at: string;
          child_id: string;
          intervention_type: string;
          intervention_content: string;
          effectiveness_rating?: number;
          parent_feedback?: string;
          follow_up_date?: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          child_id: string;
          intervention_type: string;
          intervention_content: string;
          effectiveness_rating?: number;
          parent_feedback?: string;
          follow_up_date?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          child_id?: string;
          intervention_type?: string;
          intervention_content?: string;
          effectiveness_rating?: number;
          parent_feedback?: string;
          follow_up_date?: string;
        };
      };
      crisis_alerts: {
        Row: {
          id: string;
          created_at: string;
          child_id: string;
          alert_type: "mild" | "moderate" | "severe" | "crisis";
          alert_message: string;
          is_resolved: boolean;
          resolved_at?: string;
          action_taken?: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          child_id: string;
          alert_type: "mild" | "moderate" | "severe" | "crisis";
          alert_message: string;
          is_resolved?: boolean;
          resolved_at?: string;
          action_taken?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          child_id?: string;
          alert_type?: "mild" | "moderate" | "severe" | "crisis";
          alert_message?: string;
          is_resolved?: boolean;
          resolved_at?: string;
          action_taken?: string;
        };
      };
      dashboard_analytics: {
        Row: {
          id: string;
          created_at: string;
          child_id: string;
          latest_mood: {
            status: string;
            trend: string;
            recorded_at: string;
          };
          sessions_analytics: {
            sessions_this_week: number;
            total_sessions: number;
            average_duration: number;
            last_session_at: string;
          };
          emotional_trend: {
            status: "improving" | "declining" | "stable";
            attention_needed: boolean;
            analysis_period: string;
            key_factors: string[];
          };
          active_concerns: {
            count: number;
            level: "stable" | "monitoring" | "high_priority";
            identified_concerns: string[];
            priority_concerns: string[];
          };
          alerts: {
            has_alert: boolean;
            alert_type?: "warning" | "critical";
            alert_title?: string;
            alert_description?: string;
            created_at?: string;
          };
          communication_insights: {
            topic: string;
            confidence_score: number;
            observations: string[];
            parent_insights: string[];
            communication_tips: string[];
            recommended_next_step: string;
            updated_at: string;
          }[];
          growth_development_insights: {
            category: string;
            insight_summary: string;
            insight_detail: string;
            suggested_actions: string[];
            updated_at: string;
          }[];
          family_communication_summary: {
            strengths: string[];
            growth_areas: string[];
            recommendations: string[];
            updated_at: string;
          };
          conversation_organization: {
            key_topics: string[];
            questions_to_consider: string[];
            updated_at: string;
          };
          family_wellness_tips: {
            title: string;
            description: string;
            updated_at: string;
          }[];
          family_communication_goals: {
            goal_type: "This Week" | "Ongoing" | "If Needed";
            description: string;
            updated_at: string;
          }[];
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          child_id: string;
          latest_mood: {
            status: string;
            trend: string;
            recorded_at: string;
          };
          sessions_analytics: {
            sessions_this_week: number;
            total_sessions: number;
            average_duration: number;
            last_session_at: string;
          };
          emotional_trend: {
            status: "improving" | "declining" | "stable";
            attention_needed: boolean;
            analysis_period: string;
            key_factors: string[];
          };
          active_concerns: {
            count: number;
            level: "stable" | "monitoring" | "high_priority";
            identified_concerns: string[];
            priority_concerns: string[];
          };
          alerts: {
            has_alert: boolean;
            alert_type?: "warning" | "critical";
            alert_title?: string;
            alert_description?: string;
            created_at?: string;
          };
          communication_insights: {
            topic: string;
            confidence_score: number;
            observations: string[];
            parent_insights: string[];
            communication_tips: string[];
            recommended_next_step: string;
            updated_at: string;
          }[];
          growth_development_insights: {
            category: string;
            insight_summary: string;
            insight_detail: string;
            suggested_actions: string[];
            updated_at: string;
          }[];
          family_communication_summary: {
            strengths: string[];
            growth_areas: string[];
            recommendations: string[];
            updated_at: string;
          };
          conversation_organization: {
            key_topics: string[];
            questions_to_consider: string[];
            updated_at: string;
          };
          family_wellness_tips: {
            title: string;
            description: string;
            updated_at: string;
          }[];
          family_communication_goals: {
            goal_type: "This Week" | "Ongoing" | "If Needed";
            description: string;
            updated_at: string;
          }[];
          updated_at: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          child_id?: string;
          latest_mood?: {
            status: string;
            trend: string;
            recorded_at: string;
          };
          sessions_analytics?: {
            sessions_this_week: number;
            total_sessions: number;
            average_duration: number;
            last_session_at: string;
          };
          emotional_trend?: {
            status: "improving" | "declining" | "stable";
            attention_needed: boolean;
            analysis_period: string;
            key_factors: string[];
          };
          active_concerns?: {
            count: number;
            level: "stable" | "monitoring" | "high_priority";
            identified_concerns: string[];
            priority_concerns: string[];
          };
          alerts?: {
            has_alert: boolean;
            alert_type?: "warning" | "critical";
            alert_title?: string;
            alert_description?: string;
            created_at?: string;
          };
          communication_insights?: {
            topic: string;
            confidence_score: number;
            observations: string[];
            parent_insights: string[];
            communication_tips: string[];
            recommended_next_step: string;
            updated_at: string;
          }[];
          growth_development_insights?: {
            category: string;
            insight_summary: string;
            insight_detail: string;
            suggested_actions: string[];
            updated_at: string;
          }[];
          family_communication_summary?: {
            strengths: string[];
            growth_areas: string[];
            recommendations: string[];
            updated_at: string;
          };
          conversation_organization?: {
            key_topics: string[];
            questions_to_consider: string[];
            updated_at: string;
          };
          family_wellness_tips?: {
            title: string;
            description: string;
            updated_at: string;
          }[];
          family_communication_goals?: {
            goal_type: "This Week" | "Ongoing" | "If Needed";
            description: string;
            updated_at: string;
          }[];
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          created_at: string;
          session_id: string;
          child_id: string;
          sender: "child" | "ai";
          content: string;
          message_index: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          session_id: string;
          child_id: string;
          sender: "child" | "ai";
          content: string;
          message_index: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          session_id?: string;
          child_id?: string;
          sender?: "child" | "ai";
          content?: string;
          message_index?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_tier: "free" | "premium" | "family" | "crisis";
      alert_type: "mild" | "moderate" | "severe" | "crisis";
      emotional_trend: "improving" | "declining" | "stable";
      concern_level: "stable" | "monitoring" | "high_priority";
    };
  };
}

// Type helpers
export type DashboardAnalytics =
  Database["public"]["Tables"]["dashboard_analytics"]["Row"];
export type Family = Database["public"]["Tables"]["families"]["Row"];
export type Child = Database["public"]["Tables"]["children"]["Row"];
export type MoodTracking = Database["public"]["Tables"]["mood_tracking"]["Row"];
export type TherapySession =
  Database["public"]["Tables"]["therapy_sessions"]["Row"];
export type SocialHealthAnalysis =
  Database["public"]["Tables"]["social_health_analyses"]["Row"];
export type InterventionHistory =
  Database["public"]["Tables"]["intervention_history"]["Row"];
export type CrisisAlert = Database["public"]["Tables"]["crisis_alerts"]["Row"];
