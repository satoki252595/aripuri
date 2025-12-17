import type { Card, Cylinder, CylinderRow, SearchMatch, CardsData, CylindersData } from './types';
import cardsData from './data/cards.json';
import cylindersData from './data/cylinders.json';

const cards = (cardsData as CardsData).cards;
const cylinders = (cylindersData as CylindersData).cylinders;

export function getCard(no: string): Card | undefined {
  return cards.find(c => c.no === no);
}

export function getCardImageUrl(card: Card): string {
  // Try JPG first, fallback to SVG for placeholder images
  return `/images/cards/${card.no}.jpg`;
}

export function getAllCards(): Card[] {
  return cards;
}

export function searchByFirstCard(cardNo: string): SearchMatch[] {
  const matches: SearchMatch[] = [];
  const normalizedNo = cardNo.padStart(2, '0');

  for (const cylinder of cylinders) {
    for (const row of cylinder.rows) {
      const cardIndex = row.cards.indexOf(normalizedNo);
      if (cardIndex !== -1) {
        const remainingCards = row.cards.slice(cardIndex + 1);
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
  const normalizedSecondNo = secondCardNo.padStart(2, '0');

  return firstMatches
    .filter(match => {
      if (match.remainingCards.length === 0) return false;
      return match.remainingCards[0] === normalizedSecondNo;
    })
    .map(match => ({
      ...match,
      // Update remainingCards to show cards AFTER the 2nd card
      remainingCards: match.remainingCards.slice(1),
      cardIndex: match.cardIndex + 1 // Now pointing to 2nd card position
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
  if (no.includes('P')) return no;
  return no.padStart(2, '0');
}

export function getRarityStars(rarity: number): string {
  return '★'.repeat(rarity);
}
