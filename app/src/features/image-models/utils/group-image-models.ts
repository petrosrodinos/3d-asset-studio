import type { ImageModel } from "@/features/image-models/interfaces/image-models.interfaces";

/** Provider name → models, sorted by label; providers sorted A–Z */
export function groupImageModelsByProvider(models: ImageModel[]): [string, ImageModel[]][] {
  const map = new Map<string, ImageModel[]>();
  for (const m of models) {
    const list = map.get(m.provider) ?? [];
    list.push(m);
    map.set(m.provider, list);
  }
  return [...map.entries()]
    .map(([provider, items]) => [
      provider,
      [...items].sort((a, b) => a.label.localeCompare(b.label)),
    ] as [string, ImageModel[]])
    .sort(([a], [b]) => a.localeCompare(b));
}
