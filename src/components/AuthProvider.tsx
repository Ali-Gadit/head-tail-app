import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

type Profile = {
  id: string;
  username: string;
  friend_id: string;
  is_online: boolean;
  coins: number;
  rp?: number;
  rank_tier?: string;
  last_daily_reward: string | null;
  private_room_tokens?: number;
  premium_currency?: number;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
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
            
            // Get count to generate sequential ID
            const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const nextId = (count || 0) + 1;
            const friendId = nextId.toString().padStart(7, '0');
            
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
      
      if (data && String(data.friend_id).includes('#')) {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const newId = ((count || 0) + 1).toString().padStart(7, '0');
        await supabase.from('profiles').update({ friend_id: newId, is_online: true }).eq('id', userId);
        data.friend_id = newId;
        return data;
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
        try {
          const { api } = await import('../lib/api');
          await api.processDailyLogin(session.user.id);
        } catch (e) { console.error(e); }
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

  useEffect(() => {
    let profileSub: any = null;
    let mounted = true;
    if (user) {
      profileSub = supabase
        .channel(`public:profiles:${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
          if (mounted) setProfile(payload.new as Profile);
        })
        .subscribe();
    }

    return () => {
      mounted = false;
      if (profileSub) supabase.removeChannel(profileSub);
    };
  }, [user?.id]);

  const signOut = async () => {
    if (user) {
      await supabase.from('profiles').update({ is_online: false }).eq('id', user.id);
    }
    
    // Clear Google Sign-In session so the account picker shows up next time
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
    } catch (error) {
      // Ignore error if the user didn't log in with Google or if it's unconfigured
    }

    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
