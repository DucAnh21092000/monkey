import { createBrowserRouter } from "react-router";
import StudentReportPage from "../pages/homepage/StudentEvaluationPage";
import EditVideo from "../pages/edit-video/EditVideo";
import ChatPage from "../pages/chat/ChatPage";
import DefaultLayout from "../pages/layout/DefaultLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { path: "/", element: <StudentReportPage /> },
      {
        path: "/download-video",
        element: <EditVideo />,
      },
      {
        path: "/chat",
        element: <ChatPage />,
      },
    ],
  },
]);

export default router;
