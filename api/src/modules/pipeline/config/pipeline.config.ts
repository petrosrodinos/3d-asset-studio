export const PIPELINE_CONFIG = {
  PIPELINE_DEFAULT_ANIMATIONS: ["preset:idle"],

  PIPELINE_SSE_EVENTS: {
    PROGRESS: "progress",
    COMPLETE: "complete",
    ERROR: "error",
  } as const,

  PIPELINE_STEPS: {
    UPLOAD: "upload",
    MESH: "mesh",
    PRERIG: "prerig",
    RIG: "rig",
    ANIMATE: "animate",
  } as const,

  PIPELINE_STATUSES: {
    RUNNING: "running",
    SUCCESS: "success",
    QUEUED: "queued",
    FAILED: "failed",
  } as const,

  DEFAULT_POLL_INTERVAL_MS: 2000,
  DEFAULT_POLL_TIMEOUT_MS: 600_000,
} as const;

