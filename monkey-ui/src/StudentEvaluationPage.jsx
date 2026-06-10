import { BankOutlined, TeamOutlined, TrophyOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Image,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
} from "antd";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";

const { Search } = Input;

export default function StudentReportPage() {
  const [selectedSchool, setSelectedSchool] = useState();
  const [keyword, setKeyword] = useState("");

  const [listStudent, setListStudent] = useState([]);

  const getStatusList = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/status-list");
      setListStudent(res.data.data.data);
      console.log(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getStatusList();
  }, []);

  const highlightText = (text, keyword) => {
    if (!keyword) return text;

    const regex = new RegExp(`(${keyword})`, "gi");
    const parts = text?.split(regex);

    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <span
              key={index}
              style={{
                backgroundColor: "#ffe58f",
                padding: "0 2px",
                borderRadius: 2,
              }}
            >
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  const schoolOptions = useMemo(() => {
    return [
      ...new Map(
        listStudent.map((item) => [
          item.school_id,
          {
            value: item.school_id,
            label: item.school_name,
          },
        ]),
      ).values(),
    ];
  }, [listStudent]);

  const filteredStudents = useMemo(() => {
    return listStudent.filter((student) => {
      const matchSchool =
        !selectedSchool || student.school_id === selectedSchool;

      const matchKeyword =
        !keyword ||
        student.student_name.toLowerCase().includes(keyword.toLowerCase());

      return matchSchool && matchKeyword;
    });
  }, [listStudent, selectedSchool, keyword]);

  const handleReset = () => {
    setSelectedSchool(undefined);
    setKeyword("");
  };

  const classFilters = useMemo(
    () => [
      ...new Map(
        listStudent.map((item) => [
          item.class_id,
          {
            text: item.class_name,
            value: item.class_id,
          },
        ]),
      ).values(),
    ],
    [listStudent],
  );

  const schoolFilters = useMemo(
    () =>
      [
        ...new Set(listStudent.map((item) => item.school_name).filter(Boolean)),
      ].map((value) => ({
        text: value,
        value,
      })),
    [listStudent],
  );

  const testResultFilters = useMemo(
    () =>
      [
        ...new Set(listStudent.map((item) => item.test_result).filter(Boolean)),
      ].map((value) => ({
        text: value,
        value,
      })),
    [listStudent],
  );

  const columns = [
    {
      title: "",
      width: 70,
      render: (_, record) => (
        <Avatar
          size={48}
          style={{
            backgroundColor: "#1677ff",
            fontWeight: 600,
          }}
        >
          {record.student_name?.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: "Student Name",
      dataIndex: "student_name",
      width: 220,
      render: (text) => highlightText(text, keyword),
    },
    {
      title: "Class",
      dataIndex: "class_name",
      filters: classFilters,
      filterSearch: true,
      onFilter: (value, record) => record.class_id === value,
    },
    {
      title: "School",
      dataIndex: "school_name",
      filters: schoolFilters,
      onFilter: (value, record) => record.school_name === value,
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Report",
      dataIndex: "report_name",
    },
    {
      title: "Test Result",
      dataIndex: "test_result",
      filters: testResultFilters,
      onFilter: (value, record) => record.test_result === value,
      render: (value) => {
        const colorMap = {
          "Very good": "green",
          Good: "blue",
          Average: "orange",
          Poor: "red",
        };

        return <Tag color={colorMap[value] || "default"}>{value || "-"}</Tag>;
      },
    },
    {
      title: "Report Image",
      dataIndex: "image",
      width: 120,
      render: (url) => (
        <Image
          src={url}
          width={70}
          height={90}
          style={{
            objectFit: "cover",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
          }}
        />
      ),
    },
    {
      title: "Video",
      dataIndex: "video",
      render: (url) => (
        <a href={url} target="_blank" rel="noreferrer">
          View Video
        </a>
      ),
    },
  ];

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Students"
              value={listStudent.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Schools"
              value={new Set(listStudent.map((x) => x.school_id)).size}
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Reports"
              value={listStudent.length}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={8}>
            <Select
              allowClear
              showSearch
              size="large"
              placeholder="🏫 Select School"
              style={{ width: "100%" }}
              options={schoolOptions}
              value={selectedSchool}
              onChange={setSelectedSchool}
              optionFilterProp="label"
            />
          </Col>

          <Col xs={24} md={8}>
            <Search
              allowClear
              size="large"
              placeholder="🔍 Search Student Name"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Col>

          <Col xs={24} md={8}>
            <Space>
              <Button size="large" onClick={handleReset}>
                Reset Filters
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          rowKey={(record) => `${record.student_id}-${record.game_lesson_id}`}
          columns={columns}
          dataSource={filteredStudents}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} students`,
          }}
        />
      </Card>
    </>
  );
}
