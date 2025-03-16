// charts.js
document.addEventListener('DOMContentLoaded', () => {
    // Check if ApexCharts is loaded.  This is crucial.
    if (typeof ApexCharts === 'undefined') {
        console.error('ApexCharts is not loaded.  Make sure the CDN link is correct and included BEFORE your custom scripts.');
        return; // Exit the function if ApexCharts is not loaded
    }

    // ApexCharts - Revenue Chart
    const revenueChartOptions = {
        series: [{
            name: 'Net Profit',
            data: [44, 55, 57, 56, 61, 58, 63, 60, 66]
        }, {
            name: 'Revenue',
            data: [76, 85, 101, 98, 87, 105, 91, 114, 94]
        }],
        chart: {
            type: 'bar',
            height: 250,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: { categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], },
        yaxis: { title: { text: '$ (thousands)' } },
        fill: { opacity: 1 },
        tooltip: {
            y: {
                formatter: function (val) {
                    return "$ " + val + " thousands"
                }
            }
        }
    };

    const revenueChartElement = document.querySelector("#revenue-chart"); // Get element once
    if (revenueChartElement) { // Check if the element exists
       const revenueChart = new ApexCharts(revenueChartElement, revenueChartOptions);
       revenueChart.render();
    } else {
        console.error("Revenue chart element not found.  Check your HTML for an element with id='revenue-chart'.");
    }


    // ApexCharts - Traffic Sources Chart (Pie Chart)
    const trafficChartOptions = {
        series: [44, 55, 13, 43, 22],
        chart: {
            type: 'pie',
            height: 250,
            toolbar: { show: false }
        },
        labels: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
        responsive: [{
            breakpoint: 480,
            options: {
                chart: { width: 200 },
                legend: { position: 'bottom' }
            }
        }]
    };

     const trafficChartElement = document.querySelector("#traffic-chart"); // Get element once
    if (trafficChartElement) {  //Check if element exists
        const trafficChart = new ApexCharts(trafficChartElement, trafficChartOptions);
        trafficChart.render();
    } else {
      console.error("Traffic chart element not found.  Check your HTML for an element with id='traffic-chart'.");
    }

});