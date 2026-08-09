"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminClient";

type HeroSkill = {
  id: number;
  heroId: number;
  name: string;
  skillSlot: number; // ゲーム内のスキル番号(1〜3)
  triggerType: string; // "always" | "chance" | "everyNTurns" | "everyNAttacks"
  triggerValue: number | null;
  requiredTroopType: string | null; // 発動に必要な兵種("歩兵"/"騎兵"/"弓兵"/null)
  target: string; // "self" | "enemy"
  stat: string; // "atk" | "def" | "hp" | "lethality"
  value: number;
  durationTurns: number | null;
  targetTroopType: string | null; // 対象の兵種("歩兵"/"騎兵"/"弓兵"/null)
};

type Hero = {
  id: number;
  name: string;
  troopType: string;
  generation: number | null;
  atk: number | null;
  def: number | null;
  hp: number | null;
  lethality: number | null;
  exclusiveGearAtkPct: number | null;
  exclusiveGearDefPct: number | null;
  exclusiveGearHpPct: number | null;
  exclusiveGearLethalityPct: number | null;
  notes: string | null;
  skills: HeroSkill[];
};
type Expert = { id: number; name: string };
type Pet = { id: number; name: string; skill: string | null };

const troopTypeLabel: Record<string, string> = {
  歩兵: "歩兵(盾)",
  騎兵: "騎兵(槍)",
  弓兵: "弓兵(弓)",
};

const statLabel: Record<string, string> = {
  atk: "攻撃力",
  def: "防御力",
  hp: "HP",
  lethality: "殺傷力",
};

function describeSkill(s: HeroSkill): string {
  const targetLabel = s.target === "self" ? "自分" : "敵";
  const sign = s.target === "self" ? "+" : "-";
  let trigger = "常時";
  if (s.triggerType === "chance") trigger = `確率${s.triggerValue ?? "?"}%`;
  else if (s.triggerType === "everyNTurns") trigger = `${s.triggerValue ?? "?"}ターンごと`;
  else if (s.triggerType === "everyNAttacks") trigger = `${s.triggerValue ?? "?"}回攻撃ごと`;
  const duration = s.durationTurns ? `(${s.durationTurns}ターン持続)` : "";
  const required = s.requiredTroopType ? `【${s.requiredTroopType}帯同時】` : "";
  const targetTroop = s.targetTroopType ? `対象:${s.targetTroopType}` : "";
  return `[スキル${s.skillSlot}] ${s.name}: ${required}[${trigger}] ${targetLabel}の${
    statLabel[s.stat] || s.stat
  }${sign}${s.value}%${duration}${targetTroop ? ` (${targetTroop})` : ""}`;
}

export default function MasterPage() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [heroName, setHeroName] = useState("");
  const [heroTroopType, setHeroTroopType] = useState("歩兵");
  const [heroGeneration, setHeroGeneration] = useState("");
  const [heroAtk, setHeroAtk] = useState("");
  const [heroDef, setHeroDef] = useState("");
  const [heroHp, setHeroHp] = useState("");
  const [heroLethality, setHeroLethality] = useState("");
  const [heroExclusiveGearAtk, setHeroExclusiveGearAtk] = useState("");
  const [heroExclusiveGearDef, setHeroExclusiveGearDef] = useState("");
  const [heroExclusiveGearHp, setHeroExclusiveGearHp] = useState("");
  const [heroExclusiveGearLethality, setHeroExclusiveGearLethality] = useState("");
  const [heroNotes, setHeroNotes] = useState("");

  // 新規スキル追加フォーム(編集中の英雄に対して使う)
  const [skillName, setSkillName] = useState("");
  const [skillSlot, setSkillSlot] = useState("1");
  const [skillTriggerType, setSkillTriggerType] = useState("always");
  const [skillTriggerValue, setSkillTriggerValue] = useState("");
  const [skillRequiredTroopType, setSkillRequiredTroopType] = useState("");
  const [skillTarget, setSkillTarget] = useState("self");
  const [skillStat, setSkillStat] = useState("atk");
  const [skillValue, setSkillValue] = useState("");
  const [skillDuration, setSkillDuration] = useState("");
  const [skillTargetTroopType, setSkillTargetTroopType] = useState("");

  const [generationFilter, setGenerationFilter] = useState("");
  const [troopFilter, setTroopFilter] = useState("");

  const [expertName, setExpertName] = useState("");
  const [petName, setPetName] = useState("");
  const [petSkill, setPetSkill] = useState("");

  const [seeding, setSeeding] = useState(false);

  async function loadAll() {
    const [h, e, p] = await Promise.all([
      fetch("/api/heroes").then((r) => r.json()),
      fetch("/api/experts").then((r) => r.json()),
      fetch("/api/pets").then((r) => r.json()),
    ]);
    setHeroes(h);
    setExperts(e);
    setPets(p);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function resetHeroForm() {
    setEditingId(null);
    setHeroName("");
    setHeroTroopType("歩兵");
    setHeroGeneration("");
    setHeroAtk("");
    setHeroDef("");
    setHeroHp("");
    setHeroLethality("");
    setHeroExclusiveGearAtk("");
    setHeroExclusiveGearDef("");
    setHeroExclusiveGearHp("");
    setHeroExclusiveGearLethality("");
    setHeroNotes("");
    resetSkillForm();
  }

  function resetSkillForm() {
    setSkillName("");
    setSkillSlot("1");
    setSkillTriggerType("always");
    setSkillTriggerValue("");
    setSkillRequiredTroopType("");
    setSkillTarget("self");
    setSkillStat("atk");
    setSkillValue("");
    setSkillDuration("");
    setSkillTargetTroopType("");
  }

  function startEditHero(h: Hero) {
    setEditingId(h.id);
    setHeroName(h.name);
    setHeroTroopType(h.troopType);
    setHeroGeneration(h.generation !== null ? String(h.generation) : "");
    setHeroAtk(h.atk !== null ? String(h.atk) : "");
    setHeroDef(h.def !== null ? String(h.def) : "");
    setHeroHp(h.hp !== null ? String(h.hp) : "");
    setHeroLethality(h.lethality !== null ? String(h.lethality) : "");
    setHeroExclusiveGearAtk(
      h.exclusiveGearAtkPct !== null ? String(h.exclusiveGearAtkPct) : ""
    );
    setHeroExclusiveGearDef(
      h.exclusiveGearDefPct !== null ? String(h.exclusiveGearDefPct) : ""
    );
    setHeroExclusiveGearHp(h.exclusiveGearHpPct !== null ? String(h.exclusiveGearHpPct) : "");
    setHeroExclusiveGearLethality(
      h.exclusiveGearLethalityPct !== null ? String(h.exclusiveGearLethalityPct) : ""
    );
    setHeroNotes(h.notes || "");
    resetSkillForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitHero() {
    if (!heroName.trim()) return;

    const body: Record<string, unknown> = {
      name: heroName,
      troopType: heroTroopType,
      generation: heroGeneration,
      atk: heroAtk,
      def: heroDef,
      hp: heroHp,
      lethality: heroLethality,
      exclusiveGearAtkPct: heroExclusiveGearAtk,
      exclusiveGearDefPct: heroExclusiveGearDef,
      exclusiveGearHpPct: heroExclusiveGearHp,
      exclusiveGearLethalityPct: heroExclusiveGearLethality,
      notes: heroNotes,
    };

    if (editingId) {
      const res = await adminFetch(`/api/heroes/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res) return;
    } else {
      await fetch("/api/heroes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    resetHeroForm();
    await loadAll();
  }

  async function addSkill() {
    if (!editingId || !skillName.trim()) return;
    const res = await adminFetch(`/api/heroes/${editingId}/skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: skillName,
        skillSlot: skillSlot,
        triggerType: skillTriggerType,
        triggerValue: skillTriggerValue,
        requiredTroopType: skillRequiredTroopType,
        target: skillTarget,
        stat: skillStat,
        value: skillValue,
        durationTurns: skillDuration,
        targetTroopType: skillTargetTroopType,
      }),
    });
    if (!res) return;
    resetSkillForm();
    await loadAll();
  }

  async function deleteSkill(skillId: number, label: string) {
    if (!confirm(`スキル「${label}」を削除しますか?`)) return;
    const res = await adminFetch(`/api/hero-skills/${skillId}`, { method: "DELETE" });
    if (!res) return;
    await loadAll();
  }

  async function seedHeroes() {
    if (
      !confirm(
        "SSR英雄49人(盾17/槍16/弓16)をまとめて登録しますか?既存の名前は重複登録されません。"
      )
    ) {
      return;
    }
    setSeeding(true);
    try {
      await fetch("/api/heroes/seed", { method: "POST" });
      await loadAll();
    } finally {
      setSeeding(false);
    }
  }

  async function addExpert() {
    if (!expertName.trim()) return;
    await fetch("/api/experts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: expertName }),
    });
    setExpertName("");
    await loadAll();
  }

  async function addPet() {
    if (!petName.trim()) return;
    await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: petName, skill: petSkill }),
    });
    setPetName("");
    setPetSkill("");
    await loadAll();
  }

  async function deleteHero(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか?`)) return;
    const res = await adminFetch(`/api/heroes/${id}`, { method: "DELETE" });
    if (!res) return;
    if (editingId === id) resetHeroForm();
    await loadAll();
  }

  async function deleteExpert(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか?`)) return;
    const res = await adminFetch(`/api/experts/${id}`, { method: "DELETE" });
    if (!res) return;
    await loadAll();
  }

  async function deletePet(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか?`)) return;
    const res = await adminFetch(`/api/pets/${id}`, { method: "DELETE" });
    if (!res) return;
    await loadAll();
  }

  const filteredHeroes = heroes.filter((h) => {
    if (generationFilter && String(h.generation ?? "") !== generationFilter) return false;
    if (troopFilter && h.troopType !== troopFilter) return false;
    return true;
  });

  const editingHero = heroes.find((h) => h.id === editingId) || null;

  return (
    <div>
      <h1>マスターデータ管理</h1>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
        ここで登録した英雄・専門家・ペットが、編成登録ページのプルダウンに出るようになります。
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>英雄の一括登録</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
          SSR英雄49人(盾17/槍16/弓16、世代1〜16)の名前・兵種・世代をまとめて登録します。ステータスやスキルは後で1体ずつ編集してください。
        </p>
        <button onClick={seedHeroes} disabled={seeding}>
          {seeding ? "登録中..." : "SSR英雄49人を一括登録"}
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>英雄{editingId ? "の編集" : "を追加"}</h2>
        <label>英雄名</label>
        <input value={heroName} onChange={(e) => setHeroName(e.target.value)} />

        <div className="row">
          <div>
            <label>兵種</label>
            <select value={heroTroopType} onChange={(e) => setHeroTroopType(e.target.value)}>
              <option value="歩兵">歩兵(盾)</option>
              <option value="騎兵">騎兵(槍)</option>
              <option value="弓兵">弓兵(弓)</option>
            </select>
          </div>
          <div>
            <label>世代</label>
            <input
              value={heroGeneration}
              onChange={(e) => setHeroGeneration(e.target.value)}
              placeholder="例: 12"
            />
          </div>
        </div>

        <div className="row">
          <div>
            <label>攻撃力</label>
            <input value={heroAtk} onChange={(e) => setHeroAtk(e.target.value)} />
          </div>
          <div>
            <label>防御力</label>
            <input value={heroDef} onChange={(e) => setHeroDef(e.target.value)} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>体力(HP)</label>
            <input value={heroHp} onChange={(e) => setHeroHp(e.target.value)} />
          </div>
          <div>
            <label>殺傷力</label>
            <input value={heroLethality} onChange={(e) => setHeroLethality(e.target.value)} />
          </div>
        </div>

        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 16, marginBottom: 4 }}>
          専用装備によるステータス上昇(%・乗算バフ)
        </p>
        <div className="row">
          <div>
            <label>攻撃力</label>
            <input
              value={heroExclusiveGearAtk}
              onChange={(e) => setHeroExclusiveGearAtk(e.target.value)}
            />
          </div>
          <div>
            <label>防御力</label>
            <input
              value={heroExclusiveGearDef}
              onChange={(e) => setHeroExclusiveGearDef(e.target.value)}
            />
          </div>
        </div>
        <div className="row">
          <div>
            <label>HP</label>
            <input
              value={heroExclusiveGearHp}
              onChange={(e) => setHeroExclusiveGearHp(e.target.value)}
            />
          </div>
          <div>
            <label>殺傷力</label>
            <input
              value={heroExclusiveGearLethality}
              onChange={(e) => setHeroExclusiveGearLethality(e.target.value)}
            />
          </div>
        </div>

        <label>メモ(自由記述)</label>
        <textarea
          value={heroNotes}
          onChange={(e) => setHeroNotes(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: "8px",
            border: "1px solid #334155",
            background: "#0f172a",
            color: "#e2e8f0",
            fontSize: "1rem",
          }}
        />

        <button onClick={submitHero}>{editingId ? "英雄を更新" : "英雄を追加"}</button>
        {editingId && (
          <button
            onClick={resetHeroForm}
            style={{ marginLeft: 8, background: "#334155", color: "#e2e8f0" }}
          >
            編集をキャンセル
          </button>
        )}

        {editingId && editingHero && (
          <div style={{ marginTop: 20, borderTop: "1px solid #334155", paddingTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>{editingHero.name}のスキル一覧</h3>
            {editingHero.skills.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                まだスキルが登録されていません。
              </p>
            )}
            {editingHero.skills.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                  fontSize: "0.9rem",
                }}
              >
                <span>{describeSkill(s)}</span>
                <button
                  onClick={() => deleteSkill(s.id, s.name)}
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

            <h3>スキルを追加</h3>
            <label>スキル名</label>
            <input
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="例: 決起集会"
            />

            <label>スキル番号(ゲーム内のスキル1〜3。集結リーダーは全部、フィラーはスキル1のみ反映)</label>
            <select value={skillSlot} onChange={(e) => setSkillSlot(e.target.value)}>
              <option value="1">スキル1</option>
              <option value="2">スキル2</option>
              <option value="3">スキル3</option>
            </select>

            <div className="row">
              <div>
                <label>発動条件</label>
                <select
                  value={skillTriggerType}
                  onChange={(e) => setSkillTriggerType(e.target.value)}
                >
                  <option value="always">常時</option>
                  <option value="chance">確率(%)</option>
                  <option value="everyNTurns">Nターンごと</option>
                  <option value="everyNAttacks">N回攻撃ごと</option>
                </select>
              </div>
              {skillTriggerType !== "always" && (
                <div>
                  <label>
                    {skillTriggerType === "chance"
                      ? "確率(%)"
                      : skillTriggerType === "everyNTurns"
                      ? "何ターンごと"
                      : "何回攻撃ごと"}
                  </label>
                  <input
                    value={skillTriggerValue}
                    onChange={(e) => setSkillTriggerValue(e.target.value)}
                  />
                </div>
              )}
            </div>

            <label>発動に必要な兵種(その兵種を連れていないと発動しない。指定なしなら常に発動)</label>
            <select
              value={skillRequiredTroopType}
              onChange={(e) => setSkillRequiredTroopType(e.target.value)}
            >
              <option value="">指定なし(常に発動)</option>
              <option value="歩兵">歩兵(盾)を連れている時のみ</option>
              <option value="騎兵">騎兵(槍)を連れている時のみ</option>
              <option value="弓兵">弓兵(弓)を連れている時のみ</option>
            </select>

            <div className="row">
              <div>
                <label>対象</label>
                <select value={skillTarget} onChange={(e) => setSkillTarget(e.target.value)}>
                  <option value="self">自分(上昇)</option>
                  <option value="enemy">敵(下降)</option>
                </select>
              </div>
              <div>
                <label>ステータス</label>
                <select value={skillStat} onChange={(e) => setSkillStat(e.target.value)}>
                  <option value="atk">攻撃力</option>
                  <option value="def">防御力</option>
                  <option value="hp">HP</option>
                  <option value="lethality">殺傷力</option>
                </select>
              </div>
            </div>

            <label>対象の兵種(このスキルが狙う兵種。指定なしなら兵種を問わない)</label>
            <select
              value={skillTargetTroopType}
              onChange={(e) => setSkillTargetTroopType(e.target.value)}
            >
              <option value="">指定なし</option>
              <option value="歩兵">歩兵(盾)を狙う</option>
              <option value="騎兵">騎兵(槍)を狙う</option>
              <option value="弓兵">弓兵(弓)を狙う</option>
            </select>

            <div className="row">
              <div>
                <label>値(%)</label>
                <input
                  value={skillValue}
                  onChange={(e) => setSkillValue(e.target.value)}
                  placeholder="例: 25"
                />
              </div>
              <div>
                <label>持続ターン数(任意)</label>
                <input
                  value={skillDuration}
                  onChange={(e) => setSkillDuration(e.target.value)}
                  placeholder="例: 2"
                />
              </div>
            </div>

            <button onClick={addSkill}>このスキルを追加</button>
          </div>
        )}

        <div className="row" style={{ marginTop: 16 }}>
          <div>
            <label>絞り込み: 兵種</label>
            <select value={troopFilter} onChange={(e) => setTroopFilter(e.target.value)}>
              <option value="">すべて</option>
              <option value="歩兵">歩兵(盾)</option>
              <option value="騎兵">騎兵(槍)</option>
              <option value="弓兵">弓兵(弓)</option>
            </select>
          </div>
          <div>
            <label>絞り込み: 世代</label>
            <select
              value={generationFilter}
              onChange={(e) => setGenerationFilter(e.target.value)}
            >
              <option value="">すべて</option>
              {Array.from({ length: 16 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  第{g}世代
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {filteredHeroes.map((h) => (
            <div
              key={h.id}
              style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <div>
                ・{h.name} ({troopTypeLabel[h.troopType] || h.troopType}
                {h.generation ? ` / 第${h.generation}世代` : ""}) 攻{h.atk ?? "-"} / 防
                {h.def ?? "-"} / 体{h.hp ?? "-"} / 殺{h.lethality ?? "-"} / スキル
                {h.skills.length}個
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => startEditHero(h)}
                  style={{
                    marginTop: 0,
                    padding: "4px 10px",
                    fontSize: "0.8rem",
                    background: "#1e3a5f",
                    color: "#bfdbfe",
                  }}
                >
                  編集
                </button>
                <button
                  onClick={() => deleteHero(h.id, h.name)}
                  style={{
                    marginTop: 0,
                    padding: "4px 10px",
                    fontSize: "0.8rem",
                    background: "#7f1d1d",
                    color: "#fecaca",
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>専門家</h2>
        <label>専門家名</label>
        <input value={expertName} onChange={(e) => setExpertName(e.target.value)} />
        <button onClick={addExpert}>専門家を追加</button>

        <div style={{ marginTop: 16 }}>
          {experts.map((ex) => (
            <div
              key={ex.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <div>・{ex.name}</div>
              <button
                onClick={() => deleteExpert(ex.id, ex.name)}
                style={{
                  marginTop: 0,
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  background: "#7f1d1d",
                  color: "#fecaca",
                }}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>ペット</h2>
        <label>ペット名</label>
        <input value={petName} onChange={(e) => setPetName(e.target.value)} />
        <label>スキル(任意)</label>
        <input value={petSkill} onChange={(e) => setPetSkill(e.target.value)} />
        <button onClick={addPet}>ペットを追加</button>

        <div style={{ marginTop: 16 }}>
          {pets.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <div>
                ・{p.name} {p.skill ? `(${p.skill})` : ""}
              </div>
              <button
                onClick={() => deletePet(p.id, p.name)}
                style={{
                  marginTop: 0,
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  background: "#7f1d1d",
                  color: "#fecaca",
                }}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
