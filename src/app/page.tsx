"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";

type QuestNode = {
  day: number;
  completed: boolean;
  xp: number;
  level: number;
  badge?: string | null;
  turn: number;
  notes?: string;
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [nodes, setNodes] = useState<QuestNode[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchNodes = async (uid: string) => {
    try {
      const res = await fetch(`/api/plan?user_id=${uid}`, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setNodes(data);
      else setNodes([]);
    } catch {
      setNodes([]);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    if (result.user) {
      setUser(result.user);

      // cookie auth untuk middleware
      document.cookie = `pmo_auth=1; path=/; max-age=86400`;

      await fetchNodes(result.user.uid);
      router.push("/planner");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    document.cookie = "pmo_auth=; path=/; max-age=0";
    setUser(null);
    setNodes([]);
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        await fetchNodes(u.uid);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white px-4">
        <div className="bg-gray-900 p-8 rounded-xl shadow-xl text-center w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6">PMO Planner</h1>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold"
          >
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  const completedCount = nodes.filter((n) => n.completed).length;
  const totalXP = nodes.reduce((acc, n) => acc + (n.xp || 0), 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">PMO RPG Dashboard</h1>

        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm opacity-80">{user.displayName}</span>

          <button
            onClick={() => router.push("/planner")}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm"
          >
            Open Planner
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* PROGRESS */}
      <section className="mb-8 bg-gray-900 p-4 rounded-xl">
        <div className="flex flex-col md:flex-row justify-between mb-2 text-sm gap-2">
          <span>Total XP: {totalXP}</span>
          <span>
            Completed: {completedCount}/{nodes.length}
          </span>
        </div>

        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{
              width: nodes.length
                ? `${(completedCount / nodes.length) * 100}%`
                : "0%",
            }}
          />
        </div>
      </section>

      {/* RPG MAP */}
      <section>
        <h2 className="text-xl font-semibold mb-4">RPG Map</h2>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {nodes.map((n) => (
            <div
              key={n.day}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold
                ${
                  n.completed
                    ? "bg-green-600"
                    : n.notes
                    ? "bg-yellow-600"
                    : "bg-gray-800"
                }
                hover:scale-105 transition`}
              title={`Day ${n.day} | XP ${n.xp} | Level ${n.level}`}
            >
              {n.day}
              {n.badge && <span className="text-yellow-300 text-[10px]">★</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
