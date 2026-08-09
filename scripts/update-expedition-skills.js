// Railwayコンソールで実行するスクリプト
// 対象: 送信済み全46英雄の「遠征スキル」のみ一括登録
// 手順: ①対象英雄の既存HeroSkillを全削除 → ②遠征スキル3つずつを新規登録
// triggerType規約: 常時 / 確率N% / Nターンごと / N回攻撃ごと
// 複合効果や特殊条件は rawText に正確な文章を保存(target/stat/valueはnullのままでOK)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const heroSkillData = {
  // ===== 第1世代 =====
  "ジンマン": [
    { name: "堅固", rawText: "味方全部隊の防御力が10%、HPが10%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 1 },
    { name: "建築の芸術", rawText: "建造資源の消費減少・建造時間加速(非戦闘スキル)。", triggerType: "常時", target: null, stat: null, value: null, skillSlot: 2 },
    { name: "陣地戦の強者", rawText: "味方全部隊の殺傷力が25%上昇する。", triggerType: "常時", target: "自分", stat: "殺傷力", value: 25, skillSlot: 3 },
  ],
  "ジャスミン": [
    { name: "雪の姫君", rawText: "味方全部隊が攻撃する際、20%の確率で敵軍を眩暈状態にする。1ターン持続。", triggerType: "確率20%", target: "敵", stat: null, value: null, skillSlot: 1 },
    { name: "氷結の領域", rawText: "味方全部隊の攻撃時、50%の確率で今回の攻撃ダメージが50%上昇する。", triggerType: "確率50%", target: "自分", stat: "ダメージ", value: 50, skillSlot: 2 },
    { name: "不機嫌少女", rawText: "味方全部隊の与ダメージが25%上昇する。", triggerType: "常時", target: "自分", stat: "ダメージ", value: 25, skillSlot: 3 },
  ],
  "ジェロニモ": [
    { name: "決起集会", rawText: "味方全部隊の与ダメージを25%上昇させる。", triggerType: "常時", target: "自分", stat: "ダメージ", value: 25, skillSlot: 1 },
    { name: "剣術指導", rawText: "味方全部隊の攻撃力を25%上昇させる。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 25, skillSlot: 2 },
    { name: "練達なる剣技", rawText: "味方全部隊が攻撃する際、20%の確率で敵軍を眩暈状態にする。1ターン持続。", triggerType: "確率20%", target: "敵", stat: null, value: null, skillSlot: 3 },
  ],

  // ===== 第2世代 =====
  "ナタリア": [
    { name: "野性咆哮", rawText: "味方全部隊が攻撃する際、20%の確率で敵軍を眩暈状態にする。1ターン持続。", triggerType: "確率20%", target: "敵", stat: null, value: null, skillSlot: 1 },
    { name: "獣軍の王", rawText: "味方全部隊の攻撃力が25%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 25, skillSlot: 2 },
    { name: "野獣召喚", rawText: "味方全部隊に25%のダメージ上昇効果を与える。", triggerType: "常時", target: "自分", stat: "ダメージ", value: 25, skillSlot: 3 },
  ],
  "アロンゾ": [
    { name: "波瀾万丈", rawText: "味方全部隊が攻撃する際、20%の確率で敵に眩暈状態を付与。1ターン持続。", triggerType: "確率20%", target: "敵", stat: null, value: null, skillSlot: 1 },
    { name: "鋼鉄意志", rawText: "味方全部隊が攻撃する際、20%の確率で敵からのダメージを50%軽減。2ターン持続。", triggerType: "確率20%", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "毒の銛", rawText: "味方全部隊が攻撃する際、50%の確率で今回の攻撃ダメージが50%上昇する。", triggerType: "確率50%", target: "自分", stat: "ダメージ", value: 50, skillSlot: 3 },
  ],
  "フレンダー": [
    { name: "強健の秘訣", rawText: "味方全部隊の攻撃力が15%、防御力が10%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 15, skillSlot: 1 },
    { name: "強化薬剤", rawText: "味方全部隊が攻撃する際、25%の確率で200%のダメージを与える。", triggerType: "確率25%", target: "敵", stat: "ダメージ", value: 200, skillSlot: 2 },
    { name: "眩暈胞子", rawText: "味方全部隊が攻撃する際、20%の確率で敵を眩暈状態にする。1ターン持続。", triggerType: "確率20%", target: "敵", stat: null, value: null, skillSlot: 3 },
  ],

  // ===== 第3世代 =====
  "フリント": [
    { name: "野火", rawText: "味方全部隊が攻撃する際、20%の確率で敵に焼灼効果(毎ターン40%ダメージ)を付与。3ターン持続。", triggerType: "確率20%", target: "敵", stat: null, value: null, skillSlot: 1 },
    { name: "森林火災", rawText: "味方全部隊の攻撃力が25%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 25, skillSlot: 2 },
    { name: "灼熱の魂", rawText: "味方全部隊が攻撃する際、50%の確率で敵軍の被ダメージを50%上昇させる。", triggerType: "確率50%", target: "敵", stat: "被ダメージ", value: 50, skillSlot: 3 },
  ],
  "グレッグ": [
    { name: "正義の剣", rawText: "20%の確率で味方全部隊のダメージが40%上昇する。3ターン持続。", triggerType: "確率20%", target: "自分", stat: "ダメージ", value: 40, skillSlot: 1 },
    { name: "律令の脅威", rawText: "味方全部隊の攻撃時、20%の確率で敵軍のダメージを50%低下させる。2ターン持続。", triggerType: "確率20%", target: "敵", stat: "ダメージ", value: -50, skillSlot: 2 },
    { name: "秩序の庇護", rawText: "味方全部隊のHPが25%上昇する。", triggerType: "常時", target: "自分", stat: "HP", value: 25, skillSlot: 3 },
  ],
  "ミア": [
    { name: "不幸の連鎖", rawText: "味方全部隊の攻撃が50%の確率で敵を災難に陥れ、被ダメージを50%増加させる。", triggerType: "確率50%", target: "敵", stat: "被ダメージ", value: 50, skillSlot: 1 },
    { name: "幸運の加護", rawText: "味方全部隊の攻撃時に50%の確率で今回のダメージが50%上昇する。", triggerType: "確率50%", target: "自分", stat: "ダメージ", value: 50, skillSlot: 2 },
    { name: "秘儀の解読", rawText: "40%の確率で味方全部隊の被ダメージが50%低下する。", triggerType: "確率40%", target: "自分", stat: "被ダメージ", value: -50, skillSlot: 3 },
  ],
  "ローガン": [
    { name: "怒れる獅子の強襲", rawText: "味方全部隊の攻撃時、20%の確率で敵軍に毎ターン追加で40%のダメージ。3ターン持続。", triggerType: "確率20%", target: "敵", stat: null, value: null, skillSlot: 1 },
    { name: "猛き獅子の威嚇", rawText: "味方全部隊の被ダメージが20%低下する。", triggerType: "常時", target: "自分", stat: "被ダメージ", value: -20, skillSlot: 2 },
    { name: "リーダーの鼓舞", rawText: "味方全部隊のHPが25%上昇する。", triggerType: "常時", target: "自分", stat: "HP", value: 25, skillSlot: 3 },
  ],

  // ===== 第4世代 =====
  "リオン": [
    { name: "獅子の歌", rawText: "40%の確率で味方全部隊のダメージが50%上昇する。", triggerType: "確率40%", target: "自分", stat: "ダメージ", value: 50, skillSlot: 1 },
    { name: "悲しき音色", rawText: "敵軍全部隊のダメージを20%低下させる。", triggerType: "常時", target: "敵", stat: "ダメージ", value: -20, skillSlot: 2 },
    { name: "オーナイのカデンツァ", rawText: "弓兵が3回攻撃する毎に自身の攻撃力が5%上昇。重ね掛け可能、戦闘終了まで持続。", triggerType: "3回攻撃ごと", target: "自分", stat: "攻撃力", value: 5, skillSlot: 3 },
  ],
  "レイナ": [
    { name: "暗殺者の本能", rawText: "味方全部隊の通常攻撃の与ダメージを30%上昇させる。", triggerType: "常時", target: "自分", stat: "ダメージ", value: 30, skillSlot: 1 },
    { name: "残像の足跡", rawText: "味方全部隊が通常攻撃を受けた際、20%の確率でダメージを回避する。", triggerType: "確率20%", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "影刃", rawText: "槍兵が25%の確率で1回追加攻撃を行い、200%のダメージを与える。", triggerType: "確率25%", target: "敵", stat: "ダメージ", value: 200, skillSlot: 3 },
  ],
  "アクモス": [
    { name: "マムシ方陣", rawText: "盾兵が4回攻撃する毎に次の攻撃を止め、弓兵と槍兵の被ダメージ30%、盾兵の被ダメージ70%低下。2ターン持続。", triggerType: "4回攻撃ごと", target: "自分", stat: null, value: null, skillSlot: 1 },
    { name: "火の祈願", rawText: "味方盾兵の与ダメージが100%上昇する。", triggerType: "常時", target: "自分", stat: "ダメージ", value: 100, skillSlot: 2 },
    { name: "光鍛の刃", rawText: "盾兵の攻撃の度にターゲットへ60%の追加ダメージ、被ダメージを25%上昇させる。1ターン持続。", triggerType: "攻撃毎", target: "敵", stat: null, value: null, skillSlot: 3 },
  ],
  "ノラ": [
    { name: "多兵種戦術", rawText: "盾兵と弓兵の被ダメージが15%低下し、与ダメージが15%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 1 },
    { name: "急所突き", rawText: "槍兵が攻撃する際、20%の確率で敵全体に100%の追加ダメージを与える。", triggerType: "確率20%", target: "敵", stat: "ダメージ", value: 100, skillSlot: 2 },
    { name: "追撃攻勢", rawText: "率いる部隊が5回攻撃する毎に、味方全部隊の与ダメージが25%上昇、被ダメージが25%低下する。2ターン持続。", triggerType: "5回攻撃ごと", target: "自分", stat: null, value: null, skillSlot: 3 },
  ],

  // ===== 第5世代 =====
  "ヘクトー": [
    { name: "生存本能", rawText: "味方全部隊の被ダメージが40%の確率で50%低下する。", triggerType: "確率40%", target: "自分", stat: "被ダメージ", value: -50, skillSlot: 1 },
    { name: "雷の突撃", rawText: "攻撃時、盾兵のダメージが200%、弓兵の与ダメージが50%上昇。以後攻撃毎に強化効果が前回の80%になり、5回攻撃で消失。", triggerType: "攻撃毎", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "疾風猛襲", rawText: "味方全部隊の攻撃時に25%の確率で200%のダメージを与える。", triggerType: "確率25%", target: "敵", stat: "ダメージ", value: 200, skillSlot: 3 },
  ],
  "グエン": [
    { name: "ホークアイ", rawText: "味方全部隊の攻撃時、ターゲットの被ダメージが25%上昇する。", triggerType: "常時", target: "敵", stat: "被ダメージ", value: 25, skillSlot: 1 },
    { name: "空中制圧", rawText: "味方全部隊が5回攻撃する毎に、ターゲットに60%の追加ダメージ、次回被攻撃時に10%の追加ダメージ。", triggerType: "5回攻撃ごと", target: "敵", stat: null, value: null, skillSlot: 2 },
    { name: "小隊爆破", rawText: "弓兵が4回攻撃する毎に敵全体に50%の追加ダメージを与える。", triggerType: "4回攻撃ごと", target: "敵", stat: "ダメージ", value: 50, skillSlot: 3 },
  ],

  // ===== 第6世代 =====
  "ウェイン": [
    { name: "サンダーサプライズ", rawText: "味方全部隊が4ターン毎に1度追加攻撃を行い、100%のダメージを与える。", triggerType: "4ターンごと", target: "敵", stat: "ダメージ", value: 100, skillSlot: 1 },
    { name: "迂回攻撃", rawText: "弓兵が2回攻撃する毎に、敵槍兵に40%、敵弓兵に20%の追加ダメージ。", triggerType: "2回攻撃ごと", target: "敵", stat: null, value: null, skillSlot: 2 },
    { name: "電光石火", rawText: "味方全部隊の通常攻撃で25%の確率で会心を発生させる。", triggerType: "確率25%", target: "自分", stat: null, value: null, skillSlot: 3 },
  ],
  "レネ": [
    { name: "夢の痕跡", rawText: "槍兵は2ターン毎にターゲットに夢の痕跡を付与。付与された敵は次ターンに追加で200%の槍兵ダメージを受ける。1ターン持続。", triggerType: "2ターンごと", target: "敵", stat: null, value: null, skillSlot: 1 },
    { name: "ドリームイーター", rawText: "夢の痕跡のあるターゲットに対する槍兵の与ダメージが150%上昇する。", triggerType: "常時", target: "自分", stat: "ダメージ", value: 150, skillSlot: 2 },
    { name: "夢の欠片", rawText: "夢の痕跡のあるターゲットに対する味方全部隊の与ダメージが75%上昇する。", triggerType: "常時", target: "自分", stat: "ダメージ", value: 75, skillSlot: 3 },
  ],
  "無名": [
    { name: "避風補雨", rawText: "盾兵が受ける通常攻撃ダメージが25%、スキルダメージが30%減少する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 1 },
    { name: "半月飛翔", rawText: "味方全部隊が与えるダメージが20%上昇する。", triggerType: "常時", target: "自分", stat: "ダメージ", value: 20, skillSlot: 2 },
    { name: "四象明晰", rawText: "味方全部隊のスキルダメージが25%上昇する。", triggerType: "常時", target: "自分", stat: "スキルダメージ", value: 25, skillSlot: 3 },
  ],

  // ===== 第7世代 =====
  "ゴードン": [
    { name: "毒の刃", rawText: "槍兵の武器に毒を塗り、2回攻撃する毎に100%の追加ダメージ。さらに毒状態にし、与ダメージを20%低下させる。1ターン持続。", triggerType: "2回攻撃ごと", target: "敵", stat: null, value: null, skillSlot: 1 },
    { name: "毒の恐怖", rawText: "3ターン毎に敵の士気を低下させる。味方槍兵の与ダメージが150%上昇し、敵全体の与ダメージが30%低下する。1ターン持続。", triggerType: "3ターンごと", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "劇毒の霧", rawText: "4ターン毎に毒の雲が発生。敵盾兵の被ダメージ30%上昇、敵弓兵の与ダメージ30%低下。2ターン持続。", triggerType: "4ターンごと", target: "敵", stat: null, value: null, skillSlot: 3 },
  ],
  "エディス": [
    { name: "攻守両立", rawText: "味方弓兵の被ダメージが20%低下し、味方槍兵の与ダメージが20%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 1 },
    { name: "銅頭鉄腕", rawText: "盾兵の被ダメージが20%低下する。", triggerType: "常時", target: "自分", stat: "被ダメージ", value: -20, skillSlot: 2 },
    { name: "鋼甲護体", rawText: "味方全部隊のHPが25%上昇する。", triggerType: "常時", target: "自分", stat: "HP", value: 25, skillSlot: 3 },
  ],
  "ブラッドリー": [
    { name: "老兵の誇り", rawText: "味方全部隊の攻撃力が25%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 25, skillSlot: 1 },
    { name: "正面突破", rawText: "味方全部隊の槍兵に対する与ダメージが30%、盾兵に対する与ダメージが25%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "戦局洞察", rawText: "4ターン毎に味方全部隊の与ダメージが30%上昇する。2ターン持続。", triggerType: "4ターンごと", target: "自分", stat: "ダメージ", value: 30, skillSlot: 3 },
  ],
  "ソニヤ": [
    { name: "トレジャーハンター", rawText: "味方全部隊の与ダメージが20%上昇する。", triggerType: "常時", target: "自分", stat: "ダメージ", value: 20, skillSlot: 1 },
    { name: "賞金の誘惑", rawText: "率いる槍兵が2回攻撃する毎にターゲットへ75%の追加ダメージ。味方全部隊の攻撃力25%上昇。1ターン持続。", triggerType: "2回攻撃ごと", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "激流衝撃", rawText: "槍兵は5ターン毎にターゲットへ50%のダメージを与え、1ターン眩暈状態にする。", triggerType: "5ターンごと", target: "敵", stat: "ダメージ", value: 50, skillSlot: 3 },
  ],

  // ===== 第8世代 =====
  "ガト": [
    { name: "黄金の近衛", rawText: "盾兵の防御力が30%上昇する。", triggerType: "常時", target: "自分", stat: "防御力", value: 30, skillSlot: 1 },
    { name: "列王の恩恵", rawText: "盾兵は攻撃する度に自身の攻撃力の30%のシールドを得る。1ターン持続。", triggerType: "攻撃毎", target: "自分", stat: null, value: 30, skillSlot: 2 },
    { name: "王者の師", rawText: "敵全体の攻撃力を25%低下させる。", triggerType: "常時", target: "敵", stat: "攻撃力", value: -25, skillSlot: 3 },
  ],
  "ヘンドリック": [
    { name: "蠕虫のかみつき", rawText: "敵部隊全体の防御力を25%低下させる。", triggerType: "常時", target: "敵", stat: "防御力", value: -25, skillSlot: 1 },
    { name: "フジツボの鎧", rawText: "4ターン毎に堅いフジツボを味方部隊に付着させる。防御力が30%上昇。2ターン持続。", triggerType: "4ターンごと", target: "自分", stat: "防御力", value: 30, skillSlot: 2 },
    { name: "ダゴンの後継者", rawText: "3ターン毎に敵全体に40%のダメージを与える。", triggerType: "3ターンごと", target: "敵", stat: "ダメージ", value: 40, skillSlot: 3 },
  ],
  "シュラ": [
    { name: "霧の胞子", rawText: "味方全部隊の被ダメージを20%低下させる。", triggerType: "常時", target: "自分", stat: "被ダメージ", value: -20, skillSlot: 1 },
    { name: "貫通の矢", rawText: "弓兵が2回攻撃する毎にターゲットへ100%の追加ダメージ、被ダメージを25%上昇させる。1ターン持続。", triggerType: "2回攻撃ごと", target: "敵", stat: null, value: null, skillSlot: 2 },
    { name: "変幻自在", rawText: "弓兵の被ダメージが15%低下、与ダメージが10%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 3 },
  ],

  // ===== 第9世代 =====
  "フレッド": [
    { name: "放水砲制圧", rawText: "敵全部隊の殺傷力を20%低下させる。", triggerType: "常時", target: "敵", stat: "殺傷力", value: -20, skillSlot: 1 },
    { name: "酸性溶液", rawText: "敵盾兵の被ダメージを20%上昇させる。", triggerType: "常時", target: "敵", stat: "被ダメージ", value: 20, skillSlot: 2 },
    { name: "猛烈な攻勢", rawText: "槍兵の攻撃4回毎にターゲットへ200%の追加ダメージ、敵全体の次ターンの与ダメージを20%低下させる。", triggerType: "4回攻撃ごと", target: "敵", stat: null, value: null, skillSlot: 3 },
  ],
  "マグヌス": [
    { name: "怒りの波", rawText: "味方全部隊の攻撃力が25%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 25, skillSlot: 1 },
    { name: "鋼鉄陣形", rawText: "盾兵を指揮して攻撃する際、40%の確率で味方全部隊の防御力が50%上昇。1ターン持続。", triggerType: "確率40%", target: "自分", stat: "防御力", value: 50, skillSlot: 2 },
    { name: "氷海戦術", rawText: "味方盾兵の被ダメージが10%低下、弓兵の与ダメージが10%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 3 },
  ],
  "フレイヤ": [
    { name: "夕暮れの霧", rawText: "敵全体の攻撃力を20%低下させる。", triggerType: "常時", target: "敵", stat: "攻撃力", value: -20, skillSlot: 1 },
    { name: "新月の鎌", rawText: "通常攻撃後に50%の確率で追撃が1度発動し、100%の追加ダメージを与える。", triggerType: "確率50%", target: "敵", stat: "ダメージ", value: 100, skillSlot: 2 },
    { name: "疾風の一撃", rawText: "味方の盾兵と弓兵の被ダメージが15%低下、与ダメージが15%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 3 },
  ],

  // ===== 第10世代 =====
  "グレゴリー": [
    { name: "灼熱の軍団", rawText: "味方全部隊の攻撃力が15%、防御力が10%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 15, skillSlot: 1 },
    { name: "制圧突撃", rawText: "味方全部隊の通常攻撃時に25%の確率でクリティカルダメージを発生させる。", triggerType: "確率25%", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "鋼鉄の防壁", rawText: "盾兵の受けるダメージが20%低下する。", triggerType: "常時", target: "自分", stat: "被ダメージ", value: -20, skillSlot: 3 },
  ],
  "ブランシュ": [
    { name: "真紅の刃", rawText: "味方全部隊の殺傷力が25%上昇する。", triggerType: "常時", target: "自分", stat: "殺傷力", value: 25, skillSlot: 1 },
    { name: "熾紅爆裂", rawText: "弓兵の攻撃時、3ターン毎にクリスタルの刃を放ち、対象に75%の追加ダメージ。", triggerType: "3ターンごと", target: "敵", stat: "ダメージ", value: 75, skillSlot: 2 },
    { name: "黒紅の狙撃", rawText: "弓兵が2回攻撃する毎に、敵槍兵に40%、敵弓兵に20%の追加ダメージ。", triggerType: "2回攻撃ごと", target: "敵", stat: null, value: null, skillSlot: 3 },
  ],
  "エリオノーラ": [
    { name: "烈日の威光", rawText: "味方全部隊のHPが25%増加する。", triggerType: "常時", target: "自分", stat: "HP", value: 25, skillSlot: 1 },
    { name: "ソラリス方陣", rawText: "味方盾兵の被ダメージが10%低下、弓兵の与ダメージが10%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "烈火の飛光", rawText: "率いる盾兵が5回攻撃する毎に、味方全部隊の与ダメージが25%上昇、被ダメージが25%低下する。2ターン持続。", triggerType: "5回攻撃ごと", target: "自分", stat: null, value: null, skillSlot: 3 },
  ],

  // ===== 第11世代 =====
  "ロイド": [
    { name: "群鳥の侵襲", rawText: "敵全体の殺傷力を20%低下させる。", triggerType: "常時", target: "敵", stat: "殺傷力", value: -20, skillSlot: 1 },
    { name: "氷霧爆弾", rawText: "3ターン毎に槍兵のダメージが150%上昇し、敵軍の殺傷力を30%低下させる。1ターン持続。", triggerType: "3ターンごと", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "千変万化", rawText: "40%の確率で味方全部隊の殺傷力が50%上昇する。", triggerType: "確率40%", target: "自分", stat: "殺傷力", value: 50, skillSlot: 3 },
  ],
  "ルーファス": [
    { name: "火焔戦団", rawText: "味方全部隊の攻撃力が25%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 25, skillSlot: 1 },
    { name: "砕鎧の一撃", rawText: "攻撃する度にターゲットへ60%の追加ダメージ、被ダメージを25%上昇させる。1ターン持続。", triggerType: "攻撃毎", target: "敵", stat: null, value: null, skillSlot: 2 },
    { name: "苛烈震撼", rawText: "味方全部隊の攻撃時、20%の確率で敵の殺傷力を50%低下させる。2ターン持続。", triggerType: "確率20%", target: "敵", stat: "殺傷力", value: -50, skillSlot: 3 },
  ],
  "ライジーア": [
    { name: "スチールファング", rawText: "敵全体の防御力を25%低下させる。", triggerType: "常時", target: "敵", stat: "防御力", value: -25, skillSlot: 1 },
    { name: "崩壊の毒", rawText: "弓兵が2回攻撃する毎に対象へ100%の追加ダメージ、被ダメージを25%上昇させる。1ターン持続。", triggerType: "2回攻撃ごと", target: "敵", stat: null, value: null, skillSlot: 2 },
    { name: "ポイズンファング", rawText: "弓兵が2回攻撃する毎に対象を毒状態にし、100%の追加ダメージ、与ダメージを20%減少させる。1ターン持続。", triggerType: "2回攻撃ごと", target: "敵", stat: null, value: null, skillSlot: 3 },
  ],

  // ===== 第12世代 =====
  "カロール": [
    { name: "守護の翼", rawText: "味方全部隊の被ダメージを20%減少させる。", triggerType: "常時", target: "自分", stat: "被ダメージ", value: -20, skillSlot: 1 },
    { name: "ブレイクスピア", rawText: "味方全部隊の槍兵に対するダメージが30%、盾兵に対するダメージが25%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "栄光の戦旗", rawText: "味方全部隊の攻撃力が15%、防御力が10%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 15, skillSlot: 3 },
  ],
  "ヘルヴィル": [
    { name: "ウォーラウド", rawText: "味方全部隊の殺傷力が25%上昇する。", triggerType: "常時", target: "自分", stat: "殺傷力", value: 25, skillSlot: 1 },
    { name: "不滅の軍団", rawText: "指揮下にある盾兵が受ける通常攻撃ダメージを25%、スキルダメージを30%低下させる。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "戦火の意志", rawText: "指揮する盾兵の被ダメージが15%減少、与ダメージが10%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 3 },
  ],
  "フローラ": [
    { name: "刺蔓の舞", rawText: "味方全体の攻撃時に敵が受けるダメージを50%の確率で50%上昇させる。", triggerType: "確率50%", target: "敵", stat: "被ダメージ", value: 50, skillSlot: 1 },
    { name: "茨の花園", rawText: "味方盾兵の被ダメージを25%軽減し、槍兵の与ダメージを25%上昇させる。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "芳香の霧", rawText: "4ターン毎に発動し、敵盾兵の被ダメージを30%上昇、敵弓兵の与ダメージを30%低下させる。2ターン持続。", triggerType: "4ターンごと", target: "敵", stat: null, value: null, skillSlot: 3 },
  ],

  // ===== 第13世代 =====
  "ギーゼラ": [
    { name: "合金シールド", rawText: "味方盾兵の防御力を30%強化する。", triggerType: "常時", target: "自分", stat: "防御力", value: 30, skillSlot: 1 },
    { name: "臨時防衛工事", rawText: "率いる盾兵が攻撃する際、40%の確率で味方全体の防御力が50%上昇する。1ターン持続。", triggerType: "確率40%", target: "自分", stat: "防御力", value: 50, skillSlot: 2 },
    { name: "試作型シールド", rawText: "味方全体に試作型軍団シールドを装備。40%の確率で被ダメージを50%軽減する。", triggerType: "確率40%", target: "自分", stat: "被ダメージ", value: -50, skillSlot: 3 },
  ],
  "ウルカヌス": [
    { name: "覇者の怒り", rawText: "敵全体の攻撃力を20%低下させる。", triggerType: "常時", target: "敵", stat: "攻撃力", value: -20, skillSlot: 1 },
    { name: "貫通裂刃", rawText: "味方全部隊が5回攻撃する毎に次の攻撃で対象に100%の追加ダメージ、対象は次の被攻撃時15%の追加ダメージを受ける。", triggerType: "5回攻撃ごと", target: "敵", stat: null, value: null, skillSlot: 2 },
    { name: "破砕の矢", rawText: "3ターン毎に敵盾兵と槍兵の防御力を60%低下させ、味方弓兵の攻撃力を60%上昇させる。1ターン持続。", triggerType: "3ターンごと", target: null, stat: null, value: null, skillSlot: 3 },
  ],

  // ===== 第14世代 =====
  "エリーフ": [
    { name: "軽紗の舞", rawText: "敵軍全体の攻撃力を25%低下させる。", triggerType: "常時", target: "敵", stat: "攻撃力", value: -25, skillSlot: 1 },
    { name: "千刃の陣", rawText: "味方全部隊の攻撃力が15%、防御力が10%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 15, skillSlot: 2 },
    { name: "絢爛の幕", rawText: "配下の盾兵の攻撃時に幕を編み上げ、自身の攻撃力の30%のシールドを得る。1ターン持続。", triggerType: "盾兵攻撃時", target: "自分", stat: null, value: 30, skillSlot: 3 },
  ],
  "ドミニク": [
    { name: "イリュージョン", rawText: "味方全部隊の与ダメージが20%上昇する。", triggerType: "常時", target: "自分", stat: "ダメージ", value: 20, skillSlot: 1 },
    { name: "シリーローゼス", rawText: "槍兵の攻撃の度に60%の追加ダメージ、毒で対象の被ダメージを25%増加させる。1ターン持続。", triggerType: "攻撃毎", target: "敵", stat: null, value: null, skillSlot: 2 },
    { name: "ミラーメイズ", rawText: "味方盾兵と弓兵の被ダメージを15%軽減し、与ダメージを15%増加させる。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 3 },
  ],
  "カーラ": [
    { name: "霧の包囲網", rawText: "対象の殺傷力を20%低下させる。", triggerType: "常時", target: "敵", stat: "殺傷力", value: -20, skillSlot: 1 },
    { name: "ペットマシーン", rawText: "味方部隊全体の通常攻撃のダメージを30%上昇させる。", triggerType: "常時", target: "自分", stat: "ダメージ", value: 30, skillSlot: 2 },
    { name: "魔女の強襲", rawText: "弓兵が2回攻撃する毎に、敵槍兵に40%、敵弓兵に20%の追加ダメージ。", triggerType: "2回攻撃ごと", target: "敵", stat: null, value: null, skillSlot: 3 },
  ],

  // ===== 第15世代 =====
  "ヴィヴィカ": [
    { name: "ナイトレギオン", rawText: "味方全部隊の攻撃力が25%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 25, skillSlot: 1 },
    { name: "シャドウビジョン", rawText: "攻撃時、20%の確率で敵全部隊に100%の追加ダメージを与える。", triggerType: "確率20%", target: "敵", stat: "ダメージ", value: 100, skillSlot: 2 },
    { name: "ミストチャイルド", rawText: "味方盾兵の被ダメージが10%低下、弓兵の与ダメージが10%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 3 },
  ],
  "エステラ": [
    { name: "ムーンシャドウブルー", rawText: "敵全体の防御力を25%低下させる。", triggerType: "常時", target: "敵", stat: "防御力", value: -25, skillSlot: 1 },
    { name: "ルミナスペイント", rawText: "味方全部隊の攻撃力が15%上昇、防御力が10%上昇する。", triggerType: "常時", target: "自分", stat: "攻撃力", value: 15, skillSlot: 2 },
    { name: "フローティングカラー", rawText: "味方盾兵の被ダメージが25%低下、槍兵の与ダメージが25%上昇する。", triggerType: "常時", target: "自分", stat: null, value: null, skillSlot: 3 },
  ],
  "ハンク": [
    { name: "レイジングロアー", rawText: "味方全部隊の殺傷力が25%上昇する。", triggerType: "常時", target: "自分", stat: "殺傷力", value: 25, skillSlot: 1 },
    { name: "スパークバースト", rawText: "率いる盾兵が5回攻撃する毎に、味方全部隊の与ダメージが25%上昇、被ダメージが25%低下する。2ターン持続。", triggerType: "5回攻撃ごと", target: "自分", stat: null, value: null, skillSlot: 2 },
    { name: "バーサークパワー", rawText: "4ターン毎に敵盾兵の被ダメージを30%上昇、敵弓兵の与ダメージを30%低下させる。2ターン持続。", triggerType: "4ターンごと", target: "敵", stat: null, value: null, skillSlot: 3 },
  ],
};

async function main() {
  let heroesProcessed = 0;
  let heroesFailed = [];
  let heroesNotFound = [];

  for (const [heroName, skills] of Object.entries(heroSkillData)) {
    try {
      const hero = await prisma.hero.findFirst({ where: { name: heroName } });
      if (!hero) {
        heroesNotFound.push(heroName);
        continue;
      }

      const deleted = await prisma.heroSkill.deleteMany({ where: { heroId: hero.id } });
      console.log(`${heroName}: 既存スキル ${deleted.count}件 削除`);

      for (const skill of skills) {
        await prisma.heroSkill.create({
          data: {
            heroId: hero.id,
            name: skill.name,
            rawText: skill.rawText,
            triggerType: skill.triggerType,
            target: skill.target,
            stat: skill.stat,
            value: skill.value,
            skillSlot: skill.skillSlot,
          },
        });
      }
      console.log(`${heroName}: 遠征スキル ${skills.length}件 登録完了`);
      heroesProcessed++;
    } catch (err) {
      console.error(`❌ ${heroName} でエラー:`, err.message);
      heroesFailed.push(heroName);
    }
  }

  console.log(`\n=== 完了: ${heroesProcessed}人登録 ===`);
  if (heroesNotFound.length > 0) console.log(`⚠ 見つからなかった英雄: ${heroesNotFound.join(', ')}`);
  if (heroesFailed.length > 0) console.log(`❌ エラーが出た英雄: ${heroesFailed.join(', ')}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
