"use client";

import { useEffect, useState } from "react";

type HeroSkill = {
  id: number;
  name: string;
  triggerType: string;
  triggerValue: number | null;
  target: string;
  stat: string;
  value: number;
  durationTurns: number | null;
};

type Hero = {
  id: number;
  name: string;
  troopType: string;
  atk: number | null;
  def: number | null;
  hp: number | null;
  lethality: number | null;
  skills: HeroSkill[];
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
  equipSpearAtkPct: number | null;
  equipSpearDefPct: number | null;
  equipBowAtkPct: number | null;
  equipBowDefPct: number | null;
  gemShieldLethalityPct: number | null;
  gemShieldHpPct: number | null;
  gemSpearLethalityPct: number | null;
  gemSpearHpPct: number | null;
  gemBowLethalityPct: number | null;
  gemBowHpPct: number | null;
};

type Stats = { atk: number; def: number; hp: number; lethality: number };
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

// 発動条件に応じて「平均的にはどれくらいの効果か」を期待値で計算する。
// 常時発動やターン制の効果は、本格的なターン制シミュレーターができるまでの
// 暫定として満額で計算し、確率発動のみ期待値(値×確率)で割り引く。
function effectiveValue(s: HeroSkill): number {
  if (s.triggerType === "chance") {
    const chance = s.triggerValue ?? 100;
    return (s.value * chance) / 100;
  }
  return s.value;
}

// 領主装備・領主宝石の%(兵種ごと、加算バフ扱い)
function equipGemAdditivePct(hero: Hero, formation: Formation | null, stat: StatKey): number {
  if (!formation) return 0;
  const prefix = troopPrefix(hero.troopType);
  const suffix = statSuffix(stat);
  if (stat === "atk" || stat === "def") {
    const key = `equip${prefix}${suffix}Pct` as keyof Formation;
    return (formation[key] as number | null) ?? 0;
  }
  const key = `gem${prefix}${suffix}Pct` as keyof Formation;
  return (formation[key] as number | null) ?? 0;
}

// 英雄スキル(自分upのみ)の%の合計(加算バフ扱い)
function heroSkillAdditivePct(hero: Hero, stat: StatKey): number {
  return hero.skills
    .filter((s) => s.target === "self" && s.stat === stat)
    .reduce((sum, s) => sum + effectiveValue(s), 0);
}

// 専用装備・ダイヤバフ・ペットスキル・霜竜石塔などの乗算バフ。
// まだ登録する仕組みがないため、今は常に0(効果なし)として扱う暫定実装。
function multiplicativePct(): number {
  return 0;
}

// 相手側の英雄スキル(敵downのみ)の%の合計(デバフ扱い)
function enemyDebuffPct(opponentHeroes: Hero[], stat: StatKey): number {
  return opponentHeroes.reduce(
    (sum, h) =>
      sum +
      h.skills
        .filter((s) => s.target === "enemy" && s.stat === stat)
        .reduce((s2, sk) => s2 + effectiveValue(sk), 0),
    0
  );
}

// 最終値 = 基礎値 × (100%+加算バフ計) × (100%+乗算バフ計) ÷ (100%+デバフ計)
function finalStats(
  heroes: Hero[],
  formation: Formation | null,
  opponentHeroes: Hero[]
): Stats {
  const result: Stats = { atk: 0, def: 0, hp: 0, lethality: 0 };
  (Object.keys(result) as StatKey[]).forEach((stat) => {
    const debuffPct = enemyDebuffPct(opponentHeroes, stat);
    let total = 0;
    for (const h of heroes) {
      const base = h[stat] ?? 0;
      const additivePct = equipGemAdditivePct(h, formation, stat) + heroSkillAdditivePct(h, stat);
      const multPct = multiplicativePct();
      total +=
        (base * (1 + additivePct / 100) * (1 + multPct / 100)) / (1 + debuffPct / 100);
    }
    result[stat] = Math.round(total);
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

  const selfFinal = finalStats(selfHeroes, selfFormation, opponentHeroes);
  const opponentFinal = finalStats(opponentHeroes, opponentFormation, selfHeroes);

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
        最終値 = 基礎値×(100%+加算バフ)×(100%+乗算バフ)÷(100%+デバフ)で計算しています。加算バフ=領主装備・領主宝石・英雄スキル、デバフ=相手英雄スキル。専用装備・ダイヤバフ・ペットスキルなどの乗算バフはまだ登録する仕組みがなく、今は0として計算しています。ターン制の本格シミュレーターは開発中です。
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
