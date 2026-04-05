/**
 * Batch-generate collectible-style reference images with AimlAPI (flux-pro) and mesh GLBs with Tripo.
 * Config: api/assets/batch-figurine-generation.config.json
 *
 * Usage (from api/): npx ts-node src/scripts/batchFigurineGenerateAndMesh.ts [path/to/config.json]
 *
 * Requires: AIML_API_KEY, TRIPO_API_KEY
 */
import "dotenv/config";
import axios from "axios";
import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";

import { AimlApiService } from "../integrations/aimlapi/AimlApiService";
import { TripoService } from "../integrations/trippo/TripoService";
import { extractTripoUploadToken } from "../integrations/trippo/uploadToken";
import { fetchImageAsBuffer } from "../lib/image-fetch.util";
import { canonicalImageModelId } from "../config/models/image-models";
import { TRIPO_CONFIG } from "../modules/tripo/config/tripo.config";
import type { ModelVersion } from "../integrations/trippo/types";

type PromptJob = { id: string; prompt: string; negativePrompt: string };
type CategoryBlock = { type: string; figures: PromptJob[]; skin: PromptJob };

type BatchConfig = {
  version: number;
  aiml: {
    model: string;
    size?: string;
    n?: number;
    steps?: number | null;
    response_format?: string;
  };
  tripo: {
    model_version: string;
    texture: boolean;
    pbr: boolean;
    poll: { intervalMs: number; timeoutMs: number };
  };
  output: {
    imagesDir: string;
    glbDir: string;
    manifestFile: string;
  };
  categories: CategoryBlock[];
};

type FlatJob = PromptJob & { categoryType: string; role: "figure" | "skin" };

type ManifestEntry = {
  categoryType: string;
  role: "figure" | "skin";
  id: string;
  prompt: string;
  negativePrompt: string;
  imagePath: string;
  imageUrl?: string;
  meshTaskId?: string;
  glbPath?: string;
  modelUrl?: string;
  error?: string;
};

function defaultConfigPath(): string {
  return path.join(__dirname, "./batch-figurine-generation.config.json");
}

function mergePromptForAiml(prompt: string, negativePrompt: string): string {
  const neg = negativePrompt.trim();
  if (!neg) return prompt.trim();
  return `${prompt.trim()}\n\nNegative prompt: ${neg}`;
}

function flattenJobs(cfg: BatchConfig): FlatJob[] {
  const out: FlatJob[] = [];
  for (const cat of cfg.categories) {
    for (const f of cat.figures) {
      out.push({ ...f, categoryType: cat.type, role: "figure" });
    }
    out.push({ ...cat.skin, categoryType: cat.type, role: "skin" });
  }
  return out;
}

function assertConfig(cfg: unknown): asserts cfg is BatchConfig {
  if (!cfg || typeof cfg !== "object") throw new Error("Config must be a JSON object");
  const c = cfg as BatchConfig;
  if (!c.aiml?.model) throw new Error("config.aiml.model is required");
  if (!c.tripo?.model_version) throw new Error("config.tripo.model_version is required");
  if (!Array.isArray(c.categories) || c.categories.length === 0) throw new Error("config.categories must be a non-empty array");
  for (const cat of c.categories) {
    if (!cat.type) throw new Error("Each category needs type");
    if (!Array.isArray(cat.figures) || cat.figures.length !== 3) {
      throw new Error(`Category "${cat.type}" must have exactly 3 figures`);
    }
    if (!cat.skin?.id) throw new Error(`Category "${cat.type}" needs skin with id`);
  }
}

function jobLabel(job: FlatJob): string {
  return `${job.categoryType}/${job.role}/${job.id}`;
}

function logBatch(event: string, detail?: Record<string, unknown>): void {
  const line = {
    ts: new Date().toISOString(),
    scope: "batch",
    event,
    ...detail,
  };
  console.log(JSON.stringify(line));
}

function logJob(job: FlatJob, event: string, detail?: Record<string, unknown>): void {
  const line = {
    ts: new Date().toISOString(),
    scope: "job",
    job: jobLabel(job),
    event,
    ...detail,
  };
  console.log(JSON.stringify(line));
}

async function downloadToFile(url: string, dest: string): Promise<void> {
  const res = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer", timeout: 300_000 });
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(res.data));
}

async function processJob(
  job: FlatJob,
  cfg: BatchConfig,
  model: string,
  aiml: AimlApiService,
  tripo: TripoService,
  imagesRoot: string,
  glbRoot: string,
  assetsRoot: string,
): Promise<ManifestEntry> {
  const entry: ManifestEntry = {
    categoryType: job.categoryType,
    role: job.role,
    id: job.id,
    prompt: job.prompt,
    negativePrompt: job.negativePrompt,
    imagePath: "",
  };

  const safeId = job.id.replace(/[^a-zA-Z0-9-_]+/g, "_");
  const subdir = path.join(job.categoryType, job.role);

  logJob(job, "job_start");

  try {
    const finalPrompt = mergePromptForAiml(job.prompt, job.negativePrompt);
    const genBody: Record<string, unknown> = {
      model,
      prompt: finalPrompt,
      n: cfg.aiml.n ?? 1,
    };
    if (cfg.aiml.size) genBody.size = cfg.aiml.size;
    if (cfg.aiml.steps != null) genBody.steps = cfg.aiml.steps;
    if (cfg.aiml.response_format) genBody.response_format = cfg.aiml.response_format;

    logJob(job, "aiml_generate_start", { model, hasNegative: Boolean(job.negativePrompt.trim()) });
    const tAiml = Date.now();
    const { data: imageRes } = await aiml.generateImage(genBody);
    logJob(job, "aiml_generate_done", { ms: Date.now() - tAiml, imagesReturned: imageRes.data?.length ?? 0 });

    const first = imageRes.data?.[0];
    const imageUrl =
      first?.url ?? (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : null);
    if (!imageUrl || typeof imageUrl !== "string") {
      throw new Error("Image generation returned no URL/b64_json");
    }
    entry.imageUrl = imageUrl.startsWith("data:") ? "(inline base64)" : imageUrl;

    logJob(job, "fetch_image_buffer_start");
    const tFetch = Date.now();
    const { buffer, mimeType } = await fetchImageAsBuffer(imageUrl, TRIPO_CONFIG.PROXY_MAX_BYTES);
    logJob(job, "fetch_image_buffer_done", { ms: Date.now() - tFetch, mimeType, bytes: buffer.length });

    const ext = mimeType === "image/jpeg" ? "jpg" : "png";
    const imageFilename = `${safeId}.${ext}`;
    const imagePath = path.join(imagesRoot, subdir, imageFilename);
    await mkdir(path.dirname(imagePath), { recursive: true });
    logJob(job, "write_image_disk_start", { path: imagePath });
    await writeFile(imagePath, buffer);
    entry.imagePath = path.relative(assetsRoot, imagePath).replace(/\\/g, "/");
    logJob(job, "write_image_disk_done", { relativePath: entry.imagePath });

    logJob(job, "tripo_upload_start", { filename: imageFilename });
    const tUp = Date.now();
    const upload = await tripo.uploadFile(
      buffer,
      imageFilename,
      mimeType === "image/jpeg" ? "image/jpeg" : "image/png",
    );
    const fileToken = extractTripoUploadToken(upload);
    logJob(job, "tripo_upload_done", { ms: Date.now() - tUp, hasToken: Boolean(fileToken) });

    const imgType = mimeType === "image/jpeg" ? "jpeg" : "png";
    logJob(job, "tripo_mesh_task_create_start", {
      model_version: cfg.tripo.model_version,
      texture: cfg.tripo.texture,
      pbr: cfg.tripo.pbr,
    });
    const { createTaskResponse: meshCreated } = await tripo.createTask({
      type: "image_to_model",
      file: { type: imgType, file_token: fileToken },
      model_version: cfg.tripo.model_version as ModelVersion,
      texture: cfg.tripo.texture,
      pbr: cfg.tripo.pbr,
    } as never);

    const meshTaskId = meshCreated.data.task_id;
    if (!meshTaskId) throw new Error("Tripo did not return mesh task_id");
    entry.meshTaskId = meshTaskId;
    logJob(job, "tripo_mesh_task_created", { meshTaskId });

    logJob(job, "tripo_mesh_poll_start", {
      intervalMs: cfg.tripo.poll.intervalMs,
      timeoutMs: cfg.tripo.poll.timeoutMs,
    });
    const tPoll = Date.now();
    const meshTask = await tripo.pollTask(meshTaskId, cfg.tripo.poll);
    logJob(job, "tripo_mesh_poll_done", { ms: Date.now() - tPoll, status: meshTask.status });

    const glbUrl =
      meshTask.output?.pbr_model ?? meshTask.output?.model ?? meshTask.output?.base_model;
    if (!glbUrl || typeof glbUrl !== "string") {
      throw new Error("Mesh task succeeded but no GLB URL in output");
    }
    entry.modelUrl = glbUrl;

    const glbPath = path.join(glbRoot, subdir, `${safeId}.glb`);
    logJob(job, "glb_download_start", { dest: glbPath });
    const tDl = Date.now();
    await downloadToFile(glbUrl, glbPath);
    entry.glbPath = path.relative(assetsRoot, glbPath).replace(/\\/g, "/");
    logJob(job, "glb_download_done", { ms: Date.now() - tDl, relativePath: entry.glbPath });

    logJob(job, "job_success", { imagePath: entry.imagePath, glbPath: entry.glbPath });
  } catch (e) {
    entry.error = e instanceof Error ? e.message : String(e);
    logJob(job, "job_failed", { error: entry.error });
  }

  return entry;
}

async function main() {
  const configPath = path.resolve(process.argv[2] ?? defaultConfigPath());
  logBatch("load_config", { configPath });

  const raw = JSON.parse(await readFile(configPath, "utf8")) as unknown;
  assertConfig(raw);
  const cfg = raw;

  const apiRoot = path.join(__dirname, "../..");
  const assetsRoot = path.join(apiRoot, "assets");
  const imagesRoot = path.join(assetsRoot, cfg.output.imagesDir);
  const glbRoot = path.join(assetsRoot, cfg.output.glbDir);
  const manifestPath = path.join(assetsRoot, cfg.output.manifestFile);

  await mkdir(imagesRoot, { recursive: true });
  await mkdir(glbRoot, { recursive: true });

  const aiml = new AimlApiService();
  const tripo = new TripoService();
  const jobs = flattenJobs(cfg);
  const model = canonicalImageModelId(cfg.aiml.model.trim());

  logBatch("batch_setup_complete", {
    jobCount: jobs.length,
    aimlModel: model,
    tripoModelVersion: cfg.tripo.model_version,
    imagesRoot: path.relative(apiRoot, imagesRoot).replace(/\\/g, "/"),
    glbRoot: path.relative(apiRoot, glbRoot).replace(/\\/g, "/"),
  });

  const manifest: {
    configPath: string;
    startedAt: string;
    finishedAt?: string;
    entries: ManifestEntry[];
  } = {
    configPath,
    startedAt: new Date().toISOString(),
    entries: [],
  };

  logBatch("parallel_run_start", { concurrency: jobs.length });
  const tAll = Date.now();

  const entries = await Promise.all(
    jobs.map((job) => processJob(job, cfg, model, aiml, tripo, imagesRoot, glbRoot, assetsRoot)),
  );

  logBatch("parallel_run_done", { ms: Date.now() - tAll, jobCount: entries.length });

  manifest.entries = entries;
  manifest.finishedAt = new Date().toISOString();

  const ok = entries.filter((e) => !e.error).length;
  const failed = entries.filter((e) => e.error).length;
  logBatch("batch_summary", { ok, failed, manifestPath });

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  logBatch("manifest_written", { manifestPath });
}

main().catch((e) => {
  logBatch("batch_fatal", { error: e instanceof Error ? e.message : String(e) });
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
