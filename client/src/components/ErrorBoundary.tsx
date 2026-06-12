import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

// Catches render-time errors anywhere in the tree so a crash shows a visible,
// logged fallback instead of an unexplained blank white page.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-full min-h-screen bg-dark-blue flex flex-col items-center justify-center gap-4 font-outfit px-6 text-center">
          <h1 className="text-white text-2xl">Something went wrong</h1>
          <p className="text-greyish-blue max-w-md">
            The page hit an unexpected error. Try reloading — if it persists, the
            details are in the browser console.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red text-white rounded-full px-6 py-2 hover:opacity-90"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
