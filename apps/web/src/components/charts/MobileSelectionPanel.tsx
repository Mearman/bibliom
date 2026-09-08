/**
 * Mobile Selection Panel Component
 *
 * Displays selection details and interaction hints on mobile devices.
 * Used by chart components to show selected data point information.
 */

import type { ReactNode } from "react";

interface MobileSelectionPanelProperties {
  /**
  Content to display in the panel
   */
  children: ReactNode;
}

/**
 * Panel component for displaying selection details on mobile
 * @param root0
 * @param root0.children
 */
export const MobileSelectionPanel = ({ children }: MobileSelectionPanelProperties) => (
  <div
    style={{
      marginTop: "16px",
      padding: "12px",
      backgroundColor: "var(--mantine-color-blue-0)",
      border: "1px solid var(--mantine-color-blue-3)",
      borderRadius: "8px",
      fontSize: "14px",
    }}
    role="status"
    aria-live="polite"
  >
    {children}
  </div>
);

interface PerformanceChartHintsProperties {
  /**
  Selected dataset name
   */
  datasetName: string;
  /**
  Current zoom level
   */
  zoomLevel: number;
}

/**
 * Mobile interaction hints for performance bar chart
 * @param root0
 * @param root0.datasetName
 * @param root0.zoomLevel
 */
export const PerformanceChartHints = ({
  datasetName,
  zoomLevel,
}: PerformanceChartHintsProperties) => (
  <MobileSelectionPanel>
    <strong>Selected:</strong> {datasetName}
    <br />
    <div
      style={{
        fontSize: "12px",
        color: "var(--mantine-color-dimmed)",
        marginTop: "8px",
      }}
    >
      <div>Tap bars to hear values</div>
      <div>Swipe to scroll horizontally</div>
      <div>Double-tap to zoom in/out</div>
      <div>Pinch to zoom (scale: {Math.round(zoomLevel * 100)}%)</div>
    </div>
  </MobileSelectionPanel>
);

interface ScatterPlotDetailsProperties {
  /**
  Dataset name
   */
  datasetName: string;
  /**
  Precision value (0-1)
   */
  precision: number;
  /**
  Recall value (0-1)
   */
  recall: number;
  /**
  F1 score value (0-1)
   */
  f1Score: number;
}

/**
 * Mobile selection details for scatter plot
 * @param root0
 * @param root0.datasetName
 * @param root0.precision
 * @param root0.recall
 * @param root0.f1Score
 */
export const ScatterPlotDetails = ({
  datasetName,
  precision,
  recall,
  f1Score,
}: ScatterPlotDetailsProperties) => (
  <MobileSelectionPanel>
    <strong>{datasetName}</strong>
    <br />
    Precision: {(precision * 100).toFixed(1)}%
    <br />
    Recall: {(recall * 100).toFixed(1)}%
    <br />
    F1-Score: {(f1Score * 100).toFixed(1)}%
  </MobileSelectionPanel>
);
