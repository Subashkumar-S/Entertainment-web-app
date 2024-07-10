import { useState } from "react";
import logo  from "/logo.svg";
import { FaHome, FaBookmark } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { RiTvFill } from "react-icons/ri";
import { MdLocalMovies } from "react-icons/md";
import { FaCircleUser } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import axios from "axios";

export default function Navbar() {
  const location = useLocation();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const navigate = useNavigate();

  const user = useSelector((state: RootState) => state.user);

  const handleMouseEnter = () => {
    setShowContextMenu(true);
  };

  const handleMouseLeave = () => {
    setShowContextMenu(false);
  };

  const handleClick = async () => {
    const axiosInstance = axios.create({
      baseURL: "http://localhost:5000/api",
      withCredentials: true,
    });

    try {
      const response = await axiosInstance.post("/auth/logout");
      console.log(response.data.message);
      navigate("/login");
    } catch (error : any) {
      console.error(
        "Error logging out:",
        error.response ? error.response.data : error.message
      );
    }
  };

  return (
    <div className="relative w-full h-14 sm:h-[120px] sm:p-6 lg:w-fit lg:h-screen">
      <div className="w-full lg:w-24 h-full bg-semi-dark-blue flex lg:flex-col items-center justify-between px-4 lg:pt-7 lg:pb-8 sm:rounded-[10px] lg:rounded-[20px]">
        <img src={logo} alt="logo" className="h-6 w-6 sm:h-8 sm:w-8" />
        <ul className="flex lg:flex-col items-center gap-6 lg:pt-16 lg:flex-1 list-none">
          <li>
            <Link
              to="/"
              className={
                location.pathname === "/"
                  ? "text-white opacity-100"
                  : "text-white opacity-50 hover:opacity-100"
              }
            >
              <FaHome className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </li>
          <li>
            <Link
              to="/movies"
              className={
                location.pathname === "/movies"
                  ? "text-white opacity-100"
                  : "text-white opacity-50 hover:opacity-100"
              }
            >
              <MdLocalMovies className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </li>
          <li>
            <Link
              to="/tv-series"
              className={
                location.pathname === "/tv-series"
                  ? "text-white opacity-100"
                  : "text-white opacity-50 hover:opacity-100"
              }
            >
              <RiTvFill className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </li>
          <li>
            <Link
              to="/bookmark"
              className={
                location.pathname === "/bookmark"
                  ? "text-white opacity-100"
                  : "text-white opacity-50 hover:opacity-100"
              }
            >
              <FaBookmark className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </li>
        </ul>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative"
        >
          <FaCircleUser className="h-6 w-6 sm:h-8 sm:w-8 lg:w-10 lg:h-10 text-white opacity-50 hover:opacity-100 hover:cursor-pointer" />
          {showContextMenu && (
            <div className="absolute left-10 top-full -mt-28 w-48 bg-semi-dark-blue text-white p-4 rounded shadow-lg z-10">
              <p className="font-semibold">{user.fullName}</p>
              <p className="text-sm">{user.email}</p>
              <button
                className="mt-4 py-2 w-full bg-red-600 rounded hover:bg-red-700"
                onClick={handleClick}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
