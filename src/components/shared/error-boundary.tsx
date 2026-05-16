"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-[300px] flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-7 w-7 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
              <p className="text-sm text-slate-500 mt-2">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
              <Button
                onClick={() => this.setState({ hasError: false })}
                className="mt-5 rounded-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
