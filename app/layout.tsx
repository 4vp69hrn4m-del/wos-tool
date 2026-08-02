import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "WOS編成分析ツール",
  description: "ホワイトアウト・サバイバル 対人戦編成分析(vbv.cbs.ONK専用)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "#0f172a",
            borderBottom: "1px solid #334155",
            padding: "10px 16px",
          }}
        >
          <Link href="/" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            🏠 ホームに戻る
          </Link>
        </div>
        <main>{children}</main>
        <div
          style={{
            position: "fixed",
            bottom: 8,
            right: 12,
            fontSize: "0.75rem",
            color: "#64748b",
            pointerEvents: "none",
          }}
        >
          create by ななぽこ
        </div>
      </body>
    </html>
  );
}
