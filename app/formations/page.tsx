"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminClient";

type Formation = {
  id: number;
  label: string | null;
  side: string;
  formationType: string | null;
  shieldHeroName: string | null;
  spearHeroName: string | null;
  bowHeroName: string | null;
  expertName: string | null;
  petName: string | null;
  infantryPct: number | null;
  cavalryPct: number | null;
  archerPct: number | null;
  troopCount: number | null;
  equipmentNote: string | null;
  createdAt: string;
};

type Hero = { id: number; name: string; troopType: string };
type Expert = { id: number; name: string };
type Pet = { id: number; name: string };

const emptyForm = {
  label: "",
  side: "self",
  formationType: "attack",
  shieldHeroName: "",
  spearHeroName: "",
  bowHeroName: "",
  expertName: "",
  petName: "",
  infantryPct: "",
  cavalryPct: "",
  archerPct: "",
  troopCount: "",
  equipmentNote: "",
};

const statCols = [
  ["atk", "攻撃力"],
  ["def", "防御力"],
  ["lethality", "殺傷力"],
  ["hp", "HP"],
] as const;

const equipCols = statCols.filter(([key]) => key === "atk" || key === "def");
const gemCols = statCols.filter(([key]) => key === "lethality" || key === "hp");

const troopRows = [
  ["shield", "盾兵"],
  ["spear", "槍兵"],
  ["bow", "弓兵"],
] as const;

function StatGrid({
  cols,
  values,
  onChange,
}: {
  cols: readonly (readonly [string, string])[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 4 }}></th>
            {cols.map(([key, label]) => (
              <th key={key} style={{ padding: 4 }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {troopRows.map(([troopKey, troopLabel]) => (
            <tr key={troopKey}>
              <td style={{ padding: 4, color: "#94a3b8" }}>{troopLabel}</td>
              {cols.map(([statKey]) => (
                <td key={statKey} style={{ padding: 2 }}>
                  <input
                    value={values[`${troopKey}_${statKey}`] || ""}
                    onChange={(e) => onChange(`${troopKey}_${statKey}`, e.target.value)}
                    style={{ width: "100%", padding: "4px 6px" }}
                    placeholder="0"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FormationsPage() {
  const [form, setForm] = useState(emptyForm);
  const [equipStats, setEquipStats] = useState<Record<string, string>>({});
  const [gemStats, setGemStats] = useState<Record<string, string>>({});
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
      const body: Record<string, unknown> = { ...form };
      for (const [troopKey] of troopRows) {
        const troopCapKey = troopKey.charAt(0).toUpperCase() + troopKey.slice(1);
        for (const [statKey] of equipCols) {
          const k = `${troopKey}_${statKey}`;
          const capKey = statKey.charAt(0).toUpperCase() + statKey.slice(1);
          body[`equip${troopCapKey}${capKey}Pct`] = equipStats[k] || "";
        }
        for (const [statKey] of gemCols) {
          const k = `${troopKey}_${statKey}`;
          const capKey = statKey.charAt(0).toUpperCase() + statKey.slice(1);
          body[`gem${troopCapKey}${capKey}Pct`] = gemStats[k] || "";
        }
      }

      await fetch("/api/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setForm(emptyForm);
      setEquipStats({});
      setGemStats({});
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  async function deleteFormation(id: number, label: string | null) {
    if (!confirm(`「${label || "この編成"}」を削除しますか?`)) return;
    const res = await adminFetch(`/api/formations/${id}`, { method: "DELETE" });
    if (!res) return;
    await loadAll();
  }

  const shieldHeroes = heroes.filter((h) => h.troopType === "歩兵");
  const spearHeroes = heroes.filter((h) => h.troopType === "騎兵");
  const bowHeroes = heroes.filter((h) => h.troopType === "弓兵");

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

        <label>盾英雄(歩兵)</label>
        <select
          value={form.shieldHeroName}
          onChange={(e) => update("shieldHeroName", e.target.value)}
        >
          <option value="">(選択してください)</option>
          {shieldHeroes.map((h) => (
            <option key={h.id} value={h.name}>
              {h.name}
            </option>
          ))}
        </select>

        <label>槍英雄(騎兵)</label>
        <select
          value={form.spearHeroName}
          onChange={(e) => update("spearHeroName", e.target.value)}
        >
          <option value="">(選択してください)</option>
          {spearHeroes.map((h) => (
            <option key={h.id} value={h.name}>
              {h.name}
            </option>
          ))}
        </select>

        <label>弓英雄(弓兵)</label>
        <select value={form.bowHeroName} onChange={(e) => update("bowHeroName", e.target.value)}>
          <option value="">(選択してください)</option>
          {bowHeroes.map((h) => (
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

        <label>兵士数</label>
        <input value={form.troopCount} onChange={(e) => update("troopCount", e.target.value)} />

        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 16, marginBottom: 4 }}>
          領主装備(%・任意)
        </p>
        <StatGrid
          cols={equipCols}
          values={equipStats}
          onChange={(k, v) => setEquipStats((prev) => ({ ...prev, [k]: v }))}
        />

        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 16, marginBottom: 4 }}>
          領主宝石(%・任意)
        </p>
        <StatGrid
          cols={gemCols}
          values={gemStats}
          onChange={(k, v) => setGemStats((prev) => ({ ...prev, [k]: v }))}
        />

        <label style={{ marginTop: 16 }}>装備メモ(自由記述・後で構造化予定)</label>
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
        <div
          className="card"
          key={f.id}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <div>
            <strong>{f.label || "(名前なし)"}</strong>
            <div>
              {f.side === "self" ? "自分" : "相手"} /{" "}
              {f.formationType === "attack" ? "攻撃" : "防衛"}
            </div>
            <div>
              盾: {f.shieldHeroName || "-"} / 槍: {f.spearHeroName || "-"} / 弓:{" "}
              {f.bowHeroName || "-"}
            </div>
            <div>
              専門家: {f.expertName || "-"} / ペット: {f.petName || "-"}
            </div>
            <div>
              兵種割合: 歩{f.infantryPct ?? "-"}% 騎{f.cavalryPct ?? "-"}% 弓
              {f.archerPct ?? "-"}% / 兵士数: {f.troopCount ?? "-"}
            </div>
            {f.equipmentNote && <div>装備メモ: {f.equipmentNote}</div>}
          </div>
          <button
            onClick={() => deleteFormation(f.id, f.label)}
            style={{
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
    </div>
  );
}
