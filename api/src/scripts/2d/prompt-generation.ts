import { boardPiecePrompt } from "./prompts";

export function build2dPrompt({
    theme = "white",
    variant,
}: {
    theme?: keyof typeof boardPiecePrompt.themes;
    variant?: keyof typeof boardPiecePrompt.variants;
}): string {
    return [
        boardPiecePrompt.base,
        boardPiecePrompt.themes[theme],
        variant ? boardPiecePrompt.variants[variant] : "",
    ]
        .filter(Boolean)
        .join(", ");
}