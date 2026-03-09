"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallbackCard } from "@/components/error-fallback-card";

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
}

interface ErrorBoundaryInnerProps extends ErrorBoundaryProps {
  renderFallback: (options: { error?: Error; reset: () => void }) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryInner extends Component<
  ErrorBoundaryInnerProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error boundary caught a render error", error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryInnerProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.handleReset();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.renderFallback({
        error: this.state.error,
        reset: this.handleReset,
      });
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children, resetKey }: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryInner
      resetKey={resetKey}
      renderFallback={({ error, reset }) => (
        <ErrorFallbackCard
          error={error}
          onReload={() => window.location.reload()}
          onRetry={reset}
        />
      )}
    >
      {children}
    </ErrorBoundaryInner>
  );
}
