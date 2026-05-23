import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(
      { status: "error", message: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("workshop_test").select("*").limit(10);

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "ok", rows: data });
}
