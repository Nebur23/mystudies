
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
  const [isOpen, setIsOpen] = useState(false);



  if (isPending) return (
    <Avatar className="h-9 w-9 sm:flex animate-pulse ">
      <AvatarFallback ></AvatarFallback>
    </Avatar>
  );


  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(o => !o)}
        variant="ghost" size="icon" className="rounded-full">
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

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute -right-13 md:right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
            {/* Header */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Manage Account</h3>
              <div className="flex gap-1">

              </div>
            </div>

            {/* List */}
            <div className="max-h-105 overflow-y-auto">

               <button
                className="w-full text-center text-sm text-black font-medium hover:underline py-2"
                onClick={() => {
                  navigate("/profile/me")
                  setIsOpen(false)
                }}>
                My Profile
              </button>
              <button
                className="w-full text-center text-sm text-black font-medium hover:underline py-2"
                onClick={() => {
                  navigate("/connections")
                  setIsOpen(false)
                }}>
                Connections
              </button>

              <button
                className="w-full text-center text-sm text-black font-medium hover:underline py-2"
                onClick={() => {
                  navigate("/profile/settings")
                  setIsOpen(false)
                }}
              >
                Settings
              </button>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={async () => {
                  setIsSignOut(true);
                  await signOut();
                  setIsSignOut(false);
                  navigate("/sign-in");
                }}
                disabled={isSignOut}
                
                className="w-full gap-2 z-10 text-center text-sm text-red-600 flex items-center justify-center font-medium hover:underline"
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
              </button>

            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>

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


          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

