"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TimeSlot = { id: number; label: string };
type ParticipantSlot = { timeSlotId: number; timeSlot: TimeSlot };
type Participant = {
  id: number;
  playerName: string;
  hasT12: boolean;
  t12ShieldSkill: number | null;
  t12SpearSkill: number | null;
  t12BowSkill: number | null;
  noSleepRisk: boolean;
  timeSlots: ParticipantSlot[];
};
type SvsRound = {
  id: number;
  roundName: string;
  eventDate: string | null;
  opponent: string | null;
  status: string | null;
  timeSlots: TimeSlot[];
  participants: Participant[];
};

export default function SvsRoundDetailPage({ params }: { params: { id: string } }) {
  const [round, setRound] = useState<SvsRound | null>(null);
  const [label, setLabel] = useState("");

  const [playerName, setPlayerName] = useState("");
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);
  const [hasT12, setHasT12] = useState(false);
  const [noSleepRisk, setNoSleepRisk] = useState(false);
  const [t12ShieldSkill, setT12ShieldSkill] = useState("");
  const [t12SpearSkill, setT12SpearSkill] = useState("");
  const [t12BowSkill, setT12BowSkill] = useState("");

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

  function toggleSlot(id: number) {
    setSelectedSlotIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function addParticipant() {
    if (!playerName.trim()) return;
    await fetch(`/api/svs-rounds/${params.id}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName,
        hasT12,
        t12ShieldSkill: hasT12 ? t12ShieldSkill : "",
        t12SpearSkill: hasT12 ? t12SpearSkill : "",
        t12BowSkill: hasT12 ? t12BowSkill : "",
        noSleepRisk,
        timeSlotIds: selectedSlotIds,
      }),
    });
    setPlayerName("");
    setSelectedSlotIds([]);
    setHasT12(false);
    setNoSleepRisk(false);
    setT12ShieldSkill("");
    setT12SpearSkill("");
    setT12BowSkill("");
    await load();
  }

  async function deleteParticipant(id: number, name: string) {
    if (!confirm(`「${name}」の登録を削除しますか?`)) return;
    await fetch(`/api/svs-participants/${id}`, { method: "DELETE" });
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

      <div className="card">
        <h2 style={{ marginTop: 0 }}>参加者登録</h2>
        <label>名前</label>
        <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} />

        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 12, marginBottom: 4 }}>
          参加可能な時間帯(複数選択可)
        </p>
        {round.timeSlots.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            先に上で時間帯を追加してください。
          </p>
        )}
        {round.timeSlots.map((t) => (
          <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={selectedSlotIds.includes(t.id)}
              onChange={() => toggleSlot(t.id)}
              style={{ width: "auto" }}
            />
            {t.label}
          </label>
        ))}

        <div className="row" style={{ marginTop: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={hasT12}
              onChange={(e) => setHasT12(e.target.checked)}
              style={{ width: "auto" }}
            />
            T12兵士を持っている
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={noSleepRisk}
              onChange={(e) => setNoSleepRisk(e.target.checked)}
              style={{ width: "auto" }}
            />
            寝落ちは考慮しないものとする
          </label>
        </div>

        {hasT12 && (
          <div className="row">
            <div>
              <label>盾兵スキルLv</label>
              <select
                value={t12ShieldSkill}
                onChange={(e) => setT12ShieldSkill(e.target.value)}
              >
                <option value="">(未選択)</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div>
              <label>槍兵スキルLv</label>
              <select value={t12SpearSkill} onChange={(e) => setT12SpearSkill(e.target.value)}>
                <option value="">(未選択)</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div>
              <label>弓兵スキルLv</label>
              <select value={t12BowSkill} onChange={(e) => setT12BowSkill(e.target.value)}>
                <option value="">(未選択)</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
          </div>
        )}

        <button onClick={addParticipant}>参加者を登録</button>
      </div>

      <h1>時間帯ごとの参加者</h1>
      {round.timeSlots.length === 0 && <p>まだ時間帯がありません。</p>}
      {round.timeSlots.map((t) => {
        const inSlot = round.participants.filter((p) =>
          p.timeSlots.some((ps) => ps.timeSlotId === t.id)
        );
        return (
          <div key={t.id} className="card">
            <h2 style={{ marginTop: 0 }}>
              {t.label}({inSlot.length}人)
            </h2>
            {inSlot.length === 0 && (
              <p style={{ color: "#94a3b8" }}>まだこの時間帯の参加者がいません。</p>
            )}
            {inSlot.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderTop: "1px solid #334155",
                  paddingTop: 8,
                  marginTop: 8,
                }}
              >
                <div>
                  <strong>{p.playerName}</strong>
                  {p.noSleepRisk && (
                    <span style={{ color: "#38bdf8", fontSize: "0.8rem" }}> (寝落ちなし)</span>
                  )}
                  <div>
                    T12:{" "}
                    {p.hasT12
                      ? `盾${p.t12ShieldSkill ?? "-"} / 槍${p.t12SpearSkill ?? "-"} / 弓${
                          p.t12BowSkill ?? "-"
                        }`
                      : "なし"}
                  </div>
                </div>
                <button
                  onClick={() => deleteParticipant(p.id, p.playerName)}
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
      })}
    </div>
  );
}
