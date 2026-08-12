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
    // 1. Check stored demo session
    const storedDemo = localStorage.getItem('danishgah_demo_session');
    if (storedDemo) {
      try {
        const parsed = JSON.parse(storedDemo);
        setUser(parsed.user);
        setUserProfile(parsed.profile);
        setIsDemo(true);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('danishgah_demo_session');
      }
    }

    // 2. Check Supabase Auth session if Supabase is configured
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
        } else if (!isDemo) {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });

      return () => subscription?.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      if (!supabase.from) return;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (!error && data) {
        setUserProfile(data);
      } else {
        setUserProfile({
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          email: authUser.email,
          role: authUser.user_metadata?.role || 'admin',
        });
      }
    } catch (e) {
      setUserProfile({
        name: authUser.user_metadata?.name || authUser.email.split('@')[0],
        email: authUser.email,
        role: 'admin',
      });
    }
  };

  const login = async (email, password) => {
    if (!supabase.auth || typeof supabase.auth.signInWithPassword !== 'function') {
      throw new Error('Supabase Auth client is not configured.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    return data;
  };

  const logout = async () => {
    setUser(null);
    setUserProfile(null);
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
