import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Bitte E-Mail und Passwort eingeben." },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("User")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .maybeSingle();
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "E-Mail oder Passwort ist falsch." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Login erfolgreich",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        error: "Login fehlgeschlagen",
        details: String(error),
      },
      { status: 500 }
    );
  }
}