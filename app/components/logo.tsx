import LogoImg from "~/assets/logo_icon.svg";
import { cn } from "~/lib/utils";

export default function Logo( {logo, className} : {logo?: {src?: string, alt: string, url?: string}, className?: string}) {
  const logoWithDefaults = { src: LogoImg, url: "/", ...logo };
  return (              
    <div className="flex items-center gap-2">
    <a href={logoWithDefaults.url} className="flex items-center gap-2">
              <img
                src={logoWithDefaults.src}
                className={cn("max-h-8 dark:invert", className)}
                alt={logoWithDefaults.alt}
              />
            </a>
    </div>
  );
}