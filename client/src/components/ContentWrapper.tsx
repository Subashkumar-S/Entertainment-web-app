import {CardWrapper} from "./CardWrapper";
import {TrendingWrapper} from "./TrendingWrapper";
import RecentlyViewed from "./RecentlyViewed";
import { useLocation } from "react-router-dom";

export default function ContentWrapper(){
    const location = useLocation();
    const isHomePage = location.pathname === "/";

    return (
        <>
            {isHomePage && (<TrendingWrapper />)}
            {isHomePage && (<RecentlyViewed />)}
            <CardWrapper />
        </>
    )
}