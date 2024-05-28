import ContentWrapper from "./ContentWrapper";
import InputWrapper from "./InputWrapper";

export default function PageWrapper(){
    return(
        <div className="w-full bg-vulcan flex flex-col  lg:pt-8 px-4 sm:px-6 overflow-y-scroll ">
            <InputWrapper />
            <ContentWrapper />
        </div>
    )
}