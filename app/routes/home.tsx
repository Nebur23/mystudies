import type { Route } from "./+types/home";
import { About } from "./home/About";
import { Footer } from "./home/Footer";
import { Features } from "./home/Features";
import { Hero } from "./home/Hero";
import { useLoaderData, useRouteLoaderData } from "react-router";
import CTASection from "./home/CTA";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Master Your Studies" },
    { name: "description", content: "Improve your study habits and achieve your academic goals with our proven methods." },
  ];
}

export default function Home() {
  // const { user } = useRouteLoaderData("root") ;



  // if (!user) return <p>Not logged in</p>;
  return    <>
      <Hero />
      <Features />
      <CTASection />
      <Footer />
      {/* <Sponsors />
      
      <HowItWorks />
      <Features />
      <Services />
      <Cta />
      <Testimonials />
      <Team />
      <Pricing />
      <Newsletter />
      <FAQ />
      
      <ScrollToTop /> */}
    </>;
}


