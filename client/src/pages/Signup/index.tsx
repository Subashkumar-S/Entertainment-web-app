import { Link } from "react-router-dom";
import { logo } from "../../assets";

export default function LoginPage(){
    return(
        <section className="w-full h-screen bg-vulcan pt-12 px-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-center ">
              <img src={logo} alt="logo" />
            </div>
            <div className="w-full bg-mirage text-white font-outfit p-6 rounded-[10px] max-h-[520px] max-w-[400px] m-auto">
                <h2 className="text-[32px] pb-[40px]">Signup</h2>
                <form action="submit" className="flex flex-col gap-6">
                    <div>
                        <input name="email" id="email" type="text" placeholder="Email address" required className="input"/>
                    </div>
                    <div>
                        <input name="password" id="password" type="password" placeholder="Password" required className="input"/>
                    </div>
                    <div>
                        <input name="password" id="password" type="password" placeholder="Repeat Password" required className="input"/>
                    </div>
                    <button type="submit" className="bg-orange h-12 rounded-md text-[15px]">Create an account</button>
                </form>
                <p className="pt-6 w-full text-[15px] text-center"> 
                    Already have an account? 
                    <Link to="/login" className="text-orange pl-2">Login</Link>
                </p>
            </div>
        </section>
    )
}