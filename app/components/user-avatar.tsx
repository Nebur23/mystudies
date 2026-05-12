
import { signOut, useSession } from "~/lib/auth-client";


import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useNavigate } from "react-router";



export function UserAvatar() {
  const { data: session, isPending, error } = useSession();
  const [isSignOut, setIsSignOut] = useState<boolean>(false);
  const navigate = useNavigate();


  if (isPending) return (
    <Avatar className="h-9 w-9 sm:flex animate-pulse ">
      <AvatarFallback ></AvatarFallback>
    </Avatar>
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className=" h-9 w-9 sm:flex ">
            <AvatarImage
              src={session?.user.image || "#"}
              alt="Avatar"
              className="object-cover"
            />
            <AvatarFallback>{session?.user.name.charAt(0)}</AvatarFallback>
            <AvatarBadge className="bg-green-600 dark:bg-green-800" />
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-12">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/profile/me")}>
              Profile
          </DropdownMenuItem>
          {/* <DropdownMenuItem>
            
             <Link to="/profile" >  
            Billing
            </Link>
            
            </DropdownMenuItem> */}

           <DropdownMenuItem onClick={() => navigate("/connections")}>
              Connections
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/profile/settings")}>
              Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">

            <Button
              className="gap-2 z-10"
              variant="destructive"
              onClick={async () => {
                setIsSignOut(true);
                await signOut();
                setIsSignOut(false);
                navigate("/sign-in");
              }}
              disabled={isSignOut}
            >
              <span className="text-sm">
                {isSignOut ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <LogOut size={16} />
                    Sign Out
                  </div>
                )}
              </span>
            </Button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

