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
const STAMINA_PER_CAN = 10; // 体力缶1個あたりの体力回復量

// 兵士訓練で1人あたり獲得できるポイント(レベル別、実測値)
// 昇格のポイントは「昇格後レベルの訓練ポイント − 昇格前レベルの訓練ポイント」で計算される
const TRAINING_POINTS_BY_LEVEL: Record<number, number> = {
  10: 64.8,
  11: 81.0,
  12: 101.5,
};
const TROOP_LEVELS = Object.keys(TRAINING_POINTS_BY_LEVEL).map(Number).sort((a, b) => a - b);

function Day3Beast() {
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
    <>
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
    </>
  );
}

// 訓練・昇格それぞれの、1人あたりの所要時間(秒)と資源消費(実測値・弓兵の例、レベル別)
const TRAIN_RATE_BY_LEVEL: Record<number, { secPerTroop: number; food: number; wood: number; ore: number; crystal: number }> = {
  11: { secPerTroop: 180, food: 3486, wood: 5159, ore: 865, crystal: 280 },
  12: { secPerTroop: 215, food: 5617, wood: 8329, ore: 1356, crystal: 453 },
};
const PROMOTE_SEC_PER_TROOP = 9.4035; // 昇格(T11→T12)
const PROMOTE_RESOURCE_PER_TROOP = { food: 2176, wood: 3216, ore: 536, crystal: 168 };

function Day4Training() {
  const [inputMode, setInputMode] = useState<"count" | "speedup">("speedup");
  const [mode, setMode] = useState<"train" | "promote">("train");
  const [trainLevel, setTrainLevel] = useState<number>(12);
  const [fromLevel, setFromLevel] = useState<number>(11);
  const [toLevel, setToLevel] = useState<number>(12);
  const [count, setCount] = useState<string>("");
  const [speedupDays, setSpeedupDays] = useState<string>("");
  const [speedupHours, setSpeedupHours] = useState<string>("");
  const [speedupMinutes, setSpeedupMinutes] = useState<string>("");
  const [valeriaLevel, setValeriaLevel] = useState<number>(0); // 0 = 未所持/選択なし

  const bonusPct = VALERIA_BONUS_BY_LEVEL[valeriaLevel] || 0;

  const trainRate = TRAIN_RATE_BY_LEVEL[trainLevel] || TRAIN_RATE_BY_LEVEL[12];
  const secPerTroop = mode === "train" ? trainRate.secPerTroop : PROMOTE_SEC_PER_TROOP;
  const resourcePerTroop = mode === "train" ? trainRate : PROMOTE_RESOURCE_PER_TROOP;

  const totalSpeedupSeconds =
    (Number(speedupDays) || 0) * 86400 +
    (Number(speedupHours) || 0) * 3600 +
    (Number(speedupMinutes) || 0) * 60;

  const troopCount =
    inputMode === "count" ? Number(count) || 0 : Math.floor(totalSpeedupSeconds / secPerTroop);

  const trainPointsPer = (TRAINING_POINTS_BY_LEVEL[trainLevel] || 0) * (1 + bonusPct / 100);
  const trainTotal = Math.round(troopCount * trainPointsPer * 10) / 10;

  const promotePointsPer =
    ((TRAINING_POINTS_BY_LEVEL[toLevel] || 0) - (TRAINING_POINTS_BY_LEVEL[fromLevel] || 0)) *
    (1 + bonusPct / 100);
  const promoteTotal = Math.round(troopCount * promotePointsPer * 10) / 10;

  const totalResource = {
    food: Math.round(troopCount * resourcePerTroop.food),
    wood: Math.round(troopCount * resourcePerTroop.wood),
    ore: Math.round(troopCount * resourcePerTroop.ore),
    crystal: Math.round(troopCount * resourcePerTroop.crystal),
  };

  return (
    <>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
        新規訓練、または既存兵士の昇格で獲得できるポイント・必要資源を計算します。
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

        <label style={{ marginTop: 16, display: "block" }}>入力方法</label>
        <select value={inputMode} onChange={(e) => setInputMode(e.target.value as "count" | "speedup")}>
          <option value="speedup">持っている加速アイテムの時間から計算</option>
          <option value="count">人数を直接入力</option>
        </select>

        <label style={{ marginTop: 16, display: "block" }}>種類</label>
        <select value={mode} onChange={(e) => setMode(e.target.value as "train" | "promote")}>
          <option value="train">新規訓練</option>
          <option value="promote">昇格(T11→T12、約9.4秒/人)</option>
        </select>

        {mode === "train" ? (
          <>
            <label style={{ marginTop: 16, display: "block" }}>訓練する兵士のレベル</label>
            <select value={trainLevel} onChange={(e) => setTrainLevel(Number(e.target.value))}>
              {TROOP_LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  T{lv}(1人{TRAINING_POINTS_BY_LEVEL[lv]}ポイント
                  {TRAIN_RATE_BY_LEVEL[lv] ? `・${TRAIN_RATE_BY_LEVEL[lv].secPerTroop}秒/人` : ""})
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label style={{ marginTop: 16, display: "block" }}>昇格前のレベル</label>
            <select value={fromLevel} onChange={(e) => setFromLevel(Number(e.target.value))}>
              {TROOP_LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  T{lv}
                </option>
              ))}
            </select>

            <label style={{ marginTop: 16, display: "block" }}>昇格後のレベル</label>
            <select value={toLevel} onChange={(e) => setToLevel(Number(e.target.value))}>
              {TROOP_LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  T{lv}
                </option>
              ))}
            </select>
          </>
        )}

        {inputMode === "count" ? (
          <>
            <label style={{ marginTop: 16, display: "block" }}>
              {mode === "train" ? "訓練する人数" : "昇格させる人数"}
            </label>
            <input
              type="number"
              min={0}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="例: 1000"
            />
          </>
        ) : (
          <>
            <label style={{ marginTop: 16, display: "block" }}>持っている加速アイテムの合計時間</label>
            <div className="row">
              <div>
                <input
                  type="number"
                  min={0}
                  value={speedupDays}
                  onChange={(e) => setSpeedupDays(e.target.value)}
                  placeholder="日"
                />
              </div>
              <div>
                <input
                  type="number"
                  min={0}
                  value={speedupHours}
                  onChange={(e) => setSpeedupHours(e.target.value)}
                  placeholder="時間"
                />
              </div>
              <div>
                <input
                  type="number"
                  min={0}
                  value={speedupMinutes}
                  onChange={(e) => setSpeedupMinutes(e.target.value)}
                  placeholder="分"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {troopCount > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>計算結果</h3>
          {inputMode === "speedup" && (
            <p>
              加速時間 合計{Math.floor(totalSpeedupSeconds / 3600)}時間{Math.floor((totalSpeedupSeconds % 3600) / 60)}
              分 ÷ {secPerTroop}秒/人 = <strong>{troopCount.toLocaleString()}人</strong>できます
            </p>
          )}
          {mode === "train" ? (
            <>
              <p>
                1人あたりの獲得ポイント: {TRAINING_POINTS_BY_LEVEL[trainLevel]}(T{trainLevel}) × (1 +{" "}
                {bonusPct}%) = {trainPointsPer.toFixed(1)}
              </p>
              <p style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#4ade80" }}>
                予想獲得ポイント合計: {trainTotal.toLocaleString()}ポイント
              </p>
            </>
          ) : (
            <>
              <p>
                1人あたりの獲得ポイント: ({TRAINING_POINTS_BY_LEVEL[toLevel]}(T{toLevel}) −{" "}
                {TRAINING_POINTS_BY_LEVEL[fromLevel]}(T{fromLevel})) × (1 + {bonusPct}%) ={" "}
                {promotePointsPer.toFixed(1)}
              </p>
              <p style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#4ade80" }}>
                予想獲得ポイント合計: {promoteTotal.toLocaleString()}ポイント
              </p>
            </>
          )}
          <p style={{ marginTop: 12 }}>
            必要資源: 🍖食料{totalResource.food.toLocaleString()} / 🪵木材{totalResource.wood.toLocaleString()}{" "}
            / ⛏鉄鉱石{totalResource.ore.toLocaleString()} / 💎クリスタル{totalResource.crystal.toLocaleString()}
          </p>
        </div>
      )}

      <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: 16 }}>
        ※ 訓練ポイントの表(T10〜T12)・所要時間/資源(T11訓練180秒・T12訓練215秒・昇格9.4秒、いずれも弓兵の実測値)は固定値です。兵種(盾/槍)で多少異なる可能性があります。昇格ポイントは「昇格後レベルの訓練ポイント−昇格前レベルの訓練ポイント」というゲーム内の仕様通りに計算しています。
      </p>
    </>
  );
}

export default function SvsPointsPage() {
  const [day, setDay] = useState<"day3" | "day4">("day3");

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <p>
        <Link href="/">🏠 ホームに戻る</Link>
      </p>
      <h1>SVSポイント計算</h1>

      <div className="row" style={{ marginTop: 12 }}>
        <button
          onClick={() => setDay("day3")}
          style={{
            background: day === "day3" ? "#2563eb" : "transparent",
            color: day === "day3" ? "#ffffff" : "#e2e8f0",
            border: "1px solid #334155",
          }}
        >
          3日目: 氷原の巨獣狩り
        </button>
        <button
          onClick={() => setDay("day4")}
          style={{
            background: day === "day4" ? "#2563eb" : "transparent",
            color: day === "day4" ? "#ffffff" : "#e2e8f0",
            border: "1px solid #334155",
          }}
        >
          4日目: 兵士訓練/昇格
        </button>
      </div>

      {day === "day3" ? <Day3Beast /> : <Day4Training />}
    </main>
  );
}
