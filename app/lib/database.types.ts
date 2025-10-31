export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          created_at?: string
          updated_at?: string
        }
      }
      toilet_sessions: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string
          duration: number
          type: 'number1' | 'number2' | 'both'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_time: string
          end_time: string
          duration: number
          type: 'number1' | 'number2' | 'both'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string
          duration?: number
          type?: 'number1' | 'number2' | 'both'
          notes?: string | null
          created_at?: string
        }
      }
      game_scores: {
        Row: {
          id: string
          user_id: string
          username: string
          score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          score?: number
          created_at?: string
          updated_at?: string
        }
      }
      chat_rooms: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
          ended_at?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      waiting_queue: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
        }
      }
      analyzer_results: {
        Row: {
          id: string
          user_id: string
          image_url: string
          analysis_result: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          analysis_result: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          analysis_result?: Json
          created_at?: string
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
      [_ in never]: never
    }
  }
}
