import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../../components/Navbar";
import api from "../../api/axios";
import { RootState } from "../../store/store";
import { ActivityPoint, InsightsData } from "../../types";

export default function ProfilePage() {
  const user = useSelector((s: RootState) => s.user);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    api
      .get("/insights")
      .then((res) => active && (setData(res.data), setLoading(false)))
      .catch(() => active && (setError(true), setLoading(false)));
    return () => {
      active = false;
    };
  }, []);

  const total = data ? data.summary.view + data.summary.search + data.summary.bookmark : 0;

  return (
    <section className="w-full min-h-screen bg-dark-blue lg:flex gap-6 font-outfit">
      <Navbar />
      <main className="w-full lg:h-screen lg:overflow-y-auto px-4 sm:px-6 lg:px-10 py-8">
        <header className="mb-8">
          <h1 className="text-white text-2xl md:text-3xl font-medium">{user.fullName || "Your profile"}</h1>
          <p className="text-greyish-blue text-sm mt-1">{user.email}</p>
        </header>

        <h2 className="text-white text-xl md:text-2xl mb-5">Your insights</h2>

        {loading && <InsightsSkeleton />}
        {!loading && error && (
          <p className="text-greyish-blue">Couldn't load your insights right now.</p>
        )}
        {!loading && !error && data && total === 0 && (
          <div className="text-greyish-blue">
            No activity yet.{" "}
            <Link to="/" className="text-red underline">
              Browse some titles
            </Link>{" "}
            and your insights will appear here.
          </div>
        )}
        {!loading && !error && data && total > 0 && <Dashboard data={data} />}
      </main>
    </section>
  );
}

function Dashboard({ data }: { data: InsightsData }) {
  return (
    <div className="space-y-10 max-w-4xl">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Titles viewed" value={data.summary.view} accent="text-red" />
        <StatCard label="Searches" value={data.summary.search} accent="text-greyish-blue" />
        <StatCard label="Bookmarks" value={data.summary.bookmark} accent="text-white" />
      </div>

      {/* Activity over time */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg">Activity · last 14 days</h3>
          <Legend />
        </div>
        <ActivityChart points={data.activity} />
      </section>

      {/* Top genres */}
      <section>
        <h3 className="text-white text-lg mb-4">Top genres</h3>
        {data.topGenres.length === 0 ? (
          <p className="text-greyish-blue text-sm">View a few titles to see your favourite genres.</p>
        ) : (
          <TopGenres data={data.topGenres} />
        )}
      </section>

      {/* Recently viewed */}
      {data.recentTitles.length > 0 && (
        <section>
          <h3 className="text-white text-lg mb-4">Recently viewed</h3>
          <ul className="flex flex-wrap gap-2">
            {data.recentTitles.map((t) => (
              <li key={`${t.mediaType}-${t.titleId}`}>
                <Link
                  to={`/title/${t.mediaType}/${t.titleId}`}
                  className="inline-block text-sm bg-semi-dark-blue text-white/90 rounded-full px-4 py-2 hover:bg-greyish-blue/30"
                >
                  {t.title || "Untitled"}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-semi-dark-blue rounded-xl p-4 md:p-6">
      <p className={`text-3xl md:text-4xl font-medium ${accent}`}>{value}</p>
      <p className="text-greyish-blue text-xs md:text-sm mt-1">{label}</p>
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Views", className: "bg-red" },
    { label: "Searches", className: "bg-greyish-blue" },
    { label: "Bookmarks", className: "bg-white" },
  ];
  return (
    <div className="flex items-center gap-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-greyish-blue text-[11px]">
          <span className={`w-2.5 h-2.5 rounded-sm ${i.className}`} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function ActivityChart({ points }: { points: ActivityPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.total));
  const pct = (n: number) => `${(n / max) * 100}%`;

  return (
    <div className="bg-semi-dark-blue rounded-xl p-4 md:p-6">
      <div className="flex items-end justify-between gap-1 h-40">
        {points.map((p) => (
          <div
            key={p.date}
            className="flex-1 h-full flex flex-col justify-end"
            title={`${p.date} — ${p.view} views, ${p.search} searches, ${p.bookmark} bookmarks`}
          >
            <div className="w-full flex flex-col-reverse rounded-t overflow-hidden">
              <div className="w-full bg-red" style={{ height: pct(p.view) }} />
              <div className="w-full bg-greyish-blue" style={{ height: pct(p.search) }} />
              <div className="w-full bg-white" style={{ height: pct(p.bookmark) }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-1 mt-2">
        {points.map((p) => (
          <span key={p.date} className="flex-1 text-center text-greyish-blue text-[9px]">
            {p.date.slice(8)}
          </span>
        ))}
      </div>
    </div>
  );
}

function TopGenres({ data }: { data: { genre: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((g) => g.count));
  return (
    <div className="space-y-3">
      {data.map((g) => (
        <div key={g.genre} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-greyish-blue text-sm truncate">{g.genre}</span>
          <div className="flex-1 bg-semi-dark-blue rounded-full h-3 overflow-hidden">
            <div className="h-full bg-red rounded-full" style={{ width: `${(g.count / max) * 100}%` }} />
          </div>
          <span className="w-6 text-right text-white text-sm">{g.count}</span>
        </div>
      ))}
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="animate-pulse space-y-10 max-w-4xl">
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-semi-dark-blue rounded-xl" />
        ))}
      </div>
      <div className="h-52 bg-semi-dark-blue rounded-xl" />
      <div className="h-40 bg-semi-dark-blue rounded-xl" />
    </div>
  );
}
