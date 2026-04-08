import { supabase } from "@/lib/supabase";

export type RouteGuardResult = {
  redirectTo: string | null;
  user: {
    id: string;
    email: string | null;
  } | null;
  learningProfile: {
    id: string;
    user_id: string;
    school_class: string;
    age: number;
    training_frequency: number;
    created_at: string;
  } | null;
  diagnosticResult: {
    id: string;
    user_id: string;
    score: number;
    created_at: string;
  } | null;
  errorMessage: string;
};

type GuardOptions = {
  requireAuth?: boolean;
  requireLearningProfile?: boolean;
  requireDiagnosticResult?: boolean;
};

export async function checkUserProgress(
  options: GuardOptions = {}
): Promise<RouteGuardResult> {
  const {
    requireAuth = true,
    requireLearningProfile = false,
    requireDiagnosticResult = false,
  } = options;

  try {
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return {
        redirectTo: null,
        user: null,
        learningProfile: null,
        diagnosticResult: null,
        errorMessage: "Fehler beim Laden des Nutzers: " + userError.message,
      };
    }

    if (!authUser) {
      return {
        redirectTo: requireAuth ? "/login" : null,
        user: null,
        learningProfile: null,
        diagnosticResult: null,
        errorMessage: "",
      };
    }

    const [profileResponse, diagnosticResponse] = await Promise.all([
      supabase
        .from("LearningProfile")
        .select("id, user_id, school_class, age, training_frequency, created_at")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from("DiagnosticResult")
        .select("id, user_id, score, created_at")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileResponse.error) {
      return {
        redirectTo: null,
        user: {
          id: authUser.id,
          email: authUser.email ?? null,
        },
        learningProfile: null,
        diagnosticResult: null,
        errorMessage:
          "Fehler beim Laden des Lernprofils: " + profileResponse.error.message,
      };
    }

    if (diagnosticResponse.error) {
      return {
        redirectTo: null,
        user: {
          id: authUser.id,
          email: authUser.email ?? null,
        },
        learningProfile: (profileResponse.data as RouteGuardResult["learningProfile"]) ?? null,
        diagnosticResult: null,
        errorMessage:
          "Fehler beim Laden des Ausgangstests: " + diagnosticResponse.error.message,
      };
    }

    const learningProfile =
      (profileResponse.data as RouteGuardResult["learningProfile"]) ?? null;

    const diagnosticResult =
      (diagnosticResponse.data as RouteGuardResult["diagnosticResult"]) ?? null;

    if (requireLearningProfile && !learningProfile) {
      return {
        redirectTo: "/diagnose-start",
        user: {
          id: authUser.id,
          email: authUser.email ?? null,
        },
        learningProfile,
        diagnosticResult,
        errorMessage: "",
      };
    }

    if (requireDiagnosticResult && !learningProfile) {
      return {
        redirectTo: "/diagnose-start",
        user: {
          id: authUser.id,
          email: authUser.email ?? null,
        },
        learningProfile,
        diagnosticResult,
        errorMessage: "",
      };
    }

    if (requireDiagnosticResult && learningProfile && !diagnosticResult) {
      return {
        redirectTo: "/ausgangstest",
        user: {
          id: authUser.id,
          email: authUser.email ?? null,
        },
        learningProfile,
        diagnosticResult,
        errorMessage: "",
      };
    }

    return {
      redirectTo: null,
      user: {
        id: authUser.id,
        email: authUser.email ?? null,
      },
      learningProfile,
      diagnosticResult,
      errorMessage: "",
    };
  } catch (error) {
    console.error("ROUTE GUARD ERROR:", error);

    return {
      redirectTo: null,
      user: null,
      learningProfile: null,
      diagnosticResult: null,
      errorMessage: "Unerwarteter Fehler bei der Zugriffsprüfung.",
    };
  }
}