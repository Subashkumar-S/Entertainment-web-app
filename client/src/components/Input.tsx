import { FaSearch } from "react-icons/fa";

export default function Input(){
    return(
        <div className="flex items-center gap-4">
            <FaSearch className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-50" />
            <input type="text" placeholder="Search for movies or TV series" className="w-full outline-none border-none bg-transparent hover:cursor-pointer text-white" />
        </div>
    )
}