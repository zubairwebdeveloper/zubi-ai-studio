"use client";

import { createContext, useEffect, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase/config";
import { getUserProfile } from "@/lib/firebase/firestore";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;

      setUser(firebaseUser);
      setProfile(null);
      setProfileError(null);

      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(firebaseUser.uid);

        if (active) {
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Profile loading error:", error);

        if (active) {
          setProfileError(error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    profileError,
    isAuthenticated: !!user,
    isEmailVerified: !!user?.emailVerified,
    isAdmin: profile?.role === "ADMIN",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
