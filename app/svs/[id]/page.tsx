"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LeaderInfo = { id: number; playerName: string } | null;

type TimeSlot = {
  id: number;
  label: string;
  rallyLeaderId: number | null;
  rallyLeader: LeaderInfo;
  rallyLeaderUsePet: boolean;
  garrisonLeaderId: number | null;
  garrisonLeader: LeaderInfo;
  garrisonLeaderUsePet: boolean;
  garrisonMembers: { participantId: number }[];
};
type ParticipantSlot = { timeSlotId: number; timeSlot: { id: number; label: string } };
type Participant = {
  id: number;
  playerName: string;
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
  eventDate: string | null;
  opponent: string | null;
  status: string | null;
  result: string | null;
  timeSlots: TimeSlot[];
  participants: Participant[];
};

const presetLabels = ["21:00〜23:00", "23:00〜01:00", "01:00〜02:00"];

function totalSkill(p: Participant) {
  return (p.t12ShieldSkill ?? 0) + (p.t12SpearSkill ?? 0) + (p.t12BowSkill ?? 0);
}

type LeaderDraft = {
  rallyLeaderId: string;
  rallyLeaderUsePet: boolean;
  garrisonLeaderId: string;
  garrisonLeaderUsePet: boolean;
  garrisonMemberIds: number[];
};

export default function SvsRoundDetailPage({ params }: { params: { id: string } }) {
  const [round, setRound] = useState<SvsRound | null>(null);
  const [checkedPresets, setCheckedPresets] = useState<string[]>([]);

  const [playerName, setPlayerName] = useState("");
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

  async function load() {
    const data = await fetch(`/api/svs-rounds/${params.id}`).then((r) => r.json());
    setRound(data);
    setStatusDraft(data.status || "編成準備中");
    setResultDraft(data.result || "");
    const drafts: Record<number, LeaderDraft> = {};
    for (const t of data.timeSlots as TimeSlot[]) {
      drafts[t.id] = {
        rallyLeaderId: t.rallyLeaderId ? String(t.rallyLeaderId) : "",
        rallyLeaderUsePet: t.rallyLeaderUsePet,
        garrisonLeaderId: t.garrisonLeaderId ? String(t.garrisonLeaderId) : "",
        garrisonLeaderUsePet: t.garrisonLeaderUsePet,
        garrisonMemberIds: t.garrisonMembers.map((g) => g.participantId),
      };
    }
    setLeaderDrafts(drafts);
  }

  useEffect(() => {
    load();
  }, []);

  function togglePreset(l: string) {
    setCheckedPresets((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
    );
  }

  async function addTimeSlots() {
    for (const l of checkedPresets) {
      await fetch(`/api/svs-rounds/${params.id}/time-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: l }),
      });
    }
    setCheckedPresets([]);
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

  function updateDraft(slotId: number, patch: Partial<LeaderDraft>) {
    setLeaderDrafts((prev) => ({
      ...prev,
      [slotId]: { ...prev[slotId], ...patch },
    }));
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
    await fetch(`/api/svs-time-slots/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rallyLeaderId: d.rallyLeaderId,
        rallyLeaderUsePet: d.rallyLeaderUsePet,
        garrisonLeaderId: d.garrisonLeaderId,
        garrisonLeaderUsePet: d.garrisonLeaderUsePet,
        garrisonMemberIds: d.garrisonMemberIds,
      }),
    });
    await load();
  }

  async function saveStatusAndResult() {
    await fetch(`/api/svs-rounds/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusDraft, result: resultDraft }),
    });
    await load();
  }

  if (!round) return <div>読み込み中...</div>;

  const availablePresets = presetLabels.filter(
    (l) => !round.timeSlots.some((t) => t.label === l)
  );

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

        <label>状態</label>
        <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
          <option value="編成準備中">編成準備中</option>
          <option value="編成確定">編成確定</option>
          <option value="開催中">開催中</option>
          <option value="終了">終了</option>
        </select>

        <label>勝敗</label>
        <select value={resultDraft} onChange={(e) => setResultDraft(e.target.value)}>
          <option value="">未定</option>
          <option value="win">勝ち</option>
          <option value="lose">負け</option>
        </select>

        <button onClick={saveStatusAndResult}>状態・勝敗を保存</button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>時間帯を追加</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 0 }}>
          複数選んでまとめて追加できます。
        </p>
        {availablePresets.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            3種類とも追加済みです。
          </p>
        )}
        {availablePresets.map((l) => (
          <label key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={checkedPresets.includes(l)}
              onChange={() => togglePreset(l)}
              style={{ width: "auto" }}
            />
            {l}
          </label>
        ))}
        {availablePresets.length > 0 && (
          <button onClick={addTimeSlots}>選んだ時間帯を追加</button>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>参加者登録</h2>
        <label>名前</label>
        <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} />

        <label>参加同盟</label>
        <select value={alliance} onChange={(e) => setAlliance(e.target.value)}>
          <option value="vbv">vbv</option>
          <option value="cbs">cbs</option>
        </select>

        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 12, marginBottom: 4 }}>
          参加可能な時間帯(複数選択可)
        </p>
        {round.timeSlots.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            先に上で時間帯を追加してください。
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
          rallyLeaderId: "",
          rallyLeaderUsePet: false,
          garrisonLeaderId: "",
          garrisonLeaderUsePet: false,
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
              T12合計Lv(全体) 盾
              <span style={{ color: totalAll.shield > 24 ? "#f87171" : "inherit" }}>
                {totalAll.shield}
              </span>{" "}
              / 槍
              <span style={{ color: totalAll.spear > 24 ? "#f87171" : "inherit" }}>
                {totalAll.spear}
              </span>{" "}
              / 弓
              <span style={{ color: totalAll.bow > 24 ? "#f87171" : "inherit" }}>
                {totalAll.bow}
              </span>{" "}
              /24
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
                <label>集結リーダー</label>
                <select
                  value={draft.rallyLeaderId}
                  onChange={(e) => updateDraft(t.id, { rallyLeaderId: e.target.value })}
                >
                  <option value="">(未選択)</option>
                  {inSlot.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.playerName}
                    </option>
                  ))}
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={draft.rallyLeaderUsePet}
                    onChange={(e) =>
                      updateDraft(t.id, { rallyLeaderUsePet: e.target.checked })
                    }
                    style={{ width: "auto" }}
                  />
                  ペット使用
                </label>
              </div>
              <div>
                <label>駐屯リーダー</label>
                <select
                  value={draft.garrisonLeaderId}
                  onChange={(e) => updateDraft(t.id, { garrisonLeaderId: e.target.value })}
                >
                  <option value="">(未選択)</option>
                  {inSlot.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.playerName}
                    </option>
                  ))}
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={draft.garrisonLeaderUsePet}
                    onChange={(e) =>
                      updateDraft(t.id, { garrisonLeaderUsePet: e.target.checked })
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
                      }}
                    >
                      <div>
                        <strong>{p.playerName}</strong>
                        {p.id === t.garrisonLeaderId && (
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
                        {p.id === t.rallyLeaderId && (
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
                        {p.id === t.garrisonLeaderId && (
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
                        {p.id === t.rallyLeaderId && (
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
    </div>
  );
}
