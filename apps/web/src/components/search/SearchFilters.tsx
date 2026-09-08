import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  MultiSelect,
  NumberInput,
  Paper,
  RangeSlider,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconCalendar,
  IconClock,
  IconFilter,
  IconHash,
  IconMath,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useState } from "react";

export interface AdvancedSearchFilters {
  // Text filters
  title?: string;
  abstract?: string;
  author?: string;
  institution?: string;
  venue?: string;
  keywords?: string;

  // Date filters
  publicationYear?: {
    from?: number;
    to?: number;
  };
  dateRangePreset?: string;

  // Type filters
  entityType?: string[];
  publicationType?: string[];
  openAccess?: boolean;

  // Citation filters
  citationCount?: {
    from?: number;
    to?: number;
  };
  citationImpact?: string;

  // Field of study
  fieldOfStudy?: string[];
  concepts?: string[];

  // Language
  language?: string[];
}

interface SearchFiltersProperties {
  filters: AdvancedSearchFilters;
  onFiltersChange: (filters: AdvancedSearchFilters) => void;
  onReset: () => void;
}

const ENTITY_TYPES = [
  { value: "works", label: "Works (Papers, Books, etc.)" },
  { value: "authors", label: "Authors" },
  { value: "institutions", label: "Institutions" },
  { value: "venues", label: "Venues (Journals, Conferences)" },
  { value: "concepts", label: "Concepts & Topics" },
];

const PUBLICATION_TYPES = [
  { value: "journal-article", label: "Journal Article" },
  { value: "book", label: "Book" },
  { value: "book-chapter", label: "Book Chapter" },
  { value: "conference-paper", label: "Conference Paper" },
  { value: "dissertation", label: "Dissertation/Thesis" },
  { value: "patent", label: "Patent" },
  { value: "preprint", label: "Preprint" },
  { value: "report", label: "Report" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
];

const COMMON_FIELDS = [
  { value: "Computer Science", label: "Computer Science" },
  { value: "Medicine", label: "Medicine" },
  { value: "Biology", label: "Biology" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "Physics", label: "Physics" },
  { value: "Mathematics", label: "Mathematics" },
  { value: "Engineering", label: "Engineering" },
  { value: "Psychology", label: "Psychology" },
  { value: "Economics", label: "Economics" },
  { value: "Sociology", label: "Sociology" },
];

// Date range presets for quick filtering
const DATE_RANGE_PRESETS = [
  { value: "this-year", label: "This Year", from: 2024, to: 2024 },
  { value: "last-5-years", label: "Last 5 Years", from: 2019, to: 2024 },
  { value: "last-10-years", label: "Last 10 Years", from: 2014, to: 2024 },
  { value: "2000s", label: "2000s", from: 2000, to: 2009 },
  { value: "1990s", label: "1990s", from: 1990, to: 1999 },
  { value: "classic", label: "Classic (pre-1990)", from: 1900, to: 1989 },
];

// Citation impact levels
const CITATION_IMPACT_LEVELS = [
  { value: "high", label: "High Impact (100+)", from: 100, to: undefined },
  { value: "moderate", label: "Moderate (10-99)", from: 10, to: 99 },
  { value: "low", label: "Low (0-9)", from: 0, to: 9 },
  { value: "viral", label: "Viral (1000+)", from: 1000, to: undefined },
];

// Quick filter entity type pills with colors
const QUICK_ENTITY_FILTERS = [
  { value: "works", label: "Works", color: "blue" },
  { value: "authors", label: "Authors", color: "green" },
  { value: "institutions", label: "Institutions", color: "orange" },
  { value: "venues", label: "Venues", color: "purple" },
  { value: "concepts", label: "Concepts", color: "pink" },
];

export const SearchFilters = ({
  filters,
  onFiltersChange,
  onReset,
}: SearchFiltersProperties) => {
  const [localFilters, setLocalFilters] = useState<AdvancedSearchFilters>(filters);

  const updateFilter = useCallback((
    field: keyof AdvancedSearchFilters,
    value: AdvancedSearchFilters[keyof AdvancedSearchFilters]
  ) => {
    const updated = { ...localFilters, [field]: value };
    setLocalFilters(updated);
    onFiltersChange(updated);
  }, [localFilters, onFiltersChange]);

  // Helper function to apply date range preset
  const applyDateRangePreset = useCallback((preset: typeof DATE_RANGE_PRESETS[0]) => {
    updateFilter("publicationYear", { from: preset.from, to: preset.to });
    updateFilter("dateRangePreset", preset.value);
  }, [updateFilter]);

  // Helper function to apply citation impact level
  const applyCitationImpact = useCallback((level: typeof CITATION_IMPACT_LEVELS[0]) => {
    updateFilter("citationCount", { from: level.from, to: level.to });
    updateFilter("citationImpact", level.value);
  }, [updateFilter]);

  // Helper function to toggle quick entity filter
  const toggleQuickEntityFilter = useCallback((entityType: string) => {
    const currentTypes = localFilters.entityType || [];
    const newTypes = currentTypes.includes(entityType)
      ? currentTypes.filter(t => t !== entityType)
      : [...currentTypes, entityType];
    updateFilter("entityType", newTypes);
  }, [localFilters.entityType, updateFilter]);

  const hasActiveFilters = useCallback(() => {
    return Object.values(localFilters).some((value) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") {
        return Object.values(value).some(v => v !== undefined && v !== null && v !== "");
      }
      return true;
    });
  }, [localFilters]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    for (const [_key, value] of Object.entries(localFilters)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) count += value.length;
      else if (typeof value === "object") {
        count += Object.values(value).filter(v => v !== undefined && v !== null && v !== "").length;
      } else count++;
    }
    return count;
  }, [localFilters]);

  const activeFilterCount = getActiveFilterCount();

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <IconFilter size={20} />
            <Title order={4}>Advanced Filters</Title>
            {activeFilterCount > 0 && (
              <Badge size="sm" color="blue" variant="filled">
                {activeFilterCount} active
              </Badge>
            )}
          </Group>

          <Group gap="xs">
            {hasActiveFilters() && (
              <Button
                variant="outline"
                size="sm"
                leftSection={<IconX size={14} />}
                onClick={onReset}
              >
                Clear All
              </Button>
            )}
          </Group>
        </Group>

        {/* Quick Entity Filter Pills */}
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text size="sm" fw={500}>Quick Entity Filters</Text>
            <Tooltip label="Toggle entity types to quickly narrow search scope">
              <ActionIcon size="sm" variant="subtle">
                <IconHash size={12} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Group gap="xs" wrap="wrap">
            {QUICK_ENTITY_FILTERS.map((entity) => {
              const isSelected = localFilters.entityType?.includes(entity.value);
              return (
                <Tooltip key={entity.value} label={`Click to ${isSelected ? 'remove' : 'add'} ${entity.label} filter`}>
                  <Button
                    size="compact-sm"
                    variant={isSelected ? "filled" : "outline"}
                    color={isSelected ? entity.color : "gray"}
                    onClick={() => toggleQuickEntityFilter(entity.value)}
                    leftSection={
                      isSelected ? <IconX size={10} /> : undefined
                    }
                    style={{
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {entity.label}
                  </Button>
                </Tooltip>
              );
            })}
          </Group>
        </Stack>

        {/* Filters */}
        <Accordion
          variant="contained"
          radius="md"
          defaultValue={["text", "dates"]}
          multiple
        >
          {/* Text-based Filters */}
          <Accordion.Item value="text">
            <Accordion.Control icon={<IconHash size={16} />}>
              Text Search
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="sm">
                <TextInput
                  label="Title"
                  placeholder="Search in title only"
                  value={localFilters.title || ""}
                  onChange={(e) => updateFilter("title", e.target.value)}
                  rightSection={
                    localFilters.title && (
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => updateFilter("title", "")}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    )
                  }
                />

                <TextInput
                  label="Abstract"
                  placeholder="Search in abstract only"
                  value={localFilters.abstract || ""}
                  onChange={(e) => updateFilter("abstract", e.target.value)}
                  rightSection={
                    localFilters.abstract && (
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => updateFilter("abstract", "")}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    )
                  }
                />

                <TextInput
                  label="Author"
                  placeholder="Search by author name"
                  value={localFilters.author || ""}
                  onChange={(e) => updateFilter("author", e.target.value)}
                  rightSection={
                    localFilters.author && (
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => updateFilter("author", "")}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    )
                  }
                />

                <TextInput
                  label="Institution"
                  placeholder="Search by institution name"
                  value={localFilters.institution || ""}
                  onChange={(e) => updateFilter("institution", e.target.value)}
                  rightSection={
                    localFilters.institution && (
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => updateFilter("institution", "")}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    )
                  }
                />

                <TextInput
                  label="Venue"
                  placeholder="Journal or conference name"
                  value={localFilters.venue || ""}
                  onChange={(e) => updateFilter("venue", e.target.value)}
                  rightSection={
                    localFilters.venue && (
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => updateFilter("venue", "")}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    )
                  }
                />

                <TextInput
                  label="Keywords"
                  placeholder="Comma-separated keywords"
                  value={localFilters.keywords || ""}
                  onChange={(e) => updateFilter("keywords", e.target.value)}
                  rightSection={
                    localFilters.keywords && (
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => updateFilter("keywords", "")}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    )
                  }
                />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Date and Citation Filters */}
          <Accordion.Item value="dates">
            <Accordion.Control icon={<IconCalendar size={16} />}>
              Date & Citation Metrics
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                {/* Date Range Presets */}
                <div>
                  <Group justify="space-between" align="center" mb="xs">
                    <Text size="sm" fw={500}>Quick Date Ranges</Text>
                    <Group gap="xs">
                      {DATE_RANGE_PRESETS.map((preset) => (
                        <Tooltip key={preset.value} label={preset.label}>
                          <Button
                            size="compact-xs"
                            variant={
                              localFilters.dateRangePreset === preset.value ? "filled" : "light"
                            }
                            onClick={() => applyDateRangePreset(preset)}
                            leftSection={<IconClock size={10} />}
                          >
                            {preset.label.split(" ", 1)[0]}
                          </Button>
                        </Tooltip>
                      ))}
                    </Group>
                  </Group>
                </div>

                {/* Custom Date Range */}
                <div>
                  <Group justify="space-between" align="center" mb="xs">
                    <Text size="sm" fw={500}>
                      Custom Publication Year
                    </Text>
                    {localFilters.dateRangePreset && (
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => {
                          updateFilter("dateRangePreset", undefined);
                        }}
                        title="Clear preset"
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    )}
                  </Group>
                  <RangeSlider
                    min={1900}
                    max={2024}
                    value={[
                      localFilters.publicationYear?.from || 1900,
                      localFilters.publicationYear?.to || 2024,
                    ]}
                    onChange={([from, to]) => {
                      updateFilter("publicationYear", { from, to });
                      // Clear preset when manually adjusting
                      if (localFilters.dateRangePreset) {
                        updateFilter("dateRangePreset", undefined);
                      }
                    }}
                    label={(value) => value.toString()}
                    marks={[
                      { value: 1900, label: "1900" },
                      { value: 1950, label: "1950" },
                      { value: 2000, label: "2000" },
                      { value: 2020, label: "2020" },
                      { value: 2024, label: "2024" },
                    ]}
                  />
                </div>

                {/* Citation Impact Levels */}
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    Citation Impact Levels
                  </Text>
                  <SegmentedControl
                    data={[
                      { label: 'All', value: 'all' },
                      ...CITATION_IMPACT_LEVELS.map(level => ({
                        label: level.label,
                        value: level.value,
                      }))
                    ]}
                    value={localFilters.citationImpact || 'all'}
                    onChange={(value) => {
                      if (value === 'all') {
                        updateFilter("citationCount", { from: undefined, to: undefined });
                        updateFilter("citationImpact", undefined);
                      } else {
                        const level = CITATION_IMPACT_LEVELS.find(l => l.value === value);
                        if (level) {
                          applyCitationImpact(level);
                        }
                      }
                    }}
                    size="sm"
                    fullWidth
                  />
                </div>

                {/* Custom Citation Count */}
                <div>
                  <Group justify="space-between" align="center" mb="xs">
                    <Text size="sm" fw={500}>
                      Custom Citation Count
                    </Text>
                    {localFilters.citationImpact && (
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => {
                          updateFilter("citationImpact", undefined);
                        }}
                        title="Clear impact level"
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    )}
                  </Group>
                  <Group grow>
                    <NumberInput
                      placeholder="From"
                      min={0}
                      value={localFilters.citationCount?.from}
                      onChange={(value) => {
                        updateFilter("citationCount", {
                          ...localFilters.citationCount,
                          from: typeof value === "number" ? value : undefined,
                        });
                        // Clear impact level when manually adjusting
                        if (localFilters.citationImpact) {
                          updateFilter("citationImpact", undefined);
                        }
                      }}
                    />
                    <NumberInput
                      placeholder="To"
                      min={0}
                      value={localFilters.citationCount?.to}
                      onChange={(value) => {
                        updateFilter("citationCount", {
                          ...localFilters.citationCount,
                          to: typeof value === "number" ? value : undefined,
                        });
                        // Clear impact level when manually adjusting
                        if (localFilters.citationImpact) {
                          updateFilter("citationImpact", undefined);
                        }
                      }}
                    />
                  </Group>
                </div>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Type and Classification Filters */}
          <Accordion.Item value="types">
            <Accordion.Control icon={<IconMath size={16} />}>
              Types & Classification
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <MultiSelect
                  label="Entity Types"
                  placeholder="Select types to search"
                  data={ENTITY_TYPES}
                  value={localFilters.entityType || []}
                  onChange={(value) => updateFilter("entityType", value)}
                />

                <MultiSelect
                  label="Publication Types"
                  placeholder="Select publication types"
                  data={PUBLICATION_TYPES}
                  value={localFilters.publicationType || []}
                  onChange={(value) => updateFilter("publicationType", value)}
                />

                <MultiSelect
                  label="Languages"
                  placeholder="Select languages"
                  data={LANGUAGES}
                  value={localFilters.language || []}
                  onChange={(value) => updateFilter("language", value)}
                  searchable
                />

                <MultiSelect
                  label="Fields of Study"
                  placeholder="Select academic fields"
                  data={COMMON_FIELDS}
                  value={localFilters.fieldOfStudy || []}
                  onChange={(value) => updateFilter("fieldOfStudy", value)}
                  searchable
                />

                <Checkbox
                  label="Open Access only"
                  checked={localFilters.openAccess || false}
                  onChange={(e) => updateFilter("openAccess", e.currentTarget.checked)}
                />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Concept-based Filters */}
          <Accordion.Item value="concepts">
            <Accordion.Control icon={<IconUsers size={16} />}>
              Concepts & Topics
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="sm">
                <Text size="sm" c="dimmed">
                  Search for specific academic concepts, topics, or research areas.
                  This helps find papers that discuss particular themes or methodologies.
                </Text>

                <MultiSelect
                  label="Concepts"
                  placeholder="e.g., Machine Learning, Climate Change, COVID-19"
                  data={COMMON_FIELDS}
                  value={localFilters.concepts || []}
                  onChange={(value) => updateFilter("concepts", value)}
                  searchable
                />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        {/* Active Filters Summary */}
        {hasActiveFilters() && (
          <Paper p="sm" bg="blue.0" withBorder style={{ borderColor: "var(--mantine-color-blue-2)" }}>
            <Text size="sm" fw={500} mb="xs">
              Active Filters:
            </Text>
            <Group gap="xs" wrap="wrap">
              {Object.keys(localFilters).map((key) => {
                const value = localFilters[key];
                if (!value || (Array.isArray(value) && value.length === 0)) return null;

                const formatValue = (k: string, v: unknown): string => {
                  switch (k) {
                    case "entityType":
                    case "publicationType":
                    case "language":
                    case "fieldOfStudy":
                    case "concepts":
                      return `${k}: ${Array.isArray(v) ? v.join(", ") : v}`;
                    case "publicationYear":
                      // Check for preset first
                      if (localFilters.dateRangePreset) {
                        const preset = DATE_RANGE_PRESETS.find(p => p.value === localFilters.dateRangePreset);
                        if (preset) return `dates: ${preset.label}`;
                      }
                      // Fallback to custom range
                      if (typeof v === "object" && v !== null) {
                        const yearObject = v as { from?: unknown; to?: unknown };
                        if (yearObject.from && yearObject.to) {
                          return `year: ${yearObject.from}-${yearObject.to}`;
                        }
                        if (yearObject.from) {
                          return `year: >= ${yearObject.from}`;
                        }
                        if (yearObject.to) {
                          return `year: <= ${yearObject.to}`;
                        }
                      }
                      return "";
                    case "citationCount":
                      // Check for impact level first
                      if (localFilters.citationImpact) {
                        const impact = CITATION_IMPACT_LEVELS.find(l => l.value === localFilters.citationImpact);
                        if (impact) return `impact: ${impact.label}`;
                      }
                      // Fallback to custom range
                      if (typeof v === "object" && v !== null) {
                        const citationObject = v as { from?: unknown; to?: unknown };
                        if (citationObject.from || citationObject.to) {
                          return `citations: ${citationObject.from || "0"}-${citationObject.to || "∞"}`;
                        }
                      }
                      return "";
                    case "dateRangePreset": {
                      const preset = DATE_RANGE_PRESETS.find(p => p.value === v);
                      return preset ? `dates: ${preset.label}` : "";
                    }
                    case "citationImpact": {
                      const impact = CITATION_IMPACT_LEVELS.find(l => l.value === v);
                      return impact ? `impact: ${impact.label}` : "";
                    }
                    case "openAccess":
                      return v ? "Open Access" : "";
                    default:
                      if (typeof v === "string") return `${k}: ${v}`;
                      return "";
                  }
                };

                const formatted = formatValue(key, value);
                if (!formatted) return null;

                return (
                  <Badge
                    key={key}
                    size="sm"
                    variant="light"
                    color="blue"
                    styles={{
                      root: { cursor: "default" },
                    }}
                  >
                    {formatted}
                  </Badge>
                );
              })}
            </Group>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
};