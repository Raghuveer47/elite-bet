import { supabase } from '../lib/supabase'
import { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type AdminUser = Database['public']['Tables']['admin_users']['Row']
// type Transaction = Database['public']['Tables']['transactions']['Row']
// type AuditLog = Database['public']['Tables']['audit_logs']['Row']

export interface AuthSession {
  user: User
  token: string
  expiresAt: Date
  refreshToken: string
}

export interface AdminSession {
  adminUser: AdminUser
  token: string
  expiresAt: Date
  refreshToken: string
}

export class SupabaseAuthService {
  // User Authentication
  static async signUp(email: string, password: string, firstName: string, lastName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error

      if (data.user) {
        // User will be automatically created in public.users table via trigger
        return {
          success: true,
          user: data.user,
          message: data.user.email_confirmed_at 
            ? 'Registration successful! You can now login.' 
            : 'Registration successful! Please check your email for verification.'
        }
      }

      return { success: false, message: 'Registration failed' }
    } catch (error: any) {
      console.error('Sign up error:', error)
      return { success: false, message: error.message }
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        // Get user profile from public.users table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) throw profileError

        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id)

        // Log the login
        await this.logAuditEvent('user_login', 'user', data.user.id, {
          email: data.user.email,
          login_method: 'email_password'
        })

        return {
          success: true,
          user: userProfile,
          session: data.session
        }
      }

      return { success: false, message: 'Login failed' }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return { success: false, message: error.message }
    }
  }

  static async signOut() {
    try {
      console.log('SupabaseAuthService: Starting sign out process');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('SupabaseAuthService: Supabase signOut error:', error);
        throw error;
      }
      
      // Clear all Supabase-related data from localStorage
      try {
        localStorage.removeItem('sb-auth-token');
        localStorage.removeItem('supabase.auth.token');
        // Clear any other Supabase-related keys
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        console.log('SupabaseAuthService: Cleared Supabase data from localStorage');
      } catch (storageError) {
        console.warn('SupabaseAuthService: Error clearing localStorage:', storageError);
      }
      
      console.log('SupabaseAuthService: Sign out successful');
      return { success: true }
    } catch (error: any) {
      console.error('SupabaseAuthService: Sign out error:', error)
      return { success: false, message: error.message }
    }
  }

  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) return null

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('SupabaseAuthService: Database error, using fallback:', profileError);
        // Return a fallback user object if database lookup fails
        return {
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || 'User',
          last_name: user.user_metadata?.last_name || 'Name',
          balance: 1000, // Default demo balance
          currency: 'USD',
          is_verified: !!user.email_confirmed_at,
          created_at: user.created_at,
          last_login: new Date().toISOString(),
          status: 'active',
          total_deposited: 0,
          total_withdrawn: 0,
          total_wagered: 0,
          active_bets: 0,
          country: 'United States',
          risk_level: 'low',
          kyc_status: 'approved',
          updated_at: new Date().toISOString()
        };
      }

      return userProfile
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  // Admin Authentication
  static async adminSignIn(email: string, password: string) {
    try {
      // First check if this is an admin user
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (adminError || !adminUser) {
        return { success: false, message: 'Invalid admin credentials' }
      }

      // For demo purposes, we'll use a simple password check
      // In production, you'd want to use Supabase Auth for admins too
      if (password === 'Admin123!') {
        // Update last login
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', adminUser.id)

        // Log the admin login
        await this.logAuditEvent('admin_login', 'admin', adminUser.id, {
          email: adminUser.email,
          role: adminUser.role
        })

        return {
          success: true,
          adminUser,
          session: {
            access_token: 'admin_token_' + Date.now(),
            refresh_token: 'admin_refresh_' + Date.now(),
            expires_at: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
          }
        }
      }

      return { success: false, message: 'Invalid admin credentials' }
    } catch (error: any) {
      console.error('Admin sign in error:', error)
      return { success: false, message: error.message }
    }
  }

  static async adminSignOut() {
    try {
      // Log the admin logout
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await this.logAuditEvent('admin_logout', 'admin', user.id, {
          logout_method: 'manual'
        })
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('Admin sign out error:', error)
      return { success: false, message: error.message }
    }
  }

  // User Management
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, users: data }
    } catch (error: any) {
      console.error('Get all users error:', error)
      return { success: false, message: error.message }
    }
  }

  static async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return { success: true, user: data }
    } catch (error: any) {
      console.error('Get user by ID error:', error)
      return { success: false, message: error.message }
    }
  }

  static async updateUser(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Log the update
      await this.logAuditEvent('user_updated', 'user', userId, updates)

      return { success: true, user: data }
    } catch (error: any) {
      console.error('Update user error:', error)
      return { success: false, message: error.message }
    }
  }

  static async updateUserBalance(userId: string, amountToAdd: number) {
    try {
      console.log('SupabaseAuthService: Updating user balance for:', userId, 'Amount to add:', amountToAdd);
      
      // First get current balance
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('SupabaseAuthService: Failed to fetch current balance:', fetchError);
        throw fetchError;
      }

      const currentBalance = userData.balance || 0;
      const newBalance = currentBalance + amountToAdd;
      
      console.log('SupabaseAuthService: Current balance:', currentBalance, 'New balance:', newBalance);

      // Update with new balance
      const { data, error } = await supabase
        .from('users')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('SupabaseAuthService: Failed to update balance:', error);
        throw error;
      }

      console.log('SupabaseAuthService: Balance updated successfully:', data.balance);

      // Log the balance update
      await this.logAuditEvent('balance_updated', 'user', userId, {
        previousBalance: currentBalance,
        amountAdded: amountToAdd,
        newBalance: newBalance
      });

      return { success: true, user: data }
    } catch (error: any) {
      console.error('SupabaseAuthService: Update user balance error:', error)
      return { success: false, message: error.message }
    }
  }

  // Give automatic welcome bonus to new users
  static async giveWelcomeBonus(userId: string) {
    try {
      console.log('SupabaseAuthService: User already has $100 by default - no bonus needed');
      
      // Users get $100 automatically from database trigger
      // No need to create transactions or update balance
      return { success: true, message: 'User has $100 balance ready to play!' };
      
    } catch (error: any) {
      console.error('SupabaseAuthService: Error in welcome bonus:', error);
      return { success: false, message: error.message };
    }
  }

  // Transaction Management
  static async createTransaction(transaction: Database['public']['Tables']['transactions']['Insert']) {
    try {
      console.log('SupabaseAuthService: Creating transaction in Supabase:', transaction);
      
      // Test basic Supabase connectivity first
      console.log('SupabaseAuthService: Testing Supabase connectivity...');
      console.log('SupabaseAuthService: Supabase URL:', supabase.supabaseUrl);
      console.log('SupabaseAuthService: Supabase Key exists:', !!supabase.supabaseKey);
      
      // Skip session check since RLS is disabled - direct database insert
      console.log('SupabaseAuthService: Bypassing session check (RLS disabled), proceeding with transaction insert...');

      // Create transaction in Supabase with timeout
      const insertPromise = supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();
      
      const insertTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database insert timeout')), 30000)
      );

      console.log('SupabaseAuthService: Executing database insert...');
      const { data, error } = await Promise.race([insertPromise, insertTimeoutPromise]) as any;

      if (error) {
        console.error('SupabaseAuthService: Database error:', error);
        console.error('SupabaseAuthService: Error code:', error.code);
        console.error('SupabaseAuthService: Error details:', error.details);
        console.error('SupabaseAuthService: Error hint:', error.hint);
        console.error('SupabaseAuthService: Error message:', error.message);
        return { success: false, message: `Database error: ${error.message} (Code: ${error.code})` };
      }

      console.log('SupabaseAuthService: Transaction created successfully:', data);
      
      return {
        success: true,
        transaction: data,
        message: 'Transaction created successfully'
      };

    } catch (error: any) {
      console.error('SupabaseAuthService: Create transaction error:', error);
      console.error('SupabaseAuthService: Error type:', typeof error);
      console.error('SupabaseAuthService: Error stack:', error.stack);
      console.error('SupabaseAuthService: Full error object:', error);
      return { success: false, message: `Transaction creation failed: ${error.message}` };
    }
  }

  // Quick database test
  static async quickDatabaseTest() {
    try {
      console.log('SupabaseAuthService: Quick database test...');
      
      // Test 1: Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('SupabaseAuthService: Session test - Error:', sessionError);
      console.log('SupabaseAuthService: Session test - Has session:', !!session);
      
      if (!session) {
        return { success: false, message: 'No active session' };
      }

      // Test 2: Simple select
      const { data: selectData, error: selectError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      console.log('SupabaseAuthService: Select test - Error:', selectError);
      console.log('SupabaseAuthService: Select test - Data:', selectData);

      // Test 3: Simple insert (will be rolled back)
      const testTransaction = {
        user_id: session.user.id,
        type: 'deposit' as const,
        amount: 0.01,
        currency: 'USD',
        status: 'pending' as const,
        description: 'Database connectivity test',
        reference: `TEST_${Date.now()}`,
        metadata: { test: true }
      };

      const { data: insertData, error: insertError } = await supabase
        .from('transactions')
        .insert([testTransaction])
        .select()
        .single();

      console.log('SupabaseAuthService: Insert test - Error:', insertError);
      console.log('SupabaseAuthService: Insert test - Data:', insertData);

      if (insertError) {
        return { success: false, message: `Insert test failed: ${insertError.message}` };
      }

      // Clean up test data
      await supabase
        .from('transactions')
        .delete()
        .eq('id', insertData.id);

      console.log('SupabaseAuthService: Database test completed successfully');
      return { success: true, message: 'Database is accessible' };

    } catch (error: any) {
      console.error('SupabaseAuthService: Database test error:', error);
      return { success: false, message: `Database test failed: ${error.message}` };
    }
  }

  // Database connectivity test
  static async testDatabaseConnection() {
    try {
      console.log('SupabaseAuthService: Testing database connection...');
      
      // Test 1: Check if we can connect to Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('SupabaseAuthService: Session check:', sessionData.session ? 'Active' : 'None');
      
      // Test 2: Try to select from transactions table
      const { data: transactions, error: selectError } = await supabase
        .from('transactions')
        .select('id')
        .limit(1);
      
      if (selectError) {
        console.error('SupabaseAuthService: Select test failed:', selectError);
        return { success: false, message: `Select test failed: ${selectError.message}` };
      }
      
      console.log('SupabaseAuthService: Select test passed');
      
      // Test 3: Try to insert a test transaction
      const testTransaction = {
        user_id: 'faf28610-32bc-445c-8880-a9a66f0f4f51',
        type: 'deposit' as const,
        amount: 0.01,
        currency: 'USD',
        status: 'pending' as const,
        description: 'Database connectivity test',
        reference: `CONNECTIVITY_TEST_${Date.now()}`,
        metadata: { test: true }
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('transactions')
        .insert(testTransaction)
        .select()
        .single();
      
      if (insertError) {
        console.error('SupabaseAuthService: Insert test failed:', insertError);
        return { success: false, message: `Insert test failed: ${insertError.message}` };
      }
      
      console.log('SupabaseAuthService: Insert test passed');
      
      // Clean up test data
      await supabase
        .from('transactions')
        .delete()
        .eq('id', insertData.id);
      
      console.log('SupabaseAuthService: Database connection test completed successfully');
      return { success: true, message: 'Database connection is working' };
      
    } catch (error: any) {
      console.error('SupabaseAuthService: Database connection test failed:', error);
      return { success: false, message: error.message };
    }
  }

  static async getAllTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          users!inner(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, transactions: data }
    } catch (error: any) {
      console.error('Get all transactions error:', error)
      return { success: false, message: error.message }
    }
  }

  static async updateTransactionStatus(transactionId: string, status: string, metadata?: any) {
    try {
      console.log('SupabaseAuthService: Updating transaction status:', transactionId, 'to', status);
      
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      if (metadata) {
        updateData.metadata = metadata;
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        console.error('SupabaseAuthService: Update transaction status error:', error);
        throw error;
      }
      
      console.log('SupabaseAuthService: Transaction status updated successfully:', data);
      return { success: true, transaction: data }
    } catch (error: any) {
      console.error('SupabaseAuthService: Update transaction status error:', error)
      return { success: false, message: error.message }
    }
  }

  static async getUserTransactions(userId: string) {
    try {
      console.log('SupabaseAuthService: Fetching transactions for user:', userId);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('SupabaseAuthService: Get user transactions error:', error);
        throw error;
      }
      
      console.log('SupabaseAuthService: Found', data?.length || 0, 'transactions for user');
      return { success: true, transactions: data }
    } catch (error: any) {
      console.error('SupabaseAuthService: Get user transactions error:', error)
      return { success: false, message: error.message }
    }
  }

  // Audit Logging
  static async logAuditEvent(action: string, resourceType: string, resourceId: string, details: any = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id || null,
          admin_id: null, // Will be set if this is an admin action
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: '127.0.0.1', // In production, get real IP
          user_agent: navigator.userAgent
        })
    } catch (error) {
      console.error('Log audit event error:', error)
    }
  }

  static async getAuditLogs() {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users(first_name, last_name, email),
          admin_users(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return { success: true, logs: data }
    } catch (error: any) {
      console.error('Get audit logs error:', error)
      return { success: false, message: error.message }
    }
  }

  // System Stats
  static async getSystemStats() {
    try {
      const [
        usersResult,
        transactionsResult,
        activeUsersResult
      ] = await Promise.all([
        supabase.from('users').select('id, balance, total_deposited, total_withdrawn, total_wagered'),
        supabase.from('transactions').select('amount, type, status'),
        supabase.from('users').select('id').eq('status', 'active')
      ])

      if (usersResult.error) throw usersResult.error
      if (transactionsResult.error) throw transactionsResult.error
      if (activeUsersResult.error) throw activeUsersResult.error

      const users = usersResult.data || []
      const transactions = transactionsResult.data || []
      const activeUsers = activeUsersResult.data || []

      const totalDeposits = transactions
        .filter(t => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalWithdrawals = transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalBets = transactions
        .filter(t => t.type === 'bet' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalWinnings = transactions
        .filter(t => t.type === 'win' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)

      const pendingWithdrawals = transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        success: true,
        stats: {
          totalUsers: users.length,
          activeUsers: activeUsers.length,
          totalDeposits,
          totalWithdrawals,
          totalBets,
          totalWinnings,
          platformRevenue: totalBets - totalWinnings,
          pendingWithdrawals,
          pendingVerifications: users.filter(u => u.kyc_status === 'pending').length,
          systemHealth: 'healthy'
        }
      }
    } catch (error: any) {
      console.error('Get system stats error:', error)
      return { success: false, message: error.message }
    }
  }
}
