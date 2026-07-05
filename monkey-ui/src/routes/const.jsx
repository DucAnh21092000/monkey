import { createBrowserRouter } from "react-router";
import StudentReportPage from "../pages/homepage/StudentEvaluationPage";
import EditVideo from "../pages/edit-video/EditVideo";
import DefaultLayout from "../pages/layout/DefaultLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { path: "/", element: <StudentReportPage /> },
      {
        path: "/edit-video",
        element: <EditVideo />,
      },
    ],
  },
]);

export default router;
