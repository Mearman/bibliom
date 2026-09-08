import { rem } from '@mantine/core'

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

// Only truly essential components that can't be Mantine defaults
// This contains NO styling overrides - only functional components
export const essentialComponents = {
  // Container component is essential for layout functionality
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

  // Basic Button color variables (no styling overrides)
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

  // Basic Input error handling (no styling overrides)
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

  // Basic Select error handling (no styling overrides)
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

  // Basic Textarea error handling (no styling overrides)
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

  // Basic Checkbox color variables (no styling overrides)
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

  // Basic Radio color variables (no styling overrides)
  Radio: {
    vars: (theme, properties) => ({
      root: {
        '--radio-color': properties.color
          ? Object.keys(theme.colors).includes(properties.color)
            ? ["zinc", "slate", "gray", "neutral", "stone"].includes(properties.color)
              ? "var(--mantine-color-body)"
              : `var(--mantine-color-${properties.color}-filled)`
            : properties.color
          : "var(--mantine-primary-color-filled)",
        '--radio-icon-color': properties.color
          ? (Object.keys(theme.colors).includes(properties.color)
            ? `var(--mantine-color-${properties.color}-contrast)`
            : properties.color)
          : "var(--mantine-primary-color-contrast)",
      },
    }),
  },

  // Basic color variables for other components (no styling overrides)
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

  // Basic ActionIcon color variables (no styling overrides)
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

  // Basic Badge color variables (no styling overrides)
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

  // Basic Chip color variables (simplified)
  Chip: {
    vars: (theme, properties) => {
      const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
      return {
        root: {
          '--chip-bg': colorKey ? `var(--mantine-color-${colorKey}-filled)` : 'var(--mantine-primary-color-filled)',
          '--chip-color': colorKey ? `var(--mantine-color-${colorKey}-contrast)` : 'var(--mantine-primary-color-contrast)',
        },
      }
    },
  },

  // Basic Avatar color variables (simplified)
  Avatar: {
    vars: (theme, properties) => {
      const colorKey = properties.color && Object.keys(theme.colors).includes(properties.color) ? properties.color : undefined
      return {
        root: {
          '--avatar-bg': colorKey ? `var(--mantine-color-${colorKey}-light)` : 'var(--mantine-primary-color-light)',
          '--avatar-color': colorKey ? `var(--mantine-color-${colorKey}-contrast)` : 'var(--mantine-primary-color-contrast)',
        },
      }
    },
  },
}