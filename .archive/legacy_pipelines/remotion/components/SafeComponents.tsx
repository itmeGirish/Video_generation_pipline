/**
 * SafeComponents — SceneErrorBoundary for catching crashes in scene rendering.
 */

import React from "react";

// ============================================
// SCENE ERROR BOUNDARY
// Catches any crash in a scene and shows fallback
// ============================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode; sceneName?: string },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#1a0000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#FF4757",
          fontFamily: "monospace",
          fontSize: 24,
          padding: 40,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
          <div>Scene Error: {this.props.sceneName || "Unknown"}</div>
          <div style={{ fontSize: 14, color: "#888", marginTop: 10 }}>
            {this.state.error?.message?.slice(0, 100)}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default SceneErrorBoundary;
