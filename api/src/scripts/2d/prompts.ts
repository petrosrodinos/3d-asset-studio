export const boardPiecePrompt = {
    base: `
  High-quality 2D digital board game token icon, centered composition, 
  circular medallion with metallic rim and glossy enamel surface, 
  stylized emblem in the middle, soft studio lighting, subtle reflections, 
  smooth gradients, clean vector-like shading, slightly beveled edges, 
  polished game UI style, soft shadow beneath, minimalistic isolated background, 
  symmetrical layout, modern mobile strategy game asset, ultra clean, 
  high resolution, consistent thickness outlines, gentle ambient occlusion
  `.trim(),

    themes: {
        white: `
  bright white enamel surface, light neutral background, 
  silver or light gold metallic rim, soft highlights, 
  subtle cool shadows, clean bright palette, 
  high-key lighting, premium polished look
  `.trim(),

        black: `
  deep black enamel surface, dark neutral background, 
  dark chrome or muted gold metallic rim, 
  stronger contrast reflections, subtle rim lighting, 
  low-key lighting, premium polished look
  `.trim()
    },

    variants: {
        fantasy: "fantasy game style, slightly ornate details",
        scifi: "sci-fi UI style, sleek futuristic finish",
        wooden: "tabletop board game aesthetic, subtle material texture",
        minimal: "minimal flat color palette, reduced ornamentation"
    }

}