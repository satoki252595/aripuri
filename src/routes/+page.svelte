<script lang="ts">
  import { searchByFirstCard, searchByTwoCards, getCard, getCardImageUrl, getRemainingSequence, getRarityStars, normalizeCardNo, getCardType, getPCards } from '$lib/search';
  import type { SearchMatch, Card } from '$lib/types';

  let firstCardNo = '';
  let secondCardNo = '';
  let matches: SearchMatch[] = [];
  let previewCard: Card | null = null;

  // P cards for quick selection
  const pCards = getPCards();

  // Get card objects for display
  $: firstCard = firstCardNo ? getCard(normalizeCardNo(firstCardNo)) : null;
  $: secondCard = secondCardNo ? getCard(normalizeCardNo(secondCardNo)) : null;

  // Get possible next cards for autocomplete (including special cards)
  $: possibleNextCards = (() => {
    if (matches.length === 0) return [];
    const cardNos = new Set<string>();
    for (const match of matches) {
      if (match.remainingCards.length > 0) {
        cardNos.add(match.remainingCards[0]);
      }
    }
    return Array.from(cardNos)
      .map(no => {
        // Handle サプライズランダム specially
        if (no === 'サプライズランダム') {
          return { no, name: 'サプライズ', rarity: 4, isSpecial: true } as Card & { isSpecial?: boolean };
        }
        return getCard(no);
      })
      .filter((card): card is Card => card !== undefined)
      .sort((a, b) => {
        // サプライズランダム goes last
        if (a.no === 'サプライズランダム') return 1;
        if (b.no === 'サプライズランダム') return -1;
        return parseInt(a.no) - parseInt(b.no);
      });
  })();

  function handleFirstSearch() {
    if (!firstCardNo) {
      matches = [];
      return;
    }
    matches = searchByFirstCard(firstCardNo);
    secondCardNo = '';
  }

  function handleSecondSearch() {
    if (!firstCardNo) return;

    // 2枚目が空の場合、1枚目の検索結果に戻す
    if (!secondCardNo) {
      matches = searchByFirstCard(firstCardNo);
      return;
    }

    matches = searchByTwoCards(firstCardNo, secondCardNo);
  }

  function selectSuggestion(cardNo: string) {
    secondCardNo = cardNo;
    handleSecondSearch();
  }

  function showCardPreview(card: Card) {
    previewCard = card;
  }

  function closePreview() {
    previewCard = null;
  }

  function reset() {
    firstCardNo = '';
    secondCardNo = '';
    matches = [];
  }

  function selectPCard(cardNo: string, target: 'first' | 'second') {
    if (target === 'first') {
      firstCardNo = cardNo;
      handleFirstSearch();
    } else {
      secondCardNo = cardNo;
      handleSecondSearch();
    }
  }

  // Check if card is a special type for styling
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
  {#if !firstCardNo}
    <section class="guide-section">
      <h2>使い方</h2>
      <ol class="guide-steps">
        <li><strong>1枚目</strong>のカード番号を入力</li>
        <li><strong>2枚目</strong>のカード番号を入力して絞り込み</li>
        <li>該当する<strong>2つのシリンダー</strong>の配列を同時に確認</li>
      </ol>
      <p class="guide-note">※ 筐体には2つのシリンダーがあり、どちらが出るかはランダムです</p>
    </section>
  {/if}

  <section class="search-section">
    <!-- 1枚目入力 -->
    <div class="card-input-group">
      <div class="step-indicator">
        <span class="step-number">1</span>
        <label for="first-card">1枚目のカードNo</label>
      </div>
      <div class="card-input-row">
        <div class="input-with-preview">
          <input
            id="first-card"
            type="text"
            inputmode="numeric"
            pattern="[0-9P]*"
            placeholder="01"
            bind:value={firstCardNo}
            on:input={handleFirstSearch}
            maxlength="3"
          />
          {#if firstCard}
            <button class="input-card-preview" on:click={() => showCardPreview(firstCard)}>
              <img
                src={getCardImageUrl(firstCard)}
                alt={firstCard.name}
                on:error={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </button>
          {/if}
        </div>
        {#if firstCard}
          <div class="card-detail">
            <span class="card-name-large">{firstCard.name}</span>
            <span class="card-rarity-large">{getRarityStars(firstCard.rarity)}</span>
          </div>
        {/if}
      </div>
      <!-- Pカード選択ボタン -->
      <div class="p-card-buttons">
        <span class="p-card-label">P:</span>
        {#each pCards as pCard}
          <button
            class="p-card-btn"
            class:selected={firstCardNo === pCard.no}
            on:click={() => selectPCard(pCard.no, 'first')}
          >
            {pCard.no}
          </button>
        {/each}
      </div>
    </div>

    <!-- 2枚目入力 -->
    {#if matches.length > 0}
      <div class="card-input-group">
        <div class="step-indicator">
          <span class="step-number">2</span>
          <label for="second-card">2枚目のカードNo</label>
        </div>
        <div class="card-input-row">
          <div class="input-with-preview">
            <input
              id="second-card"
              type="text"
              inputmode="numeric"
              pattern="[0-9P]*"
              placeholder="01"
              bind:value={secondCardNo}
              on:input={handleSecondSearch}
              maxlength="3"
            />
            {#if secondCard}
              <button class="input-card-preview" on:click={() => showCardPreview(secondCard)}>
                <img
                  src={getCardImageUrl(secondCard)}
                  alt={secondCard.name}
                  on:error={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </button>
            {/if}
          </div>
          {#if secondCard}
            <div class="card-detail">
              <span class="card-name-large">{secondCard.name}</span>
              <span class="card-rarity-large">{getRarityStars(secondCard.rarity)}</span>
            </div>
          {/if}
        </div>

        <!-- オートコンプリート候補 -->
        {#if possibleNextCards.length > 0 && !secondCardNo}
          <div class="suggestions">
            <p class="suggestions-label">次に来る可能性があるカード:</p>
            <div class="suggestions-grid">
              {#each possibleNextCards as card}
                {#if isSpecialCard(card.no)}
                  <button class="suggestion-card suggestion-special" on:click={() => selectSuggestion(card.no)}>
                    <div class="suggestion-special-face">
                      <span class="suggestion-special-icon">?</span>
                    </div>
                    <div class="suggestion-info">
                      <span class="suggestion-no special">SP</span>
                      <span class="suggestion-name">サプライズ</span>
                    </div>
                  </button>
                {:else}
                  <button class="suggestion-card" class:rarity-4={card.rarity === 4} on:click={() => selectSuggestion(card.no)}>
                    <img
                      src={getCardImageUrl(card)}
                      alt={card.name}
                      on:error={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div class="suggestion-info">
                      <span class="suggestion-no">{card.no}</span>
                      <span class="suggestion-name">{card.name}</span>
                    </div>
                  </button>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- 検索結果サマリー -->
    {#if matches.length > 0 && secondCardNo && secondCard}
      <div class="search-summary">
        <div class="search-cards">
          {#if firstCard}
            <div class="summary-card">
              <img src={getCardImageUrl(firstCard)} alt={firstCard.name} />
              <span>{firstCard.no}</span>
            </div>
          {/if}
          <span class="arrow">→</span>
          <div class="summary-card">
            <img src={getCardImageUrl(secondCard)} alt={secondCard.name} />
            <span>{secondCard.no}</span>
          </div>
        </div>
        <div class="search-result-badge">
          {#each matches as match}
            <span class="cylinder-badge">配列{match.cylinderId}</span>
          {/each}
        </div>
      </div>
    {/if}

    <button class="reset-btn" on:click={reset}>リセット</button>
  </section>

  <!-- 候補配列一覧（1枚目のみ入力時） -->
  {#if matches.length > 0 && !secondCardNo}
    <section class="results-section">
      <h2>候補配列 ({matches.length}件)</h2>
      <div class="matches-list">
        {#each matches as match}
          <div class="match-card">
            <div class="match-main">
              <span class="cylinder-id">配列{match.cylinderId}</span>
              <span class="cylinder-name">{match.cylinderName}</span>
            </div>
            <div class="match-sub">
              <span class="remaining">残り{match.remainingCards.length}枚</span>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- 次以降のカード表示（2枚目入力後、全シリンダー表示） -->
  {#if matches.length > 0 && secondCardNo}
    {#if matches.length >= 2}
      <div class="dual-cylinder-notice">
        <span class="notice-icon">🎰</span>
        <span class="notice-text">2つのシリンダーが該当します（どちらが出るかはランダム）</span>
      </div>
    {/if}
    {#each matches as match, matchIndex}
      <section class="sequence-section cylinder-{matchIndex + 1}">
        <div class="sequence-header">
          <div class="cylinder-header-badge cylinder-color-{matchIndex + 1}">
            <span class="cylinder-id-large">配列{match.cylinderId}</span>
            <span class="cylinder-name-sub">{match.cylinderName}</span>
          </div>
          {#if matches.length >= 2}
            <span class="cylinder-label">{matchIndex === 0 ? 'シリンダー①' : 'シリンダー②'}</span>
          {/if}
        </div>

        <h3>次以降のカード ({match.remainingCards.length}枚)</h3>
        <div class="sequence-cards">
          {#each match.remainingCards as cardNo, i}
            {@const card = getCard(cardNo)}
            {#if isSpecialCard(cardNo)}
              <!-- サプライズランダムなど特殊カード -->
              <div class="card-item special-card">
                <div class="card-order">{i + 1}</div>
                <div class="special-card-face">
                  <span class="special-icon">?</span>
                  <span class="special-label">サプライズ</span>
                </div>
                <div class="card-info">
                  <span class="card-no special">SP</span>
                  <span class="card-name special">ランダム</span>
                  <span class="card-rarity">?</span>
                </div>
              </div>
            {:else if card}
              <button class="card-item" class:rarity-4={card.rarity === 4} on:click={() => showCardPreview(card)}>
                <div class="card-order">{i + 1}</div>
                <img
                  src={getCardImageUrl(card)}
                  alt={card.name}
                  loading="lazy"
                  on:error={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 140%22%3E%3Crect fill=%22%23eee%22 width=%22100%22 height=%22140%22/%3E%3Ctext x=%2250%22 y=%2270%22 text-anchor=%22middle%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'; }}
                />
                <div class="card-info">
                  <span class="card-no">{card.no}</span>
                  <span class="card-name">{card.name}</span>
                  <span class="card-rarity">{getRarityStars(card.rarity)}</span>
                </div>
              </button>
            {/if}
          {/each}
        </div>
      </section>
    {/each}
  {/if}

  {#if matches.length === 0 && firstCardNo}
    <section class="no-results">
      <p>該当する配列が見つかりませんでした</p>
    </section>
  {/if}
</main>

<!-- カードプレビューモーダル -->
{#if previewCard}
  <div class="modal-overlay" on:click={closePreview} on:keydown={(e) => e.key === 'Escape' && closePreview()} role="button" tabindex="0">
    <div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation role="dialog" tabindex="-1">
      <button class="close-btn" on:click={closePreview}>×</button>
      <img
        src={getCardImageUrl(previewCard)}
        alt={previewCard.name}
        on:error={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 140%22%3E%3Crect fill=%22%23eee%22 width=%22100%22 height=%22140%22/%3E%3Ctext x=%2250%22 y=%2270%22 text-anchor=%22middle%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'; }}
      />
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
    min-height: 100dvh;
  }

  main {
    max-width: 100%;
    padding: 12px;
    padding-bottom: env(safe-area-inset-bottom, 24px);
  }

  @media (min-width: 480px) {
    main {
      max-width: 480px;
      margin: 0 auto;
      padding: 16px;
    }
  }

  header {
    text-align: center;
    margin-bottom: 16px;
    padding-top: env(safe-area-inset-top, 8px);
  }

  h1 {
    color: #ff69b4;
    font-size: 22px;
    margin: 0 0 2px 0;
  }

  .subtitle {
    color: #888;
    font-size: 13px;
    margin: 0;
  }

  /* 使い方ガイド */
  .guide-section {
    background: white;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(255, 105, 180, 0.15);
    margin-bottom: 12px;
  }

  .guide-section h2 {
    font-size: 15px;
    color: #ff69b4;
    margin: 0 0 12px 0;
  }

  .guide-steps {
    margin: 0;
    padding-left: 24px;
    color: #555;
    font-size: 14px;
    line-height: 1.8;
  }

  .guide-steps strong {
    color: #ff69b4;
  }

  .guide-note {
    margin: 12px 0 0 0;
    padding: 10px 12px;
    background: #fff8fa;
    border-radius: 8px;
    font-size: 12px;
    color: #888;
  }

  /* ステップインジケーター */
  .step-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .step-number {
    width: 24px;
    height: 24px;
    background: #ff69b4;
    color: white;
    border-radius: 50%;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .step-indicator label {
    margin-bottom: 0;
  }

  .search-section {
    background: white;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(255, 105, 180, 0.15);
    margin-bottom: 12px;
  }

  .card-input-group {
    margin-bottom: 20px;
  }

  .card-input-group label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #ff69b4;
    margin-bottom: 10px;
  }

  .card-input-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .input-with-preview {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  input {
    width: 72px;
    height: 56px;
    padding: 0;
    font-size: 24px;
    font-weight: bold;
    border: 3px solid #ffb6c1;
    border-radius: 14px;
    outline: none;
    text-align: center;
    background: #fff;
    color: #333;
  }

  input:focus {
    border-color: #ff69b4;
    box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.2);
  }

  input::placeholder {
    color: #ddd;
  }

  .input-card-preview {
    width: 56px;
    height: 78px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    flex-shrink: 0;
    border: none;
    padding: 0;
    background: none;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .input-card-preview:active {
    transform: scale(0.95);
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }

  .input-card-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .card-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .card-name-large {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }

  .card-rarity-large {
    font-size: 14px;
    color: #ffc107;
  }

  .suggestions {
    margin-top: 16px;
    padding: 14px;
    background: linear-gradient(135deg, #fff8fa 0%, #fff0f5 100%);
    border-radius: 14px;
    border: 2px solid #ffb6c1;
  }

  .suggestions-label {
    font-size: 12px;
    font-weight: 600;
    color: #ff69b4;
    margin: 0 0 12px 0;
  }

  .suggestions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 10px;
  }

  .suggestion-card {
    background: white;
    border: 2px solid #ffb6c1;
    border-radius: 10px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .suggestion-card:active {
    transform: scale(0.95);
    background: #ff69b4;
    border-color: #ff69b4;
  }

  .suggestion-card:active .suggestion-no,
  .suggestion-card:active .suggestion-name {
    color: white;
  }

  .suggestion-card img {
    width: 100%;
    aspect-ratio: 5/7;
    object-fit: cover;
    border-radius: 6px;
    margin-bottom: 6px;
  }

  .suggestion-info {
    text-align: center;
  }

  .suggestion-no {
    display: block;
    font-size: 14px;
    font-weight: bold;
    color: #ff69b4;
  }

  .suggestion-name {
    display: block;
    font-size: 11px;
    color: #666;
  }

  /* サジェスト内の特殊カード */
  .suggestion-special {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
  }

  .suggestion-special:active {
    background: linear-gradient(135deg, #5a6fd6 0%, #6a4292 100%);
    border-color: #5a6fd6;
  }

  .suggestion-special-face {
    width: 100%;
    aspect-ratio: 5/7;
    border-radius: 6px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
  }

  .suggestion-special-icon {
    font-size: 24px;
    font-weight: bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }

  .suggestion-no.special {
    color: white;
  }

  .suggestion-special .suggestion-name {
    color: white;
  }

  /* サジェスト内の星4カード */
  .suggestion-card.rarity-4 {
    border-color: #ffd700;
    background: linear-gradient(135deg, #fffef5 0%, #fff9e6 100%);
    box-shadow: 0 0 6px rgba(255, 215, 0, 0.25);
  }

  .suggestion-card.rarity-4 .suggestion-no {
    color: #b8860b;
  }

  .suggestion-card.rarity-4 .suggestion-name {
    color: #8b6914;
  }

  .search-summary {
    margin-top: 16px;
    padding: 14px;
    background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
    border-radius: 14px;
    border: 2px solid #81c784;
  }

  .search-cards {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .summary-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .summary-card img {
    width: 48px;
    height: 67px;
    object-fit: cover;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }

  .summary-card span {
    font-size: 12px;
    font-weight: bold;
    color: #2e7d32;
  }

  .arrow {
    font-size: 24px;
    color: #4caf50;
    font-weight: bold;
  }

  .search-result-badge {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }

  .cylinder-badge {
    background: #4caf50;
    color: white;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
  }

  .reset-btn {
    width: 100%;
    padding: 14px;
    background: #f5f5f5;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 600;
    color: #888;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reset-btn:active {
    background: #eee;
    transform: scale(0.98);
  }

  .results-section, .sequence-section {
    background: white;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(255, 105, 180, 0.15);
    margin-bottom: 12px;
  }

  h2 {
    font-size: 17px;
    color: #333;
    margin: 0 0 14px 0;
  }

  .multiple-matches-note {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #856404;
  }

  .matches-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .match-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    background: linear-gradient(135deg, #fff0f5 0%, #ffe4ec 100%);
    border: 2px solid #ffb6c1;
    border-radius: 14px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }

  .match-card:active {
    background: linear-gradient(135deg, #ffe4ec 0%, #ffd0dc 100%);
    border-color: #ff69b4;
    transform: scale(0.98);
  }

  .match-main {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .match-sub {
    display: flex;
    gap: 12px;
  }

  .cylinder-id {
    background: #ff69b4;
    color: white;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 13px;
  }

  .cylinder-name {
    color: #333;
    font-size: 14px;
    font-weight: 500;
  }

  .remaining {
    color: #888;
    font-size: 12px;
  }

  .sequence-header {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cylinder-header-badge {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .cylinder-id-large {
    background: #ff69b4;
    color: white;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: bold;
  }

  .cylinder-name-sub {
    color: #666;
    font-size: 14px;
  }

  /* 2シリンダー表示の通知 */
  .dual-cylinder-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border: 2px solid #64b5f6;
    border-radius: 12px;
    margin-bottom: 12px;
  }

  .notice-icon {
    font-size: 20px;
  }

  .notice-text {
    font-size: 13px;
    font-weight: 600;
    color: #1565c0;
  }

  /* シリンダー1（ピンク系） */
  .cylinder-1 {
    border-left: 4px solid #ff69b4;
  }

  .cylinder-color-1 .cylinder-id-large {
    background: #ff69b4;
  }

  /* シリンダー2（ブルー系） */
  .cylinder-2 {
    border-left: 4px solid #42a5f5;
  }

  .cylinder-color-2 .cylinder-id-large {
    background: #42a5f5;
  }

  .cylinder-label {
    font-size: 12px;
    font-weight: 600;
    color: #888;
    padding: 4px 8px;
    background: #f5f5f5;
    border-radius: 4px;
  }

  h3 {
    font-size: 15px;
    color: #333;
    margin: 16px 0 14px 0;
  }

  .sequence-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  @media (min-width: 400px) {
    .sequence-cards {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .card-item {
    background: white;
    border: 2px solid #eee;
    border-radius: 12px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .card-item:active {
    border-color: #ff69b4;
    transform: scale(0.95);
  }

  /* 星4カードのハイライト */
  .card-item.rarity-4 {
    border-color: #ffd700;
    background: linear-gradient(135deg, #fffef5 0%, #fff9e6 100%);
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
  }

  .card-item.rarity-4 .card-order {
    background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
  }

  .card-item.rarity-4 .card-name {
    color: #b8860b;
  }

  .card-order {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 22px;
    height: 22px;
    background: #ff69b4;
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .card-item img {
    width: 100%;
    aspect-ratio: 5/7;
    object-fit: cover;
    border-radius: 8px;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 6px;
    gap: 1px;
  }

  .card-info .card-no {
    font-size: 11px;
    color: #888;
    font-weight: 500;
  }

  .card-info .card-name {
    font-size: 12px;
    color: #333;
    font-weight: 600;
  }

  .card-info .card-rarity {
    font-size: 10px;
    color: #ffc107;
  }

  .no-results {
    text-align: center;
    padding: 40px 20px;
    color: #888;
    background: white;
    border-radius: 20px;
  }

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
    padding: 24px;
  }

  .modal-content {
    background: white;
    border-radius: 20px;
    padding: 20px;
    max-width: 320px;
    width: 100%;
    position: relative;
  }

  .modal-content img {
    width: 100%;
    border-radius: 12px;
  }

  .modal-info {
    text-align: center;
    margin-top: 14px;
  }

  .modal-info h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
  }

  .modal-info p {
    margin: 6px 0 0 0;
    color: #ffc107;
    font-size: 20px;
  }

  .close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    border: none;
    background: #f0f0f0;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
  }

  .close-btn:active {
    background: #e0e0e0;
  }

  /* Pカードボタン */
  .p-card-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
  }

  .p-card-label {
    font-size: 13px;
    font-weight: 600;
    color: #ff69b4;
  }

  .p-card-btn {
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    background: #fff0f5;
    border: 2px solid #ffb6c1;
    border-radius: 8px;
    color: #ff69b4;
    cursor: pointer;
    transition: all 0.2s;
  }

  .p-card-btn:active,
  .p-card-btn.selected {
    background: #ff69b4;
    border-color: #ff69b4;
    color: white;
  }

  /* 特殊カード（サプライズランダム） */
  .special-card {
    cursor: default;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
  }

  .special-card-face {
    width: 100%;
    aspect-ratio: 5/7;
    border-radius: 8px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .special-icon {
    font-size: 32px;
    font-weight: bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }

  .special-label {
    font-size: 10px;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }

  .special-card .card-order {
    background: #667eea;
  }

  .card-info .card-no.special,
  .card-info .card-name.special {
    color: #667eea;
  }
</style>
