import { Link } from "react-router";
import LogoImg from "~/assets/yigil_logo-removebg-preview.png";
import { cn } from "~/lib/utils";

export default function Logo( {logo, className} : {logo?: {src?: string, alt: string, url?: string}, className?: string}) {
  const logoWithDefaults = { src: LogoImg, url: "/", ...logo };
  return (              
    <div className="flex items-center gap-2">
    <Link to={logoWithDefaults.url} className="flex items-center gap-2">
              <img
                src={logoWithDefaults.src}
                className={cn("h-13 dark:invert", className)}
                alt={logoWithDefaults.alt}
              />
            </Link>
    </div>
  );
}