import { logo } from "../assets";
import { FaHome, FaBookmark } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { RiTvFill } from "react-icons/ri";
import { MdLocalMovies } from "react-icons/md";
import { FaCircleUser } from "react-icons/fa6";

export default function Navbar() {
  const location = useLocation();
  
  return (
    <div className="w-full h-14 sm:h-[120px] sm:p-6 lg:w-fit lg:h-screen ">
      <div className="w-full lg:w-24 h-full bg-semi-dark-blue flex lg:flex-col items-center justify-between px-4 lg:pt-7 lg:pb-8 sm:rounded-[10px] lg:rounded-[20px]">
        <img src={logo} alt="logo" className="h-6 w-6 sm:h-8 sm:w-8" />
        <ul className="flex lg:flex-col items-center gap-6 lg:pt-16 lg:flex-1 list-none">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'text-red' : 'text-white opacity-50 hover:opacity-100'}>
              <FaHome className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </li>
          <li>
            <Link to="/movies" className={location.pathname === '/movies' ? 'text-red' : 'text-white opacity-50 hover:opacity-100'}>
              <MdLocalMovies className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </li>
          <li>
            <Link to="/tv-series" className={location.pathname === '/tv-series' ? 'text-red' : 'text-white opacity-50 hover:opacity-100'}>
              <RiTvFill className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </li>
          <li>
            <Link to="/bookmark" className={location.pathname === '/bookmark' ? 'text-red' : 'text-white opacity-50 hover:opacity-100'}>
              <FaBookmark className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </li>
        </ul>
        <Link to="/profile">
          <FaCircleUser className="h-6 w-6 sm:h-8 sm:w-8 lg:w-10 lg:h-10 text-white opacity-50 hover:opacity-100" />
        </Link>
      </div>
    </div>
  );
}
