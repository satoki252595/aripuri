import type { Card, Cylinder, CylinderRow, SearchMatch, CardsData, CylindersData } from './types';
import cardsData from './data/cards.json';
import cylindersData from './data/cylinders.json';

const cards = (cardsData as CardsData).cards;
const cylinders = (cylindersData as CylindersData).cylinders;

export function getCard(no: string): Card | undefined {
  return cards.find(c => c.no === no);
}

export function getCardImageUrl(card: Card): string {
  return `/images/cards/${card.no}.jpg`;
}

export function getAllCards(): Card[] {
  return cards;
}

// Normalize card number (handle both "3" -> "03" and "03P" -> "03P")
export function normalizeCardNo(cardNo: string): string {
  if (cardNo.includes('P')) {
    // For P cards like "3P" -> "03P"
    const num = cardNo.replace('P', '');
    return num.padStart(2, '0') + 'P';
  }
  return cardNo.padStart(2, '0');
}

// Get all remaining cards in a cylinder from a specific row and card index
// This follows the Z-pattern: finish current row, then all subsequent rows
function getRemainingCardsInCylinder(cylinder: Cylinder, rowPosition: number, cardIndex: number): string[] {
  const remaining: string[] = [];

  for (const row of cylinder.rows) {
    if (row.position < rowPosition) continue;

    if (row.position === rowPosition) {
      // Current row: add cards after the found card
      remaining.push(...row.cards.slice(cardIndex + 1));
    } else {
      // Subsequent rows: add all cards
      remaining.push(...row.cards);
    }
  }

  return remaining;
}

export function searchByFirstCard(cardNo: string): SearchMatch[] {
  const matches: SearchMatch[] = [];
  const normalizedNo = normalizeCardNo(cardNo);

  for (const cylinder of cylinders) {
    for (const row of cylinder.rows) {
      const cardIndex = row.cards.indexOf(normalizedNo);
      if (cardIndex !== -1) {
        // Get all remaining cards following Z-pattern
        const remainingCards = getRemainingCardsInCylinder(cylinder, row.position, cardIndex);
        matches.push({
          cylinderId: cylinder.id,
          cylinderName: cylinder.name,
          rowPosition: row.position,
          cardIndex,
          remainingCards
        });
      }
    }
  }

  return matches;
}

export function searchByTwoCards(firstCardNo: string, secondCardNo: string): SearchMatch[] {
  const firstMatches = searchByFirstCard(firstCardNo);
  const normalizedSecondNo = normalizeCardNo(secondCardNo);

  return firstMatches
    .filter(match => {
      if (match.remainingCards.length === 0) return false;
      return match.remainingCards[0] === normalizedSecondNo;
    })
    .map(match => ({
      ...match,
      // Update remainingCards to show cards AFTER the 2nd card
      remainingCards: match.remainingCards.slice(1),
      cardIndex: match.cardIndex + 1
    }));
}

export function getRemainingSequence(match: SearchMatch): Card[] {
  return match.remainingCards
    .map(no => getCard(no))
    .filter((card): card is Card => card !== undefined);
}

export function getCylinder(id: string): Cylinder | undefined {
  return cylinders.find(c => c.id === id);
}

export function getAllCylinders(): Cylinder[] {
  return cylinders;
}

export function formatCardNo(no: string): string {
  return normalizeCardNo(no);
}

export function getRarityStars(rarity: number): string {
  return '★'.repeat(rarity);
}

// Check if a card number is a special type
export function getCardType(cardNo: string): 'normal' | 'random' | 'surprise' {
  if (cardNo === 'サプライズランダム') return 'surprise';
  if (cardNo.includes('P')) return 'normal'; // P cards are still normal numbered cards
  return 'normal';
}

// Get all P-suffix cards
export function getPCards(): Card[] {
  return cards.filter(c => c.no.includes('P'));
}
