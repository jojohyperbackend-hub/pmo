import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type QuestRow = {
  user_id: string;
  day: number;
  completed: boolean;
  notes?: string | null;
};

// ==========================
// RPG PROCESSOR
// ==========================
const processQuest = (q: QuestRow) => {
  const completed = Boolean(q.completed);
  const hasNotes = Boolean(q.notes && q.notes.trim() !== "");

  const xp = completed ? 10 : hasNotes ? 5 : 0;
  const level = Math.floor(q.day / 30) + 1;
  const badge = q.day % 30 === 0 && completed ? `Badge-${q.day}` : null;
  const turn = q.day % 4 === 0 ? 4 : q.day % 4;

  const status = completed
    ? "Completed"
    : hasNotes
    ? "In Progress"
    : "Not Started";

  return {
    ...q,
    xp,
    level,
    badge,
    turn,
    status,
  };
};

// ==========================
// GET
// ==========================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("pmo_planner")
      .select("*")
      .eq("user_id", user_id)
      .order("day", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json((data || []).map(processQuest));
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}

// ==========================
// POST (ADD / UPDATE)
// ==========================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, day, completed = false, notes = "" } = body;

    if (!user_id || day === undefined) {
      return NextResponse.json(
        { error: "user_id & day required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("pmo_planner")
      .upsert(
        {
          user_id: String(user_id),
          day: Number(day),
          completed: Boolean(completed),
          notes: notes ?? "",
        },
        {
          onConflict: "user_id,day", // 🔥 FIX WAJIB STRING
        }
      )
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json((data || []).map(processQuest));
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}

// ==========================
// DELETE
// ==========================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const day = searchParams.get("day");

    if (!user_id || !day) {
      return NextResponse.json(
        { error: "user_id & day required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("pmo_planner")
      .delete()
      .eq("user_id", user_id)
      .eq("day", Number(day));

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
