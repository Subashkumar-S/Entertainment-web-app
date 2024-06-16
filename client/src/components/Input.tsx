import { search } from "../assets";
export default function Input(){
    return(
        <div className="flex items-center gap-4">
            <img src={search} alt="search" className="w-6 h-6 sm:w-7 sm:h-7" />
            <input type="text" placeholder="Search for movies or TV series" className="w-full outline-none border-none bg-transparent hover:cursor-pointer text-white" />
        </div>
    )
}