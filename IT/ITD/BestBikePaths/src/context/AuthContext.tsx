import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext<any>(null);

//export const AuthProvider = ({children}) => {
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } =
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  const signUp = async (email, password, surname, name, city) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        // Passiamo nome e cognome nei "metadata".
        // Questi verranno intercettati dal Trigger SQL per popolare la tabella 'user'.
        data: {
          surname: surname,
          name: name,
          city: city,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const value = {
    session,
    //isGuest,
    signUp,
    signIn,
    //signInWithGoogle,
    //signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

//export const useAuth = () => useContext(AuthContext);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};