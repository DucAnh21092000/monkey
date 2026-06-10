import React, { useEffect, useState } from "react";

import { message, Table } from "antd";
import axios from "axios";

export default function StudentReportPage() {
    const [schools, setSchools] = useState([]);
    const [reports, setReports] = useState([]);
    const [listStudent, setListStudent] = useState([]);

    const getSchools = async () => {
        try {
            const res = await axios.get("http://localhost:3000/api/status-list");
            console.log("res", res);
            setListStudent(res.data.data?.data ?? []);
        } catch {
            message.error("Cannot load schools");
        }
    };

    const getReports = async (schoolId) => {
        try {
            const res = await axios.get(`/reports?school_id=${schoolId}`);

            setReports(res.data || []);
        } catch {
            message.error("Cannot load reports");
        }
    };

    useEffect(() => {
        getSchools();
    }, []);

    const columns = [
        {
            title: "Student Name",
            dataIndex: "student_name",
            search: false,
        },
        {
            title: "School",
            dataIndex: "school_id",
            valueType: "select",
            fieldProps: {
                showSearch: true,
                onChange: (value) => {
                    setReports([]);

                    if (value) {
                        getReports(value);
                    }
                },
            },
            request: async () => {
                return schools.map((item) => ({
                    label: item.school_name,
                    value: item.school_id,
                }));
            },
        },

        {
            title: "Report",
            dataIndex: "report_id",
            valueType: "select",
            fieldProps: {
                showSearch: true,
            },
            request: async () => {
                return reports.map((item) => ({
                    label: item.report_name,
                    value: item.report_id,
                }));
            },
        },

        {
            title: "Student ID",
            dataIndex: "student_id",
            search: false,
        },


        {
            title: "Class",
            dataIndex: "class_name",
            search: false,
        },

        {
            title: "Report Name",
            dataIndex: "report_name",
            search: false,
        },

        {
            title: "School Name",
            dataIndex: "school_name",
            search: false,
        },
    ];

    return (
        <Table
            rowKey={(record) =>
                `${record.student_id}-${record.game_lesson_id}`
            }
            headerTitle="Student Reports"
            columns={columns}
            search={{
                labelWidth: 100,
            }}
            pagination={{
                pageSize: 10,
            }}
            dataSource={listStudent}
        />
    );
}