import { createClient } from '@supabase/supabase-js'

const useSupabaseOnly = (import.meta as any).env?.VITE_SUPABASE_ONLY === 'true'
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY

let supabase: any;

if (!useSupabaseOnly && (!supabaseUrl || !supabaseAnonKey)) {
  // Minimal mock used by contexts when backend auth is enabled
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      refreshSession: async () => ({ data: {}, error: null }),
      getUser: async () => ({ data: { user: null }, error: null })
    },
    from: (_table: string) => {
      const chain: any = {
        _data: [],
        select: function() { return this; },
        insert: function() { return this; },
        update: function() { return this; },
        delete: function() { return this; },
        eq: function() { return this; },
        order: function() { return this; },
        limit: function() { return this; },
        range: function() { return this; },
        single: function() { return this; },
        then: function(resolve: any) { resolve({ data: [], error: null }); }
      };
      return chain;
    },
    rpc: async () => ({ data: null, error: null })
  } as any;
} else {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Enable auto refresh for users
    persistSession: true, // Enable session persistence for users
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        try {
          // Allow session restoration for users
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error getting item from localStorage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          // Store session data for users
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error setting item in localStorage:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing item from localStorage:', error);
        }
      }
    },
    storageKey: 'sb-auth-token'
  }
})
}

export { supabase }

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          balance: number
          currency: string
          is_verified: boolean
          created_at: string
          last_login: string
          status: 'active' | 'suspended' | 'closed'
          total_deposited: number
          total_withdrawn: number
          total_wagered: number
          active_bets: number
          country: string
          risk_level: 'low' | 'medium' | 'high'
          kyc_status: 'pending' | 'approved' | 'rejected'
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          balance?: number
          currency?: string
          is_verified?: boolean
          created_at?: string
          last_login?: string
          status?: 'active' | 'suspended' | 'closed'
          total_deposited?: number
          total_withdrawn?: number
          total_wagered?: number
          active_bets?: number
          country?: string
          risk_level?: 'low' | 'medium' | 'high'
          kyc_status?: 'pending' | 'approved' | 'rejected'
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          balance?: number
          currency?: string
          is_verified?: boolean
          created_at?: string
          last_login?: string
          status?: 'active' | 'suspended' | 'closed'
          total_deposited?: number
          total_withdrawn?: number
          total_wagered?: number
          active_bets?: number
          country?: string
          risk_level?: 'low' | 'medium' | 'high'
          kyc_status?: 'pending' | 'approved' | 'rejected'
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund'
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          description: string
          reference: string
          created_at: string
          completed_at: string | null
          updated_at: string
          metadata: any
        }
        Insert: {
          id?: string
          user_id: string
          type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund'
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          description: string
          reference: string
          created_at?: string
          completed_at?: string | null
          updated_at?: string
          metadata?: any
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund'
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          description?: string
          reference?: string
          created_at?: string
          completed_at?: string | null
          updated_at?: string
          metadata?: any
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
          permissions: string[]
          is_active: boolean
          created_at: string
          last_login: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          role: string
          permissions: string[]
          is_active?: boolean
          created_at?: string
          last_login?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: string
          permissions?: string[]
          is_active?: boolean
          created_at?: string
          last_login?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          admin_id: string | null
          action: string
          resource_type: string
          resource_id: string
          details: any
          ip_address: string
          user_agent: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          admin_id?: string | null
          action: string
          resource_type: string
          resource_id: string
          details?: any
          ip_address?: string
          user_agent?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          admin_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string
          details?: any
          ip_address?: string
          user_agent?: string
          created_at?: string
        }
      }
      games: {
        Row: {
          id: string
          name: string
          provider: string
          category: string
          rtp: number
          is_active: boolean
          total_played: number
          total_wagered: number
          total_payout: number
          profit_margin: number
          last_played: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          provider: string
          category: string
          rtp: number
          is_active?: boolean
          total_played?: number
          total_wagered?: number
          total_payout?: number
          profit_margin?: number
          last_played?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          provider?: string
          category?: string
          rtp?: number
          is_active?: boolean
          total_played?: number
          total_wagered?: number
          total_payout?: number
          profit_margin?: number
          last_played?: string
          created_at?: string
          updated_at?: string
        }
      }
      bets: {
        Row: {
          id: string
          user_id: string
          game_id: string | null
          type: 'sports' | 'casino' | 'lottery'
          amount: number
          odds: number | null
          potential_win: number | null
          status: 'pending' | 'won' | 'lost' | 'cancelled'
          details: any
          created_at: string
          settled_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id?: string | null
          type: 'sports' | 'casino' | 'lottery'
          amount: number
          odds?: number | null
          potential_win?: number | null
          status?: 'pending' | 'won' | 'lost' | 'cancelled'
          details?: any
          created_at?: string
          settled_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string | null
          type?: 'sports' | 'casino' | 'lottery'
          amount?: number
          odds?: number | null
          potential_win?: number | null
          status?: 'pending' | 'won' | 'lost' | 'cancelled'
          details?: any
          created_at?: string
          settled_at?: string | null
          updated_at?: string
        }
      }
    }
  }
}
