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
          subscription_canceled_at?: string;
          subscription_current_period_start?: string;
          subscription_current_period_end?: string;
          last_payment_at?: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          subscription_tier?: "free" | "premium" | "family" | "crisis";
          subscription_status?: "active" | "inactive" | "trial";
          trial_ends_at?: string;
          parent_pin?: string;
          subscription_canceled_at?: string;
          subscription_current_period_start?: string;
          subscription_current_period_end?: string;
          last_payment_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          subscription_tier?: "free" | "premium" | "family" | "crisis";
          subscription_status?: "active" | "inactive" | "trial";
          trial_ends_at?: string;
          parent_pin?: string;
          subscription_canceled_at?: string;
          subscription_current_period_start?: string;
          subscription_current_period_end?: string;
          last_payment_at?: string;
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
          child_name: string | null;
          weekly_insight: {
            story: string;
            what_happened: string;
            good_news: string;
          } | null;
          action_plan: {
            steps: {
              timeframe: string;
              action: string;
              description: string;
            }[];
            quick_win: string;
          } | null;
          progress_tracking: {
            wins: string[];
            working_on: {
              issue: string;
              note: string;
            }[];
            when_to_worry: string;
          } | null;
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
          child_name?: string | null;
          weekly_insight?: {
            story: string;
            what_happened: string;
            good_news: string;
          } | null;
          action_plan?: {
            steps: {
              timeframe: string;
              action: string;
              description: string;
            }[];
            quick_win: string;
          } | null;
          progress_tracking?: {
            wins: string[];
            working_on: {
              issue: string;
              note: string;
            }[];
            when_to_worry: string;
          } | null;
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
          child_name?: string | null;
          weekly_insight?: {
            story: string;
            what_happened: string;
            good_news: string;
          } | null;
          action_plan?: {
            steps: {
              timeframe: string;
              action: string;
              description: string;
            }[];
            quick_win: string;
          } | null;
          progress_tracking?: {
            wins: string[];
            working_on: {
              issue: string;
              note: string;
            }[];
            when_to_worry: string;
          } | null;
          updated_at?: string;
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
