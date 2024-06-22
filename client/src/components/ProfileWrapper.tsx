import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { Link } from "react-router-dom";

export default function ProfileWrapper() {

    const user = useSelector((state: RootState) => state.user);
    console.log(user);

  return (
    <>
      <div>
        <p>Full Name: {user.fullName}</p>
        <p>Email: {user.email}</p>
        <p>Watched movies: {user.watchedMovies}</p>
      </div>
      <Link to="/login">Login</Link>
    </>
  );
}
