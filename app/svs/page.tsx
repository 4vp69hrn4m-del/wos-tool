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
  result: string | null;
  timeSlots: TimeSlot[];
};

export default function SvsListPage() {
  const [rounds, setRounds] = useState<SvsRound[]>([]);
  const [roundName, setRoundName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [status, setStatus] = useState("編成準備中");

  async function loadRounds() {
    const data = await fetch("/api/svs-rounds").then((r) => r.json());
    setRounds(data);
  }

  useEffect(() => {
    loadRounds();
  }, []);

  async function addRound() {
    if (!roundName.trim()) return;
    await fetch("/api/svs-rounds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundName, eventDate, opponent, status }),
    });
    setRoundName("");
    setEventDate("");
    setOpponent("");
    setStatus("編成準備中");
    await loadRounds();
  }

  async function deleteRound(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか?(中の時間帯も全て消えます)`)) return;
    await fetch(`/api/svs-rounds/${id}`, { method: "DELETE" });
    await loadRounds();
  }

  return (
    <div>
      <h1>SVS開催回の管理</h1>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>新しい開催回を追加</h2>
        <label>開催回の名前(例: SVS 350)</label>
        <input value={roundName} onChange={(e) => setRoundName(e.target.value)} />

        <label>開催日</label>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />

        <label>対戦相手(未定なら空欄でOK)</label>
        <input value={opponent} onChange={(e) => setOpponent(e.target.value)} />

        <label>状態</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="編成準備中">編成準備中</option>
          <option value="編成確定">編成確定</option>
          <option value="開催中">開催中</option>
          <option value="終了">終了</option>
        </select>

        <button onClick={addRound}>開催回を追加</button>
      </div>

      <h1>開催回一覧</h1>
      {rounds.length === 0 && <p>まだ登録がありません。</p>}
      {rounds.map((r) => (
        <div
          className="card"
          key={r.id}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <div>
            <strong>{r.roundName}</strong>
            <div>
              開催日: {r.eventDate ? r.eventDate.slice(0, 10) : "未定"} / 対戦相手:{" "}
              {r.opponent || "未定"}
            </div>
            <div>
              状態: {r.status || "-"}
              {r.result === "win" && (
                <span style={{ color: "#38bdf8" }}> / 勝ち</span>
              )}
              {r.result === "lose" && (
                <span style={{ color: "#f87171" }}> / 負け</span>
              )}
            </div>
            <div>
              時間帯:{" "}
              {[...r.timeSlots]
                .sort(
                  (a, b) =>
                    ["21:00〜23:00", "23:00〜01:00", "01:00〜02:00"].indexOf(a.label) -
                    ["21:00〜23:00", "23:00〜01:00", "01:00〜02:00"].indexOf(b.label)
                )
                .map((t) => t.label)
                .join(" / ") || "未設定"}
            </div>
            <div style={{ marginTop: 8 }}>
              <Link href={`/svs/${r.id}`}>→ 時間帯を管理する</Link>
            </div>
          </div>
          <button
            onClick={() => deleteRound(r.id, r.roundName)}
            style={{
              padding: "4px 10px",
              fontSize: "0.8rem",
              background: "#7f1d1d",
              color: "#fecaca",
              flexShrink: 0,
            }}
          >
            削除
          </button>
        </div>
      ))}
    </div>
  );
}
