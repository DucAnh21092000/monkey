import { DesktopOutlined, MessageOutlined, PieChartOutlined } from "@ant-design/icons";
import { Col, Menu, Row } from "antd";
import { Link, Outlet, useLocation } from "react-router";

const DefaultLayout = () => {
  const location = useLocation();

  const menuItems = [
    { key: "1", icon: <PieChartOutlined />, label: <Link to="/">Student Evaluation</Link> },
    { key: "2", icon: <DesktopOutlined />, label: <Link to="/download-video">Download Video</Link> },
    { key: "3", icon: <MessageOutlined />, label: <Link to="/chat">Chat</Link> },
  ];

  const selectedKey =
    location.pathname === "/download-video" ? "2" : location.pathname === "/chat" ? "3" : "1";

  return (
    <Row className="d-flex flex-row">
      <Col className="h-screen bg-gray-100">
        <Menu
          selectedKeys={[selectedKey]}
          defaultOpenKeys={["sub1"]}
          items={menuItems}
          mode="horizontal"
          className="w-100"
        />
      </Col>
      <Col className="p-4">
        <Outlet />
      </Col>
    </Row>
  );
};

export default DefaultLayout;
