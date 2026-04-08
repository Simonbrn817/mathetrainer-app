"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DiagnoseTestPage() {
  const [score, setScore] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [debugUserId, setDebugUserId] = useState("");

  async function handleSaveTestResult() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setErrorMessage("Fehler beim Laden des Users: " + userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setErrorMessage("Du bist nicht eingeloggt.");
        setLoading(false);
        return;
      }

      if (score.trim() === "") {
        setErrorMessage("Bitte einen Score eingeben.");
        setLoading(false);
        return;
      }

      const numericScore = Number(score);

      if (Number.isNaN(numericScore)) {
        setErrorMessage("Score muss eine Zahl sein.");
        setLoading(false);
        return;
      }

      setDebugUserId(user.id);

      const insertPayload = {
        user_id: user.id,
        score: numericScore,
      };

      console.log("USER ID:", user.id);
      console.log("INSERT PAYLOAD:", insertPayload);

      const { data, error } = await supabase
        .from("DiagnosticResult")
        .insert([insertPayload])
        .select();

      console.log("INSERT DATA:", data);
      console.log("INSERT ERROR:", error);

      if (error) {
        setErrorMessage("Fehler beim Speichern: " + error.message);
        setLoading(false);
        return;
      }

      setMessage("Diagnose-Ergebnis erfolgreich gespeichert.");
      setScore("");
    } catch (error) {
      console.error("UNERWARTETER FEHLER:", error);
      setErrorMessage("Unerwarteter Fehler beim Speichern.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h1>Diagnose Test</h1>

      <div style={{ display: "grid", gap: 12, maxWidth: 300 }}>
        <input
          type="number"
          placeholder="Score eingeben"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          style={{ padding: 10, fontSize: 16 }}
        />

        <button
          onClick={handleSaveTestResult}
          disabled={loading}
          style={{ padding: 10, fontSize: 16 }}
        >
          {loading ? "Speichere..." : "Diagnose speichern"}
        </button>
      </div>

      {debugUserId && (
        <p style={{ marginTop: 20 }}>
          <strong>Aktuelle User ID:</strong> {debugUserId}
        </p>
      )}

      {message && (
        <p style={{ color: "green", marginTop: 20 }}>
          {message}
        </p>
      )}

      {errorMessage && (
        <p style={{ color: "red", marginTop: 20 }}>
          {errorMessage}
        </p>
      )}
    </main>
  );
}