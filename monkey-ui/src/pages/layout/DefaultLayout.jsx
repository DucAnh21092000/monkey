import { DesktopOutlined, PieChartOutlined } from "@ant-design/icons";
import { Col, Menu, Row } from "antd";
import { Link, Outlet } from "react-router";
const menuItems = [
  { key: "1", icon: <PieChartOutlined />, label: <Link to="/">Student Evaluation</Link> },
  { key: "2", icon: <DesktopOutlined />, label: <Link to="/edit-video">Edit Video</Link> },
];

const DefaultLayout = () => {
  return (
    <Row className="d-flex flex-row">
      <Col span={4} className="h-screen bg-gray-100">
        <Menu
          defaultSelectedKeys={["1"]}
          defaultOpenKeys={["sub1"]}
          mode="inline"
          items={menuItems}
          className="position-fixed  h-100 overflow-y-auto "
        />
      </Col>
      <Col span={20} className="p-4">
        <Outlet />
      </Col>
    </Row>
  );
};

export default DefaultLayout;
