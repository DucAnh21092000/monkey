import { Card } from "antd";
import { Bar } from "react-chartjs-2";

const ByReportChart = (props) => {
    const { reportChartData } = props;
    return (
        <div>
            <Card
                bordered={false}
                className="chart-card"
                title="Report count"
                extra={<span className="card-pill">By report</span>}>
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
        </div>
    );
};

export default ByReportChart;
