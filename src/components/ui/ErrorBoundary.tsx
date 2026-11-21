/**
 * Error Boundary component for catching React errors
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorBlock } from "./ErrorBlock";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to error reporting service
    console.error("Error caught by boundary:", error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full">
            <ErrorBlock
              title="Something went wrong"
              message={
                import.meta.env.PROD
                  ? "An unexpected error occurred. Please try refreshing the page."
                  : this.state.error?.message ||
                    "An unexpected error occurred. Please try refreshing the page."
              }
              onRetry={() => this.setState({ hasError: false, error: undefined })}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

