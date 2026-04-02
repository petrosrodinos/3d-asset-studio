import fs from "fs/promises";
import path from "path";

const FIGURES_PATH = path.resolve(__dirname, "../../assets/figures/figures.json");

export async function readFigures(): Promise<any[]> {
  const raw = await fs.readFile(FIGURES_PATH, "utf-8");
  return JSON.parse(raw);
}

export async function writeFigures(figures: any[]): Promise<void> {
  await fs.writeFile(FIGURES_PATH, JSON.stringify(figures, null, 2) + "\n");
}
