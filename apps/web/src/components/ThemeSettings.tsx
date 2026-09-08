import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconDeviceDesktop,
  IconMoon,
  IconPalette,
  IconSun,
} from "@tabler/icons-react";

import { BORDER_STYLE_GRAY_3, CARD_BORDER_STYLE, ICON_SIZE } from "@/config/style-constants";
import { useTheme } from "@/contexts/theme-context";
import type { BorderRadius,ColorScheme, ComponentLibrary } from "@/styles/theme-contracts";

interface ThemeSettingsProperties {
  onClose?: () => void;
}

export const ThemeSettings = ({ onClose }: ThemeSettingsProperties) => {
  const { config, setComponentLibrary, setColorScheme, setColorMode, setBorderRadius, resetTheme } = useTheme();

  const componentLibraryData = [
    {
      value: "mantine",
      label: "Mantine",
      description: "Rich, feature-complete component library",
    },
    {
      value: "shadcn",
      label: "shadcn/ui",
      description: "Modern, accessible components built on Radix",
    },
    {
      value: "radix",
      label: "Radix UI",
      description: "Unstyled, accessible primitives",
    },
  ] as const;

  const colorSchemeData = [
    { value: "blue", label: "Blue", color: "#228be6" },
    { value: "green", label: "Green", color: "#37b24d" },
    { value: "orange", label: "Orange", color: "#fd7e14" },
    { value: "purple", label: "Purple", color: "#9775fa" },
    { value: "red", label: "Red", color: "#fa5252" },
    { value: "zinc", label: "Zinc", color: "#71717a" },
  ] as const;

  const colorModeData = [
    {
      value: "light",
      label: (
        <Group gap={6}>
          <IconSun size={ICON_SIZE.SM} />
          <span>Light</span>
        </Group>
      ),
    },
    {
      value: "dark",
      label: (
        <Group gap={6}>
          <IconMoon size={ICON_SIZE.SM} />
          <span>Dark</span>
        </Group>
      ),
    },
    {
      value: "auto",
      label: (
        <Group gap={6}>
          <IconDeviceDesktop size={ICON_SIZE.SM} />
          <span>Auto</span>
        </Group>
      ),
    },
  ];

  const borderRadiusData = [
    { value: "xs", label: "XS (2px)", description: "Extra small radius" },
    { value: "sm", label: "SM (4px)", description: "Small radius" },
    { value: "md", label: "MD (8px)", description: "Medium radius" },
    { value: "lg", label: "LG (12px)", description: "Large radius" },
    { value: "xl", label: "XL (16px)", description: "Extra large radius" },
  ] as const;

  const handleComponentLibraryChange = (value: string | null) => {
    if (value && ["mantine", "shadcn", "radix"].includes(value)) {
      setComponentLibrary(value as ComponentLibrary);
    }
  };

  const handleColorSchemeChange = (value: string | null) => {
    if (value && ["blue", "green", "orange", "purple", "red", "neutral"].includes(value)) {
      setColorScheme(value as ColorScheme);
    }
  };

  const handleColorModeChange = (value: string) => {
    if (["light", "dark", "auto"].includes(value)) {
      setColorMode(value as "light" | "dark" | "auto");
    }
  };

  const handleBorderRadiusChange = (value: string | null) => {
    if (value && ["xs", "sm", "md", "lg", "xl"].includes(value)) {
      setBorderRadius(value as BorderRadius);
    }
  };

  return (
    <Stack gap="lg">
      {/* Current Theme Summary */}
      <Card style={CARD_BORDER_STYLE} p="md" bg="var(--mantine-color-body)">
        <Group justify="space-between" align="center">
          <Group>
            <IconPalette size={ICON_SIZE.XL} color="var(--colors-primary)" />
            <Text size="sm" fw={500}>
              Current Theme
            </Text>
          </Group>
          <Group gap="xs">
            <Badge variant="light" size="sm">
              {config.componentLibrary}
            </Badge>
            <Badge
              variant="light"
              size="sm"
              style={{
                backgroundColor: colorSchemeData.find(s => s.value === config.colorScheme)?.color,
                color: "white",
              }}
            >
              {config.colorScheme}
            </Badge>
            <Badge variant="light" size="sm">
              {config.colorMode}
            </Badge>
            <Badge variant="light" size="sm">
              Radius: {config.borderRadius.toUpperCase()}
            </Badge>
          </Group>
        </Group>
      </Card>

      <Divider />

      {/* Component Library Selection */}
      <Stack gap="sm">
        <Text size="sm" fw={600}>
          Component Library
        </Text>
        <Select
          data={componentLibraryData}
          value={config.componentLibrary}
          onChange={handleComponentLibraryChange}
          description="Choose the base component library style"
        />
      </Stack>

      {/* Color Scheme Selection */}
      <Stack gap="sm">
        <Text size="sm" fw={600}>
          Color Scheme
        </Text>
        <Select
          data={colorSchemeData.map((scheme) => ({
            value: scheme.value,
            label: scheme.label,
          }))}
          value={config.colorScheme}
          onChange={handleColorSchemeChange}
          description="Choose the main color palette"
          renderOption={({ option }) => (
            <Group gap={8}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: colorSchemeData.find(s => s.value === option.value)?.color,
                  border: BORDER_STYLE_GRAY_3,
                }}
              />
              <span>{option.label}</span>
            </Group>
          )}
        />
      </Stack>

      {/* Color Mode Selection */}
      <Stack gap="sm">
        <Text size="sm" fw={600}>
          Appearance
        </Text>
        <SegmentedControl
          data={colorModeData}
          value={config.colorMode}
          onChange={handleColorModeChange}
          fullWidth
        />
      </Stack>

      {/* Border Radius Selection */}
      <Stack gap="sm">
        <Text size="sm" fw={600}>
          Border Radius
        </Text>
        <Select
          data={borderRadiusData}
          value={config.borderRadius}
          onChange={handleBorderRadiusChange}
          description="Choose the border radius for components"
          renderOption={({ option }) => (
            <Group gap={8}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: option.value === "xs" ? "2px" :
                                 option.value === "sm" ? "4px" :
                                 option.value === "md" ? "8px" :
                                 option.value === "lg" ? "12px" : "16px",
                  backgroundColor: "var(--mantine-color-gray-6)",
                  border: BORDER_STYLE_GRAY_3,
                }}
              />
              <span>{option.label}</span>
            </Group>
          )}
        />
      </Stack>

      <Divider />

      {/* Actions */}
      <Group justify="space-between">
        <Button
          variant="subtle"
          size="sm"
          onClick={resetTheme}
        >
          Reset to Default
        </Button>
        {onClose && (
          <Button
            variant="filled"
            size="sm"
            onClick={onClose}
          >
            Done
          </Button>
        )}
      </Group>
    </Stack>
  );
};