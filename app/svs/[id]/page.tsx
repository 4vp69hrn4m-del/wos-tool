"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TimeSlot = { id: number; label: string };
type SvsRound = {
  id: number;
  roundName: string;
  eventDate: string | null;
  opponent: string | null;
  status: string | null;
  timeSlots: TimeSlot[];
};

export default function SvsRoundDetailPage({ params }: { params: { id: string } }) {
  const [round, setRound] = useState<SvsRound | null>(null);
  const [label, setLabel] = useState("");

  async function load() {
    const data = await fetch(`/api/svs-rounds/${params.id}`).then((r) => r.json());
    setRound(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function addTimeSlot() {
    if (!label.trim()) return;
    await fetch(`/api/svs-rounds/${params.id}/time-slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    setLabel("");
    await load();
  }

  async function deleteTimeSlot(id: number, l: string) {
    if (!confirm(`「${l}」を削除しますか?`)) return;
    await fetch(`/api/svs-time-slots/${id}`, { method: "DELETE" });
    await load();
  }

  if (!round) return <div>読み込み中...</div>;

  return (
    <div>
      <p>
        <Link href="/svs">← 開催回一覧に戻る</Link>
      </p>
      <h1>{round.roundName}</h1>
      <div className="card">
        <div>開催日: {round.eventDate ? round.eventDate.slice(0, 10) : "未定"}</div>
        <div>対戦相手: {round.opponent || "未定"}</div>
        <div>状態: {round.status || "-"}</div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>時間帯を追加</h2>
        <label>時間帯(例: 21:00〜23:00)</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} />
        <button onClick={addTimeSlot}>時間帯を追加</button>
      </div>

      <h1>時間帯一覧</h1>
      {round.timeSlots.length === 0 && <p>まだ時間帯がありません。</p>}
      {round.timeSlots.map((t) => (
        <div
          className="card"
          key={t.id}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <strong>{t.label}</strong>
          <button
            onClick={() => deleteTimeSlot(t.id, t.label)}
            style={{
              padding: "4px 10px",
              fontSize: "0.8rem",
              background: "#7f1d1d",
              color: "#fecaca",
            }}
          >
            削除
          </button>
        </div>
      ))}
    </div>
  );
}
