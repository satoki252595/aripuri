export interface Card {
  no: string;
  name: string;
  rarity: number;
}

export interface CylinderRow {
  position: number;
  cards: string[];
}

export interface Cylinder {
  id: string;
  name: string;
  rows: CylinderRow[];
}

export interface SearchMatch {
  cylinderId: string;
  cylinderName: string;
  rowPosition: number;
  cardIndex: number;
  remainingCards: string[];
}

export interface CardsData {
  cards: Card[];
}

export interface CylindersData {
  cylinders: Cylinder[];
}
