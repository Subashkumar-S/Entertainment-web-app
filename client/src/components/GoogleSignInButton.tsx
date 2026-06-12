import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import api from "../api/axios";

// Renders the "Continue with Google" button only when the backend reports that
// Google OAuth is configured (GET /auth/config). It's a full-page navigation,
// not an XHR, because the OAuth flow relies on browser redirects.
export default function GoogleSignInButton() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get("/auth/config")
      .then((r) => active && setEnabled(Boolean(r.data?.google)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!enabled) return null;

  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  return (
    <div className="font-outfit">
      <div className="flex items-center gap-3 my-4">
        <span className="flex-1 h-px bg-greyish-blue/40" />
        <span className="text-greyish-blue text-xs">or</span>
        <span className="flex-1 h-px bg-greyish-blue/40" />
      </div>
      <a
        href={`${base}/auth/google`}
        className="flex items-center justify-center gap-3 h-12 rounded-md bg-white text-semi-dark-blue text-[15px] hover:opacity-90"
      >
        <FcGoogle className="w-5 h-5" />
        Continue with Google
      </a>
    </div>
  );
}
