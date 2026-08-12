import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext(null);

const DEMO_USER = {
  id: 'demo-admin-123',
  email: 'admin@danishgah.edu',
  user_metadata: { name: 'Admin User' }
};

const DEMO_PROFILE = {
  id: 'demo-admin-123',
  name: 'Admin User',
  email: 'admin@danishgah.edu',
  role: 'admin',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // 1. Check stored active session first
    const storedSession = localStorage.getItem('danishgah_active_session');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        if (parsed?.user && parsed?.profile) {
          setUser(parsed.user);
          setUserProfile(parsed.profile);
          setLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem('danishgah_active_session');
      }
    }

    // 2. Check Supabase Auth session if configured
    if (supabase.auth && typeof supabase.auth.getSession === 'function') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user);
        } else {
          setLoading(false);
        }
      }).catch(() => setLoading(false));

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user);
        }
        setLoading(false);
      });

      return () => subscription?.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (authUser) => {
    let prof = {
      name: authUser.user_metadata?.name || authUser.email.split('@')[0],
      email: authUser.email,
      role: authUser.user_metadata?.role || 'admin',
    };
    try {
      if (supabase.from) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('email', authUser.email)
          .single();

        if (!error && data) {
          prof = data;
        }
      }
    } catch (e) {}
    setUserProfile(prof);
    return prof;
  };

  const login = async (rawEmail, rawPassword) => {
    const email = (rawEmail || '').trim().toLowerCase();
    const password = (rawPassword || '').trim();

    // 1. Try Supabase Auth standard signInWithPassword
    if (supabase.auth && typeof supabase.auth.signInWithPassword === 'function') {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.user) {
          setUser(data.user);
          const prof = await fetchProfile(data.user);
          localStorage.setItem('danishgah_active_session', JSON.stringify({ user: data.user, profile: prof }));
          return data;
        }
      } catch (e) {
        // Fallthrough to database and local store checks
      }
    }

    // 2. Direct database check (Supabase `users` table)
    try {
      if (supabase.from) {
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('*')
          .ilike('email', email)
          .single();

        if (!dbError && dbUser) {
          if (!dbUser.password || dbUser.password.trim() === password) {
            const authUser = {
              id: dbUser.id || 'user-' + Date.now(),
              email: dbUser.email,
              user_metadata: { name: dbUser.name, role: dbUser.role }
            };
            setUser(authUser);
            setUserProfile(dbUser);
            localStorage.setItem('danishgah_active_session', JSON.stringify({ user: authUser, profile: dbUser }));
            return { user: authUser };
          }
        }
      }
    } catch (e) {
      console.error('DB login note:', e);
    }

    // 3. Local custom users check (created from Settings)
    try {
      const stored = localStorage.getItem('danishgah_custom_users');
      if (stored) {
        const customUsers = JSON.parse(stored);
        if (Array.isArray(customUsers)) {
          const matched = customUsers.find(
            u => u.email.trim().toLowerCase() === email && (!u.password || u.password.trim() === password)
          );

          if (matched) {
            const authUser = {
              id: matched.id || 'user-' + Date.now(),
              email: matched.email,
              user_metadata: { name: matched.name, role: matched.role }
            };
            const userProf = {
              id: matched.id,
              name: matched.name,
              email: matched.email,
              role: matched.role,
              is_active: true
            };
            setUser(authUser);
            setUserProfile(userProf);
            localStorage.setItem('danishgah_active_session', JSON.stringify({ user: authUser, profile: userProf }));
            return { user: authUser };
          }
        }
      }
    } catch (e) {
      console.error('Local login note:', e);
    }

    throw new Error('Invalid email or password. Please check your credentials.');
  };

  const logout = async () => {
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem('danishgah_active_session');
    if (supabase.auth && typeof supabase.auth.signOut === 'function') {
      try { await supabase.auth.signOut(); } catch (e) {}
    }
  };

  const resetPassword = async (email) => {
    if (!supabase.auth || typeof supabase.auth.resetPasswordForEmail !== 'function') {
      throw new Error('Supabase Auth client is not configured.');
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      throw error;
    }
    return data;
  };

  const value = {
    user,
    userProfile,
    role: userProfile?.role || 'admin',
    isAdmin: (userProfile?.role || 'admin') === 'admin',
    isTeacher: userProfile?.role === 'teacher',
    isAccountant: userProfile?.role === 'accountant',
    loading,
    login,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
