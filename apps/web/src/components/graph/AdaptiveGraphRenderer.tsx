/**
 * Adaptive Graph Renderer
 *
 * Automatically adjusts rendering quality and performance based on device capabilities,
 * screen size, and graph complexity. Provides smooth experience across mobile and desktop.
 */

import type { GraphNode } from '@bibgraph/types';
import { Box, LoadingOverlay, useMantineTheme } from '@mantine/core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from 'react-force-graph-2d';

import { useTouchGestures } from '@/hooks/use-touch-gestures';
import { announceToScreenReader } from '@/utils/accessibility';

import { ENTITY_TYPE_COLORS as HASH_BASED_ENTITY_COLORS } from '../../styles/hash-colors';
import {
  hasZoomMethod,
  isForceGraphLink,
  isForceGraphNode,
  isGraphCallbackNode,
} from './adaptive-graph-type-guards';
import type {
  AdaptiveGraphRendererProps as AdaptiveGraphRendererProperties,
  PerformanceMetrics,
  PerformanceProfile,
  RenderSettings,
} from './adaptive-graph-types';
import {
  detectDeviceCapabilities,
  determinePerformanceProfile,
  getPerformanceSettings,
} from './adaptive-graph-utils';
import { DeviceIndicator } from './DeviceIndicator';
import { GraphInstructionsPanel } from './GraphInstructionsPanel';
import { GraphTooLargeWarning } from './GraphTooLargeWarning';
import { MobileGraphControls } from './MobileGraphControls';
import { PerformanceOverlay } from './PerformanceOverlay';

const DEFAULT_HEIGHT = 400;
const INITIAL_FPS = 60;
const INITIAL_FRAME_TIME = 16;
const FPS_MEASURE_INTERVAL_MS = 1000;
const GRAPH_READY_CHECK_DELAY_MS = 100;
const ZOOM_STEP = 0.2;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 3;
const ZOOM_ANIMATION_DURATION = 200;
const ZOOM_TO_FIT_DURATION = 200;
const LABEL_VISIBILITY_SCALE = 2;
const BORDER_VISIBILITY_SCALE = 1.5;
const MIN_FONT_SIZE = 8;
const FONT_SIZE_SCALE = 10;

export const AdaptiveGraphRenderer = ({
  nodes,
  edges,
  visible = true,
  width,
  height = DEFAULT_HEIGHT,
  onNodeClick,
  onNodeRightClick,
  onNodeHover,
  onBackgroundClick,
  enableSimulation = true,
  showPerformanceOverlay = false,
  onGraphReady,
  performanceProfile,
}: AdaptiveGraphRendererProperties) => {
  const theme = useMantineTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const containerReference = useRef<HTMLDivElement>(null);
  const graphReference = useRef<
    ForceGraphMethods<NodeObject, LinkObject<NodeObject>> | undefined
  >(undefined);

  const [currentPerformanceProfile, setCurrentPerformanceProfile] =
    useState<PerformanceProfile>('medium');
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics>({
      fps: INITIAL_FPS,
      frameTime: INITIAL_FRAME_TIME,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      performanceLevel: 'good',
    });
  const [renderSettings, setRenderSettings] = useState<RenderSettings>(
    getPerformanceSettings('medium', nodes.length)
  );

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const breakpointPx = Number.parseInt(
        theme.breakpoints.sm.replace('px', '')
      );
      setIsMobile(window.innerWidth < breakpointPx);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [theme.breakpoints.sm]);

  // Auto-detect performance profile if not provided
  useEffect(() => {
    if (performanceProfile) {
      setCurrentPerformanceProfile(performanceProfile);
    } else {
      const capabilities = detectDeviceCapabilities();
      setCurrentPerformanceProfile(determinePerformanceProfile(capabilities));
    }
  }, [performanceProfile]);

  // Adjust render settings based on profile and graph size
  useEffect(() => {
    const adjustedProfile =
      nodes.length > renderSettings.maxNodes ? 'low' : currentPerformanceProfile;
    const settings = getPerformanceSettings(adjustedProfile, nodes.length);
    setRenderSettings(settings);

    if (nodes.length > renderSettings.maxNodes) {
      announceToScreenReader(
        `Performance adjusted to low quality mode for ${nodes.length} nodes`
      );
    }
  }, [currentPerformanceProfile, nodes.length, renderSettings.maxNodes]);

  // Performance monitoring
  useEffect(() => {
    if (!showPerformanceOverlay) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measurePerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= FPS_MEASURE_INTERVAL_MS) {
        const fps = Math.round((frameCount * FPS_MEASURE_INTERVAL_MS) / deltaTime);
        const frameTime = deltaTime / frameCount;
        const performanceLevel =
          fps >= 50 ? 'good' : fps >= 30 ? 'ok' : 'poor';

        setPerformanceMetrics({
          fps,
          frameTime,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          performanceLevel,
        });

        if (performanceLevel === 'poor' && currentPerformanceProfile !== 'low') {
          setCurrentPerformanceProfile('low');
          announceToScreenReader(
            'Performance automatically adjusted to maintain smooth interaction'
          );
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(measurePerformance);
    };

    animationFrameId = requestAnimationFrame(measurePerformance);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    showPerformanceOverlay,
    currentPerformanceProfile,
    nodes.length,
    edges.length,
  ]);

  // Node rendering based on performance settings
  const nodeCanvasObject = useCallback(
    (node: unknown, context: CanvasRenderingContext2D, globalScale: number) => {
      if (!isForceGraphNode(node)) return;

      const size =
        renderSettings.nodeDetail === 'high'
          ? 8
          : renderSettings.nodeDetail === 'medium'
            ? 6
            : 4;
      const opacity = renderSettings.animationEnabled ? 1 : 0.8;

      context.globalAlpha = opacity;
      context.beginPath();
      context.arc(node.x, node.y, size, 0, 2 * Math.PI);
      context.fillStyle =
        HASH_BASED_ENTITY_COLORS[
          node.entityType as keyof typeof HASH_BASED_ENTITY_COLORS
        ] || 'var(--mantine-color-gray-5)';
      context.fill();

      if (
        renderSettings.nodeDetail === 'high' &&
        globalScale > BORDER_VISIBILITY_SCALE
      ) {
        context.strokeStyle = 'var(--mantine-color-body)';
        context.lineWidth = 1;
        context.stroke();
      }

      if (renderSettings.labelEnabled && globalScale > LABEL_VISIBILITY_SCALE) {
        const fontSize = Math.max(FONT_SIZE_SCALE / globalScale, MIN_FONT_SIZE);
        context.font = `${fontSize}px Sans-Serif`;
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillStyle = 'var(--mantine-color-text)';
        context.fillText(node.label, node.x, node.y + size + 2);
      }

      context.globalAlpha = 1;
    },
    [renderSettings]
  );

  // Link rendering
  const linkCanvasObject = useCallback(
    (link: unknown, context: CanvasRenderingContext2D, globalScale: number) => {
      if (!isForceGraphLink(link)) return;

      const lineWidth =
        renderSettings.linkDetail === 'high'
          ? 2
          : renderSettings.linkDetail === 'medium'
            ? 1.5
            : 1;
      const opacity = renderSettings.animationEnabled ? 0.6 : 0.4;

      context.globalAlpha = opacity;
      context.strokeStyle = 'var(--mantine-color-gray-5)';
      context.lineWidth = lineWidth / globalScale;
      context.beginPath();
      context.moveTo(link.source.x, link.source.y);
      context.lineTo(link.target.x, link.target.y);
      context.stroke();
      context.globalAlpha = 1;
    },
    [renderSettings]
  );

  // Event handlers
  const handleNodeClick = useCallback(
    (node: unknown) => {
      if (isGraphCallbackNode(node)) {
        onNodeClick?.(node);
      }
    },
    [onNodeClick]
  );

  const handleNodeRightClick = useCallback(
    (node: unknown, event: MouseEvent) => {
      if (!isGraphCallbackNode(node)) {
      	return;
      }

      event.preventDefault();
      onNodeRightClick?.(node, event);
    },
    [onNodeRightClick]
  );

  const handleNodeHover = useCallback(
    (node: unknown | null) => {
      if (node === null) {
        onNodeHover?.(null);
      } else if (isGraphCallbackNode(node)) {
        onNodeHover?.(node as GraphNode);
      }
    },
    [onNodeHover]
  );

  const handleBackgroundClick = useCallback(() => {
    onBackgroundClick?.();
  }, [onBackgroundClick]);

  // Touch gesture handlers
  const touchHandlers = useTouchGestures(
    {
      onSwipe: (direction: string) => {
        if (!hasZoomMethod(graphReference.current)) return;
        const currentZoom = graphReference.current.zoom();
        const newZoom =
          direction === 'up' || direction === 'left'
            ? Math.min(currentZoom * 1.1, ZOOM_MAX)
            : Math.max(currentZoom * 0.9, ZOOM_MIN);
        graphReference.current.zoom(newZoom, ZOOM_ANIMATION_DURATION * 2);
        setZoomLevel(newZoom);
        announceToScreenReader(
          `Zoom ${direction === 'up' || direction === 'left' ? 'in' : 'out'} to ${Math.round(newZoom * 100)}%`
        );
      },
      onDoubleTap: () => {
        if (!hasZoomMethod(graphReference.current)) {
        	return;
        }

        const currentZoom = graphReference.current.zoom();
        const newZoom = currentZoom === 1 ? 2 : 1;
        graphReference.current.zoom(newZoom, ZOOM_ANIMATION_DURATION * 2);
        setZoomLevel(newZoom);
        announceToScreenReader(
          `Zoom ${newZoom === 1 ? 'out to fit' : 'in to 200%'}`
        );
      },
      onPinch: (scale: number) => {
        if (!hasZoomMethod(graphReference.current)) {
        	return;
        }

        const currentZoom = graphReference.current.zoom();
        const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, currentZoom * scale));
        graphReference.current.zoom(newZoom, 0);
        setZoomLevel(newZoom);
      },
      onLongPress: () => {
        setShowControls((previous) => !previous);
        announceToScreenReader(`Controls ${showControls ? 'hidden' : 'shown'}`);
      },
    },
    {
      swipeThreshold: 50,
      pinchThreshold: 0.1,
      doubleTapDelay: 300,
      longPressDelay: 800,
      preventDefault: false,
    }
  );

  // Notify parent when graph is ready
  useEffect(() => {
    const checkReference = () => {
      if (graphReference.current !== undefined && onGraphReady) {
        onGraphReady(graphReference.current as unknown);
      }
    };
    checkReference();
    const timeoutId = setTimeout(checkReference, GRAPH_READY_CHECK_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [onGraphReady]);

  // Pause/resume simulation based on settings
  useEffect(() => {
    if (graphReference.current !== undefined) {
      if (enableSimulation && renderSettings.animationEnabled) {
        graphReference.current.resumeAnimation();
      } else {
        graphReference.current.pauseAnimation();
      }
    }
  }, [enableSimulation, renderSettings.animationEnabled]);

  // Transform data for force graph
  const graphData = useMemo(() => {
    const forceNodes = nodes.map((node) => ({
      id: node.id,
      entityType: node.entityType,
      label: node.label,
      entityId: node.entityId,
      x: node.x,
      y: node.y,
      originalNode: node,
    }));

    const forceLinks = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      originalEdge: edge,
    }));

    return { nodes: forceNodes, links: forceLinks };
  }, [nodes, edges]);

  // Mobile control handlers
  const handleMobileZoomIn = useCallback(() => {
    if (!hasZoomMethod(graphReference.current)) {
    	return;
    }

    const currentZoom = graphReference.current.zoom();
    const newZoom = Math.min(ZOOM_MAX, currentZoom + ZOOM_STEP);
    graphReference.current.zoom(newZoom, ZOOM_ANIMATION_DURATION);
    setZoomLevel(newZoom);
    announceToScreenReader(`Zoom in to ${Math.round(newZoom * 100)}%`);
  }, []);

  const handleMobileZoomOut = useCallback(() => {
    if (!hasZoomMethod(graphReference.current)) {
    	return;
    }

    const currentZoom = graphReference.current.zoom();
    const newZoom = Math.max(ZOOM_MIN, currentZoom - ZOOM_STEP);
    graphReference.current.zoom(newZoom, ZOOM_ANIMATION_DURATION);
    setZoomLevel(newZoom);
    announceToScreenReader(`Zoom out to ${Math.round(newZoom * 100)}%`);
  }, []);

  const handleMobileZoomToFit = useCallback(() => {
    if (graphReference.current === undefined) {
    	return;
    }

    graphReference.current.zoomToFit(ZOOM_TO_FIT_DURATION);
    setZoomLevel(1);
  }, []);

  const handleMobileRotate = useCallback(() => {
    // Rotation placeholder - can be implemented with graph transformation
  }, []);

  if (!visible) {
    return null;
  }

  if (nodes.length > renderSettings.maxNodes) {
    return (
      <GraphTooLargeWarning
        width={width}
        height={height}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        maxNodes={renderSettings.maxNodes}
      />
    );
  }

  return (
    <Box
      ref={containerReference}
      pos="relative"
      style={{
        width: width ?? '100%',
        height,
        border: '1px solid var(--mantine-color-gray-3)',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'var(--mantine-color-body)',
      }}
      role="application"
      aria-label={`Interactive graph with ${nodes.length} nodes and ${edges.length} edges. ${renderSettings.animationEnabled ? 'Animation enabled' : 'Animation disabled for performance'}.`}
      {...(isMobile ? touchHandlers.handlers : {})}
    >
      <LoadingOverlay visible={false} />

      <ForceGraph2D
        ref={graphReference}
        width={width}
        height={height}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeClick={handleNodeClick}
        onNodeRightClick={handleNodeRightClick}
        onNodeHover={handleNodeHover}
        onBackgroundClick={handleBackgroundClick}
        enableNodeDrag={true}
        enableZoomInteraction={!isMobile}
        enablePanInteraction={!isMobile}
        cooldownTime={renderSettings.simulationCooldown}
        d3AlphaDecay={renderSettings.animationEnabled ? 0.0228 : 0.1}
        d3VelocityDecay={renderSettings.animationEnabled ? 0.4 : 0.8}
      />

      <DeviceIndicator
        isMobile={isMobile}
        performanceProfile={currentPerformanceProfile}
        zoomLevel={zoomLevel}
      />

      {isMobile && showControls && (
        <MobileGraphControls
          onZoomIn={handleMobileZoomIn}
          onZoomOut={handleMobileZoomOut}
          onZoomToFit={handleMobileZoomToFit}
          onRotate={handleMobileRotate}
        />
      )}

      {showPerformanceOverlay && (
        <PerformanceOverlay
          metrics={performanceMetrics}
          renderSettings={renderSettings}
        />
      )}

      <GraphInstructionsPanel isMobile={isMobile} />
    </Box>
  );
};
