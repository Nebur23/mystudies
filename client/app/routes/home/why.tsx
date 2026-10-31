import { Button } from "~/components/ui/button";
import { HeroCards } from "./HeroCards";
import HeroImg from "~/assets/ybg.png";
import { useNavigate } from "react-router";
import { ArrowRight, Book, Video } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "~/components/ui/avatar"

export const Why = () => {
  const navigate = useNavigate()
  return (
    <section className="container  grid md:grid-cols-2 place-items-center h-[70vh]  ">
      {/* col 1 */}
      <div className=" w-full h-full items-center md:items-start flex flex-col space-y-6">



      </div>

      {/* col 2 */}
      <div  style={{ backgroundImage: `url(${HeroImg})`, backgroundSize: "cover", backgroundPosition: 'center right', backgroundRepeat:"no-repeat" }} className=" w-full h-full px-2 ">
        
      </div>

    </section>
  );
};