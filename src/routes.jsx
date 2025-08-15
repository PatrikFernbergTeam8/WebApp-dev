import {
  RectangleStackIcon,
  PrinterIcon,
} from "@heroicons/react/24/solid";
import { Tables } from "@/pages/dashboard";
import { SignUp } from "@/pages/auth";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <PrinterIcon {...icon} />,
        name: "lagerstatus",
        path: "/tables",
        element: <Tables />,
      },
    ],
  },
  {
    layout: "auth",
    pages: [
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "sign up",
        path: "/sign-up",
        element: <SignUp />,
      },
    ],
  },
];

export default routes;
