import { useSelector } from "react-redux";
import { Card } from "./Card";
import { RootState } from "../store/store";
import { getRecentlyViewed } from "../utils/recentlyViewed";

// Horizontal "Recently viewed" row on Home, read from localStorage. Mounts only
// on Home, so it refreshes each time the user returns from a details page.
export default function RecentlyViewed() {
  const favorites = useSelector((s: RootState) => s.user.favorites);
  const items = getRecentlyViewed();

  if (items.length === 0) return null;

  return (
    <div className="font-outfit pb-2">
      <h4 className="text-2xl md:text-3xl text-white pb-6">Recently viewed</h4>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {items.map((item) => (
          <div key={`${item.mediaType}-${item.id}`} className="shrink-0">
            <Card
              id={item.id}
              mediaType={item.mediaType}
              title={item.title}
              year={item.year}
              category={item.mediaType === "tv" ? "TV Series" : "Movie"}
              thumbnail={item.backdropPath || item.posterPath || ""}
              rating={item.rating ? item.rating.toFixed(1) : ""}
              bookmark={favorites.includes(item.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
