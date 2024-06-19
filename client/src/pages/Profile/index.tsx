import Navbar from "../../components/Navbar";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

export default function ProfilePage(){

    const user = useSelector((state: RootState) => state.user);

    return (
        <section className="w-full h-screen bg-dark-blue lg:flex gap-6">
          <Navbar />
          <div>
            <p>Full Name: {user.fullName}</p>
            <p>Email: {user.email}</p>
          </div>

        </section>
      );
}