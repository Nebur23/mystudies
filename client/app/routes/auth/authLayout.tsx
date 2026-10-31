import { Outlet} from "react-router";
import Logo from "~/components/logo";


export default function AuthLayout() {
 

  return (
    <div className="bg-background px-3.5 h-dvh w-full flex flex-col gap-7 items-center justify-center">
      <div className="flex items-center justify-center">
        
        <Logo />
      </div>
       
      
        <Outlet />
     
   
      
    </div>
  );
}
