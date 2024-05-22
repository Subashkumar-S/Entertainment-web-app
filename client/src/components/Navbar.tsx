import { avatar, logo, navHome, navMovies, navTVSeries, navBookmark } from "../assets";

export default function Navbar() {
  return (
    <div className="w-full h-14 sm:h-[120px] sm:p-6 lg:w-fit lg:h-screen ">
      <div className="w-full lg:w-24 h-full bg-mirage flex lg:flex-col items-center justify-between px-4 lg:pt-7 lg:pb-8 sm:rounded-[10px] lg:rounded-[20px]">
        <img src={logo} alt="logo" className="h-6 w-6 sm:h-8 sm:w-8" />
        <ul className="flex lg:flex-col items-center gap-6 lg:pt-16 lg:flex-1 list-none">
          <li><button><img src={navHome} alt="home" className="h-4 w-4 sm:h-5 sm:w-5 " /></button></li>
          <li><button><img src={navMovies} alt="movies" className="h-4 w-4 sm:h-5 sm:w-5 hover:fill-white"  /></button></li>
          <li><button><img src={navTVSeries} alt="tv-series" className="h-4 w-4 sm:h-5 sm:w-5 hover:fill-white"  /></button></li>
          <li><button><img src={navBookmark} alt="bookmark" className="h-4 w-4 sm:h-5 sm:w-5  hover:fill-white"  /></button></li>
        </ul>
        <img src={avatar} alt="avatar" className="h-6 w-6 sm:h-8 sm:w-8 lg:w-10 lg:h-10" />
      </div>
      
    </div>
  );
}
