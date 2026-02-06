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
          keyPoints: string | null
          analysis: string | null
          recommendations: string | null
          createdAt: Date
          updatedAt: Date
        }
        Insert: {
          id?: string
          userId: string
          filename: string
          fileContent?: string | null
          summary?: string | null
          keyPoints?: string | null
          analysis?: string | null
          recommendations?: string | null
          createdAt?: Date
          updatedAt?: Date
        }
        Update: {
          id?: string
          userId?: string
          filename?: string
          fileContent?: string | null
          summary?: string | null
          keyPoints?: string | null
          analysis?: string | null
          recommendations?: string | null
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
      documents: {
        Row: {
          id: string
          userId: string
          filename: string
          file_type: string
          file_size: number | null
          page_count: number | null
          content: string | null
          metadata: Json
          created_at: Date
          updated_at: Date
        }
        Insert: {
          id?: string
          userId: string
          filename: string
          file_type: string
          file_size?: number | null
          page_count?: number | null
          content?: string | null
          metadata?: Json
          created_at?: Date
          updated_at?: Date
        }
        Update: {
          id?: string
          userId?: string
          filename?: string
          file_type?: string
          file_size?: number | null
          page_count?: number | null
          content?: string | null
          metadata?: Json
          created_at?: Date
          updated_at?: Date
        }
      }
      document_chunks: {
        Row: {
          id: string
          document_id: string
          userId: string
          chunk_index: number
          content: string
          token_count: number | null
          embedding: string | null
          metadata: Json
          created_at: Date
        }
        Insert: {
          id?: string
          document_id: string
          userId: string
          chunk_index: number
          content: string
          token_count?: number | null
          embedding?: string | null
          metadata?: Json
          created_at?: Date
        }
        Update: {
          id?: string
          document_id?: string
          userId?: string
          chunk_index?: number
          content?: string
          token_count?: number | null
          embedding?: string | null
          metadata?: Json
          created_at?: Date
        }
      }
      conversations: {
        Row: {
          id: string
          userId: string
          title: string | null
          document_ids: string[]
          created_at: Date
          updated_at: Date
        }
        Insert: {
          id?: string
          userId: string
          title?: string | null
          document_ids?: string[]
          created_at?: Date
          updated_at?: Date
        }
        Update: {
          id?: string
          userId?: string
          title?: string | null
          document_ids?: string[]
          created_at?: Date
          updated_at?: Date
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          userId: string
          role: 'user' | 'assistant' | 'system'
          content: string
          sources: Json
          token_count: number | null
          created_at: Date
        }
        Insert: {
          id?: string
          conversation_id: string
          userId: string
          role: 'user' | 'assistant' | 'system'
          content: string
          sources?: Json
          token_count?: number | null
          created_at?: Date
        }
        Update: {
          id?: string
          conversation_id?: string
          userId?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          sources?: Json
          token_count?: number | null
          created_at?: Date
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: string
          match_count?: number
          filter_user_id?: string
          filter_document_ids?: string[]
          similarity_threshold?: number
        }
        Returns: {
          id: string
          document_id: string
          chunk_index: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      hybrid_search: {
        Args: {
          query_text: string
          query_embedding: string
          match_count?: number
          filter_user_id?: string
          filter_document_ids?: string[]
          similarity_threshold?: number
          keyword_weight?: number
          semantic_weight?: number
        }
        Returns: {
          id: string
          document_id: string
          chunk_index: number
          content: string
          metadata: Json
          similarity: number
          combined_score: number
        }[]
      }
      get_rag_context: {
        Args: {
          query_embedding: string
          p_user_id: string
          p_document_ids?: string[]
          p_match_count?: number
          p_similarity_threshold?: number
        }
        Returns: {
          chunk_id: string
          document_id: string
          filename: string
          chunk_content: string
          chunk_index: number
          similarity: number
          document_metadata: Json
          chunk_metadata: Json
        }[]
      }
      get_user_document_stats: {
        Args: {
          p_user_id: string
        }
        Returns: {
          total_documents: number
          total_chunks: number
          total_conversations: number
          total_analyses: number
        }[]
      }
      delete_document_with_chunks: {
        Args: {
          p_document_id: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}