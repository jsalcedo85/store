import Highcharts from 'highcharts';

const corporateTheme: Highcharts.Options = {
    colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#2563eb', '#1d4ed8', '#1e3a8a'],
    chart: {
        backgroundColor: '#ffffff',
        style: {
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        },
        spacingTop: 20,
        spacingBottom: 20,
        spacingLeft: 20,
        spacingRight: 20,
    },
    title: {
        style: {
            color: '#1e293b',
            fontSize: '18px',
            fontWeight: '600',
        },
        align: 'left',
    },
    subtitle: {
        style: {
            color: '#64748b',
            fontSize: '14px',
        },
        align: 'left',
    },
    xAxis: {
        gridLineWidth: 0,
        lineColor: '#e2e8f0',
        tickColor: '#e2e8f0',
        labels: {
            style: {
                color: '#64748b',
                fontSize: '12px',
            },
        },
        title: {
            style: {
                color: '#64748b',
            },
        },
    },
    yAxis: {
        gridLineColor: '#f1f5f9',
        gridLineWidth: 1,
        minorGridLineWidth: 0,
        lineColor: '#e2e8f0',
        lineWidth: 0,
        tickWidth: 0,
        labels: {
            style: {
                color: '#64748b',
                fontSize: '12px',
            },
        },
        title: {
            style: {
                color: '#64748b',
            },
        },
    },
    legend: {
        itemStyle: {
            color: '#475569',
            fontWeight: '500',
            fontSize: '12px',
        },
        itemHoverStyle: {
            color: '#1e293b',
        },
    },
    tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 8,
        shadow: true,
        style: {
            color: '#334155',
            fontSize: '12px',
        },
        headerFormat: '<span style="font-size: 12px; color: #64748b">{point.key}</span><br/>',
    },
    plotOptions: {
        series: {
            animation: {
                duration: 1000,
            },
            marker: {
                enabled: false,
            },
        },
        column: {
            borderRadius: 4,
            borderWidth: 0,
        },
        bar: {
            borderRadius: 4,
            borderWidth: 0,
        },
        area: {
            fillOpacity: 0.1,
        },
    },
    credits: {
        enabled: false,
    },
};

export const applyHighchartsTheme = () => {
    Highcharts.setOptions(corporateTheme);
};

export default corporateTheme;
