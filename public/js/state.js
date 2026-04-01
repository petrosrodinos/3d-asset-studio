/** Single shared application state. Mutate directly; no store abstraction needed at this scale. */
export const state = {
  /** Current UI mode: 'chat' | 'pipeline' | 'image' */
  mode: "chat",

  /** Chat history sent to the API (last N messages) */
  history: /** @type {{ role: string; content: string }[]} */ ([]),

  /** File selected for the Tripo pipeline */
  selectedFile: /** @type {File | null} */ (null),

  /** Animation presets chosen for the pipeline */
  selectedAnimations: new Set(["preset:idle"]),

  /** True while an API request is in-flight */
  isLoading: false,

  /** Whether the right detail panel is visible */
  panelVisible: true,
};
