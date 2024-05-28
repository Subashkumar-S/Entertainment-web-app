import {CardWrapper} from "./CardWrapper";
import {TrendingWrapper} from "./TrendingWrapper";
import { useLocation } from "react-router-dom";

export default function ContentWrapper(){
    const location = useLocation();
    console.log("the location is" + JSON.stringify(location))

    return (
        <>
            {location.pathname === "/" && (<TrendingWrapper />)}
            <CardWrapper />
        </>
    )
}