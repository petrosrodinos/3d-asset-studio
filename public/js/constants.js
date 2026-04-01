export const TOOLS = [
  "aiml_listModels", "aiml_responses", "aiml_chatCompletion",
  "aiml_generateImage", "aiml_generateImageToFile",
  "aiml_createVideoGeneration", "aiml_getVideoGeneration", "aiml_pollVideoGeneration",
  "aiml_createEmbedding", "aiml_textToSpeechToFile", "aiml_transcribeFile",
  "aiml_getBalance", "aiml_listApiKeys", "aiml_getCurrentKey",
  "tripo_createTask", "tripo_getTask", "tripo_pollTask",
  "tripo_getBalance", "tripo_getStsToken", "tripo_uploadImageFromPath",
];

export const PIPELINE_STEPS = [
  { id: "upload",  label: "Upload Image",    icon: "↑" },
  { id: "mesh",    label: "Generate Mesh",   icon: "⬡" },
  { id: "prerig",  label: "Pre-rig Check",   icon: "⊡" },
  { id: "rig",     label: "Rigging",         icon: "⊕" },
  { id: "animate", label: "Animation",       icon: "▷" },
];

export const ANIMATION_PRESETS = [
  { id: "preset:idle",             label: "Idle" },
  { id: "preset:walk",             label: "Walk" },
  { id: "preset:run",              label: "Run" },
  { id: "preset:jump",             label: "Jump" },
  { id: "preset:slash",            label: "Slash" },
  { id: "preset:shoot",            label: "Shoot" },
  { id: "preset:hurt",             label: "Hurt" },
  { id: "preset:fall",             label: "Fall" },
  { id: "preset:dive",             label: "Dive" },
  { id: "preset:climb",            label: "Climb" },
  { id: "preset:quadruped:walk",   label: "Quad Walk" },
  { id: "preset:serpentine:march", label: "Serpentine" },
  { id: "preset:aquatic:march",    label: "Aquatic" },
];

export const IMAGE_MODELS = [
  { id: "flux/schnell",               label: "FLUX Schnell" },
  { id: "flux/dev",                   label: "FLUX Dev" },
  { id: "dall-e-3",                   label: "DALL-E 3" },
  { id: "stable-diffusion-v3-medium", label: "SD v3" },
];
