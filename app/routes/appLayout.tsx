import { Outlet } from "react-router";
import { Navbar1 } from "~/components/navbar1";

export default function SomeParent() {
  return (
    <div>
      <div className=" border-b-2 border-muted/50 px-4">
        <Navbar1 />
      </div>
      <Outlet />
    </div>
  );
}
