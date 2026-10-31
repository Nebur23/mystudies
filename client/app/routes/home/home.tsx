import { Footer } from "./Footer";
import { Features } from "./Features";
import { Hero } from "./Hero";
import CTASection from "./CTA";
import type { Route } from "./+types/home";
import { Statistics } from "./Statistics";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "YIGIL | Learn better. Grow further." },
    {
      name: "description",
      content: "Prepare for your GCE exams with structured courses, focused practice, and a community built to help you keep learning.",
    },
  ];
}

export default function Home() {
  return (
    <div className="home-page min-h-screen md:px-12">
      <Hero />
      <Features />
      <CTASection />
      <Statistics />
      <Footer />
    </div>
  );
}
