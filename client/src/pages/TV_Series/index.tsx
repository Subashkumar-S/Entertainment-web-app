import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";

export default function HomePage() {
  return (
    <section className="w-full lg:h-screen bg-dark-blue lg:flex gap-6">
      <Navbar />
      <PageWrapper />
    </section>
  );
}
