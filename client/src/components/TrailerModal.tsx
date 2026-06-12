import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { FaTimes } from "react-icons/fa";
import api from "../api/axios";
import { MediaType } from "../types";

interface TrailerContextValue {
  // Opens the modal and fetches the title's trailer key on demand.
  play: (mediaType: MediaType, id: string, title?: string) => void;
}

const TrailerContext = createContext<TrailerContextValue | null>(null);

export const useTrailer = (): TrailerContextValue => {
  const ctx = useContext(TrailerContext);
  if (!ctx) throw new Error("useTrailer must be used within a TrailerProvider");
  return ctx;
};

type State =
  | { status: "closed" }
  | { status: "loading"; title?: string }
  | { status: "ready"; key: string; title?: string }
  | { status: "empty"; title?: string };

export function TrailerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: "closed" });
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const play = useCallback(async (mediaType: MediaType, id: string, title?: string) => {
    setState({ status: "loading", title });
    try {
      const { data } = await api.get(`/tmdb/title/${mediaType}/${id}/videos`);
      setState(
        data?.trailerKey
          ? { status: "ready", key: data.trailerKey, title }
          : { status: "empty", title }
      );
    } catch {
      setState({ status: "empty", title });
    }
  }, []);

  const close = useCallback(() => setState({ status: "closed" }), []);
  const isOpen = state.status !== "closed";

  // Esc to close, lock background scroll, trap focus, and restore it on close.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      // Keep Tab focus within the dialog.
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, a[href], iframe, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus();
    };
  }, [isOpen, close]);

  return (
    <TrailerContext.Provider value={{ play }}>
      {children}
      {isOpen && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 font-outfit"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={state.title ? `${state.title} trailer` : "Trailer"}
        >
          <button
            ref={closeBtnRef}
            onClick={close}
            aria-label="Close trailer"
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-3"
          >
            <FaTimes className="w-4 h-4" />
          </button>

          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {state.status === "loading" && (
              <div className="aspect-video w-full bg-semi-dark-blue rounded-lg flex items-center justify-center text-white">
                Loading trailer…
              </div>
            )}
            {state.status === "ready" && (
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full rounded-lg"
                  src={`https://www.youtube.com/embed/${state.key}?autoplay=1&rel=0`}
                  title={state.title ? `${state.title} trailer` : "Trailer"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {state.status === "empty" && (
              <div className="aspect-video w-full bg-semi-dark-blue rounded-lg flex flex-col items-center justify-center text-white gap-3">
                <p className="text-lg">No trailer available</p>
                <button onClick={close} className="bg-red rounded-full px-5 py-2 text-sm">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </TrailerContext.Provider>
  );
}
