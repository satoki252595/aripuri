<script lang="ts">
  import { searchByFirstCard, searchByTwoCards, getCard, getCardImageUrl, getRemainingSequence, getRarityStars, normalizeCardNo, getCardType, getPCards } from '$lib/search';
  import type { SearchMatch, Card } from '$lib/types';

  let firstCardNo = '';
  let secondCardNo = '';
  let matches: SearchMatch[] = [];
  let selectedMatch: SearchMatch | null = null;
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
    selectedMatch = null;
    secondCardNo = '';
  }

  function handleSecondSearch() {
    if (!firstCardNo || !secondCardNo) return;
    matches = searchByTwoCards(firstCardNo, secondCardNo);
    if (matches.length === 1) {
      selectedMatch = matches[0];
    } else {
      selectedMatch = null;
    }
  }

  function selectSuggestion(cardNo: string) {
    secondCardNo = cardNo;
    handleSecondSearch();
  }

  function selectMatch(match: SearchMatch) {
    selectedMatch = match;
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
    selectedMatch = null;
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
    <p class="subtitle">リング5弾</p>
  </header>

  <section class="search-section">
    <!-- 1枚目入力 -->
    <div class="card-input-group">
      <label for="first-card">1枚目のカードNo</label>
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
            <div class="input-card-preview">
              <img
                src={getCardImageUrl(firstCard)}
                alt={firstCard.name}
                on:error={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
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
        <label for="second-card">2枚目のカードNo（絞り込み）</label>
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
              <div class="input-card-preview">
                <img
                  src={getCardImageUrl(secondCard)}
                  alt={secondCard.name}
                  on:error={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
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
                  <button class="suggestion-card" on:click={() => selectSuggestion(card.no)}>
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
    {#if selectedMatch}
      <div class="search-summary">
        <div class="search-cards">
          {#if firstCard}
            <div class="summary-card">
              <img src={getCardImageUrl(firstCard)} alt={firstCard.name} />
              <span>{firstCard.no}</span>
            </div>
          {/if}
          <span class="arrow">→</span>
          {#if secondCard}
            <div class="summary-card">
              <img src={getCardImageUrl(secondCard)} alt={secondCard.name} />
              <span>{secondCard.no}</span>
            </div>
          {/if}
        </div>
        <div class="search-result-badge">
          <span class="cylinder-badge">配列{selectedMatch.cylinderId}</span>
          <span class="position-text">No.{selectedMatch.rowPosition}</span>
        </div>
      </div>
    {/if}

    <button class="reset-btn" on:click={reset}>リセット</button>
  </section>

  <!-- 候補配列一覧 -->
  {#if matches.length > 0 && !selectedMatch}
    <section class="results-section">
      <h2>候補配列 ({matches.length}件)</h2>
      {#if matches.length > 1 && secondCardNo}
        <p class="multiple-matches-note">複数の配列が該当します。タップして選択してください。</p>
      {/if}
      <div class="matches-list">
        {#each matches as match}
          <button class="match-card" on:click={() => selectMatch(match)}>
            <div class="match-main">
              <span class="cylinder-id">配列{match.cylinderId}</span>
              <span class="cylinder-name">{match.cylinderName}</span>
            </div>
            <div class="match-sub">
              <span class="position">No.{match.rowPosition} - {match.cardIndex + 1}枚目</span>
              <span class="remaining">残り{match.remainingCards.length}枚</span>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {/if}

  <!-- 次以降のカード表示 -->
  {#if selectedMatch}
    <section class="sequence-section">
      <div class="sequence-header">
        <h2>{selectedMatch.cylinderName}</h2>
        <p class="sequence-position">No.{selectedMatch.rowPosition} / {selectedMatch.cardIndex + 1}枚目から</p>
        <button class="back-btn" on:click={() => selectedMatch = null}>
          ← 候補一覧に戻る
        </button>
      </div>

      <h3>次以降のカード ({selectedMatch.remainingCards.length}枚)</h3>
      <div class="sequence-cards">
        {#each selectedMatch.remainingCards as cardNo, i}
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
            <button class="card-item" on:click={() => showCardPreview(card)}>
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
  }

  .input-card-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
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

  .position-text {
    color: #2e7d32;
    font-size: 14px;
    font-weight: 600;
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

  .position, .remaining {
    color: #888;
    font-size: 12px;
  }

  .sequence-header {
    margin-bottom: 16px;
  }

  .sequence-position {
    color: #666;
    font-size: 14px;
    margin: 4px 0 14px 0;
  }

  .back-btn {
    padding: 10px 18px;
    background: #f5f5f5;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
  }

  .back-btn:active {
    background: #eee;
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
