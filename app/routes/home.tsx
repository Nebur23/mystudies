import type { Route } from "./+types/home";
import { About } from "./home/About";
import { Footer } from "./home/Footer";
import { Features } from "./home/Features";
import { Hero } from "./home/Hero";
import { useLoaderData, useRouteLoaderData } from "react-router";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const { user } = useRouteLoaderData("root") ;



  if (!user) return <p>Not logged in</p>;
  return    <>
      <Hero />
      <Features />
      <About />
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


