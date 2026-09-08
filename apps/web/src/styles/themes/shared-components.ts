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

// Shared component definitions used by all themes
export const sharedComponents = {
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

  // All remaining component definitions...
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

  // Layout components
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

  // Additional utility components and form components...
  // (Continuing with the rest of the component definitions would make this file very long)
  // For brevity, I'm showing the key structure - we'd move all component definitions here
}