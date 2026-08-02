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
  skillEffectStat1: string | null;
  skillEffectValue1: number | null;
  skillEffectStat2: string | null;
  skillEffectValue2: number | null;
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

export default function MasterPage() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);

  const [heroName, setHeroName] = useState("");
  const [heroTroopType, setHeroTroopType] = useState("歩兵");
  const [heroAtk, setHeroAtk] = useState("");
  const [heroDef, setHeroDef] = useState("");
  const [heroHp, setHeroHp] = useState("");
  const [heroLethality, setHeroLethality] = useState("");
  const [skillEffectStat1, setSkillEffectStat1] = useState("");
  const [skillEffectValue1, setSkillEffectValue1] = useState("");
  const [skillEffectStat2, setSkillEffectStat2] = useState("");
  const [skillEffectValue2, setSkillEffectValue2] = useState("");
  const [heroSkills, setHeroSkills] = useState("");

  const [expertName, setExpertName] = useState("");
  const [petName, setPetName] = useState("");
  const [petSkill, setPetSkill] = useState("");

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

  async function addHero() {
    if (!heroName.trim()) return;
    await fetch("/api/heroes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: heroName,
        troopType: heroTroopType,
        atk: heroAtk,
        def: heroDef,
        hp: heroHp,
        lethality: heroLethality,
        skillEffectStat1,
        skillEffectValue1,
        skillEffectStat2,
        skillEffectValue2,
        skills: heroSkills,
      }),
    });
    setHeroName("");
    setHeroAtk("");
    setHeroDef("");
    setHeroHp("");
    setHeroLethality("");
    setSkillEffectStat1("");
    setSkillEffectValue1("");
    setSkillEffectStat2("");
    setSkillEffectValue2("");
    setHeroSkills("");
    await loadAll();
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

  return (
    <div>
      <h1>マスターデータ管理</h1>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
        ここで登録した英雄・専門家・ペットが、編成登録ページのプルダウンに出るようになります。
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>英雄</h2>
        <label>英雄名</label>
        <input value={heroName} onChange={(e) => setHeroName(e.target.value)} />

        <label>兵種</label>
        <select value={heroTroopType} onChange={(e) => setHeroTroopType(e.target.value)}>
          <option value="歩兵">歩兵(盾)</option>
          <option value="騎兵">騎兵(槍)</option>
          <option value="弓兵">弓兵(弓)</option>
        </select>

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

        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 16, marginBottom: 0 }}>
          主要スキル効果(計算に使う数値・最大2つ)
        </p>

        <div className="row">
          <div>
            <label>効果1の対象</label>
            <select
              value={skillEffectStat1}
              onChange={(e) => setSkillEffectStat1(e.target.value)}
            >
              <option value="">(なし)</option>
              <option value="atk">攻撃力</option>
              <option value="def">防御力</option>
              <option value="hp">HP</option>
              <option value="lethality">殺傷力</option>
            </select>
          </div>
          <div>
            <label>効果1の値(%)</label>
            <input
              value={skillEffectValue1}
              onChange={(e) => setSkillEffectValue1(e.target.value)}
              placeholder="例: 30"
            />
          </div>
        </div>

        <div className="row">
          <div>
            <label>効果2の対象</label>
            <select
              value={skillEffectStat2}
              onChange={(e) => setSkillEffectStat2(e.target.value)}
            >
              <option value="">(なし)</option>
              <option value="atk">攻撃力</option>
              <option value="def">防御力</option>
              <option value="hp">HP</option>
              <option value="lethality">殺傷力</option>
            </select>
          </div>
          <div>
            <label>効果2の値(%)</label>
            <input
              value={skillEffectValue2}
              onChange={(e) => setSkillEffectValue2(e.target.value)}
              placeholder="例: 15"
            />
          </div>
        </div>

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

        <button onClick={addHero}>英雄を追加</button>

        <div style={{ marginTop: 16 }}>
          {heroes.map((h) => (
            <div key={h.id} style={{ marginBottom: 8 }}>
              ・{h.name} ({troopTypeLabel[h.troopType] || h.troopType}) 攻{h.atk ?? "-"} / 防
              {h.def ?? "-"} / 体{h.hp ?? "-"} / 殺{h.lethality ?? "-"}
              {h.skillEffectStat1 && (
                <span>
                  {" "}
                  / スキル効果: {statLabel[h.skillEffectStat1]}+{h.skillEffectValue1}%
                </span>
              )}
              {h.skillEffectStat2 && (
                <span>
                  、{statLabel[h.skillEffectStat2]}+{h.skillEffectValue2}%
                </span>
              )}
              {h.skills && (
                <div style={{ color: "#94a3b8", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                  {h.skills}
                </div>
              )}
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
            <div key={ex.id}>・{ex.name}</div>
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
            <div key={p.id}>
              ・{p.name} {p.skill ? `(${p.skill})` : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
