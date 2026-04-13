import { createBrowserRouter, Outlet, type RouteObject } from "react-router-dom";
import Layout from "./layout";
import CanvasPage from "./pages/canvas";
import ResumePage from "./pages/resume";
import PerformancePage from "./pages/performance";
import FileUploadPage from "./pages/fileUpload";

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
          path: "performance",
          element: <PerformancePage />,
        },
        {
          path: "fileUpload",
          element: <FileUploadPage />,
        },
        {
          index: true,
          element: <ResumePage />,
        },
      ],
    },
];

export const router = createBrowserRouter(routes);