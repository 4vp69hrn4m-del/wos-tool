"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminClient";

type GarrisonMember = { participantId: number };
type RallyLeader = { participantId: number; usePet: boolean };
type TimeSlot = {
  id: number;
  label: string;
  garrisonLeaderVbvId: number | null;
  garrisonLeaderVbvUsePet: boolean;
  garrisonLeaderCbsId: number | null;
  garrisonLeaderCbsUsePet: boolean;
  garrisonMembers: GarrisonMember[];
  rallyLeaders: RallyLeader[];
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
  timeSlots: ParticipantSlot[];
};
type SvsRound = {
  id: number;
  roundName: string;
  status: string | null;
  timeSlots: TimeSlot[];
  participants: Participant[];
};

const presetOrder = ["21:00〜23:00", "23:00〜01:00", "01:00〜02:00"];
const ALLIANCE_COLOR = "#4ade80"; // vbv/cbs見出し共通の緑色

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

function sortBySkill(members: Participant[]) {
  return [...members].sort(
    (a, b) =>
      (b.t12ShieldSkill ?? 0) +
      (b.t12SpearSkill ?? 0) +
      (b.t12BowSkill ?? 0) -
      ((a.t12ShieldSkill ?? 0) + (a.t12SpearSkill ?? 0) + (a.t12BowSkill ?? 0))
  );
}

function orderWithLeaderFirst(
  members: Participant[],
  garrisonLeaderId: number | null,
  rallyLeaderIds: Set<number>
) {
  const garrisonLeader = members.find((m) => m.id === garrisonLeaderId);
  const rallyOnly = sortBySkill(
    members.filter((m) => m.id !== garrisonLeaderId && rallyLeaderIds.has(m.id))
  );
  const rest = sortBySkill(
    members.filter((m) => m.id !== garrisonLeaderId && !rallyLeaderIds.has(m.id))
  );
  return garrisonLeader ? [garrisonLeader, ...rallyOnly, ...rest] : [...rallyOnly, ...rest];
}

function ParticipantLine({
  p,
  garrisonLeaderUsePet,
  rallyLeader,
}: {
  p: Participant;
  garrisonLeaderUsePet?: boolean | null;
  rallyLeader?: RallyLeader | null;
}) {
  return (
    <div
      style={{
        fontSize: "0.85rem",
        marginTop: 3,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      <span style={{ fontWeight: 600 }}>・{p.playerName}</span>{" "}
      {garrisonLeaderUsePet !== null && garrisonLeaderUsePet !== undefined && (
        <span
          style={{
            color: "#38bdf8",
            fontSize: "0.7rem",
            fontWeight: 600,
            marginRight: 4,
          }}
        >
          駐屯{garrisonLeaderUsePet ? "🐱" : ""}
        </span>
      )}
      {rallyLeader && (
        <span
          style={{
            color: "#f87171",
            fontSize: "0.7rem",
            fontWeight: 600,
            marginRight: 4,
          }}
        >
          集結{rallyLeader.usePet ? "🐱" : ""}
        </span>
      )}
      {!(
        (garrisonLeaderUsePet !== null && garrisonLeaderUsePet !== undefined) ||
        rallyLeader
      ) && (
        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
          {p.hasT12
            ? `${p.t12ShieldSkill ?? "-"}/${p.t12SpearSkill ?? "-"}/${
                p.t12BowSkill ?? "-"
              }`
            : "T12なし"}
        </span>
      )}
    </div>
  );
}

export default function Home() {
  const [latestRound, setLatestRound] = useState<SvsRound | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const list = await fetch("/api/svs-rounds").then((r) => r.json());
    if (list.length === 0) {
      setLatestRound(null);
      setLoading(false);
      return;
    }
    const detail = await fetch(`/api/svs-rounds/${list[0].id}`).then((r) => r.json());
    setLatestRound(detail);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteRound(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか?(中の時間帯・参加者も全て消えます)`)) return;
    const res = await adminFetch(`/api/svs-rounds/${id}`, { method: "DELETE" });
    if (!res) return;
    await load();
  }

  return (
    <div>
      <h1>WOS 編成分析ツール(vbv.cbs.ONK専用)</h1>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>SVS用</h2>
        <p>
          <Link href="/svs">→ SVS開催回・時間帯の管理</Link>
        </p>
        <p>
          <Link href="/timer">→ 王城着弾時刻計算</Link>
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>その他</h2>
        <p>
          <a
            href="https://www.wosrewards.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            → ギフトコード自動受け取り
          </a>
        </p>
        <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
          ユーザーはギフトが欲しいアカウントのプレイヤーIDを入力するだけ(スペースを入れることで複数可)で、有効なギフトコードを一度に自動で受け取ることができます。
        </p>
      </div>

      {!loading && latestRound && (
        <>
          <h1
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span>
              直近の開催回: {latestRound.roundName}{" "}
              <Link href={`/svs/${latestRound.id}`} style={{ fontSize: "0.8rem" }}>
                (詳細を開く)
              </Link>
            </span>
            <button
              onClick={() => deleteRound(latestRound.id, latestRound.roundName)}
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
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            ↓駐屯メンバー(Garrison Members) ・ 🐱がついている人はペットを使用してください
          </p>
          {[...latestRound.timeSlots]
            .sort((a, b) => presetOrder.indexOf(a.label) - presetOrder.indexOf(b.label))
            .map((t) => {
              const garrisonIds = t.garrisonMembers.map((g) => g.participantId);
              const inSlot = latestRound.participants.filter((p) =>
                garrisonIds.includes(p.id)
              );
              const totalAvailable = latestRound.participants.filter((p) =>
                p.timeSlots.some((ps) => ps.timeSlotId === t.id)
              ).length;
              const rallyLeaderIds = new Set(t.rallyLeaders.map((r) => r.participantId));

              const vbvMembers = orderWithLeaderFirst(
                inSlot.filter((p) => p.alliance === "vbv"),
                t.garrisonLeaderVbvId,
                rallyLeaderIds
              );
              const cbsMembers = orderWithLeaderFirst(
                inSlot.filter((p) => p.alliance === "cbs"),
                t.garrisonLeaderCbsId,
                rallyLeaderIds
              );
              const otherMembers = orderWithLeaderFirst(
                inSlot.filter((p) => p.alliance !== "vbv" && p.alliance !== "cbs"),
                null,
                rallyLeaderIds
              );
              const rallyLeaderOf = (pid: number) =>
                t.rallyLeaders.find((r) => r.participantId === pid) || null;

              return (
                <div className="card" key={t.id}>
                  <strong>
                    {t.label}({totalAvailable}人)
                  </strong>
                  <span style={{ color: "#94a3b8", fontSize: "0.8rem", marginLeft: 6 }}>
                    ({toUtcLabel(t.label)})
                  </span>
                  {inSlot.length === 0 && (
                    <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                      まだ駐屯メンバーが選ばれていません。
                    </p>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      columnGap: 12,
                      marginTop: 8,
                    }}
                  >
                    {vbvMembers.length > 0 && (
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            color: ALLIANCE_COLOR,
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            borderBottom: `1px solid ${ALLIANCE_COLOR}`,
                            paddingBottom: 4,
                            marginBottom: 4,
                          }}
                        >
                          vbv({vbvMembers.length}人)
                        </div>
                        {vbvMembers.map((p) => (
                          <ParticipantLine
                            p={p}
                            key={p.id}
                            garrisonLeaderUsePet={
                              p.id === t.garrisonLeaderVbvId ? t.garrisonLeaderVbvUsePet : null
                            }
                            rallyLeader={rallyLeaderOf(p.id)}
                          />
                        ))}
                      </div>
                    )}

                    {cbsMembers.length > 0 && (
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            color: ALLIANCE_COLOR,
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            borderBottom: `1px solid ${ALLIANCE_COLOR}`,
                            paddingBottom: 4,
                            marginBottom: 4,
                          }}
                        >
                          cbs({cbsMembers.length}人)
                        </div>
                        {cbsMembers.map((p) => (
                          <ParticipantLine
                            p={p}
                            key={p.id}
                            garrisonLeaderUsePet={
                              p.id === t.garrisonLeaderCbsId ? t.garrisonLeaderCbsUsePet : null
                            }
                            rallyLeader={rallyLeaderOf(p.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {otherMembers.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>
                        未設定({otherMembers.length}人)
                      </div>
                      {otherMembers.map((p) => (
                        <ParticipantLine
                          p={p}
                          key={p.id}
                          rallyLeader={rallyLeaderOf(p.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>編成・シミュレーター用</h2>
        <p>自分と相手の編成を登録して、あとで比較・分析できるようにします。</p>
        <p>
          <Link href="/formations">→ 編成を登録する / 一覧を見る(作成中)</Link>
        </p>
        <p>
          <Link href="/master">→ 英雄・専門家・ペットのマスターデータ管理(作成中)</Link>
        </p>
        <p>
          <Link href="/simulate">→ 編成シミュレーター(簡易版)</Link>
        </p>
      </div>
    </div>
  );
}
