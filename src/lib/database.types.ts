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
      locations: {
        Row: {
          id: string
          name: string
          address: string
          phone: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string | null
          email?: string | null
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          duration: number
          price: number
          location_id: string
          location_name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          duration: number
          price: number
          location_id: string
          location_name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          duration?: number
          price?: number
          location_id?: string
          location_name?: string
          created_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          name: string
          specialization: string | null
          location_id: string
          location_name: string
          email: string | null
          image_url: string | null
          working_hours: Json | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          specialization?: string | null
          location_id: string
          location_name: string
          email?: string | null
          image_url?: string | null
          working_hours?: Json | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          specialization?: string | null
          location_id?: string
          location_name?: string
          email?: string | null
          image_url?: string | null
          working_hours?: Json | null
          user_id?: string | null
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          location_id: string
          location_name: string
          service_id: string
          service_name: string
          service_price: number
          service_duration: number
          staff_id: string
          staff_name: string
          staff_image_url: string | null
          booking_timestamp: string
          client_name: string
          client_phone: string
          client_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          location_name: string
          service_id: string
          service_name: string
          service_price: number
          service_duration: number
          staff_id: string
          staff_name: string
          staff_image_url?: string | null
          booking_timestamp: string
          client_name: string
          client_phone: string
          client_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          location_name?: string
          service_id?: string
          service_name?: string
          service_price?: number
          service_duration?: number
          staff_id?: string
          staff_name?: string
          staff_image_url?: string | null
          booking_timestamp?: string
          client_name?: string
          client_phone?: string
          client_email?: string | null
          created_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          user_id: string
          email: string
          location_id: string | null
          location_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          location_id?: string | null
          location_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          location_id?: string | null
          location_name?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}