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

// 訓練・昇格それぞれの、1人あたりの所要時間(秒)と資源消費(研究レベル0%減=元の値、兵種・レベル別)
// 所要時間は「初期時間」ではなく、実際に表示されていた訓練時間(個人の速度ボーナス込み)を使用
// 資源消費は「資源消費減少」研究の効果を差し引いた元の値(研究レベル選択で減少率を掛けて表示する)
type TroopType = "shield" | "spear" | "bow";
const TROOP_TYPE_LABEL: Record<TroopType, string> = { shield: "盾兵", spear: "槍兵", bow: "弓兵" };
type TrainRate = { secPerTroop: number; food: number; wood: number; coal: number; iron: number };
const TRAIN_RATE_BY_TYPE_LEVEL: Record<TroopType, Record<number, TrainRate>> = {
  shield: {
    11: { secPerTroop: 48.36, food: 4841, wood: 3615, coal: 839, iron: 177 },
    12: { secPerTroop: 57.76, food: 8329, wood: 6262, coal: 1420, iron: 304 },
  },
  spear: {
    11: { secPerTroop: 48.36, food: 5165, wood: 4841, coal: 968, iron: 230 },
    12: { secPerTroop: 57.76, food: 8200, wood: 7747, coal: 1549, iron: 365 },
  },
  bow: {
    11: { secPerTroop: 48, food: 4358, wood: 6449, coal: 1081, iron: 350 },
    12: { secPerTroop: 57.76, food: 5617, wood: 8329, coal: 1356, iron: 453 },
  },
};
const PROMOTE_SEC_PER_TROOP = 9.4035; // 昇格(T11→T12、実際の表示時間ベース。弓兵の実測値、他兵種は今のところ同じ値を暫定使用)
// 昇格の資源消費は弓兵しか実測値がないため、T12訓練の兵種間資源比率を使って盾兵・槍兵分を推定している
const PROMOTE_RESOURCE_BY_TYPE: Record<TroopType, { food: number; wood: number; coal: number; iron: number }> = {
  bow: { food: 2176, wood: 3216, coal: 536, iron: 168 }, // 実測値
  shield: { food: 3227, wood: 2418, coal: 561, iron: 113 }, // T12訓練の盾兵/弓兵の比率から推定
  spear: { food: 3177, wood: 2991, coal: 612, iron: 135 }, // T12訓練の槍兵/弓兵の比率から推定
};

// 「資源消費減少」研究のレベルごとの減少率(%)。T11とT12で刻み方が異なる(実測値)
const RESOURCE_REDUCTION_BY_LEVEL: Record<11 | 12, Record<number, number>> = {
  11: { 0: 0, 1: 5, 2: 10, 3: 15, 4: 20, 5: 25, 6: 30, 7: 35, 8: 40, 9: 45, 10: 50 },
  12: { 0: 0, 1: 2.5, 2: 5, 3: 7.5, 4: 10, 5: 12.5, 6: 15, 7: 17.5, 8: 20, 9: 22.5, 10: 25 },
};

function Day4Training() {
  const [inputMode, setInputMode] = useState<"count" | "speedup">("speedup");
  const [mode, setMode] = useState<"train" | "promote">("train");
  const [troopType, setTroopType] = useState<TroopType>("bow");
  const [splitMethod, setSplitMethod] = useState<"manual" | "ratio">("manual");
  const [trainLevel, setTrainLevel] = useState<number>(12);
  const [fromLevel, setFromLevel] = useState<number>(11);
  const [toLevel, setToLevel] = useState<number>(12);
  const [count, setCount] = useState<string>("");
  const [speedupDays, setSpeedupDays] = useState<string>("");
  const [speedupHours, setSpeedupHours] = useState<string>("");
  const [speedupMinutes, setSpeedupMinutes] = useState<string>("");
  const [speedupByType, setSpeedupByType] = useState<Record<TroopType, { d: string; h: string; m: string }>>({
    shield: { d: "", h: "", m: "" },
    spear: { d: "", h: "", m: "" },
    bow: { d: "", h: "", m: "" },
  });
  const [ratioByType, setRatioByType] = useState<Record<TroopType, string>>({
    shield: "",
    spear: "",
    bow: "",
  });
  const [valeriaLevel, setValeriaLevel] = useState<number>(0); // 0 = 未所持/選択なし
  const [resourceResearchLevelByType, setResourceResearchLevelByType] = useState<Record<TroopType, number>>({
    shield: 0,
    spear: 0,
    bow: 0,
  });
  const bonusPct = VALERIA_BONUS_BY_LEVEL[valeriaLevel] || 0;
  const isSplitFlow = mode === "train" && inputMode === "speedup";

  const availableTrainLevels = Object.keys(TRAIN_RATE_BY_TYPE_LEVEL[troopType]).map(Number).sort((a, b) => a - b);
  const trainRate =
    TRAIN_RATE_BY_TYPE_LEVEL[troopType][trainLevel] ||
    TRAIN_RATE_BY_TYPE_LEVEL[troopType][availableTrainLevels[availableTrainLevels.length - 1]];
  const secPerTroop = mode === "train" ? trainRate.secPerTroop : PROMOTE_SEC_PER_TROOP;

  // 「資源消費減少」研究の効果を反映する(訓練=兵種ごとのtrainLevel研究、昇格=昇格後レベルtoLevelの研究が適用される)
  const reductionTargetLevel = mode === "train" ? trainLevel : toLevel;
  const resourceResearchLevel = resourceResearchLevelByType[troopType];
  const reductionPct = RESOURCE_REDUCTION_BY_LEVEL[reductionTargetLevel as 11 | 12]?.[resourceResearchLevel] || 0;
  const reductionRatio = 1 - reductionPct / 100;

  function resourceFor(
    rate: { food: number; wood: number; coal: number; iron: number },
    ratio: number = reductionRatio
  ) {
    return {
      food: rate.food * ratio,
      wood: rate.wood * ratio,
      coal: rate.coal * ratio,
      iron: rate.iron * ratio,
    };
  }

  const baseResource = mode === "train" ? trainRate : PROMOTE_RESOURCE_BY_TYPE[troopType];
  const resourcePerTroop = resourceFor(baseResource);

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
    coal: Math.round(troopCount * resourcePerTroop.coal),
    iron: Math.round(troopCount * resourcePerTroop.iron),
  };

  // 盾兵/槍兵/弓兵それぞれの加速時間を分けて入力した場合の内訳・合計(訓練モードのみ)
  const totalRatioPct = (Number(ratioByType.shield) || 0) + (Number(ratioByType.spear) || 0) + (Number(ratioByType.bow) || 0);
  const perTypeBreakdown =
    isSplitFlow
      ? (Object.keys(TROOP_TYPE_LABEL) as TroopType[]).map((t) => {
          let seconds: number;
          if (splitMethod === "ratio") {
            const pctOfTotal = Number(ratioByType[t]) || 0;
            seconds = totalSpeedupSeconds * (pctOfTotal / 100);
          } else {
            const s = speedupByType[t];
            seconds = (Number(s.d) || 0) * 86400 + (Number(s.h) || 0) * 3600 + (Number(s.m) || 0) * 60;
          }
          const rate = TRAIN_RATE_BY_TYPE_LEVEL[t][trainLevel] || TRAIN_RATE_BY_TYPE_LEVEL[t][availableTrainLevels[availableTrainLevels.length - 1]];
          const count = Math.floor(seconds / rate.secPerTroop);
          const points = Math.round(count * trainPointsPer * 10) / 10;
          const pct = RESOURCE_REDUCTION_BY_LEVEL[trainLevel as 11 | 12]?.[resourceResearchLevelByType[t]] || 0;
          const res = resourceFor(rate, 1 - pct / 100);
          return {
            type: t,
            count,
            points,
            resource: {
              food: Math.round(count * res.food),
              wood: Math.round(count * res.wood),
              coal: Math.round(count * res.coal),
              iron: Math.round(count * res.iron),
            },
          };
        })
      : [];
  const splitTotalCount = perTypeBreakdown.reduce((s, b) => s + b.count, 0);
  const splitTotalPoints = Math.round(perTypeBreakdown.reduce((s, b) => s + b.points, 0) * 10) / 10;
  const splitTotalResource = {
    food: perTypeBreakdown.reduce((s, b) => s + b.resource.food, 0),
    wood: perTypeBreakdown.reduce((s, b) => s + b.resource.wood, 0),
    coal: perTypeBreakdown.reduce((s, b) => s + b.resource.coal, 0),
    iron: perTypeBreakdown.reduce((s, b) => s + b.resource.iron, 0),
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
          <option value="promote">昇格</option>
        </select>

        {inputMode === "count" && (
          <>
            <label style={{ marginTop: 16, display: "block" }}>兵種</label>
            <select
              value={troopType}
              onChange={(e) => {
                const t = e.target.value as TroopType;
                setTroopType(t);
                const levels = Object.keys(TRAIN_RATE_BY_TYPE_LEVEL[t]).map(Number);
                setTrainLevel(Math.max(...levels));
              }}
            >
              {(Object.keys(TROOP_TYPE_LABEL) as TroopType[]).map((t) => (
                <option key={t} value={t}>
                  {TROOP_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </>
        )}

        {mode === "train" ? (
          <>
            <label style={{ marginTop: 16, display: "block" }}>訓練する兵士のレベル</label>
            <select value={trainLevel} onChange={(e) => setTrainLevel(Number(e.target.value))}>
              {availableTrainLevels.map((lv) => (
                <option key={lv} value={lv}>
                  T{lv}
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

        {!isSplitFlow && (
          <>
            <label style={{ marginTop: 16, display: "block" }}>
              T{reductionTargetLevel}訓練の「資源消費減少」研究レベル
            </label>
            <select
              value={resourceResearchLevel}
              onChange={(e) =>
                setResourceResearchLevelByType((prev) => ({ ...prev, [troopType]: Number(e.target.value) }))
              }
            >
              {Object.entries(RESOURCE_REDUCTION_BY_LEVEL[reductionTargetLevel as 11 | 12] || {}).map(
                ([lv, pct]) => (
                  <option key={lv} value={lv}>
                    {lv === "0" ? "未研究(0%)" : `Lv.${lv}(-${pct}%)`}
                  </option>
                )
              )}
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
        ) : isSplitFlow ? (
          <>
            <label style={{ marginTop: 16, display: "block" }}>配分方法</label>
            <select value={splitMethod} onChange={(e) => setSplitMethod(e.target.value as "manual" | "ratio")}>
              <option value="ratio">合計の加速時間を割合で配分する</option>
              <option value="manual">兵種ごとに時間を直接入力する</option>
            </select>

            {splitMethod === "ratio" ? (
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

                <label style={{ marginTop: 16, display: "block" }}>
                  兵種ごとの割り当て割合(%・合計
                  <span style={{ color: totalRatioPct === 100 ? "#4ade80" : "#f87171" }}>{totalRatioPct}</span>
                  %)
                </label>
                {(Object.keys(TROOP_TYPE_LABEL) as TroopType[]).map((t) => (
                  <div key={t} style={{ marginTop: 8 }}>
                    <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{TROOP_TYPE_LABEL[t]}(%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ratioByType[t]}
                      onChange={(e) => setRatioByType((prev) => ({ ...prev, [t]: e.target.value }))}
                      placeholder="例: 33"
                    />
                    <select
                      style={{ marginTop: 4 }}
                      value={resourceResearchLevelByType[t]}
                      onChange={(e) =>
                        setResourceResearchLevelByType((prev) => ({ ...prev, [t]: Number(e.target.value) }))
                      }
                    >
                      {Object.entries(RESOURCE_REDUCTION_BY_LEVEL[trainLevel as 11 | 12] || {}).map(([lv, pct]) => (
                        <option key={lv} value={lv}>
                          {TROOP_TYPE_LABEL[t]}の資源消費減少研究:{" "}
                          {lv === "0" ? "未研究(0%)" : `Lv.${lv}(-${pct}%)`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {totalRatioPct !== 100 && (
                  <p style={{ color: "#f87171", fontSize: "0.85rem", marginTop: 8 }}>
                    ※ 割合の合計が100%になっていません(今は{totalRatioPct}%)
                  </p>
                )}
              </>
            ) : (
              <>
                <label style={{ marginTop: 16, display: "block" }}>
                  兵種ごとに使う加速アイテムの時間(任意・空欄は0扱い)
                </label>
                {(Object.keys(TROOP_TYPE_LABEL) as TroopType[]).map((t) => (
                  <div key={t} style={{ marginTop: 8 }}>
                    <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{TROOP_TYPE_LABEL[t]}</label>
                    <div className="row">
                      <div>
                        <input
                          type="number"
                          min={0}
                          value={speedupByType[t].d}
                          onChange={(e) =>
                            setSpeedupByType((prev) => ({ ...prev, [t]: { ...prev[t], d: e.target.value } }))
                          }
                          placeholder="日"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          value={speedupByType[t].h}
                          onChange={(e) =>
                            setSpeedupByType((prev) => ({ ...prev, [t]: { ...prev[t], h: e.target.value } }))
                          }
                          placeholder="時間"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          value={speedupByType[t].m}
                          onChange={(e) =>
                            setSpeedupByType((prev) => ({ ...prev, [t]: { ...prev[t], m: e.target.value } }))
                          }
                          placeholder="分"
                        />
                      </div>
                    </div>
                    <select
                      style={{ marginTop: 4 }}
                      value={resourceResearchLevelByType[t]}
                      onChange={(e) =>
                        setResourceResearchLevelByType((prev) => ({ ...prev, [t]: Number(e.target.value) }))
                      }
                    >
                      {Object.entries(RESOURCE_REDUCTION_BY_LEVEL[trainLevel as 11 | 12] || {}).map(([lv, pct]) => (
                        <option key={lv} value={lv}>
                          {TROOP_TYPE_LABEL[t]}の資源消費減少研究:{" "}
                          {lv === "0" ? "未研究(0%)" : `Lv.${lv}(-${pct}%)`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </>
            )}
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

      {isSplitFlow ? (
        splitTotalCount > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3>計算結果(兵種別)</h3>
            {perTypeBreakdown.map((b) => (
              <p key={b.type}>
                {TROOP_TYPE_LABEL[b.type]}: {b.count.toLocaleString()}人・{b.points.toLocaleString()}ポイント
                (食料{b.resource.food.toLocaleString()} / 木材{b.resource.wood.toLocaleString()} / 石炭
                {b.resource.coal.toLocaleString()} / 鉄鉱石{b.resource.iron.toLocaleString()})
              </p>
            ))}
            <p style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#4ade80", marginTop: 12 }}>
              合計: {splitTotalCount.toLocaleString()}人・{splitTotalPoints.toLocaleString()}ポイント
            </p>
            <p>
              必要資源合計: 🍖食料{splitTotalResource.food.toLocaleString()} / 🪵木材
              {splitTotalResource.wood.toLocaleString()} / ⚫石炭{splitTotalResource.coal.toLocaleString()} /{" "}
              ⛏鉄鉱石{splitTotalResource.iron.toLocaleString()}
            </p>
          </div>
        )
      ) : troopCount > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>計算結果</h3>
          {inputMode === "speedup" && (
            <p>
              加速時間 合計{Math.floor(totalSpeedupSeconds / 3600)}時間{Math.floor((totalSpeedupSeconds % 3600) / 60)}
              分 ÷ {secPerTroop}秒/人 = <strong>{troopCount.toLocaleString()}人</strong>できます
            </p>
          )}
          {inputMode === "count" &&
            (() => {
              const totalSeconds = troopCount * secPerTroop;
              const days = Math.floor(totalSeconds / 86400);
              const hours = Math.floor((totalSeconds % 86400) / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              return (
                <p>
                  {troopCount.toLocaleString()}人 × {secPerTroop}秒/人 = 必要時間{" "}
                  <strong>
                    {days}日{hours}時間{minutes}分
                  </strong>
                  (加速アイテムなしの場合)
                </p>
              );
            })()}
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
            / ⚫石炭{totalResource.coal.toLocaleString()} / ⛏鉄鉱石{totalResource.iron.toLocaleString()}
          </p>
        </div>
      )}

      <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: 16 }}>
        ※ 訓練ポイントの表(T10〜T12)は兵種に関係ない共通値です。訓練の所要時間・資源消費は兵種(盾/槍/弓)・レベル(T11/T12)ごとの実測値を反映しています。昇格の所要時間(9.4秒/人)は弓兵の実測値を全兵種共通で使っています。昇格の資源消費は弓兵のみ実測値があり、盾兵・槍兵はT12訓練の兵種間資源比率から推定した値です。速度ボーナス等により実際の時間は変動する可能性があります。昇格ポイントは「昇格後レベルの訓練ポイント−昇格前レベルの訓練ポイント」というゲーム内の仕様通りに計算しています。
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
