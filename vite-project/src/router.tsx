import { createBrowserRouter, Outlet, type RouteObject } from "react-router-dom";
import Layout from "./layout";
import CanvasPage from "./pages/canvas";
import ResumePage from "./pages/resume";

export const routes: RouteObject[] = [
    {
      path: "/",
      element: <Layout><Outlet /></Layout>,
      children: [
        {
          path: "canvas",
          element: <CanvasPage />,
        },
        {
          path: "resume",
          element: <ResumePage />,
        },
        {
          index: true,
          element: <ResumePage />,
        },
      ],
    },
];

export const router = createBrowserRouter(routes);