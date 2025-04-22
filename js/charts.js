function initializeMyCharts() {

    if (typeof ApexCharts === 'undefined') {
        console.error("charts.js: ApexCharts library is not available when initializeMyCharts is called.");
        return;
    }

    const revenueChartElement = document.querySelector("#revenue-chart");
    const trafficChartElement = document.querySelector("#traffic-chart");

    if (!revenueChartElement) {
        console.error("charts.js: Revenue chart element #revenue-chart not found in the DOM.");
        // Optionally retry or wait
        // setTimeout(initializeMyCharts, 100);
        // return; // Decide if you want to proceed with partial init
    }
    if (!trafficChartElement) {
        console.error("charts.js: Traffic chart element #traffic-chart not found in the DOM.");
        // Optionally retry or wait
        // setTimeout(initializeMyCharts, 100);
        // return; // Decide if you want to proceed with partial init
    }


    if (revenueChartElement) {
        const revenueChartOptions = {
            series: [{ name: 'Net Profit', data: [44, 55, 57, 56, 61, 58, 63, 60, 66] }, { name: 'Revenue', data: [76, 85, 101, 98, 87, 105, 91, 114, 94] }],
            chart: { type: 'bar', height: 250, toolbar: { show: false } },
            plotOptions: { bar: { horizontal: false, columnWidth: '55%', endingShape: 'rounded' } },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            xaxis: { categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'] },
            yaxis: { title: { text: '$ (thousands)' } },
            fill: { opacity: 1 },
            tooltip: { y: { formatter: function (val) { return "$ " + val + " thousands" } } }
        };
        try {
            const revenueChart = new ApexCharts(revenueChartElement, revenueChartOptions);
            revenueChart.render();
        } catch (e) {
            console.error("charts.js: Error rendering revenue chart:", e);
        }
    }

    if (trafficChartElement) {
        const trafficChartOptions = {
            series: [44, 55, 13, 43, 22],
            chart: { type: 'pie', height: 250, toolbar: { show: false } },
            labels: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }]
        };
        try {
            const trafficChart = new ApexCharts(trafficChartElement, trafficChartOptions);
            trafficChart.render();
        } catch (e) {
            console.error("charts.js: Error rendering traffic chart:", e);
        }
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeMyCharts();
} else {
    window.addEventListener('load', initializeMyCharts);
}