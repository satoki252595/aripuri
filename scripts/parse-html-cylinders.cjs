const fs = require('fs');
const path = require('path');

// HTMLファイルを読み込み
const htmlPath = path.join(__dirname, '..', 'a.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

// TR行を分割
const rows = html.split('</tr>').map(row => row + '</tr>');

// セルからテキストを抽出する関数
function extractCellTexts(rowHtml) {
  const cells = [];
  // <td>タグの内容を抽出（dir="ltr"があるセル）
  const tdPattern = /<td[^>]*>([^<]*)<\/td>/g;
  let match;
  while ((match = tdPattern.exec(rowHtml)) !== null) {
    cells.push(match[1].trim());
  }
  return cells;
}

// カード番号を抽出する関数（No.行から数字を取得）
function extractCardNumbers(rowHtml) {
  const cards = [];
  // s24, s25, s44, s45などのクラスを持つセルから数字を抽出
  const cardPattern = /<td class="s(?:24|25|44|45|74|75)"[^>]*dir="ltr">([0-9]+P?)<\/td>/g;
  let match;
  while ((match = cardPattern.exec(rowHtml)) !== null) {
    let cardNo = match[1];
    // ゼロパディング
    if (cardNo.includes('P')) {
      const num = cardNo.replace('P', '').padStart(2, '0');
      cardNo = num + 'P';
    } else {
      cardNo = cardNo.padStart(2, '0');
    }
    cards.push(cardNo);
  }
  return cards;
}

// シリンダーごとにカードを分離する関数
function splitCardsByCylinder(rowHtml, numCylinders) {
  const allCards = [];
  const cylinderCards = Array.from({length: numCylinders}, () => []);

  // No.で区切られた各セクションからカードを取得
  const sections = rowHtml.split(/No\./g);

  for (let i = 1; i < sections.length && i <= numCylinders; i++) {
    const section = sections[i];
    const cardPattern = /dir="ltr">([0-9]{1,2}P?)</g;
    let match;
    while ((match = cardPattern.exec(section)) !== null) {
      let cardNo = match[1];
      // 3桁以上の数字は無視（年度などの数字）
      if (cardNo.length > 3) continue;
      // ゼロパディング
      if (cardNo.includes('P')) {
        const num = cardNo.replace('P', '').padStart(2, '0');
        cardNo = num + 'P';
      } else {
        cardNo = cardNo.padStart(2, '0');
      }
      // カード番号の範囲チェック（01-61、Pカード）
      const numPart = parseInt(cardNo.replace('P', ''));
      if (numPart >= 1 && numPart <= 61) {
        cylinderCards[i-1].push(cardNo);
      }
    }
  }

  return cylinderCards;
}

// シリンダーデータを抽出
const cylinders = [];

// シリンダーA, B, Cのデータ（Row 57-120あたり）
// シリンダーD, E, Fのデータ（Row 123-186あたり）
// シリンダーG, Hのデータ（Row 189-あたり）

// シリンダーヘッダー行を検索
const cylinderHeaders = [
  { ids: ['A', 'B', 'C'], names: ['サクラ・ランダム配列', 'タマキ・ランダム配列', 'リンリン・みつき配列'] },
  { ids: ['D', 'E', 'F'], names: ['アイリ・リング配列', '2次出荷①', '2次出荷②'] },
  { ids: ['G', 'H'], names: ['2次出荷③', '???'] }
];

// シリンダーグループごとに処理
let currentGroup = 0;
let currentPosition = 0;
let cylinderData = {};

// 初期化
cylinderHeaders.forEach(group => {
  group.ids.forEach((id, idx) => {
    cylinderData[id] = {
      id: id,
      name: group.names[idx],
      rows: []
    };
  });
});

// No.行を検索してカードを抽出
let inCylinderSection = false;
let currentGroupIds = [];
let positionCounter = {};

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];

  // シリンダーヘッダー行を検出（A, B, Cなど）
  if (row.includes('サクラ・ランダム配列')) {
    inCylinderSection = true;
    currentGroupIds = ['A', 'B', 'C'];
    positionCounter = {'A': 1, 'B': 1, 'C': 1};
    continue;
  }

  if (row.includes('アイリ・リング配列')) {
    currentGroupIds = ['D', 'E', 'F'];
    positionCounter = {'D': 1, 'E': 1, 'F': 1};
    continue;
  }

  if (row.includes('2次出荷③')) {
    currentGroupIds = ['G', 'H'];
    positionCounter = {'G': 1, 'H': 1};
    continue;
  }

  // No.行からカードを抽出
  if (inCylinderSection && row.includes('>No.<')) {
    const numCylinders = currentGroupIds.length;
    const cardsByCylinder = splitCardsByCylinder(row, numCylinders);

    for (let j = 0; j < currentGroupIds.length; j++) {
      const cylinderId = currentGroupIds[j];
      const cards = cardsByCylinder[j];

      if (cards && cards.length > 0 && positionCounter[cylinderId] <= 16) {
        cylinderData[cylinderId].rows.push({
          position: positionCounter[cylinderId],
          cards: cards
        });
        positionCounter[cylinderId]++;
      }
    }
  }
}

// 結果を配列に変換
const result = {
  cylinders: Object.values(cylinderData).filter(c => c.rows.length > 0)
};

// JSONを出力
const outputPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'cylinders.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log('Cylinders extracted:');
result.cylinders.forEach(c => {
  console.log(`  ${c.id}: ${c.name} - ${c.rows.length} rows`);
});
console.log(`\nOutput saved to: ${outputPath}`);
