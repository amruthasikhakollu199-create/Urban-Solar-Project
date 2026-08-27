import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // GET CURRENT SESSION + LISTEN FOR AUTH CHANGES
  // ============================================================

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for authentication changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup listener
    return () => subscription.unsubscribe();
  }, []);

  // ============================================================
  // SIGN IN
  // ============================================================

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  // ============================================================
  // SIGN UP
  // ============================================================

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    return { data, error };
  };

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  const updateProfile = async (metadata = {}) => {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (data?.user) {
      setUser(data.user);
    }

    return { data, error };
  };

  // ============================================================
  // SIGN OUT
  // ============================================================

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ============================================================
  // AUTH CONTEXT
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// USE AUTH HOOK
// ============================================================

export function useAuth() {
  return useContext(AuthContext);
}