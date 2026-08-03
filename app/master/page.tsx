"use client";

import { useEffect, useState } from "react";

type Hero = {
  id: number;
  name: string;
  troopType: string;
  generation: number | null;
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
  skills: string | null;
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

function describeEffect(
  target: string | null,
  stat: string | null,
  value: number | null
) {
  if (!target || !stat || value === null) return null;
  const targetLabel = target === "self" ? "自分" : "敵";
  const sign = target === "self" ? "+" : "-";
  return `${targetLabel}の${statLabel[stat]}${sign}${value}%`;
}

function describeAllEffects(h: Hero) {
  const pairs: [string | null, string | null, number | null][] = [
    [h.skillEffectTarget1, h.skillEffectStat1, h.skillEffectValue1],
    [h.skillEffectTarget2, h.skillEffectStat2, h.skillEffectValue2],
    [h.skillEffectTarget3, h.skillEffectStat3, h.skillEffectValue3],
  ];
  return pairs
    .map(([target, stat, value]) => describeEffect(target, stat, value))
    .filter((s): s is string => s !== null);
}

type EffectDraft = { target: string; stat: string; value: string };
const emptyEffect: EffectDraft = { target: "", stat: "", value: "" };

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
  const [heroSkills, setHeroSkills] = useState("");
  const [effects, setEffects] = useState<EffectDraft[]>([
    { ...emptyEffect },
    { ...emptyEffect },
    { ...emptyEffect },
  ]);

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

  function updateEffect(index: number, patch: Partial<EffectDraft>) {
    setEffects((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function resetHeroForm() {
    setEditingId(null);
    setHeroName("");
    setHeroTroopType("歩兵");
    setHeroGeneration("");
    setHeroAtk("");
    setHeroDef("");
    setHeroHp("");
    setHeroLethality("");
    setHeroSkills("");
    setEffects([{ ...emptyEffect }, { ...emptyEffect }, { ...emptyEffect }]);
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
    setHeroSkills(h.skills || "");
    setEffects([
      {
        target: h.skillEffectTarget1 || "",
        stat: h.skillEffectStat1 || "",
        value: h.skillEffectValue1 !== null ? String(h.skillEffectValue1) : "",
      },
      {
        target: h.skillEffectTarget2 || "",
        stat: h.skillEffectStat2 || "",
        value: h.skillEffectValue2 !== null ? String(h.skillEffectValue2) : "",
      },
      {
        target: h.skillEffectTarget3 || "",
        stat: h.skillEffectStat3 || "",
        value: h.skillEffectValue3 !== null ? String(h.skillEffectValue3) : "",
      },
    ]);
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
      skills: heroSkills,
    };
    effects.forEach((e, i) => {
      body[`skillEffectTarget${i + 1}`] = e.target;
      body[`skillEffectStat${i + 1}`] = e.stat;
      body[`skillEffectValue${i + 1}`] = e.value;
    });

    if (editingId) {
      await fetch(`/api/heroes/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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

  async function seedHeroes() {
    if (!confirm("SSR英雄49人(盾17/槍16/弓16)をまとめて登録しますか?既存の名前は重複登録されません。")) {
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
    await fetch(`/api/heroes/${id}`, { method: "DELETE" });
    if (editingId === id) resetHeroForm();
    await loadAll();
  }

  async function deleteExpert(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか?`)) return;
    await fetch(`/api/experts/${id}`, { method: "DELETE" });
    await loadAll();
  }

  async function deletePet(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか?`)) return;
    await fetch(`/api/pets/${id}`, { method: "DELETE" });
    await loadAll();
  }

  const filteredHeroes = heroes.filter((h) => {
    if (generationFilter && String(h.generation ?? "") !== generationFilter) return false;
    if (troopFilter && h.troopType !== troopFilter) return false;
    return true;
  });

  return (
    <div>
      <h1>マスターデータ管理</h1>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
        ここで登録した英雄・専門家・ペットが、編成登録ページのプルダウンに出るようになります。
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>英雄の一括登録</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
          SSR英雄49人(盾17/槍16/弓16、世代1〜16)の名前・兵種・世代をまとめて登録します。ステータスは後で1体ずつ編集してください。
        </p>
        <button onClick={seedHeroes} disabled={seeding}>
          {seeding ? "登録中..." : "SSR英雄49人を一括登録"}
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>
          英雄{editingId ? "の編集" : "を追加"}
        </h2>
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

        {effects.map((eff, i) => (
          <div key={i}>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "0.85rem",
                marginTop: 16,
                marginBottom: 4,
              }}
            >
              主要スキル効果{i + 1}(計算に使う数値・任意)
            </p>
            <div className="row">
              <div>
                <label>対象</label>
                <select
                  value={eff.target}
                  onChange={(e) => updateEffect(i, { target: e.target.value })}
                >
                  <option value="">(なし)</option>
                  <option value="self">自分(上昇)</option>
                  <option value="enemy">敵(下降)</option>
                </select>
              </div>
              <div>
                <label>ステータス</label>
                <select
                  value={eff.stat}
                  onChange={(e) => updateEffect(i, { stat: e.target.value })}
                >
                  <option value="">(なし)</option>
                  <option value="atk">攻撃力</option>
                  <option value="def">防御力</option>
                  <option value="hp">HP</option>
                  <option value="lethality">殺傷力</option>
                </select>
              </div>
              <div>
                <label>値(%)</label>
                <input
                  value={eff.value}
                  onChange={(e) => updateEffect(i, { value: e.target.value })}
                  placeholder="例: 30"
                />
              </div>
            </div>
          </div>
        ))}

        <label>スキルメモ(自由記述・参考情報。計算には使われません)</label>
        <textarea
          value={heroSkills}
          onChange={(e) => setHeroSkills(e.target.value)}
          rows={4}
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
            <select value={generationFilter} onChange={(e) => setGenerationFilter(e.target.value)}>
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
          {filteredHeroes.map((h) => {
            const effectTexts = describeAllEffects(h);
            return (
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
                  {h.def ?? "-"} / 体{h.hp ?? "-"} / 殺{h.lethality ?? "-"}
                  {effectTexts.length > 0 && <span> / スキル効果: {effectTexts.join("、")}</span>}
                  {h.skills && (
                    <div style={{ color: "#94a3b8", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                      {h.skills}
                    </div>
                  )}
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
            );
          })}
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
