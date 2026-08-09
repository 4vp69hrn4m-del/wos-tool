"use client";

import { useEffect, useState } from "react";

type HeroSkill = {
  id: number;
  name: string;
  triggerType: string;
  triggerValue: number | null;
  target: string | null;
  stat: string | null;
  value: number | null;
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
  exclusiveGearHpPct: number | null;
  exclusiveGearLethalityPct: number | null;
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
  infantryPct: number | null;
  cavalryPct: number | null;
  archerPct: number | null;
  troopCount: number | null;
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
  diamondBuffActive: boolean;
  petBuffActive: boolean;
};

type Stats = { atk: number; def: number; hp: number; lethality: number };
type StatKey = keyof Stats;

const statLabel: Record<string, string> = {
  atk: "攻撃力",
  def: "防御力",
  hp: "HP",
  lethality: "殺傷力",
};

// ダイヤバフ・ペットバフは、誰が使っても同じ固定%(教えてもらった実測値)
const DIAMOND_SELF_PCT = 20; // 自分側: 攻撃力/防御力/HP/殺傷力 全部+20%
const DIAMOND_ENEMY_DEBUFF: Partial<Record<StatKey, number>> = { atk: 20, def: 20 };
const PET_SELF_PCT = 10; // 自分側: 攻撃力/防御力/HP/殺傷力 全部+10%
const PET_ENEMY_DEBUFF: Partial<Record<StatKey, number>> = { hp: 5, lethality: 5, def: 10 };

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

function exclusiveGearField(stat: StatKey): keyof Hero | null {
  if (stat === "hp") return "exclusiveGearHpPct";
  if (stat === "lethality") return "exclusiveGearLethalityPct";
  return null;
}

// 発動条件に応じて「平均的にはどれくらいの効果か」を期待値で計算する。
// 常時発動やターン制の効果は、本格的なターン制シミュレーターができるまでの
// 暫定として満額で計算し、確率発動のみ期待値(値×確率)で割り引く。
function effectiveValue(s: HeroSkill): number {
  const value = s.value ?? 0;
  if (s.triggerType === "chance") {
    const chance = s.triggerValue ?? 100;
    return (value * chance) / 100;
  }
  return value;
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

// 専用装備・ダイヤバフ・ペットバフの合計(乗算バフ扱い)
function multiplicativePct(hero: Hero, formation: Formation | null, stat: StatKey): number {
  const gearField = exclusiveGearField(stat);
  const gearPct = gearField ? (hero[gearField] as number | null) ?? 0 : 0;
  const diamondPct = formation?.diamondBuffActive ? DIAMOND_SELF_PCT : 0;
  const petPct = formation?.petBuffActive ? PET_SELF_PCT : 0;
  return gearPct + diamondPct + petPct;
}

// 相手側の英雄スキル・ダイヤバフ・ペットバフの合計(デバフ扱い)
function enemyDebuffPct(
  opponentHeroes: Hero[],
  opponentFormation: Formation | null,
  stat: StatKey
): number {
  const skillDebuff = opponentHeroes.reduce(
    (sum, h) =>
      sum +
      h.skills
        .filter((s) => s.target === "enemy" && s.stat === stat)
        .reduce((s2, sk) => s2 + effectiveValue(sk), 0),
    0
  );
  const diamondDebuff =
    opponentFormation?.diamondBuffActive ? DIAMOND_ENEMY_DEBUFF[stat] ?? 0 : 0;
  const petDebuff = opponentFormation?.petBuffActive ? PET_ENEMY_DEBUFF[stat] ?? 0 : 0;
  return skillDebuff + diamondDebuff + petDebuff;
}

// 最終値 = 基礎値 × (100%+加算バフ計) × (100%+乗算バフ計) ÷ (100%+デバフ計)
function finalStats(
  heroes: Hero[],
  formation: Formation | null,
  opponentHeroes: Hero[],
  opponentFormation: Formation | null
): Stats {
  const result: Stats = { atk: 0, def: 0, hp: 0, lethality: 0 };
  (Object.keys(result) as StatKey[]).forEach((stat) => {
    const debuffPct = enemyDebuffPct(opponentHeroes, opponentFormation, stat);
    let total = 0;
    for (const h of heroes) {
      const base = h[stat] ?? 0;
      const additivePct = equipGemAdditivePct(h, formation, stat) + heroSkillAdditivePct(h, stat);
      const multPct = multiplicativePct(h, formation, stat);
      total +=
        (base * (1 + additivePct / 100) * (1 + multPct / 100)) / (1 + debuffPct / 100);
    }
    result[stat] = Math.round(total);
  });
  return result;
}

// 1人分の最終ステータス(部隊シミュレーション用。上のfinalStatsは英雄3人分の合計値)
function heroFinalStat(
  hero: Hero,
  formation: Formation | null,
  opponentHeroes: Hero[],
  opponentFormation: Formation | null,
  stat: StatKey
): number {
  const base = hero[stat] ?? 0;
  const additivePct = equipGemAdditivePct(hero, formation, stat) + heroSkillAdditivePct(hero, stat);
  const multPct = multiplicativePct(hero, formation, stat);
  const debuffPct = enemyDebuffPct(opponentHeroes, opponentFormation, stat);
  return (base * (1 + additivePct / 100) * (1 + multPct / 100)) / (1 + debuffPct / 100);
}

type TroopType = "shield" | "spear" | "bow";
type TroopGroup = {
  type: TroopType;
  label: string;
  count: number;
  atkPerSoldier: number;
  defPerSoldier: number;
  hpPerSoldier: number;
  lethalityPerSoldier: number;
  hpPool: number;
};

const troopOrder: TroopType[] = ["shield", "spear", "bow"];
const troopTypeLabel: Record<TroopType, string> = {
  shield: "盾兵",
  spear: "槍兵",
  bow: "弓兵",
};

function buildTroopGroups(
  heroes: Hero[],
  formation: Formation | null,
  opponentHeroes: Hero[],
  opponentFormation: Formation | null
): TroopGroup[] {
  if (!formation || !formation.troopCount) return [];
  const defs: [TroopType, string | null, number | null][] = [
    ["shield", formation.shieldHeroName, formation.infantryPct],
    ["spear", formation.spearHeroName, formation.cavalryPct],
    ["bow", formation.bowHeroName, formation.archerPct],
  ];
  const groups: TroopGroup[] = [];
  for (const [type, heroName, pct] of defs) {
    if (!heroName || !pct) continue;
    const hero = heroes.find((h) => h.name === heroName);
    if (!hero) continue;
    const count = Math.round((formation.troopCount * pct) / 100);
    if (count <= 0) continue;
    const atkPerSoldier = heroFinalStat(hero, formation, opponentHeroes, opponentFormation, "atk");
    const defPerSoldier = heroFinalStat(hero, formation, opponentHeroes, opponentFormation, "def");
    const hpPerSoldier = heroFinalStat(hero, formation, opponentHeroes, opponentFormation, "hp");
    const lethalityPerSoldier = heroFinalStat(
      hero,
      formation,
      opponentHeroes,
      opponentFormation,
      "lethality"
    );
    groups.push({
      type,
      label: troopTypeLabel[type],
      count,
      atkPerSoldier,
      defPerSoldier,
      hpPerSoldier,
      lethalityPerSoldier,
      hpPool: count * hpPerSoldier,
    });
  }
  return groups;
}

// 仮のダメージ式(実際の式が分かったらここだけ差し替える)
// 1回のダメージ = 攻撃力 × (1 + 殺傷力/100) × (100 ÷ (100 + 相手の防御力))
function attackDamage(attacker: TroopGroup, defender: TroopGroup): number {
  const perSoldier =
    attacker.atkPerSoldier * (1 + attacker.lethalityPerSoldier / 100) *
    (100 / (100 + defender.defPerSoldier));
  return perSoldier * attacker.count;
}

// 盾→槍→弓の順で、最初に生き残っているグループを狙う
function pickTarget(groups: TroopGroup[]): TroopGroup | null {
  for (const t of troopOrder) {
    const g = groups.find((g) => g.type === t && g.count > 0);
    if (g) return g;
  }
  return null;
}

function applyDamage(target: TroopGroup, damage: number) {
  target.hpPool = Math.max(0, target.hpPool - damage);
  target.count = target.hpPerSoldier > 0 ? Math.floor(target.hpPool / target.hpPerSoldier) : 0;
}

function isWiped(groups: TroopGroup[]): boolean {
  return groups.every((g) => g.count <= 0);
}

type BattleResult = {
  winner: "self" | "opponent" | "draw";
  turns: number;
  selfGroups: TroopGroup[];
  opponentGroups: TroopGroup[];
};

function simulateBattle(selfGroups: TroopGroup[], opponentGroups: TroopGroup[]): BattleResult {
  const self = selfGroups.map((g) => ({ ...g }));
  const opponent = opponentGroups.map((g) => ({ ...g }));
  const maxTurns = 500;
  let turn = 0;

  while (turn < maxTurns) {
    if (isWiped(self) || isWiped(opponent)) break;
    turn++;
    for (const t of troopOrder) {
      const attacker = self.find((g) => g.type === t);
      if (attacker && attacker.count > 0) {
        const target = pickTarget(opponent);
        if (target) applyDamage(target, attackDamage(attacker, target));
      }
      if (isWiped(opponent)) break;

      const opponentAttacker = opponent.find((g) => g.type === t);
      if (opponentAttacker && opponentAttacker.count > 0) {
        const target = pickTarget(self);
        if (target) applyDamage(target, attackDamage(opponentAttacker, target));
      }
      if (isWiped(self)) break;
    }
  }

  const selfAlive = !isWiped(self);
  const opponentAlive = !isWiped(opponent);
  let winner: "self" | "opponent" | "draw" = "draw";
  if (selfAlive && !opponentAlive) winner = "self";
  else if (!selfAlive && opponentAlive) winner = "opponent";

  return { winner, turns: turn, selfGroups: self, opponentGroups: opponent };
}

export default function SimulatePage() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selfId, setSelfId] = useState("");
  const [opponentId, setOpponentId] = useState("");
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

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

  const selfFinal = finalStats(selfHeroes, selfFormation, opponentHeroes, opponentFormation);
  const opponentFinal = finalStats(opponentHeroes, opponentFormation, selfHeroes, selfFormation);

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

  function runBattle() {
    const selfGroups = buildTroopGroups(selfHeroes, selfFormation, opponentHeroes, opponentFormation);
    const opponentGroups = buildTroopGroups(
      opponentHeroes,
      opponentFormation,
      selfHeroes,
      selfFormation
    );
    setBattleResult(simulateBattle(selfGroups, opponentGroups));
  }

  return (
    <div>
      <h1>編成シミュレーター(簡易版)</h1>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
        最終値 = 基礎値×(100%+加算バフ)×(100%+乗算バフ)÷(100%+デバフ)で計算しています。加算バフ=領主装備・領主宝石・英雄スキル、乗算バフ=専用装備・ダイヤバフ・ペットバフ(固定%)。ダイヤバフ・ペットバフは相手側の被ダメージにも影響します。ターン制の本格シミュレーターは開発中です。
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

      {showResult && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>ターン制戦闘シミュレーション(β)</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            両編成に兵士数・兵種割合(歩兵%/騎兵%/弓兵%)が登録されている必要があります。ダメージ式は仮のものです(攻撃力×(1+殺傷力/100)×100÷(100+相手の防御力))。
          </p>
          <button onClick={runBattle}>シミュレーション実行</button>

          {battleResult && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>
                結果:{" "}
                <span
                  style={{
                    color:
                      battleResult.winner === "self"
                        ? "#38bdf8"
                        : battleResult.winner === "opponent"
                        ? "#f87171"
                        : "#94a3b8",
                  }}
                >
                  {battleResult.winner === "self"
                    ? "自分の勝利"
                    : battleResult.winner === "opponent"
                    ? "相手の勝利"
                    : "決着つかず(500ターン到達)"}
                </span>{" "}
                / {battleResult.turns}ターン
              </h3>

              <div className="row">
                <div>
                  <strong>自分の残存兵力</strong>
                  {battleResult.selfGroups.length === 0 && (
                    <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                      兵士数・兵種割合が未登録です。
                    </p>
                  )}
                  {battleResult.selfGroups.map((g) => (
                    <div key={g.type} style={{ fontSize: "0.9rem" }}>
                      {g.label}: {g.count}人
                    </div>
                  ))}
                </div>
                <div>
                  <strong>相手の残存兵力</strong>
                  {battleResult.opponentGroups.length === 0 && (
                    <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                      兵士数・兵種割合が未登録です。
                    </p>
                  )}
                  {battleResult.opponentGroups.map((g) => (
                    <div key={g.type} style={{ fontSize: "0.9rem" }}>
                      {g.label}: {g.count}人
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
