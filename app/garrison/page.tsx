"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminClient";

type Hero = { id: number; name: string; troopType: string };

type Participant = {
  id: number;
  side: string;
  playerName: string;
  troopCount: number | null;
  kills: number | null;
  isLeader: boolean;
  shieldHero: Hero | null;
  spearHero: Hero | null;
  bowHero: Hero | null;
};

type Battle = {
  id: number;
  label: string | null;
  battleDate: string | null;
  side: string;
  result: string | null;
  myName: string | null;
  myAlliance: string | null;
  enemyName: string | null;
  enemyAlliance: string | null;
  myShieldCount: number | null;
  mySpearCount: number | null;
  myBowCount: number | null;
  enemyShieldCount: number | null;
  enemySpearCount: number | null;
  enemyBowCount: number | null;
  mySurvivors: number | null;
  enemySurvivors: number | null;
  myLoss: number | null;
  enemyLoss: number | null;
  myInjured: number | null;
  enemyInjured: number | null;
  myLightInjured: number | null;
  enemyLightInjured: number | null;
  notes: string | null;
  participants: Participant[];
};

const troopRows = [
  ["shield", "盾兵"],
  ["spear", "槍兵"],
  ["bow", "弓兵"],
] as const;

const statCols = [
  ["atk", "攻撃力"],
  ["def", "防御力"],
  ["lethality", "殺傷力"],
  ["hp", "HP"],
] as const;

const emptyBattleForm = {
  label: "",
  battleDate: "",
  side: "defense",
  result: "win",
  myName: "",
  myAlliance: "",
  enemyName: "",
  enemyAlliance: "",
  myShieldCount: "",
  mySpearCount: "",
  myBowCount: "",
  enemyShieldCount: "",
  enemySpearCount: "",
  enemyBowCount: "",
  myLoss: "",
  myInjured: "",
  myLightInjured: "",
  mySurvivors: "",
  enemyLoss: "",
  enemyInjured: "",
  enemyLightInjured: "",
  enemySurvivors: "",
  notes: "",
};

function BuffGrid({
  prefix,
  values,
  onChange,
}: {
  prefix: "my" | "enemy";
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 4 }}></th>
            {statCols.map(([key, label]) => (
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
              {statCols.map(([statKey]) => {
                const k = `${prefix}_${troopKey}_${statKey}`;
                return (
                  <td key={statKey} style={{ padding: 2 }}>
                    <input
                      value={values[k] || ""}
                      onChange={(e) => onChange(k, e.target.value)}
                      style={{ width: "100%", padding: "4px 6px" }}
                      placeholder="%"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const emptyParticipantForm = {
  side: "mine",
  playerName: "",
  troopCount: "",
  kills: "",
  isLeader: false,
  shieldHeroId: "",
  spearHeroId: "",
  bowHeroId: "",
};

function ParticipantForm({
  battleId,
  heroes,
  onAdded,
}: {
  battleId: number;
  heroes: Hero[];
  onAdded: () => void;
}) {
  const [form, setForm] = useState(emptyParticipantForm);
  const [loading, setLoading] = useState(false);

  const shieldHeroes = heroes.filter((h) => h.troopType === "歩兵");
  const spearHeroes = heroes.filter((h) => h.troopType === "騎兵");
  const bowHeroes = heroes.filter((h) => h.troopType === "弓兵");

  function update(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!form.playerName) return;
    setLoading(true);
    try {
      await fetch("/api/garrison-participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, garrisonBattleId: battleId }),
      });
      setForm(emptyParticipantForm);
      onAdded();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, marginTop: 8 }}>
      <div className="row">
        <div>
          <label>陣営</label>
          <select value={form.side} onChange={(e) => update("side", e.target.value)}>
            <option value="mine">自陣営</option>
            <option value="enemy">相手陣営</option>
          </select>
        </div>
        <div>
          <label>プレイヤー名</label>
          <input value={form.playerName} onChange={(e) => update("playerName", e.target.value)} />
        </div>
      </div>
      <div className="row">
        <div>
          <label>兵力</label>
          <input value={form.troopCount} onChange={(e) => update("troopCount", e.target.value)} />
        </div>
        <div>
          <label>撃墜数</label>
          <input value={form.kills} onChange={(e) => update("kills", e.target.value)} />
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
        <input
          type="checkbox"
          style={{ width: "auto" }}
          checked={form.isLeader}
          onChange={(e) => update("isLeader", e.target.checked)}
        />
        総力最大(リーダー、スキル1〜3全部反映)
      </label>

      <label>盾英雄</label>
      <select value={form.shieldHeroId} onChange={(e) => update("shieldHeroId", e.target.value)}>
        <option value="">(未設定)</option>
        {shieldHeroes.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
      <label>槍英雄</label>
      <select value={form.spearHeroId} onChange={(e) => update("spearHeroId", e.target.value)}>
        <option value="">(未設定)</option>
        {spearHeroes.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
      <label>弓英雄</label>
      <select value={form.bowHeroId} onChange={(e) => update("bowHeroId", e.target.value)}>
        <option value="">(未設定)</option>
        {bowHeroes.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>

      <button onClick={submit} disabled={loading || !form.playerName}>
        参加者を追加
      </button>
    </div>
  );
}

export default function GarrisonPage() {
  const [form, setForm] = useState(emptyBattleForm);
  const [buffValues, setBuffValues] = useState<Record<string, string>>({});
  const [battles, setBattles] = useState<Battle[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function loadAll() {
    const [b, h] = await Promise.all([
      fetch("/api/garrison-battles").then((r) => r.json()),
      fetch("/api/heroes").then((r) => r.json()),
    ]);
    setBattles(b);
    setHeroes(h);
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
      for (const prefix of ["my", "enemy"] as const) {
        for (const [troopKey] of troopRows) {
          const troopCap = troopKey.charAt(0).toUpperCase() + troopKey.slice(1);
          for (const [statKey] of statCols) {
            const capKey = statKey.charAt(0).toUpperCase() + statKey.slice(1);
            const k = `${prefix}_${troopKey}_${statKey}`;
            body[`${prefix}Buff${troopCap}${capKey}Pct`] = buffValues[k] || "";
          }
        }
      }
      await fetch("/api/garrison-battles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setForm(emptyBattleForm);
      setBuffValues({});
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  async function deleteBattle(id: number, label: string | null) {
    if (!confirm(`「${label || "この戦闘レポート"}」を削除しますか?`)) return;
    const res = await adminFetch(`/api/garrison-battles/${id}`, { method: "DELETE" });
    if (!res) return;
    await loadAll();
  }

  async function deleteParticipant(id: number) {
    const res = await adminFetch(`/api/garrison-participants/${id}`, { method: "DELETE" });
    if (!res) return;
    await loadAll();
  }

  return (
    <div>
      <h1>集結/駐屯 戦闘データ</h1>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
        集結・駐屯規模の戦闘レポート(戦闘一覧・追加ステータス・参加者)を保存し、戦闘シミュレーターの係数調整に使うためのページです。
      </p>

      <div className="card">
        <h2 style={{ fontSize: "1.05rem", marginTop: 0 }}>戦闘レポートを追加</h2>

        <label>メモ名(例: DWKs vs NurFace)</label>
        <input value={form.label} onChange={(e) => update("label", e.target.value)} />

        <div className="row">
          <div>
            <label>自陣営が防衛/攻撃どちらか</label>
            <select value={form.side} onChange={(e) => update("side", e.target.value)}>
              <option value="defense">防衛(駐屯)</option>
              <option value="attack">攻撃(集結)</option>
            </select>
          </div>
          <div>
            <label>結果</label>
            <select value={form.result} onChange={(e) => update("result", e.target.value)}>
              <option value="win">勝利</option>
              <option value="lose">敗北</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div>
            <label>自陣営名</label>
            <input value={form.myName} onChange={(e) => update("myName", e.target.value)} />
          </div>
          <div>
            <label>相手陣営名</label>
            <input value={form.enemyName} onChange={(e) => update("enemyName", e.target.value)} />
          </div>
        </div>

        <label style={{ marginTop: 20 }}>兵力(部隊数、兵種別が分かれば下に、分からなければ合計だけメモ欄へ)</label>
        <div className="row">
          <div>
            <label>自軍 盾/槍/弓</label>
            <input placeholder="盾兵" value={form.myShieldCount} onChange={(e) => update("myShieldCount", e.target.value)} />
            <input placeholder="槍兵" style={{ marginTop: 6 }} value={form.mySpearCount} onChange={(e) => update("mySpearCount", e.target.value)} />
            <input placeholder="弓兵" style={{ marginTop: 6 }} value={form.myBowCount} onChange={(e) => update("myBowCount", e.target.value)} />
          </div>
          <div>
            <label>相手 盾/槍/弓</label>
            <input placeholder="盾兵" value={form.enemyShieldCount} onChange={(e) => update("enemyShieldCount", e.target.value)} />
            <input placeholder="槍兵" style={{ marginTop: 6 }} value={form.enemySpearCount} onChange={(e) => update("enemySpearCount", e.target.value)} />
            <input placeholder="弓兵" style={{ marginTop: 6 }} value={form.enemyBowCount} onChange={(e) => update("enemyBowCount", e.target.value)} />
          </div>
        </div>

        <label style={{ marginTop: 20 }}>結果の実測値(損失/負傷/軽傷/生存)</label>
        <div className="row">
          <div>
            <label>自軍</label>
            <input placeholder="損失" value={form.myLoss} onChange={(e) => update("myLoss", e.target.value)} />
            <input placeholder="負傷" style={{ marginTop: 6 }} value={form.myInjured} onChange={(e) => update("myInjured", e.target.value)} />
            <input placeholder="軽傷" style={{ marginTop: 6 }} value={form.myLightInjured} onChange={(e) => update("myLightInjured", e.target.value)} />
            <input placeholder="生存" style={{ marginTop: 6 }} value={form.mySurvivors} onChange={(e) => update("mySurvivors", e.target.value)} />
          </div>
          <div>
            <label>相手</label>
            <input placeholder="損失" value={form.enemyLoss} onChange={(e) => update("enemyLoss", e.target.value)} />
            <input placeholder="負傷" style={{ marginTop: 6 }} value={form.enemyInjured} onChange={(e) => update("enemyInjured", e.target.value)} />
            <input placeholder="軽傷" style={{ marginTop: 6 }} value={form.enemyLightInjured} onChange={(e) => update("enemyLightInjured", e.target.value)} />
            <input placeholder="生存" style={{ marginTop: 6 }} value={form.enemySurvivors} onChange={(e) => update("enemySurvivors", e.target.value)} />
          </div>
        </div>

        <label style={{ marginTop: 20 }}>追加ステータス% - 自陣営</label>
        <BuffGrid prefix="my" values={buffValues} onChange={(k, v) => setBuffValues((s) => ({ ...s, [k]: v }))} />

        <label style={{ marginTop: 16 }}>追加ステータス% - 相手陣営</label>
        <BuffGrid prefix="enemy" values={buffValues} onChange={(k, v) => setBuffValues((s) => ({ ...s, [k]: v }))} />

        <label style={{ marginTop: 20 }}>メモ</label>
        <textarea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "#0f172a", color: "var(--text)" }}
          rows={3}
        />

        <button onClick={submit} disabled={loading}>
          戦闘レポートを保存
        </button>
      </div>

      <h2 style={{ fontSize: "1.05rem" }}>登録済みの戦闘レポート</h2>
      {battles.length === 0 && <p style={{ color: "#94a3b8" }}>まだ登録されていません。</p>}
      {battles.map((b) => (
        <div key={b.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{b.label || `戦闘 #${b.id}`}</strong>
              <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                {b.side === "defense" ? "防衛" : "攻撃"} ・ {b.result === "win" ? "勝利" : b.result === "lose" ? "敗北" : "未定"}
              </div>
            </div>
            <button
              style={{ marginTop: 0, background: "transparent", border: "1px solid var(--border)", color: "#f87171" }}
              onClick={() => deleteBattle(b.id, b.label)}
            >
              削除
            </button>
          </div>

          <div style={{ fontSize: "0.85rem", marginTop: 10, color: "#cbd5e1" }}>
            {b.myName || "自陣営"}: 生存 {b.mySurvivors ?? "-"} / 損失 {b.myLoss ?? "-"}
            <br />
            {b.enemyName || "相手陣営"}: 生存 {b.enemySurvivors ?? "-"} / 損失 {b.enemyLoss ?? "-"}
          </div>

          <button
            style={{ marginTop: 12, background: "transparent", border: "1px solid var(--border)", color: "var(--accent)" }}
            onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
          >
            参加者({b.participants.length}人) {expandedId === b.id ? "を閉じる" : "を表示・追加"}
          </button>

          {expandedId === b.id && (
            <div style={{ marginTop: 10 }}>
              {b.participants.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: "1px solid var(--border)",
                    fontSize: "0.85rem",
                  }}
                >
                  <div>
                    {p.side === "mine" ? "🔵" : "🔴"} {p.playerName}
                    {p.isLeader && <span style={{ color: "var(--accent)" }}> (リーダー)</span>}
                    <br />
                    <span style={{ color: "#94a3b8" }}>
                      兵力{p.troopCount ?? "-"} ・ 撃墜{p.kills ?? "-"} ・{" "}
                      {p.shieldHero?.name || "-"}/{p.spearHero?.name || "-"}/{p.bowHero?.name || "-"}
                    </span>
                  </div>
                  <button
                    style={{ marginTop: 0, background: "transparent", border: "1px solid var(--border)", color: "#f87171", padding: "4px 10px", fontSize: "0.8rem" }}
                    onClick={() => deleteParticipant(p.id)}
                  >
                    削除
                  </button>
                </div>
              ))}
              <ParticipantForm battleId={b.id} heroes={heroes} onAdded={loadAll} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
