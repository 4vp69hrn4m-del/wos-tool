"use client";

import { useEffect, useState } from "react";

type Hero = {
  id: number;
  name: string;
  troopType: string;
  atk: number | null;
  def: number | null;
  hp: number | null;
  lethality: number | null;
  skillEffectTarget1: string | null;
  skillEffectStat1: string | null;
  skillEffectValue1: number | null;
  skillEffectTarget2: string | null;
  skillEffectStat2: string | null;
  skillEffectValue2: number | null;
  skillEffectTarget3: string | null;
  skillEffectStat3: string | null;
  skillEffectValue3: number | null;
};

type Formation = {
  id: number;
  label: string | null;
  side: string;
  formationType: string | null;
  shieldHeroName: string | null;
  spearHeroName: string | null;
  bowHeroName: string | null;
  equipShieldAtkPct: number | null;
  equipShieldDefPct: number | null;
  equipShieldLethalityPct: number | null;
  equipShieldHpPct: number | null;
  equipSpearAtkPct: number | null;
  equipSpearDefPct: number | null;
  equipSpearLethalityPct: number | null;
  equipSpearHpPct: number | null;
  equipBowAtkPct: number | null;
  equipBowDefPct: number | null;
  equipBowLethalityPct: number | null;
  equipBowHpPct: number | null;
  gemShieldAtkPct: number | null;
  gemShieldDefPct: number | null;
  gemShieldLethalityPct: number | null;
  gemShieldHpPct: number | null;
  gemSpearAtkPct: number | null;
  gemSpearDefPct: number | null;
  gemSpearLethalityPct: number | null;
  gemSpearHpPct: number | null;
  gemBowAtkPct: number | null;
  gemBowDefPct: number | null;
  gemBowLethalityPct: number | null;
  gemBowHpPct: number | null;
};

type Stats = { atk: number; def: number; hp: number; lethality: number };
type Effect = { stat: string; value: number; target: string };
type StatKey = keyof Stats;

const statLabel: Record<string, string> = {
  atk: "攻撃力",
  def: "防御力",
  hp: "HP",
  lethality: "殺傷力",
};

function getHeroesInFormation(formation: Formation | null, heroes: Hero[]): Hero[] {
  if (!formation) return [];
  const names = [
    formation.shieldHeroName,
    formation.spearHeroName,
    formation.bowHeroName,
  ].filter((n): n is string => !!n);
  return names
    .map((n) => heroes.find((h) => h.name === n))
    .filter((h): h is Hero => !!h);
}

function troopPrefix(troopType: string): "Shield" | "Spear" | "Bow" {
  if (troopType === "歩兵") return "Shield";
  if (troopType === "騎兵") return "Spear";
  return "Bow";
}

function statSuffix(stat: StatKey): string {
  if (stat === "atk") return "Atk";
  if (stat === "def") return "Def";
  if (stat === "hp") return "Hp";
  return "Lethality";
}

// 領主装備・領主宝石の%を、英雄の兵種に応じて乗算で反映する
function equipGemMultiplier(hero: Hero, formation: Formation, stat: StatKey): number {
  const prefix = troopPrefix(hero.troopType);
  const suffix = statSuffix(stat);
  const equipKey = `equip${prefix}${suffix}Pct` as keyof Formation;
  const gemKey = `gem${prefix}${suffix}Pct` as keyof Formation;
  const equipPct = (formation[equipKey] as number | null) ?? 0;
  const gemPct = (formation[gemKey] as number | null) ?? 0;
  return (1 + equipPct / 100) * (1 + gemPct / 100);
}

function adjustedBaseStats(hs: Hero[], formation: Formation | null): Stats {
  return hs.reduce(
    (sum, h) => {
      if (!formation) {
        return {
          atk: sum.atk + (h.atk ?? 0),
          def: sum.def + (h.def ?? 0),
          hp: sum.hp + (h.hp ?? 0),
          lethality: sum.lethality + (h.lethality ?? 0),
        };
      }
      return {
        atk: sum.atk + (h.atk ?? 0) * equipGemMultiplier(h, formation, "atk"),
        def: sum.def + (h.def ?? 0) * equipGemMultiplier(h, formation, "def"),
        hp: sum.hp + (h.hp ?? 0) * equipGemMultiplier(h, formation, "hp"),
        lethality:
          sum.lethality + (h.lethality ?? 0) * equipGemMultiplier(h, formation, "lethality"),
      };
    },
    { atk: 0, def: 0, hp: 0, lethality: 0 }
  );
}

function collectEffects(hs: Hero[]): Effect[] {
  const effects: Effect[] = [];
  for (const h of hs) {
    const triples: [string | null, string | null, number | null][] = [
      [h.skillEffectTarget1, h.skillEffectStat1, h.skillEffectValue1],
      [h.skillEffectTarget2, h.skillEffectStat2, h.skillEffectValue2],
      [h.skillEffectTarget3, h.skillEffectStat3, h.skillEffectValue3],
    ];
    for (const [target, stat, value] of triples) {
      if (target && stat && value !== null) {
        effects.push({ target, stat, value });
      }
    }
  }
  return effects;
}

function applyEffects(base: Stats, selfEffects: Effect[], enemyEffects: Effect[]): Stats {
  const result = { ...base };
  (Object.keys(result) as StatKey[]).forEach((stat) => {
    const boost = selfEffects
      .filter((e) => e.target === "self" && e.stat === stat)
      .reduce((sum, e) => sum + e.value, 0);
    const debuff = enemyEffects
      .filter((e) => e.target === "enemy" && e.stat === stat)
      .reduce((sum, e) => sum + e.value, 0);
    result[stat] = Math.round(result[stat] * (1 + boost / 100) * (1 - debuff / 100));
  });
  return result;
}

export default function SimulatePage() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selfId, setSelfId] = useState("");
  const [opponentId, setOpponentId] = useState("");

  useEffect(() => {
    async function load() {
      const [h, f] = await Promise.all([
        fetch("/api/heroes").then((r) => r.json()),
        fetch("/api/formations").then((r) => r.json()),
      ]);
      setHeroes(h);
      setFormations(f);
    }
    load();
  }, []);

  const selfFormation = formations.find((f) => String(f.id) === selfId) || null;
  const opponentFormation = formations.find((f) => String(f.id) === opponentId) || null;

  const selfHeroes = getHeroesInFormation(selfFormation, heroes);
  const opponentHeroes = getHeroesInFormation(opponentFormation, heroes);

  const selfBase = adjustedBaseStats(selfHeroes, selfFormation);
  const opponentBase = adjustedBaseStats(opponentHeroes, opponentFormation);

  const selfEffects = collectEffects(selfHeroes);
  const opponentEffects = collectEffects(opponentHeroes);

  const selfFinal = applyEffects(selfBase, selfEffects, opponentEffects);
  const opponentFinal = applyEffects(opponentBase, opponentEffects, selfEffects);

  const showResult = selfFormation && opponentFormation;

  let selfWins = 0;
  let opponentWins = 0;
  if (showResult) {
    (Object.keys(selfFinal) as StatKey[]).forEach((stat) => {
      if (selfFinal[stat] > opponentFinal[stat]) selfWins++;
      else if (selfFinal[stat] < opponentFinal[stat]) opponentWins++;
    });
  }

  let verdict = "";
  if (showResult) {
    if (selfWins > opponentWins) verdict = "有利";
    else if (selfWins < opponentWins) verdict = "不利";
    else verdict = "互角";
  }

  return (
    <div>
      <h1>編成シミュレーター(簡易版)</h1>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
        英雄の基礎ステータス・スキル効果・領主装備・領主宝石(兵種ごとに乗算)を使った参考スコアです。専門家・ペット・兵種比率・実戦データはまだ反映していません。
      </p>

      <div className="card">
        <label>自分の編成</label>
        <select value={selfId} onChange={(e) => setSelfId(e.target.value)}>
          <option value="">(選択してください)</option>
          {formations
            .filter((f) => f.side === "self")
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.label || `編成#${f.id}`}
              </option>
            ))}
        </select>

        <label>相手の編成</label>
        <select value={opponentId} onChange={(e) => setOpponentId(e.target.value)}>
          <option value="">(選択してください)</option>
          {formations
            .filter((f) => f.side === "opponent")
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.label || `編成#${f.id}`}
              </option>
            ))}
        </select>
      </div>

      {showResult && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>
            判定:{" "}
            <span
              style={{
                color: verdict === "有利" ? "#38bdf8" : verdict === "不利" ? "#f87171" : "#94a3b8",
              }}
            >
              {verdict}
            </span>
          </h2>
          {(Object.keys(selfFinal) as StatKey[]).map((stat) => (
            <div key={stat} style={{ marginTop: 8 }}>
              <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{statLabel[stat]}</div>
              <div className="row">
                <div
                  style={{
                    color: selfFinal[stat] > opponentFinal[stat] ? "#38bdf8" : "inherit",
                  }}
                >
                  自分: {selfFinal[stat]}
                </div>
                <div
                  style={{
                    color: opponentFinal[stat] > selfFinal[stat] ? "#f87171" : "inherit",
                  }}
                >
                  相手: {opponentFinal[stat]}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
