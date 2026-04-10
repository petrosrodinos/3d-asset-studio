export const boardPiecePrompt = {
    base: `
  High-quality 2D digital board game token icon, centered composition, 
  circular medallion with metallic rim, 
  stylized emblem in the middle, 
  smooth gradients, slightly beveled edges, 
  polished game UI style, symmetrical layout, modern mobile strategy game asset, ultra clean, 
  high resolution, consistent thickness outlines, gentle ambient occlusion, white background, no shadows
  `.trim(),

    themes: {
        white: `
  bright white enamel surface,
  silver or light gold metallic rim, soft highlights, clean bright palette, 
  high-key lighting, premium polished look, no shadows
  `.trim(),

        black: `
  deep black enamel surface,dark chrome rim, subtle rim lighting, 
  low-key lighting, premium polished look, no shadows
  `.trim()
    },

    variants: {
        fantasy: "fantasy game style, slightly ornate details",
        scifi: "sci-fi UI style, sleek futuristic finish",
        wooden: "tabletop board game aesthetic, subtle material texture",
        minimal: "minimal flat color palette, reduced ornamentation"
    }

}