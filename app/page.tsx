"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GarrisonMember = { participantId: number };
type TimeSlot = {
  id: number;
  label: string;
  garrisonLeaderId: number | null;
  garrisonMembers: GarrisonMember[];
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

function sortBySkill(members: Participant[]) {
  return [...members].sort(
    (a, b) =>
      (b.t12ShieldSkill ?? 0) +
      (b.t12SpearSkill ?? 0) +
      (b.t12BowSkill ?? 0) -
      ((a.t12ShieldSkill ?? 0) + (a.t12SpearSkill ?? 0) + (a.t12BowSkill ?? 0))
  );
}

function orderWithLeaderFirst(members: Participant[], leaderId: number | null) {
  const leader = members.find((m) => m.id === leaderId);
  const rest = sortBySkill(members.filter((m) => m.id !== leaderId));
  return leader ? [leader, ...rest] : rest;
}

function ParticipantLine({ p, isLeader }: { p: Participant; isLeader?: boolean }) {
  return (
    <div style={{ fontSize: "0.9rem", marginTop: 6 }}>
      ・{p.playerName}
      {isLeader && (
        <span style={{ color: "#38bdf8", fontSize: "0.75rem", fontWeight: 600 }}>
          {" "}
          駐屯リーダー
        </span>
      )}
      {p.homeAlliance && (
        <span style={{ color: "#94a3b8" }}> [{p.homeAlliance}]</span>
      )}{" "}
      {p.hasT12
        ? `盾${p.t12ShieldSkill ?? "-"}/槍${p.t12SpearSkill ?? "-"}/弓${p.t12BowSkill ?? "-"}`
        : "T12なし"}
    </div>
  );
}

export default function Home() {
  const [latestRound, setLatestRound] = useState<SvsRound | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const list = await fetch("/api/svs-rounds").then((r) => r.json());
      if (list.length === 0) {
        setLoading(false);
        return;
      }
      const detail = await fetch(`/api/svs-rounds/${list[0].id}`).then((r) => r.json());
      setLatestRound(detail);
      setLoading(false);
    }
    load();
  }, []);

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

      {!loading && latestRound && (
        <>
          <h1>
            直近の開催回: {latestRound.roundName}{" "}
            <Link href={`/svs/${latestRound.id}`} style={{ fontSize: "0.8rem" }}>
              (詳細を開く)
            </Link>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            ↓駐屯メンバー(Garrison Members)
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
              const vbvMembers = orderWithLeaderFirst(
                inSlot.filter((p) => p.alliance === "vbv"),
                t.garrisonLeaderId
              );
              const cbsMembers = orderWithLeaderFirst(
                inSlot.filter((p) => p.alliance === "cbs"),
                t.garrisonLeaderId
              );
              const otherMembers = orderWithLeaderFirst(
                inSlot.filter((p) => p.alliance !== "vbv" && p.alliance !== "cbs"),
                t.garrisonLeaderId
              );

              return (
                <div className="card" key={t.id}>
                  <strong>
                    {t.label}({totalAvailable}人)
                  </strong>
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
                      <div>
                        <div style={{ color: "#38bdf8", fontSize: "0.8rem", fontWeight: 600 }}>
                          vbv({vbvMembers.length}人)
                        </div>
                        {vbvMembers.map((p) => (
                          <ParticipantLine
                            p={p}
                            key={p.id}
                            isLeader={p.id === t.garrisonLeaderId}
                          />
                        ))}
                      </div>
                    )}

                    {cbsMembers.length > 0 && (
                      <div>
                        <div style={{ color: "#38bdf8", fontSize: "0.8rem", fontWeight: 600 }}>
                          cbs({cbsMembers.length}人)
                        </div>
                        {cbsMembers.map((p) => (
                          <ParticipantLine
                            p={p}
                            key={p.id}
                            isLeader={p.id === t.garrisonLeaderId}
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
                        <ParticipantLine p={p} key={p.id} isLeader={p.id === t.garrisonLeaderId} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </>
      )}
    </div>
  );
}
