import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>WOS 編成分析ツール(同盟内専用)</h1>
      <div className="card">
        <p>自分と相手の編成を登録して、あとで比較・分析できるようにします。</p>
        <p>
          <Link href="/formations">→ 編成を登録する / 一覧を見る</Link>
        </p>
        <p>
          <Link href="/master">→ 英雄・専門家・ペットのマスターデータ管理</Link>
        </p>
      </div>
    </div>
  );
}
