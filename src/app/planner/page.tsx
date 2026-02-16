"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

type Quest = {
  day: number;
  completed: boolean;
  notes?: string;
  xp: number;
  level: number;
  badge?: string | null;
  turn: number;
  status: "Not Started" | "In Progress" | "Completed";
};

export default function PlannerPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [day, setDay] = useState<string>("1"); // ← FIX NaN
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const router = useRouter();

  // =========================
  // FETCH
  // =========================
  const fetchQuests = async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/plan?user_id=${uid}`);
      const text = await res.text();

      try {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) return setQuests([]);

        const mapped: Quest[] = data.map((d: any) => ({
          day: d.day,
          completed: d.completed,
          notes: d.notes || "",
          xp: d.completed ? 10 : 0,
          level: Math.floor(d.day / 30) + 1,
          badge: d.day % 30 === 0 ? `Badge-${d.day}` : null,
          turn: d.day % 4 === 0 ? 4 : d.day % 4,
          status: d.completed
            ? "Completed"
            : d.notes
            ? "In Progress"
            : "Not Started",
        }));

        setQuests(mapped);
      } catch {
        console.error("Invalid JSON:", text);
        setQuests([]);
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setQuests([]);
    }
    setLoading(false);
  };

  // =========================
  // AUTH
  // =========================
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) return router.push("/");
      setUserId(u.uid);
      fetchQuests(u.uid);
    });
    return () => unsub();
  }, []);

  // =========================
  // CREATE / UPDATE
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const dayNumber = Number(day);
    if (!dayNumber || dayNumber < 1) return;

    await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        day: dayNumber,
        completed: false,
        notes,
      }),
    });

    setNotes("");
    fetchQuests(userId);
  };

  // =========================
  // COMPLETE
  // =========================
  const handleComplete = async (d: number) => {
    if (!userId) return;

    const existing = quests.find((q) => q.day === d);

    await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        day: d,
        completed: true,
        notes: existing?.notes || "",
      }),
    });

    fetchQuests(userId);
  };

  // =========================
  // DELETE (FIXED)
  // =========================
  const handleDelete = async (d: number) => {
    if (!userId) return;

    await fetch(`/api/plan?user_id=${userId}&day=${d}`, {
      method: "DELETE",
    });

    setQuests((prev) => prev.filter((q) => q.day !== d));
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white px-4 sm:px-6 py-6">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Planner</h1>

          <button
            onClick={() => router.push("/")}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
          >
            Back Dashboard
          </button>
        </header>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#171a21] border border-gray-800 rounded-2xl p-5 mb-8 space-y-4"
        >
          <div>
            <label className="text-sm opacity-70">Day</label>
            <input
              type="number"
              min={1}
              max={900}
              value={day}
              onChange={(e) => setDay(e.target.value)} // ← FIX
              className="w-full mt-1 p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>

          <div>
            <label className="text-sm opacity-70">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg">
            Save Quest
          </button>
        </form>

        {/* LIST */}
        {loading ? (
          <div className="opacity-70">Loading...</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {quests.map((q) => (
              <div
                key={q.day}
                className={`p-4 rounded-xl border ${
                  q.status === "Completed"
                    ? "bg-green-600 border-green-500"
                    : q.status === "In Progress"
                    ? "bg-yellow-600 border-yellow-500"
                    : "bg-gray-800 border-gray-700"
                }`}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-bold">Day {q.day}</span>
                  <span className="text-xs">{q.status}</span>
                </div>

                <div className="text-sm mb-3">
                  XP {q.xp} • Level {q.level} • Turn {q.turn}
                </div>

                <div className="text-sm mb-3">
                  {q.notes || "No notes"}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleComplete(q.day)}
                    className="flex-1 bg-green-800 hover:bg-green-900 py-1 rounded"
                  >
                    Complete
                  </button>

                  <button
                    onClick={() => handleDelete(q.day)}
                    className="flex-1 bg-red-600 hover:bg-red-700 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
