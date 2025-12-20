<script lang="ts">
  import { searchByFirstCard, searchByTwoCards, getCard, getCardImageUrl, getRarityStars, normalizeCardNo, getPCards } from '$lib/search';
  import type { SearchMatch, Card } from '$lib/types';

  // シリンダー1の状態
  let cyl1FirstCardNo = '';
  let cyl1SecondCardNo = '';
  let cyl1Matches: SearchMatch[] = [];

  // シリンダー2の状態
  let cyl2FirstCardNo = '';
  let cyl2SecondCardNo = '';
  let cyl2Matches: SearchMatch[] = [];

  let previewCard: Card | null = null;

  const pCards = getPCards();

  // シリンダー1のカード情報
  $: cyl1FirstCard = cyl1FirstCardNo ? getCard(normalizeCardNo(cyl1FirstCardNo)) : null;
  $: cyl1SecondCard = cyl1SecondCardNo ? getCard(normalizeCardNo(cyl1SecondCardNo)) : null;

  // シリンダー2のカード情報
  $: cyl2FirstCard = cyl2FirstCardNo ? getCard(normalizeCardNo(cyl2FirstCardNo)) : null;
  $: cyl2SecondCard = cyl2SecondCardNo ? getCard(normalizeCardNo(cyl2SecondCardNo)) : null;

  // シリンダー1の候補カード
  $: cyl1PossibleNextCards = (() => {
    if (cyl1Matches.length === 0) return [];
    const cardNos = new Set<string>();
    for (const match of cyl1Matches) {
      if (match.remainingCards.length > 0) {
        cardNos.add(match.remainingCards[0]);
      }
    }
    return Array.from(cardNos)
      .map(no => {
        if (no === 'サプライズランダム') {
          return { no, name: 'サプライズ', rarity: 4 } as Card;
        }
        return getCard(no);
      })
      .filter((card): card is Card => card !== undefined)
      .sort((a, b) => {
        if (a.no === 'サプライズランダム') return 1;
        if (b.no === 'サプライズランダム') return -1;
        return parseInt(a.no) - parseInt(b.no);
      });
  })();

  // シリンダー2の候補カード
  $: cyl2PossibleNextCards = (() => {
    if (cyl2Matches.length === 0) return [];
    const cardNos = new Set<string>();
    for (const match of cyl2Matches) {
      if (match.remainingCards.length > 0) {
        cardNos.add(match.remainingCards[0]);
      }
    }
    return Array.from(cardNos)
      .map(no => {
        if (no === 'サプライズランダム') {
          return { no, name: 'サプライズ', rarity: 4 } as Card;
        }
        return getCard(no);
      })
      .filter((card): card is Card => card !== undefined)
      .sort((a, b) => {
        if (a.no === 'サプライズランダム') return 1;
        if (b.no === 'サプライズランダム') return -1;
        return parseInt(a.no) - parseInt(b.no);
      });
  })();

  function handleCyl1FirstSearch() {
    if (!cyl1FirstCardNo) {
      cyl1Matches = [];
      return;
    }
    cyl1Matches = searchByFirstCard(cyl1FirstCardNo);
    cyl1SecondCardNo = '';
  }

  function handleCyl1SecondSearch() {
    if (!cyl1FirstCardNo) return;
    if (!cyl1SecondCardNo) {
      cyl1Matches = searchByFirstCard(cyl1FirstCardNo);
      return;
    }
    cyl1Matches = searchByTwoCards(cyl1FirstCardNo, cyl1SecondCardNo);
  }

  function handleCyl2FirstSearch() {
    if (!cyl2FirstCardNo) {
      cyl2Matches = [];
      return;
    }
    cyl2Matches = searchByFirstCard(cyl2FirstCardNo);
    cyl2SecondCardNo = '';
  }

  function handleCyl2SecondSearch() {
    if (!cyl2FirstCardNo) return;
    if (!cyl2SecondCardNo) {
      cyl2Matches = searchByFirstCard(cyl2FirstCardNo);
      return;
    }
    cyl2Matches = searchByTwoCards(cyl2FirstCardNo, cyl2SecondCardNo);
  }

  function selectCyl1Suggestion(cardNo: string) {
    cyl1SecondCardNo = cardNo;
    handleCyl1SecondSearch();
  }

  function selectCyl2Suggestion(cardNo: string) {
    cyl2SecondCardNo = cardNo;
    handleCyl2SecondSearch();
  }

  function selectPCard(cardNo: string, cylinder: 1 | 2, position: 'first' | 'second') {
    if (cylinder === 1) {
      if (position === 'first') {
        cyl1FirstCardNo = cardNo;
        handleCyl1FirstSearch();
      } else {
        cyl1SecondCardNo = cardNo;
        handleCyl1SecondSearch();
      }
    } else {
      if (position === 'first') {
        cyl2FirstCardNo = cardNo;
        handleCyl2FirstSearch();
      } else {
        cyl2SecondCardNo = cardNo;
        handleCyl2SecondSearch();
      }
    }
  }

  function showCardPreview(card: Card) {
    previewCard = card;
  }

  function closePreview() {
    previewCard = null;
  }

  function resetAll() {
    cyl1FirstCardNo = '';
    cyl1SecondCardNo = '';
    cyl1Matches = [];
    cyl2FirstCardNo = '';
    cyl2SecondCardNo = '';
    cyl2Matches = [];
  }

  function isSpecialCard(cardNo: string): boolean {
    return cardNo === 'サプライズランダム';
  }
</script>

<svelte:head>
  <title>アイプリ配列検索</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <meta name="theme-color" content="#ff69b4" />
</svelte:head>

<main>
  <header>
    <h1>アイプリ配列検索</h1>
    <p class="subtitle">ハッピーイースター！リング5弾</p>
  </header>

  <!-- 使い方ガイド -->
  {#if !cyl1FirstCardNo && !cyl2FirstCardNo}
    <section class="guide-section">
      <h2>使い方</h2>
      <p class="guide-text">筐体には<strong>2つのシリンダー</strong>があり、どちらからカードが出るかはランダムです。</p>
      <p class="guide-text">それぞれのシリンダーで出たカード番号を入力すると、次以降のカード配列が分かります。</p>
    </section>
  {/if}

  <div class="cylinders-container">
    <!-- シリンダー1 -->
    <section class="cylinder-section cylinder-1-theme">
      <div class="cylinder-title">
        <span class="cylinder-badge-1">シリンダー①</span>
      </div>

      <div class="input-group">
        <label>1枚目</label>
        <div class="input-row">
          <input
            type="text"
            inputmode="numeric"
            placeholder="No"
            bind:value={cyl1FirstCardNo}
            on:input={handleCyl1FirstSearch}
            maxlength="3"
          />
          {#if cyl1FirstCard}
            <button class="card-preview-btn" on:click={() => showCardPreview(cyl1FirstCard)}>
              <img src={getCardImageUrl(cyl1FirstCard)} alt={cyl1FirstCard.name} />
            </button>
            <span class="card-name">{cyl1FirstCard.name}</span>
          {/if}
        </div>
      </div>

      {#if cyl1Matches.length > 0}
        <div class="input-group">
          <label>2枚目</label>
          <div class="input-row">
            <input
              type="text"
              inputmode="numeric"
              placeholder="No"
              bind:value={cyl1SecondCardNo}
              on:input={handleCyl1SecondSearch}
              maxlength="3"
            />
            {#if cyl1SecondCard}
              <button class="card-preview-btn" on:click={() => showCardPreview(cyl1SecondCard)}>
                <img src={getCardImageUrl(cyl1SecondCard)} alt={cyl1SecondCard.name} />
              </button>
              <span class="card-name">{cyl1SecondCard.name}</span>
            {/if}
          </div>

          {#if cyl1PossibleNextCards.length > 0 && !cyl1SecondCardNo}
            <div class="suggestions">
              <p class="suggestions-label">候補:</p>
              <div class="suggestions-list">
                {#each cyl1PossibleNextCards as card}
                  <button
                    class="suggestion-btn"
                    class:rarity-4={card.rarity === 4}
                    class:special={isSpecialCard(card.no)}
                    on:click={() => selectCyl1Suggestion(card.no)}
                  >
                    {isSpecialCard(card.no) ? 'SP' : card.no}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- シリンダー1の結果 -->
      {#if cyl1Matches.length > 0 && cyl1SecondCardNo}
        <div class="results">
          {#each cyl1Matches as match}
            <div class="result-header">
              <span class="result-badge">配列{match.cylinderId}</span>
              <span class="result-count">残り{match.remainingCards.length}枚</span>
            </div>
            <div class="cards-grid">
              {#each match.remainingCards.slice(0, 20) as cardNo, i}
                {@const card = getCard(cardNo)}
                {#if isSpecialCard(cardNo)}
                  <div class="card-item special">
                    <span class="card-order">{i + 1}</span>
                    <div class="special-face">?</div>
                    <span class="card-label">SP</span>
                  </div>
                {:else if card}
                  <button class="card-item" class:rarity-4={card.rarity === 4} on:click={() => showCardPreview(card)}>
                    <span class="card-order">{i + 1}</span>
                    <img src={getCardImageUrl(card)} alt={card.name} loading="lazy" />
                    <span class="card-label">{card.no}</span>
                  </button>
                {/if}
              {/each}
            </div>
            {#if match.remainingCards.length > 20}
              <p class="more-cards">...他{match.remainingCards.length - 20}枚</p>
            {/if}
          {/each}
        </div>
      {/if}
    </section>

    <!-- シリンダー2 -->
    <section class="cylinder-section cylinder-2-theme">
      <div class="cylinder-title">
        <span class="cylinder-badge-2">シリンダー②</span>
      </div>

      <div class="input-group">
        <label>1枚目</label>
        <div class="input-row">
          <input
            type="text"
            inputmode="numeric"
            placeholder="No"
            bind:value={cyl2FirstCardNo}
            on:input={handleCyl2FirstSearch}
            maxlength="3"
          />
          {#if cyl2FirstCard}
            <button class="card-preview-btn" on:click={() => showCardPreview(cyl2FirstCard)}>
              <img src={getCardImageUrl(cyl2FirstCard)} alt={cyl2FirstCard.name} />
            </button>
            <span class="card-name">{cyl2FirstCard.name}</span>
          {/if}
        </div>
      </div>

      {#if cyl2Matches.length > 0}
        <div class="input-group">
          <label>2枚目</label>
          <div class="input-row">
            <input
              type="text"
              inputmode="numeric"
              placeholder="No"
              bind:value={cyl2SecondCardNo}
              on:input={handleCyl2SecondSearch}
              maxlength="3"
            />
            {#if cyl2SecondCard}
              <button class="card-preview-btn" on:click={() => showCardPreview(cyl2SecondCard)}>
                <img src={getCardImageUrl(cyl2SecondCard)} alt={cyl2SecondCard.name} />
              </button>
              <span class="card-name">{cyl2SecondCard.name}</span>
            {/if}
          </div>

          {#if cyl2PossibleNextCards.length > 0 && !cyl2SecondCardNo}
            <div class="suggestions">
              <p class="suggestions-label">候補:</p>
              <div class="suggestions-list">
                {#each cyl2PossibleNextCards as card}
                  <button
                    class="suggestion-btn"
                    class:rarity-4={card.rarity === 4}
                    class:special={isSpecialCard(card.no)}
                    on:click={() => selectCyl2Suggestion(card.no)}
                  >
                    {isSpecialCard(card.no) ? 'SP' : card.no}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- シリンダー2の結果 -->
      {#if cyl2Matches.length > 0 && cyl2SecondCardNo}
        <div class="results">
          {#each cyl2Matches as match}
            <div class="result-header">
              <span class="result-badge">配列{match.cylinderId}</span>
              <span class="result-count">残り{match.remainingCards.length}枚</span>
            </div>
            <div class="cards-grid">
              {#each match.remainingCards.slice(0, 20) as cardNo, i}
                {@const card = getCard(cardNo)}
                {#if isSpecialCard(cardNo)}
                  <div class="card-item special">
                    <span class="card-order">{i + 1}</span>
                    <div class="special-face">?</div>
                    <span class="card-label">SP</span>
                  </div>
                {:else if card}
                  <button class="card-item" class:rarity-4={card.rarity === 4} on:click={() => showCardPreview(card)}>
                    <span class="card-order">{i + 1}</span>
                    <img src={getCardImageUrl(card)} alt={card.name} loading="lazy" />
                    <span class="card-label">{card.no}</span>
                  </button>
                {/if}
              {/each}
            </div>
            {#if match.remainingCards.length > 20}
              <p class="more-cards">...他{match.remainingCards.length - 20}枚</p>
            {/if}
          {/each}
        </div>
      {/if}
    </section>
  </div>

  <button class="reset-btn" on:click={resetAll}>リセット</button>
</main>

<!-- カードプレビューモーダル -->
{#if previewCard}
  <div class="modal-overlay" on:click={closePreview} on:keydown={(e) => e.key === 'Escape' && closePreview()} role="button" tabindex="0">
    <div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation role="dialog" tabindex="-1">
      <button class="close-btn" on:click={closePreview}>×</button>
      <img src={getCardImageUrl(previewCard)} alt={previewCard.name} />
      <div class="modal-info">
        <h3>No.{previewCard.no} {previewCard.name}</h3>
        <p>{getRarityStars(previewCard.rarity)}</p>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(*) {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', sans-serif;
    background: linear-gradient(135deg, #fff0f5 0%, #ffe4ec 100%);
    min-height: 100vh;
  }

  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 8px;
    padding-bottom: 80px;
  }

  header {
    text-align: center;
    margin-bottom: 8px;
  }

  h1 {
    color: #ff69b4;
    font-size: 18px;
    margin: 0;
  }

  .subtitle {
    color: #888;
    font-size: 11px;
    margin: 2px 0 0 0;
  }

  /* ガイド */
  .guide-section {
    background: white;
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 8px;
    box-shadow: 0 2px 8px rgba(255, 105, 180, 0.1);
  }

  .guide-section h2 {
    font-size: 13px;
    color: #ff69b4;
    margin: 0 0 6px 0;
  }

  .guide-text {
    font-size: 12px;
    color: #555;
    margin: 0 0 4px 0;
    line-height: 1.4;
  }

  .guide-text strong {
    color: #ff69b4;
  }

  /* シリンダーコンテナ - モバイルファースト横並び */
  .cylinders-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .cylinder-section {
    background: white;
    border-radius: 12px;
    padding: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    min-width: 0; /* グリッドオーバーフロー防止 */
  }

  .cylinder-1-theme {
    border-top: 3px solid #ff69b4;
  }

  .cylinder-2-theme {
    border-top: 3px solid #42a5f5;
  }

  .cylinder-title {
    margin-bottom: 8px;
    text-align: center;
  }

  .cylinder-badge-1 {
    background: #ff69b4;
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }

  .cylinder-badge-2 {
    background: #42a5f5;
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }

  /* 入力グループ - コンパクト */
  .input-group {
    margin-bottom: 8px;
  }

  .input-group label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    color: #888;
    margin-bottom: 4px;
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  input {
    width: 50px;
    height: 40px;
    font-size: 18px;
    font-weight: bold;
    border: 2px solid #ddd;
    border-radius: 8px;
    text-align: center;
    outline: none;
    flex-shrink: 0;
  }

  .cylinder-1-theme input:focus {
    border-color: #ff69b4;
  }

  .cylinder-2-theme input:focus {
    border-color: #42a5f5;
  }

  .card-preview-btn {
    width: 36px;
    height: 50px;
    border: none;
    padding: 0;
    background: none;
    cursor: pointer;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    flex-shrink: 0;
  }

  .card-preview-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-name {
    font-size: 11px;
    font-weight: 600;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* サジェスト - コンパクト */
  .suggestions {
    margin-top: 6px;
    padding: 6px;
    background: #f9f9f9;
    border-radius: 8px;
  }

  .suggestions-label {
    font-size: 10px;
    color: #888;
    margin: 0 0 4px 0;
  }

  .suggestions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .suggestion-btn {
    padding: 4px 8px;
    font-size: 12px;
    font-weight: bold;
    border: 2px solid #ddd;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    min-width: 32px;
  }

  .suggestion-btn.rarity-4 {
    border-color: #ffd700;
    background: #fffef0;
    color: #b8860b;
  }

  .suggestion-btn.special {
    border-color: #9c27b0;
    background: #f3e5f5;
    color: #9c27b0;
  }

  /* 結果表示 */
  .results {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #eee;
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .result-badge {
    background: #4caf50;
    color: white;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: bold;
  }

  .result-count {
    font-size: 10px;
    color: #888;
  }

  /* カードグリッド - モバイル対応 */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }

  .card-item {
    background: white;
    border: 2px solid #eee;
    border-radius: 6px;
    padding: 3px;
    cursor: pointer;
    position: relative;
    text-align: center;
  }

  .card-item.rarity-4 {
    border-color: #ffd700;
    background: #fffef5;
  }

  .card-item.special {
    border-color: #9c27b0;
    background: #f3e5f5;
    cursor: default;
  }

  .card-order {
    position: absolute;
    top: 1px;
    left: 1px;
    width: 14px;
    height: 14px;
    background: #ff69b4;
    color: white;
    border-radius: 50%;
    font-size: 9px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cylinder-2-theme .card-order {
    background: #42a5f5;
  }

  .card-item img {
    width: 100%;
    aspect-ratio: 5/7;
    object-fit: cover;
    border-radius: 3px;
  }

  .special-face {
    width: 100%;
    aspect-ratio: 5/7;
    background: linear-gradient(135deg, #9c27b0, #e91e63);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: bold;
  }

  .card-label {
    display: block;
    font-size: 9px;
    color: #666;
    margin-top: 1px;
  }

  .more-cards {
    font-size: 10px;
    color: #888;
    text-align: center;
    margin: 6px 0 0 0;
  }

  /* リセットボタン */
  .reset-btn {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 32px;
    background: #ff69b4;
    color: white;
    border: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(255, 105, 180, 0.4);
    z-index: 100;
  }

  /* タブレット以上でより広いレイアウト */
  @media (min-width: 600px) {
    main {
      padding: 16px;
      padding-bottom: 100px;
    }

    h1 {
      font-size: 22px;
    }

    .cylinders-container {
      gap: 12px;
    }

    .cylinder-section {
      padding: 16px;
    }

    .cylinder-badge-1,
    .cylinder-badge-2 {
      font-size: 14px;
      padding: 6px 14px;
    }

    input {
      width: 60px;
      height: 48px;
      font-size: 20px;
    }

    .card-preview-btn {
      width: 44px;
      height: 62px;
    }

    .card-name {
      font-size: 13px;
    }

    .cards-grid {
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
    }

    .card-order {
      width: 18px;
      height: 18px;
      font-size: 10px;
    }
  }

  /* モーダル */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    padding: 14px;
    max-width: 260px;
    width: 100%;
    position: relative;
  }

  .modal-content img {
    width: 100%;
    border-radius: 10px;
  }

  .modal-info {
    text-align: center;
    margin-top: 10px;
  }

  .modal-info h3 {
    margin: 0;
    font-size: 15px;
    color: #333;
  }

  .modal-info p {
    margin: 4px 0 0 0;
    color: #ffc107;
    font-size: 16px;
  }

  .close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border: none;
    background: #f0f0f0;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
