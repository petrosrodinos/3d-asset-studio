import "dotenv/config";
import path from "path";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import { Jimp } from "jimp";

import { build2dPrompt } from "./prompt-generation";
import { AimlApiService } from "../../integrations/aimlapi/AimlApiService";
import { buildAimlImageGenerationsBody } from "../../integrations/aimlapi/buildImageGenerationsBody";
import { fetchImageAsBuffer } from "../../lib/image-fetch.util";
import { ImageModels } from "../../config/models/image-models";

type ThemeName = "white" | "black";
type VariantName = "default";

type FigureConfig = {
  generate?: boolean;
  themes?: {
    white?: boolean;
    black?: boolean;
    dark?: boolean;
  };
  variants?: Record<string, boolean>;
};

type GenerationConfig = Record<string, FigureConfig>;

type ImageEntry = {
  theme: ThemeName;
  variant: VariantName;
  prompt: string;
  file: string;
  cost: number;
  durationMs: number;
};

type GenerationManifest = {
  figure: string;
  model: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totalCost: number;
  images: ImageEntry[];
};

type ImageJob = {
  theme: ThemeName;
  variant: VariantName;
  prompt: string;
  outputFileName: string;
  outputPath: string;
  sourceImageDataUrl: string;
};

const FIGURES_ROOT = path.resolve(__dirname, "./figures");
const CONFIG_PATH = path.resolve(__dirname, "./generation.config.json");
const IMAGE_VARIANT: VariantName = "default";
const PER_FIGURE_CONCURRENCY = 2;
const COST_FALLBACK_TO_CATALOG = true;

function toFsSafeTimestamp(date = new Date()): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "").replace(/:/g, "-");
}

function imageMimeFromFilename(filename: string): "image/png" | "image/jpeg" {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "image/png";
}

async function ensureMinImageDimensions(
  input: Buffer,
  minSize = 64,
): Promise<{ buffer: Buffer; wasResized: boolean }> {
  const image = await Jimp.read(input);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  if (width >= minSize && height >= minSize) {
    return { buffer: input, wasResized: false };
  }

  const scale = Math.max(minSize / width, minSize / height);
  const outW = Math.max(minSize, Math.ceil(width * scale));
  const outH = Math.max(minSize, Math.ceil(height * scale));
  image.resize({ w: outW, h: outH });
  const out = await image.getBuffer("image/png");
  return { buffer: out, wasResized: true };
}

function parseNumberLoose(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const m = /-?\d+(\.\d+)?/.exec(value);
    if (!m) return null;
    const n = Number.parseFloat(m[0]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function extractCostFromMetadata(costsMetadata: unknown): number | null {
  if (!costsMetadata || typeof costsMetadata !== "object") return null;
  const root = costsMetadata as Record<string, unknown>;

  const directPaths: unknown[] = [
    root.total_cost,
    root.cost,
    root.price,
    root.usage && (root.usage as Record<string, unknown>).total_cost,
    root.usage && (root.usage as Record<string, unknown>).cost,
  ];

  for (const candidate of directPaths) {
    const n = parseNumberLoose(candidate);
    if (n != null && n >= 0) return n;
  }

  const headers = root.responseHeaders;
  if (headers && typeof headers === "object") {
    for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
      const lk = k.toLowerCase();
      if (lk.includes("cost") || lk.includes("price") || lk.includes("billing")) {
        const n = parseNumberLoose(v);
        if (n != null && n >= 0) return n;
      }
    }
  }

  return null;
}

function pickBestFluxImageToImageModel(): { id: string; price_original: number } {
  const candidates = ImageModels.filter(
    (m) => m.available && m.is_image_to_image && m.id.toLowerCase().includes("flux"),
  );
  if (!candidates.length) {
    throw new Error("No available Flux image-to-image model found in ImageModels");
  }
  const best = candidates.reduce((acc, cur) =>
    cur.price_original > acc.price_original ? cur : acc,
  );
  return { id: best.id, price_original: best.price_original };
}

async function readGenerationConfig(): Promise<GenerationConfig> {
  const raw = await readFile(CONFIG_PATH, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("generation.config.json must be an object keyed by figure name");
  }
  return parsed as GenerationConfig;
}

async function readSourceImageDataUrl(figureDir: string): Promise<string> {
  const dirents = await readdir(figureDir, { withFileTypes: true });
  const files = dirents
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((name) => /\.(png|jpg|jpeg)$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  const preferred = files.find((name) => /-original\.(png|jpg|jpeg)$/i.test(name)) ?? files[0];
  if (!preferred) throw new Error(`No source image found in ${figureDir}`);

  const abs = path.join(figureDir, preferred);
  const buf = await readFile(abs);
  const mime = imageMimeFromFilename(preferred);
  const normalized = await ensureMinImageDimensions(buf, 64);
  const outputMime = normalized.wasResized ? "image/png" : mime;
  return `data:${outputMime};base64,${normalized.buffer.toString("base64")}`;
}

function enabledThemesForFigure(cfg: FigureConfig | undefined): ThemeName[] {
  const whiteEnabled = cfg?.themes?.white ?? true;
  const blackEnabled = (cfg?.themes?.black ?? false) || (cfg?.themes?.dark ?? false);
  return (["white", "black"] as ThemeName[]).filter((theme) =>
    theme === "white" ? whiteEnabled : blackEnabled,
  );
}

function isDefaultVariantEnabled(cfg: FigureConfig | undefined): boolean {
  if (!cfg?.variants) return true;
  return cfg.variants.default !== false;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!items.length) return [];
  const c = Math.max(1, Math.min(items.length, Math.floor(concurrency)));
  const out = new Array<R>(items.length);
  let next = 0;

  async function runOne(): Promise<void> {
    for (;;) {
      const idx = next++;
      if (idx >= items.length) return;
      out[idx] = await worker(items[idx] as T, idx);
    }
  }

  await Promise.all(Array.from({ length: c }, () => runOne()));
  return out;
}

async function ensureUniqueGenerationDir(baseFigureDir: string, ts: string): Promise<string> {
  let attempt = 0;
  for (;;) {
    const suffix = attempt === 0 ? "" : `-${attempt}`;
    const dir = path.join(baseFigureDir, `generation-${ts}${suffix}`);
    try {
      await mkdir(dir, { recursive: false });
      return dir;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EEXIST") {
        attempt += 1;
        continue;
      }
      throw err;
    }
  }
}

async function generateImageJob(
  aiml: AimlApiService,
  modelId: string,
  modelCatalogCost: number,
  job: ImageJob,
): Promise<ImageEntry> {
  const started = Date.now();
  const body = buildAimlImageGenerationsBody({
    internalModelId: modelId,
    prompt: job.prompt,
    sourceImageDataUrl: job.sourceImageDataUrl,
  });

  const { data, costsMetadata } = await aiml.generateImage(body);
  const first = data.data?.[0];
  const imageUrl = first?.url ?? (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : null);
  if (!imageUrl) throw new Error(`No image data returned for ${job.outputFileName}`);

  const { buffer } = await fetchImageAsBuffer(imageUrl);
  await writeFile(job.outputPath, buffer);

  const actualCost = extractCostFromMetadata(costsMetadata);
  const cost = actualCost != null ? actualCost : COST_FALLBACK_TO_CATALOG ? modelCatalogCost : 0;

  return {
    theme: job.theme,
    variant: job.variant,
    prompt: job.prompt,
    file: job.outputFileName,
    cost,
    durationMs: Date.now() - started,
  };
}

async function processFigure(
  aiml: AimlApiService,
  model: { id: string; price_original: number },
  cfg: GenerationConfig,
  figureName: string,
  figureDir: string,
): Promise<void> {
  const figureCfg = cfg[figureName];
  if (figureCfg?.generate === false) {
    console.log(`[skip] ${figureName} (generate=false)`);
    return;
  }
  if (!isDefaultVariantEnabled(figureCfg)) {
    console.log(`[skip] ${figureName} (variants.default=false)`);
    return;
  }

  const themes = enabledThemesForFigure(figureCfg);
  if (!themes.length) {
    console.log(`[skip] ${figureName} (no enabled themes)`);
    return;
  }

  const runStarted = new Date();
  const runStartedMs = Date.now();
  const generationDir = await ensureUniqueGenerationDir(figureDir, toFsSafeTimestamp(runStarted));
  const sourceImageDataUrl = await readSourceImageDataUrl(figureDir);

  const jobs: ImageJob[] = themes.map((theme) => {
    const prompt = build2dPrompt({ theme });
    const outputFileName = `${figureName}-${theme}-${IMAGE_VARIANT}.png`;
    return {
      theme,
      variant: IMAGE_VARIANT,
      prompt,
      outputFileName,
      outputPath: path.join(generationDir, outputFileName),
      sourceImageDataUrl,
    };
  });

  const images = await mapPool(jobs, PER_FIGURE_CONCURRENCY, (job) =>
    generateImageJob(aiml, model.id, model.price_original, job),
  );

  const manifest: GenerationManifest = {
    figure: figureName,
    model: model.id,
    startedAt: runStarted.toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - runStartedMs,
    totalCost: images.reduce((sum, img) => sum + img.cost, 0),
    images,
  };

  await writeFile(path.join(generationDir, "generation.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`[ok] ${figureName} -> ${path.relative(FIGURES_ROOT, generationDir).replace(/\\/g, "/")}`);
}

async function main(): Promise<void> {
  const cfg = await readGenerationConfig();
  const model = pickBestFluxImageToImageModel();
  const aiml = new AimlApiService();

  const dirents = await readdir(FIGURES_ROOT, { withFileTypes: true });
  const figures = dirents
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  for (const figureName of figures) {
    const figureDir = path.join(FIGURES_ROOT, figureName);
    await processFigure(aiml, model, cfg, figureName, figureDir);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
