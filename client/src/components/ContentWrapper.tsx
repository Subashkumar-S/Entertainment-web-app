import {RecommendedWrapper} from "./RecommendedWrapper";
import {TrendingWrapper} from "./TrendingWrapper";

export default function ContentWrapper(){
    return (
        <>
            <TrendingWrapper />
            <RecommendedWrapper />
        </>
    )
}