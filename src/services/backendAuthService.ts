export type BackendUser = { id: string; userId: string; email: string; firstName?: string; lastName?: string; balance: number };

function getApiBase(): string {
  const base = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';
  // Strip trailing /api/betting if present to get host
  return base.replace(/\/api\/betting\/?$/, '');
}

export const BackendAuthService = {
  async register(email: string, password: string, firstName?: string, lastName?: string, country?: string, referralCode?: string) {
    const res = await fetch(`${getApiBase()}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName, country, referralCode })
    });
    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Register failed');
    return data as { success: true; token: string; user: BackendUser };
  },

  async login(email: string, password: string) {
    const res = await fetch(`${getApiBase()}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Login failed');
    return data as { success: true; token: string; user: BackendUser };
  },

  async me(token: string) {
    const res = await fetch(`${getApiBase()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Auth failed');
    return data as { success: true; user: BackendUser };
  }
};


