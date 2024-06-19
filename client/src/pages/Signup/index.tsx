import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { logo } from "../../assets";
import { setUser } from "../../store/userSlice";
import { useDispatch } from "react-redux";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/signup",
        { fullName, email, password }
      );

      if (response.status === 201) {
        const { user } = response.data;
        dispatch(setUser(user));
        navigate("/");
      }
    } catch (err: unknown) {
      if (!axios.isAxiosError(err) || !err.response || !err.response.data) {
        setError("An unexpected error occurred. Please try again later.");
        return;
      }
      setError(err.response.data.message);
    }
  };

  return (
    <section className="w-full h-screen bg-dark-blue pt-12 px-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-center">
        <img src={logo} alt="logo" />
      </div>
      <div className="w-full bg-semi-dark-blue text-white font-outfit p-6 rounded-[10px] max-h-[520px] max-w-[400px] m-auto">
        <h2 className="text-[32px] pb-[40px]">Signup</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex">
            <input
              name="fullname"
              id="fullname"
              type="text"
              placeholder="Full Name"
              required
              className="input"
              onChange={(e) => setFullName(e.target.value)}
            />
            {!fullName && (
              <p className="text-red text-sm -ml-28">Can't be empty</p>
            )}
          </div>
          <div className="flex">
            <input
              name="email"
              id="email"
              type="email"
              placeholder="Email address"
              required
              className="input"
              onChange={(e) => setEmail(e.target.value)}
            />
            {!email && (
              <p className="text-red text-sm -ml-28">Can't be empty</p>
            )}
          </div>
          <div className="flex">
            <input
              name="password"
              id="password"
              type="password"
              placeholder="Password"
              required
              className="input"
              onChange={(e) => setPassword(e.target.value)}
            />
            {!password && (
              <p className="text-red text-sm -ml-28">Can't be empty</p>
            )}
          </div>
          <div className="flex">
            <input
              name="repeatPassword"
              id="repeatPassword"
              type="password"
              placeholder="Repeat Password"
              required
              className="input"
              onChange={(e) => setRepeatPassword(e.target.value)}
            />
            {!repeatPassword && (
              <p className="text-red text-sm -ml-28">Can't be empty</p>
            )}
          </div>
          {error && <p className=" text-center text-red">{error}</p>}
          <button type="submit" className="bg-red h-12 rounded-md text-[15px]">
            Create an account
          </button>
        </form>
        <p className="pt-6 w-full text-[15px] text-center">
          Already have an account?
          <Link to="/login" className="text-red pl-2">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
