import { useEffect, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface SearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
}

export default function Input() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced multi-search; only movies/tv (person results have no details page).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/tmdb/search", { params: { query: q } });
        const items: SearchResult[] = (data?.results ?? [])
          .filter((r: SearchResult) => r.media_type === "movie" || r.media_type === "tv")
          .slice(0, 8);
        setResults(items);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goTo = (r: SearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    navigate(`/title/${r.media_type}/${r.id}`);
  };

  return (
    <div ref={containerRef} className="relative font-outfit">
      <div className="flex items-center gap-4">
        <FaSearch className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for movies or TV series"
          className="w-full outline-none border-none bg-transparent text-white placeholder:text-greyish-blue"
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute z-40 mt-3 w-full max-w-2xl bg-semi-dark-blue rounded-lg shadow-xl max-h-[60vh] overflow-y-auto">
          {loading && results.length === 0 && (
            <p className="px-4 py-3 text-greyish-blue text-sm">Searching…</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-greyish-blue text-sm">No results found.</p>
          )}
          {results.map((r) => {
            const title = r.title || r.name || "";
            const date = r.release_date || r.first_air_date || "";
            const year = date ? new Date(date).getFullYear().toString() : "";
            const poster = r.poster_path
              ? `https://image.tmdb.org/t/p/w92${r.poster_path}`
              : "";
            return (
              <button
                key={`${r.media_type}-${r.id}`}
                onClick={() => goTo(r)}
                className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-greyish-blue/20"
              >
                {poster ? (
                  <img
                    src={poster}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-14 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-14 rounded bg-dark-blue shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{title}</p>
                  <p className="text-greyish-blue text-xs">
                    {year && `${year} • `}
                    {r.media_type === "tv" ? "TV Series" : "Movie"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
