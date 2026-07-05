import { Card } from "antd";
import { Doughnut } from "react-chartjs-2";

const LiveChart = (props) => {
    const { chartData } = props;
    return (
        <div>
            <Card
                className="chart-card"
                title="Result overview"
                extra={<span className="card-pill">Live chart</span>}>
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
        </div>
    );
};

export default LiveChart;
