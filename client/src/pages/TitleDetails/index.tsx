import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaPlay, FaChevronLeft } from "react-icons/fa";
import Navbar from "../../components/Navbar";
import { Card } from "../../components/Card";
import LibraryActions from "../../components/LibraryActions";
import { useTrailer } from "../../components/TrailerModal";
import api from "../../api/axios";
import { RootState } from "../../store/store";
import { recordRecentlyViewed } from "../../utils/recentlyViewed";
import { trackEvent } from "../../utils/track";
import { SeasonSummary, TitleDetailsData } from "../../types";

const formatRuntime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

export default function TitleDetailsPage() {
  const { mediaType, id } = useParams<{ mediaType: string; id: string }>();
  const navigate = useNavigate();
  const favorites = useSelector((s: RootState) => s.user.favorites);

  const [data, setData] = useState<TitleDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    window.scrollTo(0, 0);
    api
      .get(`/tmdb/title/${mediaType}/${id}`)
      .then((res) => {
        if (active) {
          const t: TitleDetailsData = res.data;
          setData(t);
          setLoading(false);
          recordRecentlyViewed({
            id: t.id,
            mediaType: t.mediaType,
            title: t.title,
            year: t.year,
            rating: t.rating,
            posterPath: t.posterPath,
            backdropPath: t.backdropPath,
          });
          trackEvent({
            type: "view",
            mediaType: t.mediaType,
            titleId: t.id,
            title: t.title,
            genres: t.genres,
          });
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [mediaType, id]);

  return (
    <section className="w-full min-h-screen bg-dark-blue lg:flex gap-6 font-outfit">
      <Navbar />
      <main className="w-full lg:h-screen lg:overflow-y-auto">
        {loading && <DetailsSkeleton />}
        {!loading && error && <DetailsError onBack={() => navigate(-1)} />}
        {!loading && !error && data && (
          <Details data={data} onBack={() => navigate(-1)} favorites={favorites} />
        )}
      </main>
    </section>
  );
}

function Details({
  data,
  onBack,
  favorites,
}: {
  data: TitleDetailsData;
  onBack: () => void;
  favorites: string[];
}) {
  const { play } = useTrailer();

  const meta: string[] = [
    data.year,
    data.mediaType === "tv" ? "TV Series" : "Movie",
    data.mediaType === "tv"
      ? data.seasons
        ? `${data.seasons} Season${data.seasons > 1 ? "s" : ""}`
        : ""
      : data.runtime
      ? formatRuntime(data.runtime)
      : "",
    data.certification,
    data.rating ? `★ ${data.rating.toFixed(1)}` : "",
  ].filter(Boolean) as string[];

  return (
    <div>
      {/* Hero backdrop */}
      <div className="relative h-[36vh] md:h-[46vh] lg:h-[52vh] w-full">
        {data.backdropPath ? (
          <img
            src={data.backdropPath}
            alt={data.title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full bg-semi-dark-blue" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-blue via-dark-blue/40 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 text-white bg-black/40 hover:bg-black/60 rounded-full px-3 py-2"
        >
          <FaChevronLeft className="w-3 h-3" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-6 lg:px-10 -mt-20 md:-mt-28 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <div className="shrink-0">
            {data.posterPath ? (
              <img
                src={data.posterPath}
                alt={data.title}
                decoding="async"
                className="w-28 md:w-44 lg:w-52 rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-28 md:w-44 lg:w-52 aspect-[2/3] rounded-lg bg-semi-dark-blue" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-white">
            <h1 className="text-2xl md:text-4xl font-bold">{data.title}</h1>
            {data.tagline && (
              <p className="text-greyish-blue italic mt-1">{data.tagline}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm text-greyish-blue">
              {meta.map((m, i) => (
                <span key={i} className="flex items-center gap-3">
                  {i > 0 && <span>•</span>}
                  {m}
                </span>
              ))}
            </div>

            {data.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {data.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs bg-semi-dark-blue rounded-full px-3 py-1 text-white/90"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {data.trailerKey && (
              <div className="mt-5">
                <button
                  onClick={() => play(data.mediaType, data.id, data.title)}
                  className="flex items-center gap-2 bg-red rounded-full px-5 py-2 text-white hover:opacity-90"
                >
                  <FaPlay className="w-3 h-3" />
                  Watch Trailer
                </button>
              </div>
            )}

            <div className="mt-4">
              <LibraryActions id={data.id} mediaType={data.mediaType} />
            </div>

            {data.overview && (
              <p className="mt-6 text-sm md:text-base leading-relaxed max-w-3xl text-white/90">
                {data.overview}
              </p>
            )}
          </div>
        </div>

        {/* Cast */}
        {data.cast.length > 0 && (
          <section className="mt-10">
            <h2 className="text-white text-xl md:text-2xl mb-4">Top Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {data.cast.map((c) => (
                <div key={c.id} className="shrink-0 w-24 text-center">
                  {c.profilePath ? (
                    <img
                      src={c.profilePath}
                      alt={c.name}
                      loading="lazy"
                      decoding="async"
                      className="w-24 h-24 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-semi-dark-blue mx-auto" />
                  )}
                  <p className="text-white text-xs mt-2 font-medium truncate">{c.name}</p>
                  <p className="text-greyish-blue text-[11px] truncate">{c.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Seasons & episodes (TV only) */}
        {data.mediaType === "tv" && data.seasonList.length > 0 && (
          <SeasonsSection tvId={data.id} seasons={data.seasonList} />
        )}

        {/* Where to watch */}
        <WhereToWatch providers={data.providers} />

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <section className="mt-10">
            <h2 className="text-white text-xl md:text-2xl mb-4">More like this</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
              {data.recommendations.map((r) => (
                <Card
                  key={`${r.mediaType}-${r.id}`}
                  id={r.id}
                  mediaType={r.mediaType}
                  title={r.title}
                  year={r.year}
                  category={r.mediaType === "tv" ? "TV Series" : "Movie"}
                  thumbnail={r.backdropPath || r.posterPath || ""}
                  rating={r.rating ? r.rating.toFixed(1) : ""}
                  bookmark={favorites.includes(r.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

interface TmdbEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime: number | null;
  air_date: string;
}

function SeasonsSection({ tvId, seasons }: { tvId: string; seasons: SeasonSummary[] }) {
  const [selected, setSelected] = useState(seasons[0]?.seasonNumber ?? 1);
  const [episodes, setEpisodes] = useState<TmdbEpisode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/tmdb/tv/${tvId}/season/${selected}`)
      .then((res) => {
        if (active) setEpisodes(res.data?.episodes ?? []);
      })
      .catch(() => {
        if (active) setEpisodes([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tvId, selected]);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-white text-xl md:text-2xl">Episodes</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="bg-semi-dark-blue text-white rounded-md px-3 py-2 outline-none"
          aria-label="Select season"
        >
          {seasons.map((s) => (
            <option key={s.seasonNumber} value={s.seasonNumber}>
              {s.name} ({s.episodeCount})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-greyish-blue">Loading episodes…</p>
      ) : episodes.length === 0 ? (
        <p className="text-greyish-blue">No episodes found.</p>
      ) : (
        <div className="space-y-3">
          {episodes.map((ep) => (
            <div key={ep.id} className="flex gap-4 bg-semi-dark-blue rounded-lg p-3">
              {ep.still_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                  alt={ep.name}
                  loading="lazy"
                  decoding="async"
                  className="w-32 h-20 object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-32 h-20 rounded bg-dark-blue shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-medium">
                  {ep.episode_number}. {ep.name}
                </p>
                <p className="text-greyish-blue text-xs line-clamp-2 mt-1">{ep.overview}</p>
                <p className="text-greyish-blue text-[11px] mt-1">
                  {ep.air_date}
                  {ep.runtime ? ` • ${ep.runtime}m` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function WhereToWatch({ providers }: { providers: TitleDetailsData["providers"] }) {
  const groups = [
    { label: "Stream", items: providers.flatrate },
    { label: "Rent", items: providers.rent },
    { label: "Buy", items: providers.buy },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-white text-xl md:text-2xl mb-4">Where to watch</h2>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.label} className="flex items-center gap-4">
            <span className="text-greyish-blue text-sm w-16 shrink-0">{g.label}</span>
            <div className="flex flex-wrap gap-3">
              {g.items.map((p) => {
                const logo = p.logoPath ? (
                  <img
                    src={p.logoPath}
                    alt={p.name}
                    title={p.name}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-lg"
                  />
                ) : (
                  <span className="text-white text-xs">{p.name}</span>
                );
                return providers.link ? (
                  <a
                    key={p.name}
                    href={providers.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${p.name} — via JustWatch`}
                    className="hover:opacity-80"
                  >
                    {logo}
                  </a>
                ) : (
                  <span key={p.name}>{logo}</span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {providers.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs text-greyish-blue underline"
        >
          Powered by JustWatch
        </a>
      )}
    </section>
  );
}

function DetailsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[36vh] md:h-[46vh] lg:h-[52vh] w-full bg-semi-dark-blue" />
      <div className="px-4 sm:px-6 lg:px-10 -mt-20 md:-mt-28 relative z-10">
        <div className="flex gap-6">
          <div className="w-28 md:w-44 lg:w-52 aspect-[2/3] rounded-lg bg-semi-dark-blue" />
          <div className="flex-1 space-y-4 pt-24">
            <div className="h-8 w-2/3 bg-semi-dark-blue rounded" />
            <div className="h-4 w-1/3 bg-semi-dark-blue rounded" />
            <div className="h-20 w-full bg-semi-dark-blue rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailsError({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6 font-outfit">
      <p className="text-white text-xl mb-2">Couldn't load this title</p>
      <p className="text-greyish-blue mb-6">
        It may be unavailable or the request failed.
      </p>
      <button onClick={onBack} className="bg-red text-white rounded-full px-6 py-2">
        Go back
      </button>
    </div>
  );
}
