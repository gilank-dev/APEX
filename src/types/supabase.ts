export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance_logs: {
        Row: {
          clock_in_time: string
          clock_out_time: string | null
          company_id: string
          created_at: string
          id: string
          location: Json | null
          photo_url: string | null
          user_id: string
        }
        Insert: {
          clock_in_time?: string
          clock_out_time?: string | null
          company_id: string
          created_at?: string
          id?: string
          location?: Json | null
          photo_url?: string | null
          user_id: string
        }
        Update: {
          clock_in_time?: string
          clock_out_time?: string | null
          company_id?: string
          created_at?: string
          id?: string
          location?: Json | null
          photo_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active_modules: Json
          category: string
          created_at: string
          id: string
          name: string
          slug: string
          tier: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          active_modules?: Json
          category: string
          created_at?: string
          id?: string
          name: string
          slug: string
          tier?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          active_modules?: Json
          category?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          tier?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_payroll_settings: {
        Row: {
          active: boolean
          base_salary: number
          company_id: string
          created_at: string
          id: string
          overtime_rate_per_hour: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          base_salary?: number
          company_id: string
          created_at?: string
          id?: string
          overtime_rate_per_hour?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          base_salary?: number
          company_id?: string
          created_at?: string
          id?: string
          overtime_rate_per_hour?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_payroll_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_payroll_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_assets: {
        Row: {
          company_id: string
          condition: string
          created_at: string
          id: string
          item_name: string
          last_checked_by: string | null
          quantity: number
          sku: string
          updated_at: string
        }
        Insert: {
          company_id: string
          condition?: string
          created_at?: string
          id?: string
          item_name: string
          last_checked_by?: string | null
          quantity?: number
          sku: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          condition?: string
          created_at?: string
          id?: string
          item_name?: string
          last_checked_by?: string | null
          quantity?: number
          sku?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_assets_last_checked_by_fkey"
            columns: ["last_checked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          company_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invite_code: string
          is_admin: boolean
          name: string
          permissions: Json
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invite_code: string
          is_admin?: boolean
          name: string
          permissions?: Json
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invite_code?: string
          is_admin?: boolean
          name?: string
          permissions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          assignment_date: string
          company_id: string
          created_at: string
          id: string
          shift_template_id: string
          user_id: string
        }
        Insert: {
          assignment_date: string
          company_id: string
          created_at?: string
          id?: string
          shift_template_id: string
          user_id: string
        }
        Update: {
          assignment_date?: string
          company_id?: string
          created_at?: string
          id?: string
          shift_template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_shift_template_id_fkey"
            columns: ["shift_template_id"]
            isOneToOne: false
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_swap_requests: {
        Row: {
          company_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          requester_assignment_id: string
          requester_id: string
          status: string
          target_assignment_id: string
          target_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          requester_assignment_id: string
          requester_id: string
          status?: string
          target_assignment_id: string
          target_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          requester_assignment_id?: string
          requester_id?: string
          status?: string
          target_assignment_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          company_id: string
          created_at: string
          end_time: string
          id: string
          name: string
          overnight: boolean
          start_time: string
        }
        Insert: {
          company_id: string
          created_at?: string
          end_time: string
          id?: string
          name: string
          overnight?: boolean
          start_time: string
        }
        Update: {
          company_id?: string
          created_at?: string
          end_time?: string
          id?: string
          name?: string
          overnight?: boolean
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          company_id: string
          created_at: string
          creator_id: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          company_id: string
          created_at?: string
          creator_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          company_id?: string
          created_at?: string
          creator_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          company_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_dummy_account: boolean
          role_id: string
        }
        Insert: {
          auth_id?: string | null
          company_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_dummy_account?: boolean
          role_id: string
        }
        Update: {
          auth_id?: string | null
          company_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_dummy_account?: boolean
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
