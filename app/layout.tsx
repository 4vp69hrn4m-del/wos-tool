import "./globals.css";

export const metadata = {
  title: "WOS編成分析ツール",
  description: "ホワイトアウト・サバイバル 対人戦編成分析(同盟内専用)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
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
