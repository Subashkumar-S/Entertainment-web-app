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

  // Esc to close, lock background scroll, and move focus into the dialog.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close]);

  return (
    <TrailerContext.Provider value={{ play }}>
      {children}
      {isOpen && (
        <div
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
