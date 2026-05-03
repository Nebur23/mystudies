import { Button } from "~/components/ui/button";
import { buttonVariants } from "~/components/ui/button";
import { HeroCards } from "./HeroCards";
import { Link } from "react-router";
import HeroImg from "~/assets/hero.png";

export const Hero = () => {
  return (
    <section style={{ backgroundImage: `url(${HeroImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} className=" container  grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-4 md:not-last:px-4">
      <div className="text-center lg:text-start space-y-6 px-4 ">
        <main className="text-5xl md:text-6xl font-bold ">
          <h1 className="inline font-sora">
            <span className="inline bg-gradient-to-r from-[#1A56DB]  to-[#D247BF] text-transparent bg-clip-text">
              Prepare for GCE <br />
            </span>
            the Right Way
          </h1>
        
        </main>

        <p className="text-md md:text-xl font-sans font-light md:w-10/12 mx-auto lg:mx-0">
          Follow a structured curriculum, watch lessons, and test yourself with real exam-style questions.
        </p>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
         <Button size={"lg"} className="w-full md:w-1/3"> <Link to="/sign-in">Start Learning</Link> </Button>

        <Button size={"lg"} className="w-full md:w-1/3" variant={"outline"}>
          <Link
            rel="noreferrer noopener"
            to="/courses"
          >
            Explore Courses
          </Link>
          </Button>
        </div>
      </div>

      {/* Hero cards sections */}
      <div className=" w-full h-full px-2">
         <HeroCards /> 
      </div>

      {/* Shadow effect */}
      <div className="shadow"></div>
    </section>
  );
};