import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type QuestRow = {
  user_id: string;
  day: number;
  completed: boolean;
  notes?: string | null;
};

// Hitungan RPG per quest
const processQuest = (q: QuestRow) => {
  const xp = q.completed ? 10 : q.notes ? 5 : 0; // 0 = not started, 5 = in progress, 10 = completed
  const level = Math.floor(q.day / 30) + 1;
  const badge = q.day % 30 === 0 && q.completed ? `Badge-${q.day}` : null;
  const turn = q.day % 4 === 0 ? 4 : q.day % 4;
  const status = q.completed ? "Completed" : q.notes ? "In Progress" : "Not Started";

  return { ...q, xp, level, badge, turn, status };
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");

  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("pmo_planner")
    .select("*")
    .eq("user_id", user_id)
    .order("day", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const processed = (data || []).map(processQuest);

  return NextResponse.json(processed);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user_id, day, completed = false, notes = "" } = body;

  if (!user_id || !day) return NextResponse.json({ error: "user_id & day required" }, { status: 400 });

  // Upsert = add / edit
  const { data, error } = await supabase
    .from("pmo_planner")
    .upsert({ user_id, day, completed, notes }, { onConflict: ["user_id", "day"] })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data || []).map(processQuest));
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  const day = searchParams.get("day");

  if (!user_id || !day) return NextResponse.json({ error: "user_id & day required" }, { status: 400 });

  const { error } = await supabase
    .from("pmo_planner")
    .delete()
    .eq("user_id", user_id)
    .eq("day", parseInt(day));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
