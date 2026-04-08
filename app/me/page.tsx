"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CurrentUser = {
  id: string;
  email: string | null;
} | null;

export default function MePage() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadCurrentUser() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        setErrorMessage(error.message);
        setUser(null);
        setLoading(false);
        return;
      }

      if (!user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({
        id: user.id,
        email: user.email ?? null,
      });
    } catch (error) {
      console.error("Fehler beim Laden des Users:", error);
      setErrorMessage("Unerwarteter Fehler beim Laden des Nutzers.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentUser();
  }, []);

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h1>Aktueller Nutzer</h1>

      <button onClick={loadCurrentUser} style={{ padding: 10, marginBottom: 20 }}>
        Nutzer neu laden
      </button>

      {loading && <p>Lade Nutzer...</p>}

      {!loading && errorMessage && (
        <p style={{ color: "red" }}>{errorMessage}</p>
      )}

      {!loading && !errorMessage && !user && (
        <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
          <p><strong>Status:</strong> Nicht eingeloggt</p>
        </div>
      )}

      {!loading && user && (
        <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
          <p><strong>Status:</strong> Eingeloggt</p>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>E-Mail:</strong> {user.email}</p>
        </div>
      )}
    </main>
  );
}