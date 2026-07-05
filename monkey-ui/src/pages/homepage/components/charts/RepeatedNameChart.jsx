import { Card } from "antd";
import { Bar } from "react-chartjs-2";

const RepeatedNameChart = (props) => {
    const { duplicateStudentChartData } = props;
    return (
        <div>
            <Card
                className="chart-card"
                title="Duplicate students"
                extra={<span className="card-pill">Repeated names</span>}>
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
        </div>
    );
};

export default RepeatedNameChart;
