import { createBrowserRouter, type RouteObject } from "react-router-dom";
import Layout from "./layout";
import UploadPage from "./pages/upload";
import CanvasPage from "./pages/canvas";

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
          index: true,
          element: <UploadPage />,
        },
      ],
    },
];

export const router = createBrowserRouter(routes);