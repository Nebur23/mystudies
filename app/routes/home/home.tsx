import { About } from "./About";
import { Footer } from "./Footer";
import { Features } from "./Features";
import { Hero } from "./Hero";
import { useLoaderData, useRouteLoaderData } from "react-router";
import CTASection from "./CTA";
import type { Route } from "./+types/home";


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


