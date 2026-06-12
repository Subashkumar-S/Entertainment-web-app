import api from "../api/axios";
import { MediaType } from "../types";

export type TrackEvent =
  | { type: "view"; mediaType: MediaType; titleId: string; title?: string; genres?: string[] }
  | { type: "bookmark"; mediaType: MediaType; titleId: string; title?: string }
  | { type: "search"; query: string };

// Fire-and-forget analytics. Never awaited and never throws into the UI —
// dropping an event is always preferable to interrupting the user.
export const trackEvent = (event: TrackEvent): void => {
  api.post("/events", event).catch(() => {
    /* analytics is best-effort */
  });
};
