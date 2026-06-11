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
import { useCallback, useEffect, useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);
const { Search } = Input;

export default function StudentReportPage() {
  const [selectedSchool, setSelectedSchool] = useState();
  const [keyword, setKeyword] = useState("");
  const [listSchool, setListSchool] = useState([]);
  const [listStudent, setListStudent] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [loading, setLoading] = useState(false);
  const fetchStudents = useCallback(
    async (schoolId, page = 1, pageSize = 10) => {
      try {
        setLoading(true);

        const response = await axios.get(
          "https://monkey-1gz4.onrender.com/api/status-list",
          {
            params: {
              school_id: schoolId,
              page,
              pageSize,
            },
          },
        );

        setListStudent(response.data?.data ?? []);

        setPagination({
          current: page,
          pageSize,
          total: response.data?.total ?? 0,
        });
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const chartData = useMemo(() => {
    const summary = {};

    listStudent.forEach((student) => {
      if (student.test_result) {
        const key = student.test_result || "Unknown";
        summary[key] = (summary[key] || 0) + 1;
      }
    });

    return {
      labels: Object.keys(summary),
      datasets: [
        {
          data: Object.values(summary),
          backgroundColor: [
            "#1677ff",
            "#52c41a",
            "#faad14",
            "#ff4d4f",
            "#722ed1",
            "#13c2c2",
          ],
        },
      ],
    };
  }, [listStudent]);

  const initData = useCallback(() => {
    axios
      .get("https://monkey-1gz4.onrender.com/api/school-list")
      .then((schoolResponse) => {
        const newListSchool =
          schoolResponse.data?.data?.map((item) => ({
            ...item,
            label: item.school_name,
            value: item.school_id,
          })) ?? [];

        setListSchool(newListSchool);
      })
      .catch((error) => {
        console.error("Error fetching schools:", error);
      });
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  useEffect(() => {
    fetchStudents(selectedSchool);
  }, [selectedSchool, fetchStudents]);

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

  const reportFilters = useMemo(
    () =>
      [
        ...new Set(listStudent.map((item) => item.report_name).filter(Boolean)),
      ].map((value) => ({
        text: value,
        value,
      })),
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
      title: "STT",
      dataIndex: "stt",
      width: 70,
      fixed: "left",
      render: (value, record, index) => (
        <span style={{ fontWeight: 600 }}>{index + 1}</span>
      ),
    },
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
      filters: reportFilters,
      filterSearch: true,
      onFilter: (value, record) => record.report_name === value,
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

  const handleTableChange = (paginationConfig) => {
    fetchStudents(
      selectedSchool,
      paginationConfig.current,
      paginationConfig.pageSize,
    );
  };

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
      <Card title="Student Performance">
        <div
          style={{
            height: 280,
            width: 280,
            margin: "0 auto",
          }}
        >
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "70%",
              plugins: {
                legend: {
                  position: "bottom",
                },
              },
            }}
          />
        </div>
      </Card>
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
              options={listSchool}
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
          loading={loading}
          rowKey={(record) => `${record.student_id}-${record.game_lesson_id}`}
          columns={columns}
          dataSource={filteredStudents}
          scroll={{ x: 1400 }}
          onChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total) => `Total ${total} students`,
          }}
        />
      </Card>
    </>
  );
}
