/**
 * FilterField - Base component for individual filter conditions
 * Provides the foundation for all filter field types with consistent UI and behavior
 */

import type { EntityFilters } from "@bibgraph/types";
import type { FilterFieldConfig as UtilitiesFilterFieldConfig } from "@bibgraph/utils";
import { ActionIcon, Alert,Group, Text, Tooltip } from "@mantine/core";
import { IconAlertCircle,IconX } from "@tabler/icons-react";
import React, { useCallback, useMemo } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useThemeColors } from "@/hooks/use-theme-colors";

import { BooleanFilter } from "../fields/BooleanFilter";
import { DateFilter } from "../fields/DateFilter";
import { EntityFilter } from "../fields/EntityFilter";
import { EnumFilter } from "../fields/EnumFilter";
import { NumericFilter } from "../fields/NumericFilter";
import { TextFilter } from "../fields/TextFilter";
import type { FilterCondition,FilterFieldProps as FilterFieldProperties } from "../types/filter-ui";

interface FilterFieldWrapperProperties<T extends EntityFilters = EntityFilters>
  extends FilterFieldProperties<T> {
  showRemoveButton?: boolean;
  showLabel?: boolean;
  error?: string;
}

export const FilterField = <T extends EntityFilters>({
  condition,
  config,
  onUpdate,
  onRemove,
  disabled = false,
  compact = false,
  showRemoveButton = true,
  showLabel = true,
  error,
}: FilterFieldWrapperProperties<T>) => {
  const { colors } = useThemeColors();
  const isPrefersReducedMotion = useReducedMotion();

  // Generate unique ID for form elements
  const fieldId = useMemo(() => `filter-${condition.id}`, [condition.id]);

  // Handle field value updates
  const handleValueChange = useCallback(
    (value: unknown) => {
      const updatedCondition: FilterCondition<T> = {
        ...condition,
        value,
      };
      onUpdate(updatedCondition);
    },
    [condition, onUpdate],
  );

  // Handle operator changes
  const handleOperatorChange = useCallback(
    (operator: string) => {
      const updatedCondition: FilterCondition<T> = {
        ...condition,
        operator: operator as FilterCondition<T>["operator"],
      };
      onUpdate(updatedCondition);
    },
    [condition, onUpdate],
  );

  // Handle enabled/disabled toggle
  const handleToggleEnabled = useCallback(() => {
    const updatedCondition: FilterCondition<T> = {
      ...condition,
      enabled: !condition.enabled,
    };
    onUpdate(updatedCondition);
  }, [condition, onUpdate]);

  // Render the appropriate field component based on type
  const renderFieldComponent = () => {
    // Type assertion needed because TypeScript treats re-exported types as distinct
    // even though they're structurally identical. Cast to the utils type for compatibility.
    const filterConfig = config as unknown as UtilitiesFilterFieldConfig;

    switch (config.type) {
      case "text":
      case "search":
        return (
          <TextFilter
            value={condition.value as string}
            operator={condition.operator}
            config={filterConfig}
            onValueChange={handleValueChange}
            onOperatorChange={handleOperatorChange}
            disabled={disabled || !condition.enabled}
            compact={compact}
            fieldId={fieldId}
          />
        );

      case "number":
        return (
          <NumericFilter
            value={condition.value as number}
            operator={condition.operator}
            config={filterConfig}
            onValueChange={handleValueChange}
            onOperatorChange={handleOperatorChange}
            disabled={disabled || !condition.enabled}
            compact={compact}
            fieldId={fieldId}
          />
        );

      case "date":
      case "dateRange":
        return (
          <DateFilter
            value={condition.value as string | [string, string] | null}
            operator={condition.operator}
            config={filterConfig}
            onValueChange={handleValueChange}
            onOperatorChange={handleOperatorChange}
            disabled={disabled || !condition.enabled}
            compact={compact}
            fieldId={fieldId}
          />
        );

      case "boolean":
        return (
          <BooleanFilter
            value={condition.value as boolean}
            operator={condition.operator}
            config={filterConfig}
            onValueChange={handleValueChange}
            onOperatorChange={handleOperatorChange}
            disabled={disabled || !condition.enabled}
            compact={compact}
            fieldId={fieldId}
          />
        );

      case "select":
      case "multiSelect":
        return (
          <EnumFilter
            value={condition.value as string | string[]}
            operator={condition.operator}
            config={filterConfig}
            onValueChange={handleValueChange}
            onOperatorChange={handleOperatorChange}
            disabled={disabled || !condition.enabled}
            compact={compact}
            fieldId={fieldId}
          />
        );

      case "entity":
      case "entityMulti":
        return (
          <EntityFilter
            value={condition.value as string | string[]}
            operator={condition.operator}
            config={filterConfig}
            onValueChange={handleValueChange}
            onOperatorChange={handleOperatorChange}
            disabled={disabled || !condition.enabled}
            compact={compact}
            fieldId={fieldId}
          />
        );

      default:
        return (
          <Alert color="orange" icon={<IconAlertCircle size={14} />}>
            Unknown field type: {config.type}
          </Alert>
        );
    }
  };

  return (
    <div
      style={{
        padding: compact ? "8px" : "12px",
        border: `1px solid ${condition.enabled ? colors.border.primary : colors.border.secondary}`,
        borderRadius: "6px",
        backgroundColor: condition.enabled
          ? colors.background.primary
          : colors.background.secondary,
        opacity: condition.enabled ? 1 : 0.7,
        transition: isPrefersReducedMotion ? "none" : "all 0.2s ease",
      }}
    >
      {/* Field Label and Controls */}
      {showLabel && (
        <Group justify="space-between" mb={compact ? 4 : 8}>
          <Group gap="xs">
            <Text
              size={compact ? "xs" : "sm"}
              fw={500}
              style={{
                color: condition.enabled
                  ? colors.text.primary
                  : colors.text.secondary,
              }}
            >
              {condition.label || config.label}
            </Text>

            {config.helpText && (
              <Tooltip label={config.helpText} multiline w={220}>
                <IconAlertCircle
                  size={12}
                  style={{ color: colors.text.tertiary, cursor: "help" }}
                />
              </Tooltip>
            )}
          </Group>

          <Group gap="xs">
            {/* Enable/Disable Toggle */}
            <Tooltip
              label={condition.enabled ? "Disable filter" : "Enable filter"}
            >
              <ActionIcon
                size="sm"
                variant="subtle"
                color={condition.enabled ? "blue" : "gray"}
                onClick={handleToggleEnabled}
                disabled={disabled}
              >
                {condition.enabled ? "✓" : "○"}
              </ActionIcon>
            </Tooltip>

            {/* Remove Button */}
            {showRemoveButton && (
              <Tooltip label="Remove filter">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={onRemove}
                  disabled={disabled}
                >
                  <IconX size={12} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      )}

      {/* Field Component */}
      {renderFieldComponent()}

      {/* Error Display */}
      {error && (
        <Text size="xs" c="red" mt={4}>
          {error}
        </Text>
      )}

      {/* Field Description */}
      {config.helpText && !compact && (
        <Text size="xs" c="dimmed" mt={4}>
          {config.helpText}
        </Text>
      )}
    </div>
  );
};

// Export with display name for debugging
FilterField.displayName = "FilterField";
