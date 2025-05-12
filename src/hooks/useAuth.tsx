import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signIn: async () => {},
  signOut: async () => {},
  deleteUser: async () => {},
  isLoading: true
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {

        } else if (event === 'SIGNED_OUT') {

        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
    } catch (error) {

      console.error("Sign in error:", error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
      throw error;
    }
  };

  const deleteUser = async () => {
    try {
      if (!user) throw new Error('No user is signed in');

      // Call the Supabase Edge Function to handle user deletion securely
      const { data, error } = await supabase.functions.invoke('delete_user', {
        body: { user_id: user.id },
      });

      if (error) {
        console.error('Error from delete_user function:', error);
        throw new Error(error.message || 'Failed to delete user');
      }
      if (data && data.error) {
        // Edge Function responded with an error
        console.error('delete_user function error:', data.error);
        throw new Error(data.error);
      }

      // Optionally clear localStorage, caches, etc. here
      // localStorage.clear();

      // Sign out after successful deletion
      try {
        await signOut();
      } catch (signOutError: any) {
        // Ignore 403 Forbidden errors after deletion (session is already invalid)
        if (
          signOutError?.status === 403 ||
          (typeof signOutError?.message === 'string' && signOutError.message.includes('403'))
        ) {
          // Session already deleted, safe to ignore
        } else {
          console.error("Error during sign out after deletion:", signOutError);
          throw signOutError;
        }
      }
    } catch (error) {
      console.error("Error during account deletion:", error);
      throw error;
    }
  };


  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, deleteUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
