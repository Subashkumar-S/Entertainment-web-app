import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";

export default function HomePage() {
  return (
    <section className="w-full h-screen bg-vulcan lg:flex">
      <Navbar />
      <PageWrapper />
    </section>
  );
}