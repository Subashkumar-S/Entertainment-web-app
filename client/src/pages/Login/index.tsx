import { Link, useNavigate } from "react-router-dom";
import { logo } from "../../assets";
import { useState } from "react";
import axios from "axios";
import { setUser } from "../../store/userSlice";
import { useDispatch } from "react-redux";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [serverError, setServerError] = useState("");
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setServerError("");

        try {
            const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });

            if (response.status === 200) {
                dispatch(setUser(response.data.user));
                navigate("/");
            } 

        } catch (error ) {
            if(!error.response || !error.response.data){
                setServerError("An unexpected error occurred. Please try again later.");
                return;
            }
            setServerError(error.response.data.message);
        }
    };

    return (
        <section className="w-full h-screen bg-dark-blue pt-12 px-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-center ">
                <img src={logo} alt="logo" />
            </div>
            <div className="w-full bg-semi-dark-blue text-white font-outfit p-6 rounded-[10px] max-h-[520px] max-w-[400px] m-auto">
                <h2 className="text-[32px] pb-[40px]">Login</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex">
                        <input
                            name="email"
                            id="email"
                            type="text"
                            placeholder="Email address"
                            required
                            className={`input`}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {!email && <p className="text-red text-sm -ml-28">Can't be empty</p>}
                    </div>
                    <div className="flex">
                        <input
                            name="password"
                            id="password"
                            type="password"
                            placeholder="Password"
                            required
                            className={`input`}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {!password && <p className="text-red text-sm -ml-28">Can't be empty</p>}
                    </div>
                    <button type="submit" className="bg-red h-12 rounded-md text-[15px] hover:bg-white hover:text-semi-dark-blue">
                        Login to your account
                    </button>
                </form>
                {serverError && <p className="text-red text-center pt-4">{serverError}</p>}
                <p className="pt-6 w-full text-[15px] text-center">
                    Don't have an account?
                    <Link to="/signup" className="text-red pl-2">Signup</Link>
                </p>
            </div>
        </section>
    );
}
