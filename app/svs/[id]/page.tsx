"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminClient";

type TimeSlot = {
  id: number;
  label: string;
  rallyLeaders: { participantId: number; usePet: boolean }[];
  garrisonLeaderVbvId: number | null;
  garrisonLeaderVbvUsePet: boolean;
  garrisonLeaderCbsId: number | null;
  garrisonLeaderCbsUsePet: boolean;
  garrisonMembers: { participantId: number }[];
};
type ParticipantSlot = { timeSlotId: number; timeSlot: { id: number; label: string } };
type Participant = {
  id: number;
  playerName: string;
  homeAlliance: string | null;
  alliance: string | null;
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
  eventType: string;
  eventDate: string | null;
  opponent: string | null;
  status: string | null;
  result: string | null;
  timeSlots: TimeSlot[];
  participants: Participant[];
  rankings: { id: number; playerName: string; rank: number | null }[];
};

const presetLabels = ["21:00〜23:00", "23:00〜01:00", "01:00〜02:00"];

// ラベル(JST想定)からUTC表記を作る。例: "21:00〜23:00" → "UTC 12:00〜14:00"
function toUtcLabel(label: string): string {
  const parts = label.split("〜");
  if (parts.length !== 2) return "";
  const toUtc = (hm: string) => {
    const [h, m] = hm.split(":").map(Number);
    const utcH = (h - 9 + 24) % 24;
    return `${String(utcH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  return `UTC ${toUtc(parts[0])}〜${toUtc(parts[1])}`;
}

function totalSkill(p: Participant) {
  return (p.t12ShieldSkill ?? 0) + (p.t12SpearSkill ?? 0) + (p.t12BowSkill ?? 0);
}

type LeaderDraft = {
  rallyLeaders: { participantId: number; usePet: boolean }[];
  garrisonLeaderVbvId: string;
  garrisonLeaderVbvUsePet: boolean;
  garrisonLeaderCbsId: string;
  garrisonLeaderCbsUsePet: boolean;
  garrisonMemberIds: number[];
};

export default function SvsRoundDetailPage({ params }: { params: { id: string } }) {
  const [round, setRound] = useState<SvsRound | null>(null);

  const [playerName, setPlayerName] = useState("");
  const [registeredMessage, setRegisteredMessage] = useState(false);
  const [homeAlliance, setHomeAlliance] = useState("");
  const [alliance, setAlliance] = useState("vbv");
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);
  const [hasT12, setHasT12] = useState(false);
  const [noSleepRisk, setNoSleepRisk] = useState(false);
  const [t12ShieldSkill, setT12ShieldSkill] = useState("");
  const [t12SpearSkill, setT12SpearSkill] = useState("");
  const [t12BowSkill, setT12BowSkill] = useState("");

  const [leaderDrafts, setLeaderDrafts] = useState<Record<number, LeaderDraft>>({});

  const [statusDraft, setStatusDraft] = useState("編成準備中");
  const [resultDraft, setResultDraft] = useState("");
  const [rankingDrafts, setRankingDrafts] = useState<{ name: string; rank: string }[]>(
    Array.from({ length: 5 }, () => ({ name: "", rank: "" }))
  );

  async function load() {
    const data = await fetch(`/api/svs-rounds/${params.id}`).then((r) => r.json());
    setRound(data);
    setStatusDraft(data.status || "編成準備中");
    setResultDraft(data.result || "");
    const drafts: Record<number, LeaderDraft> = {};
    for (const t of data.timeSlots as TimeSlot[]) {
      drafts[t.id] = {
        rallyLeaders: t.rallyLeaders.map((r) => ({
          participantId: r.participantId,
          usePet: r.usePet,
        })),
        garrisonLeaderVbvId: t.garrisonLeaderVbvId ? String(t.garrisonLeaderVbvId) : "",
        garrisonLeaderVbvUsePet: t.garrisonLeaderVbvUsePet,
        garrisonLeaderCbsId: t.garrisonLeaderCbsId ? String(t.garrisonLeaderCbsId) : "",
        garrisonLeaderCbsUsePet: t.garrisonLeaderCbsUsePet,
        garrisonMemberIds: t.garrisonMembers.map((g) => g.participantId),
      };
    }
    setLeaderDrafts(drafts);
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteTimeSlot(id: number, l: string) {
    if (!confirm(`「${l}」を削除しますか?`)) return;
    const res = await adminFetch(`/api/svs-time-slots/${id}`, { method: "DELETE" });
    if (!res) return;
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
        homeAlliance,
        alliance,
        hasT12,
        t12ShieldSkill: hasT12 ? t12ShieldSkill : "",
        t12SpearSkill: hasT12 ? t12SpearSkill : "",
        t12BowSkill: hasT12 ? t12BowSkill : "",
        noSleepRisk,
        timeSlotIds: selectedSlotIds,
      }),
    });
    setPlayerName("");
    setHomeAlliance("");
    setSelectedSlotIds([]);
    setHasT12(false);
    setNoSleepRisk(false);
    setT12ShieldSkill("");
    setT12SpearSkill("");
    setT12BowSkill("");
    await load();
    setRegisteredMessage(true);
    setTimeout(() => setRegisteredMessage(false), 3000);
  }

  async function deleteParticipant(id: number, name: string) {
    if (!confirm(`「${name}」の登録を削除しますか?`)) return;
    const res = await adminFetch(`/api/svs-participants/${id}`, { method: "DELETE" });
    if (!res) return;
    await load();
  }

  async function moveAlliance(id: number, toAlliance: "vbv" | "cbs") {
    const res = await adminFetch(`/api/svs-participants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alliance: toAlliance }),
    });
    if (!res) return;
    await load();
  }

  function updateDraft(slotId: number, patch: Partial<LeaderDraft>) {
    setLeaderDrafts((prev) => ({
      ...prev,
      [slotId]: { ...prev[slotId], ...patch },
    }));
  }

  function toggleRallyLeader(slotId: number, participantId: number) {
    setLeaderDrafts((prev) => {
      const current = prev[slotId]?.rallyLeaders || [];
      const isSelected = current.some((r) => r.participantId === participantId);
      const next = isSelected
        ? current.filter((r) => r.participantId !== participantId)
        : [...current, { participantId, usePet: false }];
      return {
        ...prev,
        [slotId]: { ...prev[slotId], rallyLeaders: next },
      };
    });
  }

  function updateRallyLeaderUsePet(slotId: number, participantId: number, usePet: boolean) {
    setLeaderDrafts((prev) => {
      const current = prev[slotId]?.rallyLeaders || [];
      const next = current.map((r) =>
        r.participantId === participantId ? { ...r, usePet } : r
      );
      return {
        ...prev,
        [slotId]: { ...prev[slotId], rallyLeaders: next },
      };
    });
  }

  function toggleGarrisonMember(slotId: number, participant: Participant) {
    setLeaderDrafts((prev) => {
      const current = prev[slotId]?.garrisonMemberIds || [];
      const isSelected = current.includes(participant.id);
      if (!isSelected) {
        const sameAllianceCount = current.filter((id) => {
          const rp = round?.participants.find((x) => x.id === id);
          return rp && rp.alliance === participant.alliance;
        }).length;
        if (sameAllianceCount >= 12) {
          alert(`${participant.alliance || "未設定"}は最大12人までです。`);
          return prev;
        }
      }
      const next = isSelected
        ? current.filter((id) => id !== participant.id)
        : [...current, participant.id];
      return {
        ...prev,
        [slotId]: { ...prev[slotId], garrisonMemberIds: next },
      };
    });
  }

  async function saveLeaders(slotId: number) {
    const d = leaderDrafts[slotId];
    const res = await adminFetch(`/api/svs-time-slots/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rallyLeaders: d.rallyLeaders,
        garrisonLeaderVbvId: d.garrisonLeaderVbvId,
        garrisonLeaderVbvUsePet: d.garrisonLeaderVbvUsePet,
        garrisonLeaderCbsId: d.garrisonLeaderCbsId,
        garrisonLeaderCbsUsePet: d.garrisonLeaderCbsUsePet,
        garrisonMemberIds: d.garrisonMemberIds,
      }),
    });
    if (!res) return;
    await load();
  }

  async function saveStatusAndResult() {
    const res = await adminFetch(`/api/svs-rounds/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusDraft, result: resultDraft }),
    });
    if (!res) return;
    await load();
  }

  function updateRankingDraft(index: number, key: "name" | "rank", value: string) {
    setRankingDrafts((drafts) => {
      const next = [...drafts];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  async function saveRanking(index: number) {
    const draft = rankingDrafts[index];
    if (!draft.name.trim()) return;
    const res = await adminFetch("/api/svs-rankings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        svsRoundId: params.id,
        playerName: draft.name,
        rank: draft.rank,
      }),
    });
    if (!res) return;
    setRankingDrafts((drafts) => {
      const next = [...drafts];
      next[index] = { name: "", rank: "" };
      return next;
    });
    await load();
  }

  async function deleteRanking(id: number, name: string) {
    if (!confirm(`「${name}」のランキング登録を削除しますか?`)) return;
    const res = await adminFetch(`/api/svs-rankings/${id}`, { method: "DELETE" });
    if (!res) return;
    await load();
  }

  if (!round) return <div>読み込み中...</div>;

  const sortedTimeSlots = [...round.timeSlots].sort(
    (a, b) => presetLabels.indexOf(a.label) - presetLabels.indexOf(b.label)
  );

  return (
    <div>
      <p>
        <Link href="/svs">← 開催回一覧に戻る</Link>
      </p>
      <h1>{round.roundName}</h1>
      <div className="card">
        <div>開催日: {round.eventDate ? round.eventDate.slice(0, 10) : "未定"}</div>
        <div>対戦相手: {round.opponent || "未定"}</div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>参加者登録 / Register</h2>
        <label>名前 / Name</label>
        <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} />

        <label>所属同盟(実際に入っている同盟名) / Home Alliance (your real alliance)</label>
        <input value={homeAlliance} onChange={(e) => setHomeAlliance(e.target.value)} />

        <label>
          参加希望同盟(今回vbv/cbsどちらとして参加するか) / Alliance for this SVS (vbv or cbs)
        </label>
        <select value={alliance} onChange={(e) => setAlliance(e.target.value)}>
          <option value="vbv">vbv</option>
          <option value="cbs">cbs</option>
        </select>

        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 12, marginBottom: 4 }}>
          参加可能な時間帯(複数選択可) / Available time slots (select multiple)
        </p>
        {round.timeSlots.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            先に上で時間帯を追加してください。 / Please add a time slot above first.
          </p>
        )}
        {sortedTimeSlots.map((t) => (
          <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={selectedSlotIds.includes(t.id)}
              onChange={() => toggleSlot(t.id)}
              style={{ width: "auto" }}
            />
            {t.label}
            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>({toUtcLabel(t.label)})</span>
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
            T12兵士を持っている / I have T12 troops
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={noSleepRisk}
              onChange={(e) => setNoSleepRisk(e.target.checked)}
              style={{ width: "auto" }}
            />
            寝落ちはしません / I will not fall asleep
          </label>
        </div>

        {hasT12 && (
          <div className="row">
            <div>
              <label>盾兵スキルLv / Shield skill Lv</label>
              <select
                value={t12ShieldSkill}
                onChange={(e) => setT12ShieldSkill(e.target.value)}
              >
                <option value="">(未選択 / none)</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div>
              <label>槍兵スキルLv / Spear skill Lv</label>
              <select value={t12SpearSkill} onChange={(e) => setT12SpearSkill(e.target.value)}>
                <option value="">(未選択 / none)</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div>
              <label>弓兵スキルLv / Bow skill Lv</label>
              <select value={t12BowSkill} onChange={(e) => setT12BowSkill(e.target.value)}>
                <option value="">(未選択 / none)</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
          </div>
        )}

        <button onClick={addParticipant}>参加者を登録 / Register</button>
        {registeredMessage && (
          <span style={{ color: "#4ade80", marginLeft: 8, fontSize: "0.9rem" }}>
            登録されました!
          </span>
        )}
      </div>

      <h1>時間帯ごとの参加者・リーダー設定</h1>
      {round.timeSlots.length === 0 && <p>まだ時間帯がありません。</p>}
      {sortedTimeSlots.map((t) => {
        const inSlot = round.participants.filter((p) =>
          p.timeSlots.some((ps) => ps.timeSlotId === t.id)
        );
        const t12Members = inSlot.filter((p) => p.hasT12);
        const sumStats = (members: Participant[]) => ({
          shield: members.reduce((sum, p) => sum + (p.t12ShieldSkill ?? 0), 0),
          spear: members.reduce((sum, p) => sum + (p.t12SpearSkill ?? 0), 0),
          bow: members.reduce((sum, p) => sum + (p.t12BowSkill ?? 0), 0),
        });
        const totalAll = sumStats(t12Members);
        const totalVbv = sumStats(t12Members.filter((p) => p.alliance === "vbv"));
        const totalCbs = sumStats(t12Members.filter((p) => p.alliance === "cbs"));
        const draft = leaderDrafts[t.id] || {
          rallyLeaders: [],
          garrisonLeaderVbvId: "",
          garrisonLeaderVbvUsePet: false,
          garrisonLeaderCbsId: "",
          garrisonLeaderCbsUsePet: false,
          garrisonMemberIds: [],
        };

        return (
          <div key={t.id} className="card">
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <h2 style={{ marginTop: 0 }}>
                {t.label}({inSlot.length}人)
              </h2>
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

            <div style={{ color: "#38bdf8", fontSize: "0.9rem", marginBottom: 4 }}>
              T12合計Lv(全体) 盾{totalAll.shield} / 槍{totalAll.spear} / 弓{totalAll.bow}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: 2 }}>
              vbv: 盾
              <span style={{ color: totalVbv.shield > 24 ? "#f87171" : "inherit" }}>
                {totalVbv.shield}
              </span>{" "}
              / 槍
              <span style={{ color: totalVbv.spear > 24 ? "#f87171" : "inherit" }}>
                {totalVbv.spear}
              </span>{" "}
              / 弓
              <span style={{ color: totalVbv.bow > 24 ? "#f87171" : "inherit" }}>
                {totalVbv.bow}
              </span>{" "}
              /24
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: 8 }}>
              cbs: 盾
              <span style={{ color: totalCbs.shield > 24 ? "#f87171" : "inherit" }}>
                {totalCbs.shield}
              </span>{" "}
              / 槍
              <span style={{ color: totalCbs.spear > 24 ? "#f87171" : "inherit" }}>
                {totalCbs.spear}
              </span>{" "}
              / 弓
              <span style={{ color: totalCbs.bow > 24 ? "#f87171" : "inherit" }}>
                {totalCbs.bow}
              </span>{" "}
              /24
            </div>

            <div className="row">
              <div>
                <label>集結(vbv・複数可)</label>
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: "auto",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    padding: "4px 8px",
                  }}
                >
                  {inSlot
                    .filter((p) => p.alliance === "vbv")
                    .map((p) => {
                      const rl = draft.rallyLeaders.find((r) => r.participantId === p.id);
                      return (
                        <label
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "0.85rem",
                            padding: "3px 0",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!rl}
                            onChange={() => toggleRallyLeader(t.id, p.id)}
                            style={{ width: "auto" }}
                          />
                          <span
                            style={{
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.playerName}
                          </span>
                          {rl && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                fontSize: "0.75rem",
                                color: "#94a3b8",
                                flexShrink: 0,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={rl.usePet}
                                onChange={(e) =>
                                  updateRallyLeaderUsePet(t.id, p.id, e.target.checked)
                                }
                                style={{ width: "auto" }}
                              />
                              🐱
                            </span>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>
              <div>
                <label>集結(cbs・複数可)</label>
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: "auto",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    padding: "4px 8px",
                  }}
                >
                  {inSlot
                    .filter((p) => p.alliance === "cbs")
                    .map((p) => {
                      const rl = draft.rallyLeaders.find((r) => r.participantId === p.id);
                      return (
                        <label
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "0.85rem",
                            padding: "3px 0",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!rl}
                            onChange={() => toggleRallyLeader(t.id, p.id)}
                            style={{ width: "auto" }}
                          />
                          <span
                            style={{
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.playerName}
                          </span>
                          {rl && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                fontSize: "0.75rem",
                                color: "#94a3b8",
                                flexShrink: 0,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={rl.usePet}
                                onChange={(e) =>
                                  updateRallyLeaderUsePet(t.id, p.id, e.target.checked)
                                }
                                style={{ width: "auto" }}
                              />
                              🐱
                            </span>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="row">
              <div>
                <label>駐屯(vbv・1人)</label>
                <select
                  value={draft.garrisonLeaderVbvId}
                  onChange={(e) => updateDraft(t.id, { garrisonLeaderVbvId: e.target.value })}
                >
                  <option value="">(未選択)</option>
                  {inSlot
                    .filter((p) => p.alliance === "vbv")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.playerName}
                      </option>
                    ))}
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={draft.garrisonLeaderVbvUsePet}
                    onChange={(e) =>
                      updateDraft(t.id, { garrisonLeaderVbvUsePet: e.target.checked })
                    }
                    style={{ width: "auto" }}
                  />
                  ペット使用
                </label>
              </div>
              <div>
                <label>駐屯(cbs・1人)</label>
                <select
                  value={draft.garrisonLeaderCbsId}
                  onChange={(e) => updateDraft(t.id, { garrisonLeaderCbsId: e.target.value })}
                >
                  <option value="">(未選択)</option>
                  {inSlot
                    .filter((p) => p.alliance === "cbs")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.playerName}
                      </option>
                    ))}
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={draft.garrisonLeaderCbsUsePet}
                    onChange={(e) =>
                      updateDraft(t.id, { garrisonLeaderCbsUsePet: e.target.checked })
                    }
                    style={{ width: "auto" }}
                  />
                  ペット使用
                </label>
              </div>
            </div>

            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 16, marginBottom: 4 }}>
              駐屯メンバー選択(vbv・cbsそれぞれ最大12人、合計上限は24)
            </p>
            {(["vbv", "cbs"] as const).map((allianceKey) => {
              const members = inSlot
                .filter((p) => p.alliance === allianceKey)
                .sort((a, b) => totalSkill(b) - totalSkill(a));
              if (members.length === 0) return null;
              const selectedCount = draft.garrisonMemberIds.filter((id) =>
                members.some((m) => m.id === id)
              ).length;
              return (
                <div key={allianceKey} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      color: "#38bdf8",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      marginTop: 8,
                    }}
                  >
                    {allianceKey}({selectedCount}/12人)
                  </div>
                  <div
                    style={{
                      maxHeight: 200,
                      overflowY: "auto",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      padding: "4px 8px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        columnGap: 12,
                      }}
                    >
                      {members.map((p) => (
                        <label
                          key={p.id}
                          style={{ display: "flex", alignItems: "center", gap: 6 }}
                        >
                          <input
                            type="checkbox"
                            checked={draft.garrisonMemberIds.includes(p.id)}
                            onChange={() => toggleGarrisonMember(t.id, p)}
                            style={{ width: "auto" }}
                          />
                          <span style={{ fontSize: "0.9rem" }}>
                            {p.playerName}
                            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                              (
                              {p.hasT12
                                ? `盾${p.t12ShieldSkill ?? "-"}/槍${
                                    p.t12SpearSkill ?? "-"
                                  }/弓${p.t12BowSkill ?? "-"}`
                                : "T12なし"}
                              )
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {(() => {
              const unset = inSlot
                .filter((p) => p.alliance !== "vbv" && p.alliance !== "cbs")
                .sort((a, b) => totalSkill(b) - totalSkill(a));
              if (unset.length === 0) return null;
              return (
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      marginTop: 8,
                    }}
                  >
                    未設定
                  </div>
                  <div
                    style={{
                      maxHeight: 200,
                      overflowY: "auto",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      padding: "4px 8px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        columnGap: 12,
                      }}
                    >
                      {unset.map((p) => (
                        <label
                          key={p.id}
                          style={{ display: "flex", alignItems: "center", gap: 6 }}
                        >
                          <input
                            type="checkbox"
                            checked={draft.garrisonMemberIds.includes(p.id)}
                            onChange={() => toggleGarrisonMember(t.id, p)}
                            style={{ width: "auto" }}
                          />
                          <span style={{ fontSize: "0.9rem" }}>
                            {p.playerName}
                            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                              (
                              {p.hasT12
                                ? `盾${p.t12ShieldSkill ?? "-"}/槍${
                                    p.t12SpearSkill ?? "-"
                                  }/弓${p.t12BowSkill ?? "-"}`
                                : "T12なし"}
                              )
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <button onClick={() => saveLeaders(t.id)} style={{ marginTop: 12 }}>
              設定を保存
            </button>

            {inSlot.length === 0 && (
              <p style={{ color: "#94a3b8", marginTop: 16 }}>
                まだこの時間帯の参加者がいません。
              </p>
            )}

            {(["vbv", "cbs"] as const).map((allianceKey) => {
              const members = inSlot
                .filter((p) => p.alliance === allianceKey)
                .sort((a, b) => totalSkill(b) - totalSkill(a));
              if (members.length === 0) return null;
              return (
                <div key={allianceKey} style={{ marginTop: 16 }}>
                  <div
                    style={{
                      color: "#38bdf8",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {allianceKey}({members.length}人)
                  </div>
                  <div
                    style={{
                      maxHeight: 320,
                      overflowY: "auto",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      padding: "0 8px",
                    }}
                  >
                    {members.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          borderTop: "1px solid #334155",
                          paddingTop: 8,
                          marginTop: 8,
                          paddingBottom: 8,
                        }}
                      >
                        <div>
                          <strong>{p.playerName}</strong>
                          {p.homeAlliance && (
                            <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                              {" "}
                              [{p.homeAlliance}]
                            </span>
                          )}
                          {(p.id === t.garrisonLeaderVbvId ||
                            p.id === t.garrisonLeaderCbsId) && (
                            <span
                              style={{
                                color: "#38bdf8",
                                fontSize: "0.75rem",
                                marginLeft: 6,
                                fontWeight: 600,
                              }}
                            >
                              駐屯リーダー
                            </span>
                          )}
                          {t.rallyLeaders.some((r) => r.participantId === p.id) && (
                            <span
                              style={{
                                color: "#f87171",
                                fontSize: "0.75rem",
                                marginLeft: 6,
                                fontWeight: 600,
                              }}
                            >
                              集結リーダー
                            </span>
                          )}
                          {t.garrisonMembers.some((g) => g.participantId === p.id) && (
                            <span
                              style={{
                                color: "#94a3b8",
                                fontSize: "0.75rem",
                                marginLeft: 6,
                                fontWeight: 600,
                              }}
                            >
                              駐屯
                            </span>
                          )}
                          {p.noSleepRisk && (
                            <span style={{ color: "#38bdf8", fontSize: "0.8rem" }}>
                              {" "}
                              寝落ちなし
                            </span>
                          )}
                          <div>
                            T12:{" "}
                            {p.hasT12
                              ? `盾${p.t12ShieldSkill ?? "-"} / 槍${
                                  p.t12SpearSkill ?? "-"
                                } / 弓${p.t12BowSkill ?? "-"}`
                              : "なし"}
                          </div>
                        </div>
                        <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => moveAlliance(p.id, allianceKey === "vbv" ? "cbs" : "vbv")}
                            style={{
                              padding: "4px 10px",
                              fontSize: "0.8rem",
                              background: "transparent",
                              color: "#94a3b8",
                              border: "1px solid #334155",
                            }}
                          >
                            → {allianceKey === "vbv" ? "cbs" : "vbv"}
                          </button>
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
                            ✕
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {inSlot.filter((p) => p.alliance !== "vbv" && p.alliance !== "cbs").length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  未設定
                </div>
                {inSlot
                  .filter((p) => p.alliance !== "vbv" && p.alliance !== "cbs")
                  .sort((a, b) => totalSkill(b) - totalSkill(a))
                  .map((p) => (
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
                        {p.homeAlliance && (
                          <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                            {" "}
                            [{p.homeAlliance}]
                          </span>
                        )}
                        {(p.id === t.garrisonLeaderVbvId || p.id === t.garrisonLeaderCbsId) && (
                          <span
                            style={{
                              color: "#38bdf8",
                              fontSize: "0.75rem",
                              marginLeft: 6,
                              fontWeight: 600,
                            }}
                          >
                            駐屯リーダー
                          </span>
                        )}
                        {t.rallyLeaders.some((r) => r.participantId === p.id) && (
                          <span
                            style={{
                              color: "#f87171",
                              fontSize: "0.75rem",
                              marginLeft: 6,
                              fontWeight: 600,
                            }}
                          >
                            集結リーダー
                          </span>
                        )}
                        {t.garrisonMembers.some((g) => g.participantId === p.id) && (
                          <span
                            style={{
                              color: "#94a3b8",
                              fontSize: "0.75rem",
                              marginLeft: 6,
                              fontWeight: 600,
                            }}
                          >
                            駐屯
                          </span>
                        )}
                        {p.noSleepRisk && (
                          <span style={{ color: "#38bdf8", fontSize: "0.8rem" }}>
                            {" "}
                            寝落ちなし
                          </span>
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
            )}
          </div>
        );
      })}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>状態・{round.eventType === "霜竜" ? "個人ランキング" : "勝敗"}</h2>
        <label>状態</label>
        <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
          <option value="編成準備中">編成準備中</option>
          <option value="編成確定">編成確定</option>
          <option value="開催中">開催中</option>
          <option value="終了">終了</option>
        </select>

        {round.eventType === "霜竜" ? (
          <>
            {round.rankings.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {[...round.rankings]
                  .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
                  .map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 0",
                        borderBottom: "1px solid var(--border)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <div>
                        {r.rank ? `${r.rank}位` : "順位未設定"} - {r.playerName}
                      </div>
                      <button
                        onClick={() => deleteRanking(r.id, r.playerName)}
                        style={{
                          marginTop: 0,
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
            )}

            <label style={{ marginTop: 16 }}>ランキングを追加</label>
            {rankingDrafts.map((draft, i) => (
              <div className="row" key={i} style={{ marginTop: 6 }}>
                <input
                  placeholder="名前"
                  value={draft.name}
                  onChange={(e) => updateRankingDraft(i, "name", e.target.value)}
                />
                <input
                  placeholder="何位"
                  value={draft.rank}
                  onChange={(e) => updateRankingDraft(i, "rank", e.target.value)}
                  style={{ maxWidth: 80 }}
                />
                <button onClick={() => saveRanking(i)} style={{ marginTop: 0 }}>
                  追加
                </button>
              </div>
            ))}
          </>
        ) : (
          <>
            <label>勝敗</label>
            <select value={resultDraft} onChange={(e) => setResultDraft(e.target.value)}>
              <option value="">未定</option>
              <option value="win">勝ち</option>
              <option value="lose">負け</option>
            </select>
          </>
        )}

        <button onClick={saveStatusAndResult}>状態{round.eventType === "霜竜" ? "" : "・勝敗"}を保存</button>
      </div>
    </div>
  );
}
