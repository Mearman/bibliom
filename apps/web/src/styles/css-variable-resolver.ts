import type { ShadcnPalette, ShadcnShade } from './shadcn-colors'
import { shadcnPalettes, shadcnSemanticColors } from './shadcn-colors'

export interface ThemeColors {
  [key: string]: string
}

export interface CSSVariableMapping {
  [palette: string]: {
    [shade: number]: string
  }
}

// Helper function to create alpha-blended colors
const alpha = (color: string, alphaValue: number): string => {
  return `${color}${Math.round(alphaValue * 255).toString(16).padStart(2, '0')}`
}

// Helper to detect neutral colors
const isNeutralColor = (palette: string): boolean => {
  return ["zinc", "slate", "gray", "neutral", "stone"].includes(palette)
}

export const resolveSemanticColor = (
  semanticKey: string,
  mode: 'light' | 'dark'
): string => {
  const colorKey = shadcnSemanticColors[mode][semanticKey as keyof typeof shadcnSemanticColors.light]
  if (!colorKey) return ''

  const [palette, shade] = colorKey.split('.', 2)
  return shadcnPalettes[palette as ShadcnPalette][Number.parseInt(shade) as ShadcnShade]
}

export const generateCSSVariables = (mode: 'light' | 'dark'): ThemeColors => {
  const colors: ThemeColors = {}

  // Generate base palette variables
  for (const [paletteName, shades] of Object.entries(shadcnPalettes)) {
    for (const [shadeIndex, color] of shades.entries()) {
      colors[`--shadcn-${paletteName}-${shadeIndex * 50 + 50}`] = color
    }
  }

  // Generate semantic variables
  for (const [semanticKey, colorValue] of Object.entries(shadcnSemanticColors[mode])) {
    const [palette, shade] = colorValue.split('.', 2)
    const color = shadcnPalettes[palette as ShadcnPalette][Number.parseInt(shade) as ShadcnShade]
    colors[`--shadcn-${semanticKey}`] = color
  }

  // Generate variant variables (filled, light, outline, contrast) with hover states
  for (const [paletteName, shades] of Object.entries(shadcnPalettes)) {
    // Filled variants
    const filledShade = isNeutralColor(paletteName) ? 8 :
                        ["yellow", "lime"].includes(paletteName) ? 4 :
                        ["green", "blue"].includes(paletteName) ? 6 : 5

    colors[`--shadcn-${paletteName}-filled`] = shades[filledShade - 1]
    colors[`--shadcn-${paletteName}-filled-hover`] = alpha(shades[filledShade - 1], 0.9)

    // Light variants with alpha blending
    const lightBaseShade = 4
    const lightAlpha = mode === 'dark' ? 0.15 : 0.1
    colors[`--shadcn-${paletteName}-light`] = alpha(shades[lightBaseShade - 1], lightAlpha)
    colors[`--shadcn-${paletteName}-light-hover`] = alpha(shades[lightBaseShade - 1], lightAlpha * 0.8)

    const lightColorShade = mode === 'dark' ? 3 : 6
    colors[`--shadcn-${paletteName}-light-color`] = shades[lightColorShade - 1]

    // Outline variants
    const outlineShade = isNeutralColor(paletteName) ? 8 :
                        mode === 'dark' ?
                          (["orange", "indigo", "violet", "purple", "fuchsia", "pink"].includes(paletteName) ? 6 : 5) :
                          (["green", "blue"].includes(paletteName) ? 6 : 5)

    colors[`--shadcn-${paletteName}-outline`] = shades[outlineShade - 1]
    colors[`--shadcn-${paletteName}-outline-hover`] = alpha(shades[lightBaseShade - 1], mode === 'dark' ? 0.15 : 0.1)

    // Contrast variants
    const contrastMap: Record<string, number> = {
      zinc: 0, slate: 0, gray: 0, neutral: 0, stone: 0,
      red: 0, rose: 0,
      orange: 0, amber: 0, lime: 0, emerald: 0, teal: 0, cyan: 0, sky: 0, indigo: 0, fuchsia: 0, purple: 0, pink: 0,
      yellow: 6, green: mode === 'light' ? 0 : 9, blue: 0
    }

    colors[`--shadcn-${paletteName}-contrast`] = shades[contrastMap[paletteName] || 0]
  }

  return colors
}

export const generateMantineColors = (): Record<string, string[]> => {
  return Object.fromEntries(
    Object.entries(shadcnPalettes).map(([paletteName, shades]) => [
      paletteName,
      [...shades] // Convert readonly tuple to mutable array
    ])
  )
}

export const resolveThemeVariable = (
  palette: ShadcnPalette,
  shade: ShadcnShade
): string => {
  return `var(--shadcn-${palette}-${shade * 50 + 50})`
}

export const resolveCSSVariable = (variableName: string): string => {
  return `var(--shadcn-${variableName})`
}

// Enhanced resolver for variant access
export const resolveVariantVariable = (
  palette: ShadcnPalette,
  variant: 'filled' | 'light' | 'outline' | 'contrast',
  hover?: boolean
): string => {
  const hoverSuffix = hover ? '-hover' : ''
  return `var(--shadcn-${palette}-${variant}${hoverSuffix})`
}

export const createCSSVariableString = (mode: 'light' | 'dark'): string => {
  const variables = generateCSSVariables(mode)
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ')
}

export const getAcademicEntityColors = () => ({
  work: 'blue',
  author: 'green',
  source: 'violet',
  institution: 'orange',
  concept: 'pink',
  topic: 'red',
  publisher: 'teal',
  funder: 'cyan',
  keyword: 'zinc'
})