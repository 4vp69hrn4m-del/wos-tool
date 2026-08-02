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
};
type Expert = { id: number; name: string };
type Pet = { id: number; name: string; skill: string | null };

const troopTypeLabel: Record<string, string> = {
  歩兵: "歩兵(盾)",
  騎兵: "騎兵(槍)",
  弓兵: "弓兵(弓)",
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
      }),
    });
    setHeroName("");
    setHeroAtk("");
    setHeroDef("");
    setHeroHp("");
    setHeroLethality("");
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

        <button onClick={addHero}>英雄を追加</button>

        <div style={{ marginTop: 16 }}>
          {heroes.map((h) => (
            <div key={h.id}>
              ・{h.name} ({troopTypeLabel[h.troopType] || h.troopType}) 攻{h.atk ?? "-"} / 防
              {h.def ?? "-"} / 体{h.hp ?? "-"} / 殺{h.lethality ?? "-"}
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

