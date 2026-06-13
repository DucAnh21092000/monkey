import { BankOutlined, FilterOutlined, TeamOutlined, TrophyOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Drawer,
  Form,
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
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);
const { Search } = Input;

const SCHOOL_CACHE_KEY = "monkey-school-list-cache";
const SCHOOL_RECENT_KEY = "monkey-school-recent-cache";
const SCHOOL_CACHE_TTL = 1000 * 60 * 60 * 24 * 7;

function getCachedSchools() {
  try {
    const cached = localStorage.getItem(SCHOOL_CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    if (!parsed?.data || Date.now() - parsed.timestamp > SCHOOL_CACHE_TTL) {
      localStorage.removeItem(SCHOOL_CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedSchools(data) {
  try {
    localStorage.setItem(
      SCHOOL_CACHE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch {
    // ignore storage errors
  }
}

function getRecentSchoolIds() {
  try {
    const cached = localStorage.getItem(SCHOOL_RECENT_KEY);
    if (!cached) return [];
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setRecentSchoolIds(ids) {
  try {
    localStorage.setItem(SCHOOL_RECENT_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

function sortSchoolsByRecent(schools, recentIds = []) {
  const recentSet = new Set(recentIds);

  return [...schools].sort((a, b) => {
    const aRecent = recentSet.has(a.value) ? 1 : 0;
    const bRecent = recentSet.has(b.value) ? 1 : 0;

    if (aRecent !== bRecent) return bRecent - aRecent;
    return (a.label || "").localeCompare(b.label || "");
  });
}

export default function StudentReportPage() {
  const [selectedSchool, setSelectedSchool] = useState();
  const [keyword, setKeyword] = useState("");
  const deferredKeyword = useDeferredValue(keyword);
  const [listSchool, setListSchool] = useState([]);
  const [listStudent, setListStudent] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [openFilter, setOpenFilter] = useState(false);
  const [recentSchoolIds, setRecentSchoolIdsState] = useState(() => getRecentSchoolIds());
  const [pendingRecentSchool, setPendingRecentSchool] = useState();

  const [filters, setFilters] = useState({
    school: undefined,
    class: undefined,
    report: undefined,
    testResult: undefined,
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
        const key = student.test_result;
        summary[key] = (summary[key] || 0) + 1;
      }
    });

    const total = Object.values(summary).reduce((acc, value) => acc + value, 0);
    const newLabel = Object.keys(summary).map((key) => {
      const count = summary[key];
      const percent = total > 0 ? ((count / total) * 100).toFixed(2) : "0.00";
      return `${key} (${count}) - ${percent}%`;
    });

    return {
      labels: newLabel,
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
            "#f59e0b",
          ],
        },
      ],
    };
  }, [listStudent]);

  const reportChartData = useMemo(() => {
    const summary = {};

    listStudent.forEach((student) => {
      const key = student.report_name || "Unknown";
      summary[key] = (summary[key] || 0) + 1;
    });

    const totalReports = Object.values(summary).reduce((acc, value) => acc + value, 0);
    const labels = Object.keys(summary).map((key) => {
      const count = summary[key];
      const percent = totalReports > 0 ? ((count / totalReports) * 100).toFixed(2) : "0.00";
      return `${key} (${count}) - ${percent}%`;
    });

    return {
      labels,
      datasets: [
        {
          label: "Students",
          data: Object.values(summary),
          backgroundColor: [
            "#6366f1",
            "#0ea5e9",
            "#14b8a6",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
          ],
          borderRadius: 10,
          maxBarThickness: 42,
        },
      ],
    };
  }, [listStudent]);

  const duplicateStudentChartData = useMemo(() => {
    const summary = {};

    listStudent.forEach((student) => {
      const key = student.student_name || "Unknown";
      summary[key] = (summary[key] || 0) + 1;
    });

    const duplicates = Object.entries(summary)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    const totalDuplicates = duplicates.reduce((acc, [, count]) => acc + count, 0);
    const labels = duplicates.length
      ? duplicates.map(([name, count]) => {
        const percent = totalDuplicates > 0 ? ((count / totalDuplicates) * 100).toFixed(2) : "0.00";
        return `${name} (${count}) - ${percent}%`;
      })
      : ["No duplicates"];
    const values = duplicates.length ? duplicates.map(([, count]) => count) : [0];

    return {
      labels,
      datasets: [
        {
          label: "Duplicate entries",
          data: values,
          backgroundColor: ["#f97316", "#fb923c", "#fdba74", "#fed7aa"],
          borderRadius: 10,
          maxBarThickness: 34,
        },
      ],
    };
  }, [listStudent]);

  const reportAvailabilityChartData = useMemo(() => {
    const withReport = listStudent.filter((student) => student.test_result).length;
    const withoutReport = listStudent.length - withReport;
    const total = listStudent.length || 1;

    return {
      labels: [
        `Has report (${withReport}) - ${((withReport / total) * 100).toFixed(2)}%`,
        `No report (${withoutReport}) - ${((withoutReport / total) * 100).toFixed(2)}%`,
      ],
      datasets: [
        {
          label: "Records",
          data: [withReport, withoutReport],
          backgroundColor: ["#10b981", "#f59e0b"],
          borderRadius: 10,
          maxBarThickness: 42,
        },
      ],
    };
  }, [listStudent]);

  useEffect(() => {
    let cancelled = false;

    const cachedSchools = getCachedSchools();
    if (cachedSchools) {
      window.setTimeout(() => {
        if (!cancelled) {
          setListSchool(sortSchoolsByRecent(cachedSchools, recentSchoolIds));
        }
      }, 0);
      return () => {
        cancelled = true;
      };
    }

    axios
      .get("https://monkey-1gz4.onrender.com/api/school-list")
      .then((schoolResponse) => {
        if (cancelled) return;

        const newListSchool =
          schoolResponse.data?.data?.map((item) => ({
            ...item,
            label: item.school_name,
            value: item.school_id,
          })) ?? [];

        const sortedSchools = sortSchoolsByRecent(newListSchool, recentSchoolIds);
        setListSchool(sortedSchools);
        setCachedSchools(sortedSchools);
      })
      .catch((error) => {
        console.error("Error fetching schools:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [recentSchoolIds]);



  useEffect(() => {
    if (!selectedSchool) {
      return;
    }

    const timer = window.setTimeout(() => {
      fetchStudents(selectedSchool, 1, pagination.pageSize);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedSchool, pagination.pageSize, fetchStudents]);

  const handleSchoolChange = (value) => {
    setSelectedSchool(value);
    setPendingRecentSchool(value || undefined);
  };

  const handleSchoolDropdownVisibleChange = (open) => {
    if (open || !pendingRecentSchool) {
      return;
    }

    const recentIds = getRecentSchoolIds();
    const nextRecentIds = [pendingRecentSchool, ...recentIds.filter((id) => id !== pendingRecentSchool)].slice(0, 8);
    setRecentSchoolIdsState(nextRecentIds);
    setRecentSchoolIds(nextRecentIds);
    setPendingRecentSchool(undefined);
  };

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

  const reportOptions = useMemo(
    () =>
      [
        ...new Set(listStudent.map((item) => item.report_name).filter(Boolean)),
      ].map((value) => ({
        label: value,
        value,
      })),
    [listStudent]
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

  const classFilters = useMemo(
    () => [
      ...new Map(
        listStudent.map((item) => [
          item.class_id,
          {
            text: item.class_name,
            value: item.class_id,
            label: item.class_name,
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
      title: "STT",
      dataIndex: "stt",
      width: 50,
      fixed: "left",
      render: (value, record, index) => (
        <span style={{ fontWeight: 600 }}>{index + 1}</span>
      ),
    },
    {
      title: "",
      width: 55,
      fixed: "left",
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
      width: 200,
      ellipsis: true,
      render: (text) => highlightText(text, keyword),
    },
    {
      title: "Class",
      dataIndex: "class_name",
      width: 120,
      ellipsis: true,
      filters: classFilters,
      filterSearch: true,
      onFilter: (value, record) => record.class_id === value,
    },
    {
      title: "School",
      dataIndex: "school_name",
      width: 180,
      ellipsis: true,
      filters: schoolFilters,
      onFilter: (value, record) => record.school_name === value,
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Report",
      dataIndex: "report_name",
      width: 120,
      ellipsis: true,
      filters: reportFilters,
      filterSearch: true,
      onFilter: (value, record) => record.report_name === value,
    },
    {
      title: "Test Result",
      dataIndex: "test_result",
      width: 110,
      ellipsis: true,
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
      width: 120,
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

  const handleResetFilter = () => {
    setKeyword("");

    setFilters({
      school: undefined,
      class: undefined,
      report: undefined,
      testResult: undefined,
    });
  };

  const handleRemoveRecentSchool = (schoolId) => {
    if (!schoolId) {
      return;
    }

    const nextRecentIds = recentSchoolIds.filter((id) => id !== schoolId);
    setRecentSchoolIdsState(nextRecentIds);
    setRecentSchoolIds(nextRecentIds);
    setPendingRecentSchool(undefined);
  };

  const filteredStudentsMulti = useMemo(() => {
    return listStudent.filter((student) => {
      const matchKeyword =
        !deferredKeyword ||
        student.student_name
          ?.toLowerCase()
          .includes(deferredKeyword.toLowerCase());

      const matchSchool =
        !filters.school ||
        student.school_id === filters.school;

      const matchClass =
        !filters.class ||
        student.class_id === filters.class;

      const matchReport =
        !filters.report ||
        student.report_name === filters.report;

      const matchTestResult =
        !filters.testResult ||
        student.test_result === filters.testResult;

      return (
        matchKeyword &&
        matchSchool &&
        matchClass &&
        matchReport &&
        matchTestResult
      );
    });
  }, [listStudent, deferredKeyword, filters]);

  const visibleCount = filteredStudentsMulti.length;
  const strongResultCount = filteredStudentsMulti.filter((student) =>
    ["Very good", "Good"].includes(student.test_result)
  ).length;
  const schoolOptions = useMemo(() => {
    const recentSchools = listSchool
      .filter((school) => recentSchoolIds.includes(school.value))
      .map((school) => ({
        ...school,
        data: {
          ...school.data,
          isRecent: true,
        },
      }));
    const otherSchools = listSchool
      .filter((school) => !recentSchoolIds.includes(school.value))
      .map((school) => ({
        ...school,
        data: {
          ...school.data,
          isRecent: false,
        },
      }));

    return [
      ...(recentSchools.length > 0
        ? [{ label: "Recently used", title: true, disabled: true }, ...recentSchools]
        : []),
      ...(otherSchools.length > 0
        ? [{ label: "All schools", title: true, disabled: true }, ...otherSchools]
        : []),
    ];
  }, [listSchool, recentSchoolIds]);
  const activeFilterCount = [
    Boolean(keyword?.trim()),
    filters.school !== undefined,
    filters.class !== undefined,
    filters.report !== undefined,
    filters.testResult !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="student-page-shell">
      <div className="page-hero">
        <div>
          <p className="hero-eyebrow">🌸 Student evaluation dashboard</p>
          <p className="hero-copyright">Copyright © Diggory Dinh with love</p>
          <h1>Follow every student’s progress with a calm, clear view.</h1>

        </div>
        <div className="hero-badge">
          <span>✨ {visibleCount} visible</span>
          <span>✅ {strongResultCount} good results</span>
          <span>🏫 {new Set(listStudent.map((x) => x.school_id)).size} schools</span>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card className="stat-card stat-card-blue">
            <div className="stat-card__icon">
              <TeamOutlined />
            </div>
            <Statistic title="Total Students" value={listStudent.length} />
            <p className="stat-card__text">Students currently visible in the report</p>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="stat-card stat-card-green">
            <div className="stat-card__icon">
              <BankOutlined />
            </div>
            <Statistic
              title="Schools"
              value={new Set(listStudent.map((x) => x.school_id)).size}
            />
            <p className="stat-card__text">Different schools included in the dataset</p>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="stat-card stat-card-purple">
            <div className="stat-card__icon">
              <TrophyOutlined />
            </div>
            <Statistic title="Reports" value={listStudent.length} />
            <p className="stat-card__text">Performance summaries ready to review</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24}>
          <Card bordered={false} className="table-card">
            <div className="table-toolbar">
              <div>
                <h3>Danh sách học sinh</h3>

              </div>
              <div className="toolbar-actions">
                <div className="toolbar-btn-wrapper">
                  <Button
                    type="primary"
                    icon={<FilterOutlined />}
                    onClick={() => setOpenFilter(true)}
                    className="toolbar-btn toolbar-btn-primary"
                  >
                    Filter
                  </Button>
                  {activeFilterCount > 0 && (
                    <span className="filter-badge">{activeFilterCount}</span>
                  )}
                </div>
                <Button onClick={handleResetFilter} className="toolbar-btn">
                  Reset
                </Button>
              </div>
            </div>

            <Row gutter={[12, 12]} className="filter-grid">
              <Col xs={24} md={8}>
                <Select
                  allowClear
                  showSearch
                  size="large"
                  placeholder="🏫 Chọn trường"
                  className="modern-select"
                  style={{ width: "100%" }}
                  options={schoolOptions}
                  value={selectedSchool}
                  onChange={handleSchoolChange}
                  onDropdownVisibleChange={handleSchoolDropdownVisibleChange}
                  optionFilterProp="label"
                  optionRender={(option) => {
                    if (option.data?.title) {
                      return <span style={{ fontWeight: 700, color: "#6366f1" }}>{option.label}</span>;
                    }

                    return (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%" }}>
                        <span>{option.label}</span>
                        {option.data?.isRecent && (
                          <button
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleRemoveRecentSchool(option.value);
                            }}
                            style={{
                              border: "1px solid #d9d9d9",
                              background: "#fff7e6",
                              color: "#d46b08",
                              cursor: "pointer",
                              fontSize: 12,
                              lineHeight: 1,
                              padding: "4px 8px",
                              borderRadius: 999,
                              fontWeight: 600,
                            }}
                            aria-label={`Remove ${option.label} from recent schools`}
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>
                    );
                  }}
                />
              </Col>

              <Col xs={24} md={8}>
                <Search
                  allowClear
                  size="large"
                  placeholder="🔍 Tìm tên học sinh"
                  className="modern-search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </Col>

            </Row>

            <Table
              loading={loading}
              rowKey={(record) => `${record.student_id}-${record.game_lesson_id}`}
              columns={columns}
              dataSource={filteredStudentsMulti}
              scroll={{ x: 1400 }}
              tableLayout="fixed"
              onChange={handleTableChange}
              className="student-table"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal: (total) => `Tổng ${total} học sinh`,
              }}
            />
          </Card>
        </Col>
      </Row>

      {selectedSchool ? (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
            <Col xs={24} lg={12}>
              <Card
                className="chart-card"
                title="Result overview"
                extra={<span className="card-pill">Live chart</span>}
              >
                <div className="chart-wrapper">
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
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const value = context.raw;
                              const total = context.dataset.data.reduce((acc, item) => acc + item, 0);
                              const percent = total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";
                              return `${context.label}: ${value} (${percent}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                className="chart-card"
                title="Duplicate students"
                extra={<span className="card-pill">Repeated names</span>}
              >
                <div className="chart-wrapper chart-wrapper-large">
                  <Bar
                    data={duplicateStudentChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                className="chart-card"
                title="Report count"
                extra={<span className="card-pill">By report</span>}
              >
                <div className="chart-wrapper chart-wrapper-large">
                  <Bar
                    data={reportChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const value = context.raw;
                              const total = context.dataset.data.reduce((acc, item) => acc + item, 0);
                              const percent = total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";
                              return `${context.label}: ${value} (${percent}%)`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                className="chart-card"
                title="Report availability"
                extra={<span className="card-pill">With / without report</span>}
              >
                <div className="chart-wrapper">
                  <Doughnut
                    data={reportAvailabilityChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "70%",
                      plugins: {
                        legend: {
                          position: "bottom",
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const value = context.raw;
                              const total = context.dataset.data.reduce((acc, item) => acc + item, 0);
                              const percent = total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";
                              return `${context.label}: ${value} (${percent}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </>
      ) : null}

      <Drawer
        title="Filter Students"
        width={400}
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        footer={
          <Space>
            <Button type="primary" onClick={() => setOpenFilter(false)}>
              Apply
            </Button>

            <Button
              onClick={() =>
                setFilters({
                  school: undefined,
                  class: undefined,
                  report: undefined,
                  testResult: undefined,
                })
              }
            >
              Clear
            </Button>
            <Button onClick={() => setOpenFilter(false)}>Close</Button>
          </Space>
        }
      >
        <Form layout="vertical">
          <Form.Item label="Class">
            <Select
              allowClear
              options={classFilters}
              value={filters.class}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  class: value,
                }))
              }
            />
          </Form.Item>

          <Form.Item label="Report">
            <Select
              allowClear
              options={reportOptions}
              value={filters.report}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  report: value,
                }))
              }
            />
          </Form.Item>

          <Form.Item label="Test Result">
            <Select
              allowClear
              options={testResultFilters}
              value={filters.testResult}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  testResult: value,
                }))
              }
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
