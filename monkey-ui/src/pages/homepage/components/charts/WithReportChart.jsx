import { Card } from 'antd';
import { Doughnut } from 'react-chartjs-2';

const WithReportChart = (props) => {

    const { reportAvailabilityChartData } = props;
    return (
        <div>
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
                                            const total = context.dataset.data.reduce(
                                                (acc, item) => acc + item,
                                                0,
                                            );
                                            const percent =
                                                total > 0
                                                    ? ((value / total) * 100).toFixed(2)
                                                    : "0.00";
                                            return `${context.label}: ${value} (${percent}%)`;
                                        },
                                    },
                                },
                            },
                        }}
                    />
                </div>
            </Card>
        </div>
    )
}

export default WithReportChart