import { createTheme, MantineColorsTuple, rem } from '@mantine/core'

import { generateMantineColors } from './css-variable-resolver'

const shadcnColors = generateMantineColors()

// Convert shadcn palettes to MantineColorsTuple format
const createMantineColorTuple = (colors: string[]): MantineColorsTuple => [
  colors[0], colors[1], colors[2], colors[3], colors[4],
  colors[5], colors[6], colors[7], colors[8], colors[9], colors[10]
]

// Container sizes for custom Container component
const CONTAINER_SIZES: Record<string, string> = {
  xxs: rem("200px"),
  xs: rem("300px"),
  sm: rem("400px"),
  md: rem("500px"),
  lg: rem("600px"),
  xl: rem("1400px"),
  xxl: rem("1600px"),
}

export const shadcnMantineTheme = createTheme({
  colors: {
    // All shadcn color palettes
    zinc: createMantineColorTuple(shadcnColors.zinc),
    slate: createMantineColorTuple(shadcnColors.slate),
    stone: createMantineColorTuple(shadcnColors.stone),
    red: createMantineColorTuple(shadcnColors.red),
    orange: createMantineColorTuple(shadcnColors.orange),
    amber: createMantineColorTuple(shadcnColors.amber),
    yellow: createMantineColorTuple(shadcnColors.yellow),
    lime: createMantineColorTuple(shadcnColors.lime),
    green: createMantineColorTuple(shadcnColors.green),
    emerald: createMantineColorTuple(shadcnColors.emerald),
    teal: createMantineColorTuple(shadcnColors.teal),
    cyan: createMantineColorTuple(shadcnColors.cyan),
    sky: createMantineColorTuple(shadcnColors.sky),
    blue: createMantineColorTuple(shadcnColors.blue),
    indigo: createMantineColorTuple(shadcnColors.indigo),
    violet: createMantineColorTuple(shadcnColors.violet),
    purple: createMantineColorTuple(shadcnColors.purple),
    fuchsia: createMantineColorTuple(shadcnColors.fuchsia),
    pink: createMantineColorTuple(shadcnColors.pink),
    rose: createMantineColorTuple(shadcnColors.rose),

    // Semantic colors with shadcn mappings
    primary: createMantineColorTuple(shadcnColors.stone),
    secondary: createMantineColorTuple(shadcnColors.zinc),
    accent: createMantineColorTuple(shadcnColors.zinc),
    neutral: createMantineColorTuple(shadcnColors.zinc),
    destructive: createMantineColorTuple(shadcnColors.red),
    success: createMantineColorTuple(shadcnColors.green),
    warning: createMantineColorTuple(shadcnColors.orange),
    info: createMantineColorTuple(shadcnColors.blue),

    // Academic entity colors
    work: createMantineColorTuple(shadcnColors.blue),
    author: createMantineColorTuple(shadcnColors.green),
    source: createMantineColorTuple(shadcnColors.violet),
    institution: createMantineColorTuple(shadcnColors.orange),
    concept: createMantineColorTuple(shadcnColors.pink),
    topic: createMantineColorTuple(shadcnColors.red),
    publisher: createMantineColorTuple(shadcnColors.teal),
    funder: createMantineColorTuple(shadcnColors.cyan),
    keyword: createMantineColorTuple(shadcnColors.zinc),
  },

  primaryColor: 'stone',
  defaultRadius: 'sm',
  radius: {
    xs: rem('2px'),    // rounded-sm (Tailwind)
    sm: rem('4px'),    // rounded (Tailwind default)
    md: rem('6px'),    // rounded-md
    lg: rem('8px'),    // rounded-lg
    xl: rem('12px'),   // rounded-xl
    '2xl': rem('16px'), // rounded-2xl
    '3xl': rem('24px'), // rounded-3xl
    full: '9999px',   // rounded-full
  },
  focusRing: 'never',
  autoContrast: true,
  luminanceThreshold: 0.3,

  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, Fira Code, Consolas, monospace',

  // Custom CSS variables for shadcn semantic colors
  other: {
    '--shadcn-background': '0 0% 100%',
    '--shadcn-foreground': '222.2 84% 4.9%',
    '--shadcn-card': '0 0% 100%',
    '--shadcn-card-foreground': '222.2 84% 4.9%',
    '--shadcn-popover': '0 0% 100%',
    '--shadcn-popover-foreground': '222.2 84% 4.9%',
    '--shadcn-primary': '222.2 47.4% 11.2%',
    '--shadcn-primary-foreground': '210 40% 98%',
    '--shadcn-secondary': '210 40% 96%',
    '--shadcn-secondary-foreground': '222.2 84% 4.9%',
    '--shadcn-muted': '210 40% 96%',
    '--shadcn-muted-foreground': '215.4 16.3% 46.9%',
    '--shadcn-accent': '210 40% 96%',
    '--shadcn-accent-foreground': '222.2 84% 4.9%',
    '--shadcn-destructive': '0 84.2% 60.2%',
    '--shadcn-destructive-foreground': '210 40% 98%',
    '--shadcn-border': '214.3 31.8% 91.4%',
    '--shadcn-input': '214.3 31.8% 91.4%',
    '--shadcn-ring': '222.2 84% 4.9%',
    '--shadcn-radius': '0.5rem',
    // Dark mode semantic colors
    '--shadcn-background-dark': '222.2 84% 4.9%',
    '--shadcn-foreground-dark': '210 40% 98%',
    '--shadcn-card-dark': '222.2 84% 4.9%',
    '--shadcn-card-foreground-dark': '210 40% 98%',
    '--shadcn-popover-dark': '222.2 84% 4.9%',
    '--shadcn-popover-foreground-dark': '210 40% 98%',
    '--shadcn-primary-dark': '210 40% 98%',
    '--shadcn-primary-foreground-dark': '222.2 47.4% 11.2%',
    '--shadcn-secondary-dark': '217.2 32.6% 17.5%',
    '--shadcn-secondary-foreground-dark': '210 40% 98%',
    '--shadcn-muted-dark': '217.2 32.6% 17.5%',
    '--shadcn-muted-foreground-dark': '215 20.2% 65.1%',
    '--shadcn-accent-dark': '217.2 32.6% 17.5%',
    '--shadcn-accent-foreground-dark': '210 40% 98%',
    '--shadcn-destructive-dark': '0 62.8% 30.6%',
    '--shadcn-destructive-foreground-dark': '210 40% 98%',
    '--shadcn-border-dark': '217.2 32.6% 17.5%',
    '--shadcn-input-dark': '217.2 32.6% 17.5%',
    '--shadcn-ring-dark': '212.7 26.8% 83.9%',
  },

  spacing: {
    '4xs': rem('2px'),
    '3xs': rem('4px'),
    '2xs': rem('8px'),
    xs: rem('10px'),
    sm: rem('12px'),
    md: rem('16px'),
    lg: rem('20px'),
    xl: rem('24px'),
    '2xl': rem('28px'),
    '3xl': rem('32px'),
    '4xl': rem('40px'),
  },

  fontSizes: {
    xs: rem('12px'),   // text-xs
    sm: rem('13px'),   // text-sm (shadcn default)
    md: rem('14px'),   // text-base (shadcn default)
    lg: rem('16px'),   // text-lg
    xl: rem('18px'),   // text-xl
    '2xl': rem('20px'), // text-2xl
    '3xl': rem('24px'), // text-3xl
    '4xl': rem('30px'), // text-4xl
    '5xl': rem('36px'), // text-5xl
    '6xl': rem('48px'), // text-6xl (shadcn hero text)
    '7xl': rem('56px'), // text-7xl
    '8xl': rem('64px'), // text-8xl
    '9xl': rem('72px'), // text-9xl
  },

  lineHeights: {
    xs: '1.25',      // text-xs
    sm: '1.4',       // text-sm
    md: '1.5',       // text-base (shadcn default)
    lg: '1.5',       // text-lg
    xl: '1.5',       // text-xl
    '2xl': '1.5',    // text-2xl
    '3xl': '1.25',    // text-3xl
    '4xl': '1.25',    // text-4xl
    '5xl': '1.25',    // text-5xl
    '6xl': '1.25',    // text-6xl
    '7xl': '1.25',    // text-7xl
    '8xl': '1.25',    // text-8xl
    '9xl': '1.25',    // text-9xl
  },

  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem('32px'), lineHeight: '1.25', fontWeight: '800' }, // text-4xl font-extrabold
      h2: { fontSize: rem('24px'), lineHeight: '1.25', fontWeight: '700' }, // text-3xl font-bold
      h3: { fontSize: rem('20px'), lineHeight: '1.5', fontWeight: '600' },  // text-xl font-semibold
      h4: { fontSize: rem('18px'), lineHeight: '1.5', fontWeight: '600' },  // text-lg font-semibold
      h5: { fontSize: rem('16px'), lineHeight: '1.5', fontWeight: '600' },  // text-base font-semibold
      h6: { fontSize: rem('14px'), lineHeight: '1.5', fontWeight: '600' },  // text-sm font-semibold
    },
  },

  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    xxl: '0 25px 50px rgba(0, 0, 0, 0.25)',
  },

  cursorType: 'pointer',

  components: {
    Container: {
      vars: (_, { size, fluid }) => ({
        root: {
          '--container-size': fluid
            ? '100%'
            : (size !== undefined && size in CONTAINER_SIZES
              ? CONTAINER_SIZES[size]
              : rem(size)),
        },
      }),
    },

    Button: {
      vars: (theme, properties) => {
        const color = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        const variant = properties.variant ?? 'filled'
        const isNeutralColor = color && ["zinc", "slate", "gray", "neutral", "stone"].includes(color)

        return {
          root: {
            '--button-color': (() => {
              if (variant === 'filled') {
                return color ? `var(--mantine-color-${color}-contrast)` : 'var(--mantine-primary-color-contrast)'
              }
              if (variant === 'white') {
                return isNeutralColor ? 'var(--mantine-color-black)' : undefined
              }
            })(),
          },
        }
      },
    },

    Card: {
      vars: (theme, properties) => {
        const variant = properties.variant ?? 'default'
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        const isNeutralColor = colorKey && ["zinc", "slate", "gray", "neutral", "stone"].includes(colorKey)

        return {
          root: {
            '--card-bg': (() => {
              if (variant === 'filled' && colorKey) {
                return 'var(--mantine-color-' + colorKey + '-light)'
              }
              if (variant === 'outline') {
                return 'var(--mantine-color-body)'
              }
              return 'var(--mantine-color-body)'
            })(),
            '--card-border-color': (() => {
              if (variant === 'outline' && colorKey) {
                return 'var(--mantine-color-' + colorKey + '-outline)'
              }
              if (variant === 'filled' && isNeutralColor) {
                return 'transparent'
              }
              return 'var(--mantine-color-default-border)'
            })(),
            '--card-shadow': variant === 'filled' ? 'none' : theme.shadows.lg,
            '--card-radius': 'var(--mantine-radius-default)',
            '--card-padding': variant === 'compact' ? 'var(--mantine-spacing-md)' : 'var(--mantine-spacing-xl)',
          },
        }
      },
      defaultProps: {
        p: 'xl',
        shadow: 'xl',
        withBorder: true,
      },
      styles: {
        root: {
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border-color)',
          boxShadow: 'var(--card-shadow)',
          borderRadius: 'var(--card-radius)',
          padding: 'var(--card-padding)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 'var(--card-shadow), 0 0 0 1px var(--mantine-color-primary-outline)',
          },
        },
      },
    },

    Paper: {
      defaultProps: {
        shadow: 'xl',
      },
      vars: (theme) => ({
        root: {
          'paper-bg': 'var(--mantine-color-body)',
          'paper-shadow': theme.shadows.md,
        },
      }),
    },

    Input: {
      vars: (theme, properties) => {
        const hasError = properties.error

        return {
          input: {
            'input-bg': 'var(--mantine-color-body)',
            'input-border-color': hasError
              ? theme.colors.red[6]
              : 'var(--mantine-color-default-border)',
            'input-placeholder-color': 'var(--mantine-color-placeholder)',
          }
        }
      },
    },

    Select: {
      defaultProps: {
        checkIconPosition: "right",
      },
      vars: (theme, properties) => {
        const hasError = properties.error

        return {
          input: {
            'select-bg': 'var(--mantine-color-body)',
            'select-border-color': hasError
              ? theme.colors.red[6]
              : 'var(--mantine-color-default-border)',
            'select-placeholder-color': 'var(--mantine-color-placeholder)',
          }
        }
      },
    },

    Textarea: {
      vars: (theme, properties) => {
        const hasError = properties.error

        return {
          textarea: {
            'textarea-bg': 'var(--mantine-color-body)',
            'textarea-border-color': hasError
              ? theme.colors.red[6]
              : 'var(--mantine-color-default-border)',
            'textarea-placeholder-color': 'var(--mantine-color-placeholder)',
          }
        }
      },
    },

    Checkbox: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        return {
          root: {
            '--checkbox-color': colorKey
              ? `var(--mantine-color-${colorKey}-filled)`
              : 'var(--mantine-primary-color-filled)',
            '--checkbox-icon-color': colorKey
              ? `var(--mantine-color-${colorKey}-contrast)`
              : 'var(--mantine-primary-color-contrast)',
          },
        }
      },
    },

    Radio: {
      vars: (theme, properties) => ({
        root: {
          '--radio-color': properties.color
            ? (Object.keys(theme.colors).includes(properties.color)
              ? `var(--mantine-color-${properties.color}-filled)`
              : properties.color)
            : "var(--mantine-primary-color-filled)",
          '--radio-icon-color': properties.color
            ? (Object.keys(theme.colors).includes(properties.color)
              ? `var(--mantine-color-${properties.color}-contrast)`
              : properties.color)
            : "var(--mantine-primary-color-contrast)",
        },
      }),
    },

    Switch: {
      styles: () => ({
        thumb: {
          backgroundColor: "var(--mantine-color-default)",
          borderColor: "var(--mantine-color-default-border)",
        },
        track: {
          borderColor: "var(--mantine-color-default-border)",
        },
      }),
    },

    Modal: {
      defaultProps: {
        withBorder: true,
      },
      vars: (theme) => ({
        content: {
          'modal-bg': 'var(--mantine-color-body)',
          'modal-shadow': theme.shadows.xl,
        },
      }),
    },

    Drawer: {
      vars: (theme) => ({
        content: {
          'drawer-bg': 'var(--mantine-color-body)',
          'drawer-shadow': theme.shadows.lg,
        },
      }),
    },

    Popover: {
      vars: (theme) => ({
        dropdown: {
          'popover-bg': 'var(--mantine-color-body)',
          'popover-shadow': theme.shadows.lg,
        },
      }),
    },

    Tooltip: {
      vars: () => ({
        tooltip: {
          '--tooltip-bg': 'var(--mantine-primary-color-filled)',
          '--tooltip-color': 'var(--mantine-primary-color-contrast)',
        },
      }),
    },

    Notification: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        return {
          root: {
            '--notification-bg': colorKey ? `var(--mantine-color-${colorKey}-light)` : 'var(--mantine-primary-color-light)',
            '--notification-border': colorKey ? `var(--mantine-color-${colorKey}-outline)` : 'var(--mantine-primary-color-outline)',
            '--notification-color': colorKey ? `var(--mantine-color-${colorKey}-light-color)` : 'var(--mantine-primary-color-light-color)',
          }
        }
      },
    },

    Loader: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        return {
          root: {
            '--loader-color': colorKey
              ? `var(--mantine-color-${colorKey}-filled)`
              : 'var(--mantine-primary-color-filled)',
          },
        }
      },
    },

    ActionIcon: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        const isNeutralColor = colorKey && ["zinc", "slate", "gray", "neutral", "stone"].includes(colorKey)
        const variant = properties.variant ?? "filled"

        return {
          root: {
            '--ai-color': (() => {
              if (variant === "filled") {
                return colorKey
                  ? `var(--mantine-color-${colorKey}-contrast)`
                  : "var(--mantine-primary-color-contrast)"
              }
              if (variant === "white") {
                return isNeutralColor ? "var(--mantine-color-black)" : undefined
              }
            })(),
          },
        }
      }
    },

    Badge: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        const isNeutralColor = colorKey && ["zinc", "slate", "gray", "neutral", "stone"].includes(colorKey)
        const variant = properties.variant ?? "filled"

        return {
          root: {
            '--badge-bg': variant === "filled" && colorKey ? `var(--mantine-color-${colorKey}-filled)` : undefined,
            '--badge-color':
              variant === "filled"
                ? (colorKey ? `var(--mantine-color-${colorKey}-contrast)` : 'var(--mantine-primary-color-contrast)')
                : (variant === "white") && isNeutralColor ? `var(--mantine-color-black)` : undefined,
          },
        }
      },
    },

    Chip: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        const variant = properties.variant ?? "filled"

        return {
          root: {
            '--chip-bg':
              variant === "light"
                ? undefined
                : (colorKey
                  ? `var(--mantine-color-${colorKey}-filled)`
                  : "var(--mantine-primary-color-filled)"),
            '--chip-color':
              variant === "filled"
                ? (colorKey
                  ? `var(--mantine-color-${colorKey}-contrast)`
                  : "var(--mantine-primary-color-contrast)")
                : undefined,
          },
        }
      },
    },

    // Missing components from original theme
    Avatar: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        const isNeutralColor = colorKey && ["zinc", "slate", "gray", "neutral", "stone"].includes(colorKey)
        const variant = properties.variant ?? "light"

        return {
          root: {
            '--avatar-bg':
              variant === "filled"
                ? (colorKey
                  ? `var(--mantine-color-${colorKey}-filled)`
                  : "var(--mantine-primary-color-filled)")
                : variant === "light"
                  ? colorKey
                    ? `var(--mantine-color-${colorKey}-light)`
                    : "var(--mantine-primary-color-light)"
                  : undefined,

            '--avatar-color':
              variant === "filled"
                ? (colorKey
                  ? `var(--mantine-color-${colorKey}-contrast)`
                  : "var(--mantine-primary-color-contrast)")
                : variant === "light"
                  ? colorKey
                    ? `var(--mantine-color-${colorKey}-light-color)`
                    : "var(--mantine-primary-color-light-color)"
                  : variant === "white"
                    ? isNeutralColor
                      ? `var(--mantine-color-black)`
                      : colorKey
                        ? `var(--mantine-color-${colorKey}-outline)`
                        : "var(--mantine-primary-color-filled)"
                    : variant === "outline" || variant === "transparent"
                      ? colorKey
                        ? `var(--mantine-color-${colorKey}-outline)`
                        : "var(--mantine-primary-color-filled)"
                      : undefined,

            '--avatar-bd':
              variant === "outline"
                ? (colorKey
                  ? `1px solid var(--mantine-color-${colorKey}-outline)`
                  : "1px solid var(--mantine-primary-color-filled)")
                : undefined,
          },
        }
      },
    },

    SegmentedControl: {
      vars: (theme, properties) => ({
        root: {
          '--sc-color': properties.color
            ? Object.keys(theme.colors).includes(properties.color)
              ? ["zinc", "slate", "gray", "neutral", "stone"].includes(properties.color)
                ? "var(--mantine-color-body)"
                : `var(--mantine-color-${properties.color}-filled)`
              : properties.color
            : "var(--mantine-color-default)",
        },
      }),
    },

    NavLink: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        const variant = properties.variant ?? "light"

        return {
          root: {
            '--nl-color':
              variant === "filled" ? (colorKey ? `var(--mantine-color-${colorKey}-contrast)` : 'var(--mantine-primary-color-contrast)') : undefined,
          },
          children: {},
        }
      },
    },

    Pagination: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined

        return {
          root: {
            '--pagination-active-color': colorKey
              ? `var(--mantine-color-${colorKey}-contrast)`
              : "var(--mantine-primary-color-contrast)",
          },
        }
      },
    },

    Stepper: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined

        return {
          root: {
            '--stepper-icon-color': colorKey
              ? `var(--mantine-color-${colorKey}-contrast)`
              : "var(--mantine-primary-color-contrast)",
          },
        }
      },
    },

    Alert: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        const isNeutralColor = colorKey && ["zinc", "slate", "gray", "neutral", "stone"].includes(colorKey)
        const variant = properties.variant ?? "light"

        return {
          root: {
            '--alert-color':
              variant === "filled"
                ? (colorKey
                  ? `var(--mantine-color-${colorKey}-contrast)`
                  : "var(--mantine-primary-color-contrast)")
                : (variant === "white") && isNeutralColor ? `var(--mantine-color-black)` : undefined,
          },
        }
      },
    },

    Indicator: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined

        return {
          root: {
            '--indicator-text-color': colorKey
              ? `var(--mantine-color-${colorKey}-contrast)`
              : "var(--mantine-primary-color-contrast)",
          },
        }
      },
    },

    ThemeIcon: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
        const isNeutralColor = colorKey && ["zinc", "slate", "gray", "neutral", "stone"].includes(colorKey)
        const variant = properties.variant ?? "filled"

        return {
          root: {
            '--ti-color': variant === "filled"
              ? (colorKey
                ? `var(--mantine-color-${colorKey}-contrast)`
                : "var(--mantine-primary-color-contrast)")
              : (variant === "white") && isNeutralColor ? `var(--mantine-color-black)` : undefined,
          },
        }
      },
    },

    Timeline: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined

        return {
          root: {
            '--tl-icon-color': colorKey ? `var(--mantine-color-${colorKey}-contrast)` : 'var(--mantine-primary-color-contrast)',
          },
        }
      },
    },

    Blockquote: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined

        return {
          root: {
            '--bq-bg-dark': colorKey ? `var(--mantine-color-${colorKey}-light)` : 'var(--mantine-primary-color-light)',
            '--bq-bg-light': colorKey ? `var(--mantine-color-${colorKey}-light)` : 'var(--mantine-primary-color-light)',
          },
        }
      },
    },

    Mark: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : 'yellow'
        const isNeutralColor = colorKey && ["zinc", "slate", "gray", "neutral", "stone"].includes(colorKey)

        return {
          root: {
            '--mark-bg-light': `var(--mantine-color-${colorKey}-${isNeutralColor ? '3' : 'filled-hover'})`,
            '--mark-bg-dark': `var(--mantine-color-${colorKey}-filled)`
          },
        }
      },
    },

    // Anchor component with default props
    Anchor: {
      defaultProps: {
        underline: "always",
      },
    },

    // Enhanced Box component with additional style props for inline style replacement
    Box: {
      vars: (theme, properties) => ({
        root: {
          '--box-bg': properties.bg ? `var(--mantine-color-${properties.bg}-filled)` : undefined,
          '--box-bg-light': properties.bg ? `var(--mantine-color-${properties.bg}-light)` : undefined,
          '--box-bg-outline': properties.bg ? `var(--mantine-color-${properties.bg}-outline)` : undefined,
          '--box-color': properties.c ? `var(--mantine-color-${properties.c}-filled)` : undefined,
          '--box-border-color': properties.bdColor ? `var(--mantine-color-${properties.bdColor}-filled)` : undefined,
          '--box-cursor': properties.cursor || undefined,
          '--box-position': properties.pos || undefined,
          '--box-z-index': properties.zIndex?.toString() || undefined,
          '--box-opacity': properties.opacity?.toString() || undefined,
          '--box-user-select': properties.userSelect || undefined,
          '--box-pointer-events': properties.pointerEvents || undefined,
        }
      }),
      styles: {
        root: {
          backgroundColor: 'var(--box-bg)',
          color: 'var(--box-color)',
          cursor: 'var(--box-cursor)',
          position: 'var(--box-position)',
          zIndex: 'var(--box-z-index)',
          opacity: 'var(--box-opacity)',
          userSelect: 'var(--box-user-select)',
          pointerEvents: 'var(--box-pointer-events)',
        }
      }
    },

    // Enhanced Flex component with comprehensive flexbox props
    Flex: {
      vars: (theme, properties) => ({
        root: {
          '--flex-direction': properties.direction || 'row',
          '--flex-align': properties.align || 'stretch',
          '--flex-justify': properties.justify || 'flex-start',
          '--flex-wrap': properties.wrap || 'nowrap',
          '--flex-gap': properties.gap ? `var(--mantine-spacing-${properties.gap})` : '0',
          '--flex-column-gap': properties.gap ? `var(--mantine-spacing-${properties.gap})` : '0',
          '--flex-row-gap': properties.gap ? `var(--mantine-spacing-${properties.gap})` : '0',
        }
      }),
      styles: {
        root: {
          display: 'flex',
          flexDirection: 'var(--flex-direction)',
          alignItems: 'var(--flex-align)',
          justifyContent: 'var(--flex-justify)',
          flexWrap: 'var(--flex-wrap)',
          gap: 'var(--flex-gap)',
          columnGap: 'var(--flex-column-gap)',
          rowGap: 'var(--flex-row-gap)',
        }
      }
    },

    // Enhanced Grid component for CSS Grid patterns
    Grid: {
      vars: (theme, properties) => ({
        root: {
          '--grid-template-columns': properties.templateColumns || undefined,
          '--grid-template-rows': properties.templateRows || undefined,
          '--grid-gap': properties.gap ? `var(--mantine-spacing-${properties.gap})` : '0',
          '--grid-align-content': properties.alignContent || 'start',
          '--grid-justify-content': properties.justifyContent || 'start',
          '--grid-align-items': properties.alignItems || 'stretch',
        }
      }),
      styles: {
        root: {
          display: 'grid',
          gridTemplateColumns: 'var(--grid-template-columns)',
          gridTemplateRows: 'var(--grid-template-rows)',
          gap: 'var(--grid-gap)',
          alignContent: 'var(--grid-align-content)',
          justifyContent: 'var(--grid-justify-content)',
          alignItems: 'var(--grid-align-items)',
        }
      }
    },

    // Enhanced Text component for typography props
    Text: {
      vars: (theme, properties) => ({
        root: {
          '--text-font-size': properties.size > 0 ? `var(--mantine-font-size-${properties.size})` : undefined,
          '--text-font-weight': properties.fw?.toString() || undefined,
          '--text-line-height': properties.lh ? `var(--mantine-line-height-${properties.lh})` : undefined,
          '--text-letter-spacing': properties.ls ? `${properties.ls}` : undefined,
          '--text-transform': properties.tt || undefined,
          '--text-align': properties.ta || undefined,
          '--text-decoration': properties.td || undefined,
          '--text-white-space': properties.ws || undefined,
          '--text-word-break': properties.wb || undefined,
        }
      }),
      styles: {
        root: {
          fontSize: 'var(--text-font-size)',
          fontWeight: 'var(--text-font-weight)',
          lineHeight: 'var(--text-line-height)',
          letterSpacing: 'var(--text-letter-spacing)',
          textTransform: 'var(--text-transform)',
          textAlign: 'var(--text-align)',
          textDecoration: 'var(--text-decoration)',
          whiteSpace: 'var(--text-white-space)',
          wordBreak: 'var(--text-word-break)',
        }
      }
    },

    // Phase 1: Critical Layout & Navigation Components

    AppShell: {
      vars: () => ({
        root: {
          '--appshell-bg': 'var(--mantine-color-body)',
          '--appshell-border-color': 'var(--mantine-color-default-border)',
        },
        navbar: {
          '--navbar-bg': 'var(--mantine-color-body)',
          '--navbar-border-color': 'var(--mantine-color-default-border)',
          '--navbar-padding': 'var(--mantine-spacing-md)',
        },
        header: {
          '--header-bg': 'var(--mantine-color-body)',
          '--header-border-color': 'var(--mantine-color-default-border)',
          '--header-height': 'rem(60px)',
          '--header-padding': 'var(--mantine-spacing-md)',
        },
        aside: {
          '--aside-bg': 'var(--mantine-color-body)',
          '--aside-border-color': 'var(--mantine-color-default-border)',
          '--aside-padding': 'var(--mantine-spacing-md)',
        },
        footer: {
          '--footer-bg': 'var(--mantine-color-body)',
          '--footer-border-color': 'var(--mantine-color-default-border)',
          '--footer-padding': 'var(--mantine-spacing-md)',
        },
      }),
      styles: {
        root: {
          backgroundColor: 'var(--appshell-bg)',
        },
        navbar: {
          backgroundColor: 'var(--navbar-bg)',
          borderRight: '1px solid var(--navbar-border-color)',
          padding: 'var(--navbar-padding)',
        },
        header: {
          backgroundColor: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border-color)',
          height: 'var(--header-height)',
          padding: 'var(--header-padding)',
        },
        aside: {
          backgroundColor: 'var(--aside-bg)',
          borderLeft: '1px solid var(--aside-border-color)',
          padding: 'var(--aside-padding)',
        },
        footer: {
          backgroundColor: 'var(--footer-bg)',
          borderTop: '1px solid var(--footer-border-color)',
          padding: 'var(--footer-padding)',
        },
      },
    },

    Menu: {
      vars: (theme) => ({
        dropdown: {
          '--menu-bg': 'var(--mantine-color-body)',
          '--menu-border-color': 'var(--mantine-color-default-border)',
          '--menu-shadow': theme.shadows.lg,
          '--menu-radius': 'var(--mantine-radius-default)',
        },
        item: {
          '--menu-item-color': 'var(--mantine-color-default-color)',
          '--menu-item-bg-hover': 'var(--mantine-color-default-hover)',
          '--menu-item-bg-selected': 'var(--mantine-primary-color-light)',
          '--menu-item-color-selected': 'var(--mantine-primary-color-light-color)',
          '--menu-item-padding': 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)',
        },
        label: {
          '--menu-label-color': 'var(--mantine-color-dimmed)',
          '--menu-label-font-weight': '500',
          '--menu-label-font-size': 'var(--mantine-font-size-xs)',
          '--menu-label-padding': 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)',
        },
        divider: {
          '--menu-divider-color': 'var(--mantine-color-default-border)',
          '--menu-divider-margin': 'var(--mantine-spacing-xs) 0',
        },
      }),
      styles: {
        dropdown: {
          backgroundColor: 'var(--menu-bg)',
          border: '1px solid var(--menu-border-color)',
          borderRadius: 'var(--menu-radius)',
          boxShadow: 'var(--menu-shadow)',
          padding: 'var(--mantine-spacing-xs)',
          minWidth: 'rem(180px)',
        },
        item: {
          color: 'var(--menu-item-color)',
          borderRadius: 'var(--mantine-radius-sm)',
          padding: 'var(--menu-item-padding)',
          fontSize: 'var(--mantine-font-size-sm)',
          fontWeight: 500,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: 'var(--menu-item-bg-hover)',
          },
          '&[data-selected]': {
            backgroundColor: 'var(--menu-item-bg-selected)',
            color: 'var(--menu-item-color-selected)',
          },
        },
        label: {
          color: 'var(--menu-label-color)',
          fontWeight: 'var(--menu-label-font-weight)',
          fontSize: 'var(--menu-label-font-size)',
          padding: 'var(--menu-label-padding)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: 'var(--mantine-spacing-xs) 0',
          cursor: 'default',
        },
        divider: {
          borderTop: '1px solid var(--menu-divider-color)',
          margin: 'var(--menu-divider-margin)',
        },
      },
    },

    Tabs: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined

        return {
          root: {
            '--tabs-color': colorKey ? `var(--mantine-color-${colorKey}-filled)` : 'var(--mantine-primary-color-filled)',
            '--tabs-color-light': colorKey ? `var(--mantine-color-${colorKey}-light)` : 'var(--mantine-primary-color-light)',
            '--tabs-radius': 'var(--mantine-radius-default)',
          },
          tab: {
            '--tab-color': 'var(--mantine-color-default-color)',
            '--tab-color-hover': colorKey ? `var(--mantine-color-${colorKey}-light-color)` : 'var(--mantine-primary-color-light-color)',
            '--tab-bg-active': 'var(--tabs-color-light)',
            '--tab-border-color': 'var(--mantine-color-default-border)',
            '--tab-font-size': 'var(--mantine-font-size-sm)',
            '--tab-font-weight': '500',
            '--tab-padding': 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
            '--tab-transition': 'all 0.2s ease',
          },
          panel: {
            '--panel-padding': 'var(--mantine-spacing-lg)',
            '--panel-bg': 'var(--mantine-color-body)',
          },
        }
      },
      styles: {
        root: {
          display: 'flex',
          flexDirection: 'column',
        },
        list: {
          borderBottom: '1px solid var(--tab-border-color)',
          display: 'flex',
          gap: 'var(--mantine-spacing-xs)',
        },
        tab: {
          color: 'var(--tab-color)',
          fontSize: 'var(--tab-font-size)',
          fontWeight: 'var(--tab-font-weight)',
          padding: 'var(--tab-padding)',
          borderRadius: 'var(--tabs-radius) var(--tabs-radius) 0 0',
          border: '1px solid transparent',
          borderBottom: 'none',
          cursor: 'pointer',
          transition: 'var(--tab-transition)',
          position: 'relative',
          '&:hover': {
            color: 'var(--tab-color-hover)',
            backgroundColor: 'var(--mantine-color-default-hover)',
          },
          '&[data-active]': {
            backgroundColor: 'var(--tab-bg-active)',
            color: 'var(--tabs-color)',
            borderColor: 'var(--tab-border-color)',
            marginBottom: '-1px',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-1px',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: 'var(--tab-bg-active)',
            },
          },
        },
        panel: {
          backgroundColor: 'var(--panel-bg)',
          padding: 'var(--panel-padding)',
          flex: 1,
        },
      },
    },

    // Phase 2: Data Display Components

    Table: {
      vars: () => ({
        root: {
          '--table-bg': 'var(--mantine-color-body)',
          '--table-border-color': 'var(--mantine-color-default-border)',
          '--table-striped-bg': 'var(--mantine-color-default-hover)',
          '--table-radius': 'var(--mantine-radius-default)',
          '--table-font-size': 'var(--mantine-font-size-sm)',
        },
        th: {
          '--th-bg': 'var(--mantine-color-gray-0)',
          '--th-color': 'var(--mantine-color-default-color)',
          '--th-font-weight': '600',
          '--th-border-color': 'var(--table-border-color)',
          '--th-padding': 'var(--mantine-spacing-sm)',
        },
        td: {
          '--td-padding': 'var(--mantine-spacing-sm)',
          '--td-border-color': 'var(--table-border-color)',
          '--td-color': 'var(--mantine-color-default-color)',
        },
      }),
      styles: {
        root: {
          backgroundColor: 'var(--table-bg)',
          border: '1px solid var(--table-border-color)',
          borderRadius: 'var(--table-radius)',
          overflow: 'hidden',
          fontSize: 'var(--table-font-size)',
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
        th: {
          backgroundColor: 'var(--th-bg)',
          color: 'var(--th-color)',
          fontWeight: 'var(--th-font-weight)',
          padding: 'var(--th-padding)',
          textAlign: 'left',
          borderBottom: '1px solid var(--th-border-color)',
          '&:first-child': {
            borderTopLeftRadius: 'var(--table-radius)',
          },
          '&:last-child': {
            borderTopRightRadius: 'var(--table-radius)',
          },
        },
        td: {
          padding: 'var(--td-padding)',
          color: 'var(--td-color)',
          borderBottom: '1px solid var(--td-border-color)',
        },
        tr: {
          '&:last-child td': {
            borderBottom: 'none',
          },
          '&[data-striped] td': {
            backgroundColor: 'var(--table-striped-bg)',
          },
          '&:hover td': {
            backgroundColor: 'var(--mantine-color-default-hover)',
          },
        },
      },
    },

    TableScrollContainer: {
      vars: () => ({
        root: {
          '--scroll-container-bg': 'var(--mantine-color-body)',
          '--scroll-container-border-color': 'var(--mantine-color-default-border)',
          '--scroll-container-radius': 'var(--mantine-radius-default)',
        },
      }),
      styles: {
        root: {
          backgroundColor: 'var(--scroll-container-bg)',
          border: '1px solid var(--scroll-container-border-color)',
          borderRadius: 'var(--scroll-container-radius)',
          overflow: 'auto',
        },
      },
    },

    
    CardSection: {
      vars: () => ({
        root: {
          '--section-padding': 'var(--mantine-spacing-md)',
          '--section-border-color': 'var(--mantine-color-default-border)',
        },
      }),
      styles: {
        root: {
          padding: 'var(--section-padding)',
          '&:not(:last-child)': {
            borderBottom: '1px solid var(--section-border-color)',
          },
          '&:first-child': {
            paddingTop: 0,
          },
          '&:last-child': {
            paddingBottom: 0,
          },
        },
      },
    },

    SimpleGrid: {
      vars: () => ({
        root: {
          '--grid-spacing': 'var(--mantine-spacing-md)',
          '--grid-min-width': 'rem(280px)',
        },
      }),
      styles: {
        root: {
          display: 'grid',
          gap: 'var(--grid-spacing)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(var(--grid-min-width), 1fr))',
        },
      },
    },

    Divider: {
      vars: () => ({
        root: {
          '--divider-color': 'var(--mantine-color-default-border)',
          '--divider-size': '1px',
          '--divider-margin': 'var(--mantine-spacing-md)',
        },
      }),
      styles: {
        root: {
          borderTop: 'var(--divider-size) solid var(--divider-color)',
          margin: 'var(--divider-margin) 0',
        },
        horizontal: {
          borderTop: 'var(--divider-size) solid var(--divider-color)',
          margin: 'var(--divider-margin) 0',
        },
        vertical: {
          borderLeft: 'var(--divider-size) solid var(--divider-color)',
          margin: '0 var(--divider-margin)',
        },
      },
    },

    Space: {
      vars: () => ({
        root: {
          '--space-h': 'var(--mantine-spacing-md)',
          '--space-w': 'var(--mantine-spacing-md)',
        },
      }),
    },

    Center: {
      vars: () => ({
        root: {
          '--center-min-width': 'rem(100px)',
          '--center-min-height': 'rem(100px)',
        },
      }),
      styles: {
        root: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 'var(--center-min-width)',
          minHeight: 'var(--center-min-height)',
          width: '100%',
        },
      },
    },

    Code: {
      vars: () => ({
        root: {
          '--code-bg': 'var(--mantine-color-gray-0)',
          '--code-color': 'var(--mantine-color-red-6)',
          '--code-border-color': 'var(--mantine-color-gray-3)',
          '--code-radius': 'var(--mantine-radius-sm)',
          '--code-font-size': 'var(--mantine-font-size-sm)',
          '--code-font-weight': '600',
          '--code-padding': '2px var(--mantine-spacing-xs)',
        },
      }),
      styles: {
        root: {
          backgroundColor: 'var(--code-bg)',
          color: 'var(--code-color)',
          border: '1px solid var(--code-border-color)',
          borderRadius: 'var(--code-radius)',
          fontSize: 'var(--code-font-size)',
          fontWeight: 'var(--code-font-weight)',
          padding: 'var(--code-padding)',
          fontFamily: 'var(--mantine-font-family-monospace)',
          lineHeight: 1.4,
        },
        block: {
          backgroundColor: 'var(--code-bg)',
          border: '1px solid var(--code-border-color)',
          borderRadius: 'var(--code-radius)',
          padding: 'var(--mantine-spacing-sm)',
          fontSize: 'var(--code-font-size)',
          fontFamily: 'var(--mantine-font-family-monospace)',
          lineHeight: 1.6,
          overflow: 'auto',
          whiteSpace: 'pre',
        },
      },
    },

    // Phase 3: Form Components

    NumberInput: {
      vars: (theme, properties) => {
        const hasError = properties.error

        return {
          root: {},
          input: {
            '--number-input-bg': 'var(--mantine-color-body)',
            '--number-input-border-color': hasError
              ? theme.colors.red[6]
              : 'var(--mantine-color-default-border)',
            '--number-input-placeholder-color': 'var(--mantine-color-placeholder)',
            '--number-input-color': 'var(--mantine-color-default-color)',
          },
          controls: {
            '--controls-bg': 'var(--mantine-color-default-hover)',
            '--controls-color': 'var(--mantine-color-default-color)',
            '--controls-hover-bg': 'var(--mantine-color-primary-filled)',
            '--controls-hover-color': 'var(--mantine-color-primary-contrast)',
          },
        }
      },
      styles: {
        root: {
          position: 'relative',
        },
        input: {
          backgroundColor: 'var(--number-input-bg)',
          borderColor: 'var(--number-input-border-color)',
          color: 'var(--number-input-color)',
          '&::placeholder': {
            color: 'var(--number-input-placeholder-color)',
          },
        },
        controls: {
          backgroundColor: 'var(--controls-bg)',
          color: 'var(--controls-color)',
          '&:hover': {
            backgroundColor: 'var(--controls-hover-bg)',
            color: 'var(--controls-hover-color)',
          },
        },
      },
    },

    MultiSelect: {
      defaultProps: {
        checkIconPosition: "left",
        searchable: true,
        clearable: true,
      },
      vars: (theme, properties) => {
        const hasError = properties.error

        return {
          root: {},
          input: {
            '--multi-select-bg': 'var(--mantine-color-body)',
            '--multi-select-border-color': hasError
              ? theme.colors.red[6]
              : 'var(--mantine-color-default-border)',
            '--multi-select-placeholder-color': 'var(--mantine-color-placeholder)',
            '--multi-select-color': 'var(--mantine-color-default-color)',
          },
          dropdown: {
            '--multi-select-dropdown-bg': 'var(--mantine-color-body)',
            '--multi-select-dropdown-border-color': 'var(--mantine-color-default-border)',
            '--multi-select-dropdown-shadow': theme.shadows.lg,
          },
          item: {
            '--multi-select-item-color': 'var(--mantine-color-default-color)',
            '--multi-select-item-bg-hover': 'var(--mantine-color-default-hover)',
            '--multi-select-item-bg-selected': 'var(--mantine-primary-color-light)',
            '--multi-select-item-padding': 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)',
          },
        }
      },
      styles: {
        input: {
          backgroundColor: 'var(--multi-select-bg)',
          borderColor: 'var(--multi-select-border-color)',
          color: 'var(--multi-select-color)',
          '&::placeholder': {
            color: 'var(--multi-select-placeholder-color)',
          },
        },
        dropdown: {
          backgroundColor: 'var(--multi-select-dropdown-bg)',
          border: '1px solid var(--multi-select-dropdown-border-color)',
          borderRadius: 'var(--mantine-radius-default)',
          boxShadow: 'var(--multi-select-dropdown-shadow)',
          padding: 'var(--mantine-spacing-xs)',
        },
        item: {
          color: 'var(--multi-select-item-color)',
          padding: 'var(--multi-select-item-padding)',
          borderRadius: 'var(--mantine-radius-sm)',
          fontSize: 'var(--mantine-font-size-sm)',
          fontWeight: 500,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: 'var(--multi-select-item-bg-hover)',
          },
          '&[data-selected]': {
            backgroundColor: 'var(--multi-select-item-bg-selected)',
            color: 'var(--mantine-primary-color-light-color)',
          },
        },
      },
    },

    // Phase 4: Loading and Progress Components

    Progress: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : 'primary'

        return {
          root: {
            '--progress-radius': 'var(--mantine-radius-default)',
            '--progress-size': 'var(--mantine-spacing-md)',
          },
          section: {
            '--progress-color': 'var(--mantine-color-' + colorKey + '-filled)',
            '--progress-transition': 'width 0.3s ease',
          },
          label: {
            '--progress-label-color': 'var(--mantine-color-default-color)',
            '--progress-label-font-size': 'var(--mantine-font-size-xs)',
            '--progress-label-font-weight': '500',
          },
        }
      },
      styles: {
        root: {
          borderRadius: 'var(--progress-radius)',
          height: 'var(--progress-size)',
          backgroundColor: 'var(--mantine-color-default-hover)',
          overflow: 'hidden',
          position: 'relative',
        },
        section: {
          backgroundColor: 'var(--progress-color)',
          transition: 'var(--progress-transition)',
          height: '100%',
        },
        label: {
          color: 'var(--progress-label-color)',
          fontSize: 'var(--progress-label-font-size)',
          fontWeight: 'var(--progress-label-font-weight)',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        },
      },
    },

    RingProgress: {
      vars: (theme, properties) => {
        const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : 'primary'

        return {
          root: {
            '--ring-size': 'rem(120px)',
            '--ring-thickness': 'rem(8px)',
            '--ring-color': 'var(--mantine-color-' + colorKey + '-filled)',
            '--ring-track-color': 'var(--mantine-color-default-hover)',
            '--ring-label-color': 'var(--mantine-color-default-color)',
          },
          label: {
            '--ring-label-font-size': 'var(--mantine-font-size-lg)',
            '--ring-label-font-weight': '600',
          },
          svg: {
            '--ring-transform': 'rotate(-90deg)',
          },
        }
      },
      styles: {
        root: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        svg: {
          transform: 'var(--ring-transform)',
        },
        label: {
          color: 'var(--ring-label-color)',
          fontSize: 'var(--ring-label-font-size)',
          fontWeight: 'var(--ring-label-font-weight)',
          position: 'absolute',
          textAlign: 'center',
        },
      },
    },

    // Additional utility components
    Stack: {
      vars: () => ({
        root: {
          '--stack-spacing': 'var(--mantine-spacing-md)',
          '--stack-align': 'stretch',
          '--stack-justify': 'flex-start',
          '--stack-gap': 'var(--mantine-spacing-md)',
        },
      }),
      styles: {
        root: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'var(--stack-align)',
          justifyContent: 'var(--stack-justify)',
          gap: 'var(--stack-gap)',
        },
      },
    },

    Group: {
      vars: () => ({
        root: {
          '--group-spacing': 'var(--mantine-spacing-md)',
          '--group-align': 'center',
          '--group-justify': 'flex-start',
          '--group-wrap': 'nowrap',
          '--group-gap': 'var(--mantine-spacing-md)',
        },
      }),
      styles: {
        root: {
          display: 'flex',
          alignItems: 'var(--group-align)',
          justifyContent: 'var(--group-justify)',
          flexWrap: 'var(--group-wrap)',
          gap: 'var(--group-gap)',
        },
      },
    },

    Title: {
      vars: () => ({
        root: {
          '--title-color': 'var(--mantine-color-default-color)',
          '--title-font-weight': '700',
          '--title-line-height': '1.2',
          '--title-margin-bottom': 'var(--mantine-spacing-sm)',
        },
      }),
      styles: {
        root: {
          color: 'var(--title-color)',
          fontWeight: 'var(--title-font-weight)',
          lineHeight: 'var(--title-line-height)',
          marginBottom: 'var(--title-margin-bottom)',
        },
      },
    },

    // Critical Missing Components (Actively Used)

    Accordion: {
      vars: () => ({
        root: {
          '--accordion-border-color': 'var(--mantine-color-default-border)',
          '--accordion-radius': 'var(--mantine-radius-default)',
        },
        item: {
          '--accordion-item-bg': 'var(--mantine-color-body)',
          '--accordion-item-border-color': 'var(--accordion-border-color)',
          '--accordion-item-transition': 'all 0.2s ease',
        },
        control: {
          '--accordion-control-color': 'var(--mantine-color-default-color)',
          '--accordion-control-bg-hover': 'var(--mantine-color-default-hover)',
          '--accordion-control-padding': 'var(--mantine-spacing-md)',
          '--accordion-control-font-weight': '600',
          '--accordion-control-transition': 'var(--accordion-item-transition)',
        },
        content: {
          '--accordion-content-padding': 'var(--accordion-control-padding)',
          '--accordion-content-bg': 'var(--mantine-color-body)',
        },
        chevron: {
          '--accordion-chevron-color': 'var(--mantine-color-dimmed)',
          '--accordion-chevron-size': 'rem(16px)',
          '--accordion-chevron-transition': 'transform 0.2s ease',
        },
      }),
      styles: {
        root: {
          borderRadius: 'var(--accordion-radius)',
          overflow: 'hidden',
        },
        item: {
          backgroundColor: 'var(--accordion-item-bg)',
          border: '1px solid var(--accordion-item-border-color)',
          borderRadius: 'var(--accordion-radius)',
          marginBottom: 'var(--mantine-spacing-xs)',
          transition: 'var(--accordion-item-transition)',
          '&:last-child': {
            marginBottom: 0,
          },
        },
        control: {
          color: 'var(--accordion-control-color)',
          backgroundColor: 'transparent',
          border: 'none',
          padding: 'var(--accordion-control-padding)',
          fontWeight: 'var(--accordion-control-font-weight)',
          transition: 'var(--accordion-control-transition)',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          '&:hover': {
            backgroundColor: 'var(--accordion-control-bg-hover)',
          },
        },
        content: {
          padding: 'var(--accordion-content-padding)',
          backgroundColor: 'var(--accordion-content-bg)',
        },
        chevron: {
          color: 'var(--accordion-chevron-color)',
          width: 'var(--accordion-chevron-size)',
          height: 'var(--accordion-chevron-size)',
          transition: 'var(--accordion-chevron-transition)',
          '[data-open]': {
            transform: 'rotate(180deg)',
          },
        },
      },
    },

    Slider: {
      vars: () => ({
        root: {
          '--slider-size': 'rem(6px)',
          '--slider-track-size': 'rem(4px)',
          '--slider-color': 'var(--mantine-color-primary-filled)',
          '--slider-track-color': 'var(--mantine-color-default-hover)',
          '--slider-thumb-size': 'rem(20px)',
          '--slider-thumb-color': 'var(--mantine-color-white)',
          '--slider-thumb-border-color': 'var(--mantine-color-primary-filled)',
          '--slider-mark-size': 'rem(8px)',
          '--slider-mark-color': 'var(--mantine-color-dimmed)',
          '--slider-transition': 'all 0.2s ease',
        },
        marks: {
          '--slider-mark-active-color': 'var(--slider-color)',
        },
      }),
      styles: {
        root: {
          position: 'relative',
          height: 'var(--slider-size)',
        },
        track: {
          height: 'var(--slider-track-size)',
          backgroundColor: 'var(--slider-track-color)',
          borderRadius: 'var(--mantine-radius-sm)',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '100%',
        },
        bar: {
          height: 'var(--slider-track-size)',
          backgroundColor: 'var(--slider-color)',
          borderRadius: 'var(--mantine-radius-sm)',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          transition: 'var(--slider-transition)',
        },
        thumb: {
          width: 'var(--slider-thumb-size)',
          height: 'var(--slider-thumb-size)',
          backgroundColor: 'var(--slider-thumb-color)',
          border: '2px solid var(--slider-thumb-border-color)',
          borderRadius: '50%',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'grab',
          transition: 'var(--slider-transition)',
          '&:active': {
            cursor: 'grabbing',
          },
        },
        marksContainer: {
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 'var(--mantine-spacing-xs)',
        },
        mark: {
          width: 'var(--slider-mark-size)',
          height: 'var(--slider-mark-size)',
          backgroundColor: 'var(--slider-mark-color)',
          borderRadius: '50%',
          position: 'absolute',
          transform: 'translateX(-50%)',
          transition: 'var(--slider-transition)',
          '&[data-active]': {
            backgroundColor: 'var(--slider-mark-active-color)',
          },
        },
        markWrapper: {
          position: 'absolute',
          transform: 'translateX(-50%)',
        },
        markLabel: {
          color: 'var(--mantine-color-dimmed)',
          fontSize: 'var(--mantine-font-size-xs)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        },
      },
    },

    RangeSlider: {
      vars: () => ({
        root: {
          '--range-slider-size': 'rem(6px)',
          '--range-slider-track-size': 'rem(4px)',
          '--range-slider-color': 'var(--mantine-color-primary-filled)',
          '--range-slider-track-color': 'var(--mantine-color-default-hover)',
          '--range-slider-thumb-size': 'rem(20px)',
          '--range-slider-thumb-color': 'var(--mantine-color-white)',
          '--range-slider-thumb-border-color': 'var(--mantine-color-primary-filled)',
          '--range-slider-track-active-color': 'var(--range-slider-color)',
          '--range-slider-transition': 'all 0.2s ease',
        },
      }),
      styles: {
        root: {
          position: 'relative',
          height: 'var(--range-slider-size)',
        },
        track: {
          height: 'var(--range-slider-track-size)',
          backgroundColor: 'var(--range-slider-track-color)',
          borderRadius: 'var(--mantine-radius-sm)',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '100%',
        },
        bar: {
          height: 'var(--range-slider-track-size)',
          backgroundColor: 'var(--range-slider-track-active-color)',
          borderRadius: 'var(--mantine-radius-sm)',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          transition: 'var(--range-slider-transition)',
        },
        thumb: {
          width: 'var(--range-slider-thumb-size)',
          height: 'var(--range-slider-thumb-size)',
          backgroundColor: 'var(--range-slider-thumb-color)',
          border: '2px solid var(--range-slider-thumb-border-color)',
          borderRadius: '50%',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'grab',
          transition: 'var(--range-slider-transition)',
          '&:active': {
            cursor: 'grabbing',
          },
        },
      },
    },

    // TextInput component - Basic text input field styling
    TextInput: {
      vars: () => ({
        input: {
          '--text-input-size': 'var(--mantine-control-size)',
          '--text-input-radius': 'var(--mantine-radius-default)',
          '--text-input-color': 'var(--mantine-color-default-color)',
          '--text-input-placeholder-color': 'var(--mantine-color-placeholder)',
          '--text-input-disabled-color': 'var(--mantine-color-disabled)',
          '--text-input-error-color': 'var(--mantine-color-error)',
          '--text-input-focused-border-color': 'var(--mantine-color-primary-6)',
          '--text-input-border-color': 'var(--mantine-color-default-border)',
          '--text-input-bg': 'var(--mantine-color-default)',
        },
      }),
      styles: () => ({
        input: {
          border: '1px solid var(--text-input-border-color)',
          backgroundColor: 'var(--text-input-bg)',
          color: 'var(--text-input-color)',
          '&:focus': {
            borderColor: 'var(--text-input-focused-border-color)',
            outline: 'none',
          },
          '&:disabled': {
            color: 'var(--text-input-disabled-color)',
            backgroundColor: 'var(--mantine-color-disabled)',
            cursor: 'not-allowed',
          },
          '&[data-error]': {
            borderColor: 'var(--text-input-error-color)',
            color: 'var(--text-input-error-color)',
          },
        },
        wrapper: {
          width: '100%',
        },
      }),
    },

  
    // NativeSelect component - Native browser select dropdown
    NativeSelect: {
      vars: () => ({
        input: {
          '--native-select-size': 'var(--mantine-control-size)',
          '--native-select-radius': 'var(--mantine-radius-default)',
          '--native-select-color': 'var(--mantine-color-default-color)',
          '--native-select-bg': 'var(--mantine-color-default)',
          '--native-select-border-color': 'var(--mantine-color-default-border)',
          '--native-select-focused-border-color': 'var(--mantine-color-primary-6)',
        },
      }),
      styles: () => ({
        input: {
          cursor: 'pointer',
          backgroundColor: 'var(--native-select-bg)',
          border: '1px solid var(--native-select-border-color)',
          color: 'var(--native-select-color)',
          '&:focus': {
            borderColor: 'var(--native-select-focused-border-color)',
            outline: 'none',
          },
          '&:disabled': {
            color: 'var(--mantine-color-disabled)',
            backgroundColor: 'var(--mantine-color-disabled)',
            cursor: 'not-allowed',
          },
        },
        wrapper: {
          width: '100%',
        },
      }),
    },
  },
})