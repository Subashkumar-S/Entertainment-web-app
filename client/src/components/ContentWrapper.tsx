import {CardWrapper} from "./CardWrapper";
import {TrendingWrapper} from "./TrendingWrapper";
import { useLocation } from "react-router-dom";

export default function ContentWrapper(){
    const location = useLocation();

    return (
        <>
            {location.pathname === "/" && (<TrendingWrapper />)}
            <CardWrapper />
        </>
    )
}