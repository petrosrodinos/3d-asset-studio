export interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  price: number;
  stripePriceId: string;
}

export const TOKEN_PACKS: TokenPack[] = [
  { id: "starter", name: "Starter", tokens: 500, price: 5, stripePriceId: "price_1TIYGCGyoyONuwzMdZVFTish" },
  { id: "creator", name: "Creator", tokens: 2000, price: 20, stripePriceId: "price_1TIYGDGyoyONuwzMjl2wSSPM" },
  { id: "studio", name: "Studio", tokens: 5000, price: 50, stripePriceId: "price_1TIYGEGyoyONuwzMQKM6cb1h" },
];

export function getPackById(id: string): TokenPack | undefined {
  return TOKEN_PACKS.find((p) => p.id === id);
}
