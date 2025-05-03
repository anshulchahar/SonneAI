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
      users: {
        Row: {
          id: string
          name: string | null
          email: string | null
          emailVerified: Date | null
          image: string | null
          created_at: Date
          updated_at: Date
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          emailVerified?: Date | null
          image?: string | null
          created_at?: Date
          updated_at?: Date
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          emailVerified?: Date | null
          image?: string | null
          created_at?: Date
          updated_at?: Date
        }
      }
      analysis: {
        Row: {
          id: string
          userId: string
          filename: string
          fileContent: string | null
          summary: string | null
          analysisResult: Json | null
          recommendations: Json | null
          createdAt: Date
          updatedAt: Date
        }
        Insert: {
          id?: string
          userId: string
          filename: string
          fileContent?: string | null
          summary?: string | null
          analysisResult?: Json | null
          recommendations?: Json | null
          createdAt?: Date
          updatedAt?: Date
        }
        Update: {
          id?: string
          userId?: string
          filename?: string
          fileContent?: string | null
          summary?: string | null
          analysisResult?: Json | null
          recommendations?: Json | null
          createdAt?: Date
          updatedAt?: Date
        }
      }
      accounts: {
        Row: {
          id: string
          userId: string
          type: string
          provider: string
          providerAccountId: string
          refresh_token: string | null
          access_token: string | null
          expires_at: number | null
          token_type: string | null
          scope: string | null
          id_token: string | null
          session_state: string | null
          created_at: Date
          updated_at: Date
        }
        Insert: {
          id?: string
          userId: string
          type: string
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          created_at?: Date
          updated_at?: Date
        }
        Update: {
          id?: string
          userId?: string
          type?: string
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          created_at?: Date
          updated_at?: Date
        }
      }
      sessions: {
        Row: {
          id: string
          sessionToken: string
          userId: string
          expires: Date
          created_at: Date
          updated_at: Date
        }
        Insert: {
          id?: string
          sessionToken: string
          userId: string
          expires: Date
          created_at?: Date
          updated_at?: Date
        }
        Update: {
          id?: string
          sessionToken?: string
          userId?: string
          expires?: Date
          created_at?: Date
          updated_at?: Date
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