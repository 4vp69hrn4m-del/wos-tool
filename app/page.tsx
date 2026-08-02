"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Formation = {
  id: number;
  label: string | null;
  side: string;
  formationType: string | null;
  hero1Name: string | null;
  hero2Name: string | null;
  hero3Name: string | null;
  expertName: string | null;
  petName: string | null;
  infantryPct: number | null;
  cavalryPct: number | null;
  archerPct: number | null;
  equipmentNote: string | null;
  createdAt: string;
};

type Hero = { id: number; name: string };
type Expert = { id: number; name: string };
type Pet = { id: number; name: string };

const emptyForm = {
  label: "",
  side: "self",
  formationType: "attack",
  hero1Name: "",
  hero2Name: "",
  hero3Name: "",
  expertName: "",
  petName: "",
  infantryPct: "",
  cavalryPct: "",
  archerPct: "",
  equipmentNote: "",
};

export default function FormationsPage() {
  const [form, setForm] = useState(emptyForm);
  const [list, setList] = useState<Formation[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    const [f, h, e, p] = await Promise.all([
      fetch("/api/formations").then((r) => r.json()),
      fetch("/api/heroes").then((r) => r.json()),
      fetch("/api/experts").then((r) => r.json()),
      fetch("/api/pets").then((r) => r.json()),
    ]);
    setList(f);
    setHeroes(h);
    setExperts(e);
    setPets(p);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    try {
      await fetch("/api/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  const noMasterData = heroes.length === 0 && experts.length === 0 && pets.length === 0;

  return (
    <div>
      <h1>編成の登録</h1>

      {noMasterData && (
        <div className="card" style={{ borderColor: "#38bdf8" }}>
          英雄・専門家・ペットがまだ1件も登録されていません。
          <br />
          先に <Link href="/master">マスターデータ管理ページ</Link> から登録してください。
        </div>
      )}

      <div className="card">
        <label>メモ名(例: 対〇〇同盟 攻め用)</label>
        <input value={form.label} onChange={(e) => update("label", e.target.value)} />

        <div className="row">
          <div>
            <label>どちら側か</label>
            <select value={form.side} onChange={(e) => update("side", e.target.value)}>
              <option value="self">自分</option>
              <option value="opponent">相手</option>
            </select>
          </div>
          <div>
            <label>編成タイプ</label>
            <select
              value={form.formationType}
              onChange={(e) => update("formationType", e.target.value)}
            >
              <option value="attack">攻撃編成</option>
              <option value="defense">防衛編成</option>
            </select>
          </div>
        </div>

        <label>英雄1</label>
        <select value={form.hero1Name} onChange={(e) => update("hero1Name", e.target.value)}>
          <option value="">(選択してください)</option>
          {heroes.map((h) => (
            <option key={h.id} value={h.name}>
              {h.name}
            </option>
          ))}
        </select>

        <label>英雄2</label>
        <select value={form.hero2Name} onChange={(e) => update("hero2Name", e.target.value)}>
          <option value="">(選択してください)</option>
          {heroes.map((h) => (
            <option key={h.id} value={h.name}>
              {h.name}
            </option>
          ))}
        </select>

        <label>英雄3</label>
        <select value={form.hero3Name} onChange={(e) => update("hero3Name", e.target.value)}>
          <option value="">(選択してください)</option>
          {heroes.map((h) => (
            <option key={h.id} value={h.name}>
              {h.name}
            </option>
          ))}
        </select>

        <label>専門家</label>
        <select value={form.expertName} onChange={(e) => update("expertName", e.target.value)}>
          <option value="">(選択してください)</option>
          {experts.map((ex) => (
            <option key={ex.id} value={ex.name}>
              {ex.name}
            </option>
          ))}
        </select>

        <label>ペット</label>
        <select value={form.petName} onChange={(e) => update("petName", e.target.value)}>
          <option value="">(選択してください)</option>
          {pets.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="row">
          <div>
            <label>歩兵%</label>
            <input value={form.infantryPct} onChange={(e) => update("infantryPct", e.target.value)} />
          </div>
          <div>
            <label>騎兵%</label>
            <input value={form.cavalryPct} onChange={(e) => update("cavalryPct", e.target.value)} />
          </div>
          <div>
            <label>弓兵%</label>
            <input value={form.archerPct} onChange={(e) => update("archerPct", e.target.value)} />
          </div>
        </div>

        <label>装備メモ(自由記述・後で構造化予定)</label>
        <input
          value={form.equipmentNote}
          onChange={(e) => update("equipmentNote", e.target.value)}
        />

        <button onClick={submit} disabled={loading}>
          {loading ? "保存中..." : "この編成を保存する"}
        </button>
      </div>

      <h1>登録済みの編成</h1>
      {list.length === 0 && <p>まだ登録がありません。</p>}
      {list.map((f) => (
        <div className="card" key={f.id}>
          <strong>{f.label || "(名前なし)"}</strong>
          <div>
            {f.side === "self" ? "自分" : "相手"} / {f.formationType === "attack" ? "攻撃" : "防衛"}
          </div>
          <div>
            英雄: {f.hero1Name} / {f.hero2Name} / {f.hero3Name}
          </div>
          <div>
            専門家: {f.expertName || "-"} / ペット: {f.petName || "-"}
          </div>
          <div>
            兵種割合: 歩{f.infantryPct ?? "-"}% 騎{f.cavalryPct ?? "-"}% 弓{f.archerPct ?? "-"}%
          </div>
          {f.equipmentNote && <div>装備メモ: {f.equipmentNote}</div>}
        </div>
      ))}
    </div>
  );
}
