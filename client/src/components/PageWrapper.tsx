import ContentWrapper from "./ContentWrapper";
import InputWrapper from "./InputWrapper";

export default function PageWrapper(){
    return(
        <div className="flex flex-col lg:pt-8 overflow-y-scroll ">
            <InputWrapper />
            <ContentWrapper />
        </div>
    )
}