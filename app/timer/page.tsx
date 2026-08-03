"use client";

import { useEffect, useState } from "react";

type Card = {
  id: string;
  name: string;
  x: string;
  y: string;
  yukihyoLevel: string; // "" (なし) or "1"〜"8"
};

const CASTLE_X = 599;
const CASTLE_Y = 599;

const yukihyoBonusPct: Record<string, number> = {
  "1": 15,
  "2": 17,
  "3": 19,
  "4": 21,
  "5": 23,
  "6": 25,
  "7": 27,
  "8": 30,
};

function newCard(): Card {
  return {
    id: Math.random().toString(36).slice(2),
    name: "",
    x: "",
    y: "",
    yukihyoLevel: "",
  };
}

function nowTimeString(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function marchSeconds(card: Card, baseSpeed: number, prepSeconds: number): number | null {
  const x = Number(card.x);
  const y = Number(card.y);
  if (card.x === "" || card.y === "" || Number.isNaN(x) || Number.isNaN(y) || !baseSpeed) {
    return null;
  }
  const dist = Math.sqrt((x - CASTLE_X) ** 2 + (y - CASTLE_Y) ** 2);
  const bonusPct = yukihyoBonusPct[card.yukihyoLevel] || 0;
  const finalSpeed = baseSpeed * (1 + bonusPct / 100);
  return Math.round(dist / finalSpeed + prepSeconds);
}

export default function TimerPage() {
  const [now, setNow] = useState(new Date());
  const [baseSpeed, setBaseSpeed] = useState("0.236");
  const [prepSeconds, setPrepSeconds] = useState("6.65");
  const [cards, setCards] = useState<Card[]>([newCard()]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function addCard() {
    setCards((prev) => [...prev, newCard()]);
  }

  function updateCard(id: string, patch: Partial<Card>) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function deleteCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  function sortByArrival() {
    setCards((prev) =>
      [...prev].sort((a, b) => {
        const aSec = marchSeconds(a, Number(baseSpeed), Number(prepSeconds)) ?? Infinity;
        const bSec = marchSeconds(b, Number(baseSpeed), Number(prepSeconds)) ?? Infinity;
        return aSec - bSec;
      })
    );
  }

  return (
    <div>
      <h1>WOS 王城着弾時刻計算</h1>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
        現在時刻: {nowTimeString(now)}
      </p>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
        王城座標: ({CASTLE_X}, {CASTLE_Y})。行軍速度・固定準備時間は実データから較正した値です(誤差は0.5秒以内)。ズレる場合は下の数値を微調整してください。
      </p>

      <div className="card">
        <label>基本行軍速度(マス/秒・要調整)</label>
        <input value={baseSpeed} onChange={(e) => setBaseSpeed(e.target.value)} />
        <label>固定準備時間(秒・距離に関係なく一律でかかる時間)</label>
        <input value={prepSeconds} onChange={(e) => setPrepSeconds(e.target.value)} />
      </div>

      <div className="card">
        <button onClick={addCard}>＋カード追加</button>
        <button onClick={sortByArrival} style={{ marginLeft: 8 }}>
          行軍時間順ソート
        </button>
      </div>

      {cards.map((c) => {
        const sec = marchSeconds(c, Number(baseSpeed), Number(prepSeconds));
        return (
          <div className="card" key={c.id}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div style={{ display: "flex", gap: 8, flex: 1 }}>
                <input
                  value={c.name}
                  onChange={(e) => updateCard(c.id, { name: e.target.value })}
                  placeholder="名前"
                  style={{ flex: 2 }}
                />
                <span style={{ alignSelf: "center", fontSize: "0.85rem" }}>X:</span>
                <input
                  value={c.x}
                  onChange={(e) => updateCard(c.id, { x: e.target.value })}
                  style={{ flex: 1 }}
                />
                <span style={{ alignSelf: "center", fontSize: "0.85rem" }}>Y:</span>
                <input
                  value={c.y}
                  onChange={(e) => updateCard(c.id, { y: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
              <button
                onClick={() => deleteCard(c.id)}
                style={{
                  marginLeft: 8,
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  background: "#7f1d1d",
                  color: "#fecaca",
                }}
              >
                削除
              </button>
            </div>

            <label>ユキヒョウ</label>
            <select
              value={c.yukihyoLevel}
              onChange={(e) => updateCard(c.id, { yukihyoLevel: e.target.value })}
            >
              <option value="">なし</option>
              {Object.entries(yukihyoBonusPct).map(([lvl, pct]) => (
                <option key={lvl} value={lvl}>
                  Lv{lvl}:+{pct}%
                </option>
              ))}
            </select>

            <div style={{ marginTop: 12 }}>
              行軍時間: <strong>{sec !== null ? `${sec} 秒` : "-"}</strong>
            </div>
          </div>
        );
      })}

      <div className="card">
        <button onClick={addCard}>＋カード追加</button>
      </div>
    </div>
  );
}
