"use client";

import { useState } from "react";
import Link from "next/link";

// ヴァレリアのスキルレベルごとの、ステップポイント獲得量ボーナス(%)
// レベル1〜10。ゲーム内の表を元にした固定値。
const VALERIA_BONUS_BY_LEVEL: Record<number, number> = {
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16,
  9: 18,
  10: 20,
};

// 氷原の巨獣1頭あたりの基本情報(ボーナス無し)
const BASE_POINTS_PER_BEAST = 30000; // 集結を発起して1頭狩った時の基本ポイント
const STAMINA_PER_BEAST = 25; // 1頭狩るのに必要な体力
const STAMINA_PER_CAN = 20; // 体力缶1個あたりの体力回復量

export default function SvsPointsPage() {
  const [valeriaLevel, setValeriaLevel] = useState<number>(0); // 0 = 未所持/未選択
  const [cans, setCans] = useState<string>("");

  const bonusPct = VALERIA_BONUS_BY_LEVEL[valeriaLevel] || 0;
  const canCount = Number(cans) || 0;
  const totalStamina = canCount * STAMINA_PER_CAN;
  const beastKills = Math.floor(totalStamina / STAMINA_PER_BEAST);
  const pointsPerBeast = BASE_POINTS_PER_BEAST * (1 + bonusPct / 100);
  const totalPoints = Math.round(beastKills * pointsPerBeast);
  const leftoverStamina = totalStamina - beastKills * STAMINA_PER_BEAST;

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <p>
        <Link href="/">🏠 ホームに戻る</Link>
      </p>
      <h1>SVSポイント計算(氷原の巨獣狩り)</h1>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
        持っている体力缶の数から、氷原の巨獣を何頭狩れて、獲得ポイントがどれくらいになるかを計算します。
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <label>ヴァレリアのスキルレベル(ステップポイント獲得量ボーナス)</label>
        <select value={valeriaLevel} onChange={(e) => setValeriaLevel(Number(e.target.value))}>
          <option value={0}>未所持 / 選択なし(ボーナスなし)</option>
          {Object.entries(VALERIA_BONUS_BY_LEVEL).map(([lv, pct]) => (
            <option key={lv} value={lv}>
              Lv.{lv}(+{pct}%)
            </option>
          ))}
        </select>

        <label style={{ marginTop: 16, display: "block" }}>体力缶の数(1個=体力{STAMINA_PER_CAN})</label>
        <input
          type="number"
          min={0}
          value={cans}
          onChange={(e) => setCans(e.target.value)}
          placeholder="例: 30"
        />
      </div>

      {canCount > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>計算結果</h3>
          <p>
            合計体力: {totalStamina.toLocaleString()}(体力缶{canCount}個 × {STAMINA_PER_CAN})
          </p>
          <p>
            氷原の巨獣を狩れる回数: <strong>{beastKills.toLocaleString()}頭</strong>
            (1頭あたり体力{STAMINA_PER_BEAST}消費、余り体力{leftoverStamina})
          </p>
          <p>
            1頭あたりの獲得ポイント: {BASE_POINTS_PER_BEAST.toLocaleString()} × (1 + {bonusPct}%) ={" "}
            {pointsPerBeast.toLocaleString()}
          </p>
          <p style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#4ade80" }}>
            予想獲得ポイント合計: {totalPoints.toLocaleString()}ポイント
          </p>
        </div>
      )}

      <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: 16 }}>
        ※ 基本ポイント(1頭30,000)・消費体力(25)・ヴァレリアのボーナス%は実測値をもとにした固定値です。仕様変更があれば更新してください。
      </p>
    </main>
  );
}
