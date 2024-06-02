import { Link, useNavigate } from "react-router-dom";
import { logo } from "../../assets";
import { useState } from "react";
import axios from "axios";

export default function LoginPage(){

    const [ email, setEmail ] = useState("");
    const [ password, setPassword ] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });

            if (response.status === 200) {
                const { token } = response.data;
                localStorage.setItem('token', token); 
                navigate("/"); 
            } else {
                console.error("Login failed: ", response.data.message);
            }
        } catch (error) {
            console.error("Error during login: ", error);
        }
    };

    return(
        <section className="w-full h-screen bg-vulcan pt-12 px-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-center ">
              <img src={logo} alt="logo" />
            </div>
            <div className="w-full bg-mirage text-white font-outfit p-6 rounded-[10px] max-h-[520px] max-w-[400px] m-auto">
                <h2 className="text-[32px] pb-[40px]">Login</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <input name="email" id="email" type="text" placeholder="Email address" required className="input" onChange={(e) => {setEmail(e.target.value)}}/>
                    </div>
                    <div>
                        <input name="password" id="password" type="password" placeholder="Password" required className="input" onChange={(e) => {setPassword(e.target.value)}}/>
                    </div>
                    <button type="submit" className="bg-orange h-12 rounded-md text-[15px]">Login to your account</button>
                </form>
                <p className="pt-6 w-full text-[15px] text-center"> 
                    Don't have account? 
                    <Link to="/signup" className="text-orange pl-2">Signup</Link>
                </p>
            </div>
        </section>
    )
}