import { createBrowserRouter, type RouteObject } from "react-router-dom";
import Layout from "./layout";
import UploadPage from "./pages/upload";
import CanvasPage from "./pages/canvas";
import ResumePage from "./pages/resume";

export const routes: RouteObject[] = [
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "upload",
          element: <UploadPage />,
        },
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
          element: <UploadPage />,
        },
      ],
    },
];

export const router = createBrowserRouter(routes);