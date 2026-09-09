import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

type Profile = {
  id: string;
  username: string;
  friend_id: string;
  is_online: boolean;
  coins: number;
  last_daily_reward: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, retries = 3): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // If profile doesn't exist, try auto-creating one just in case the trigger failed
          const { data: userObj } = await supabase.auth.getUser();
          if (userObj.user) {
            const baseUsername = userObj.user.user_metadata?.username || userObj.user.email?.split('@')[0] || 'Player';
            const friendId = `${baseUsername.toUpperCase()}#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
            
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([{
                id: userId,
                email: userObj.user.email,
                username: baseUsername,
                friend_id: friendId,
                is_online: true
              }])
              .select()
              .single();
              
            if (newProfile) return newProfile;
          }
        }
        if (retries > 0) {
          await new Promise(res => setTimeout(res, 1000));
          return fetchProfile(userId, retries - 1);
        }
        return null;
      }
      
      await supabase.from('profiles').update({ is_online: true }).eq('id', userId);
      return data;
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        setUser(session.user);
        const p = await fetchProfile(session.user.id);
        if (mounted) setProfile(p);
      }
      if (mounted) setLoading(false);
    }
    
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfile(session.user.id);
        if (mounted) setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (user) {
      await supabase.from('profiles').update({ is_online: false }).eq('id', user.id);
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
