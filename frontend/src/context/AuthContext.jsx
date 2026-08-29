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
    const { city, area, full_name } = metadata;
    const userId = user?.id;

    // ---------------------------------------------------------------
    // Step 1: Update public.power_plants FIRST (if city & area given)
    // This runs before Auth so if the DB rejects the change (e.g.
    // duplicate location), Auth metadata stays consistent with the DB.
    // ---------------------------------------------------------------
    if (city && area && userId) {
      // Try updating the existing row
      const { data: updatedRows, error: plantError } = await supabase
        .from("power_plants")
        .update({ city, area })
        .eq("user_id", userId)
        .select();

      if (plantError) {
        // Duplicate city+area (unique constraint violation)
        if (plantError.code === "23505") {
          return {
            data: null,
            error: { message: "An account is already registered with this location." },
          };
        }
        return { data: null, error: plantError };
      }

      // If 0 rows matched, the user has no power_plants row yet → insert one
      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase
          .from("power_plants")
          .insert({ user_id: userId, city, area });

        if (insertError) {
          if (insertError.code === "23505") {
            return {
              data: null,
              error: { message: "An account is already registered with this location." },
            };
          }
          return { data: null, error: insertError };
        }
      }
    }

    // ---------------------------------------------------------------
    // Step 2: Update Supabase Auth metadata (full_name, city, area)
    // ---------------------------------------------------------------
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (authData?.user) {
      setUser(authData.user);
    }

    if (authError) {
      return { data: null, error: authError };
    }

    return { data: authData, error: null };
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