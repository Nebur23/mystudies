import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "~/components/ui/card";
import { Check } from "lucide-react";

export const HeroCards = () => {
  return (
    <div className="w-full h-full">
        <iframe className="w-full h-full" src="https://www.youtube.com/embed/KdG4Ex6JZPo?list=PLoGvme8Qpj_214RgVUbjgMW8voKHGS8kf" title="Master Your Studies | Channel Trailer 🎓 Learn Smarter, Succeed Faster" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
    </div>
  );
};