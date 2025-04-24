// js/charts.js

function initializeMyCharts() {

    // Check if ApexCharts library is loaded
    if (typeof ApexCharts === 'undefined') {
        console.error("charts.js: ApexCharts library is not available when initializeMyCharts is called.");
        // Optionally retry after a delay if using async loading for ApexCharts
        // setTimeout(initializeMyCharts, 200);
        return;
    }

    // Function to get theme mode for chart styling
    const getCurrentTheme = () => {
        // Check if 'dark' class is on the html element or use localStorage preference
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        // Alternative based on theme.js potentially using localStorage:
        // return localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    };

    const commonChartOptions = {
        chart: {
            height: 250, // Adjusted default height slightly
            toolbar: {
                show: false // Hide toolbar for cleaner look in examples
            },
            background: 'transparent' // Ensure chart background is transparent
        },
        theme: {
            mode: getCurrentTheme() // Set theme based on current mode
        },
        dataLabels: {
            enabled: false // Disable data labels by default for most charts
        },
        stroke: {
            curve: 'smooth', // Default to smooth curves for line/area
            width: 2
        },
        markers: {
            size: 4,
            hover: {
                size: 6
            }
        },
        grid: {
            borderColor: getCurrentTheme() === 'dark' ? '#374151' : '#e5e7eb', // Match grid lines to theme
            strokeDashArray: 4, // Optional: dashed grid lines
            yaxis: {
                lines: {
                    show: true // Show horizontal grid lines
                }
            },
            xaxis: {
                lines: {
                    show: false // Hide vertical grid lines for cleaner look
                }
            }
        },
        tooltip: {
            theme: getCurrentTheme() // Sync tooltip theme
        }
        // Add other common configurations if needed
    };

    // --- Chart Initialization ---

    // 1. Line Chart
    const lineChartElement = document.querySelector("#line-chart");
    if (lineChartElement) {
        const lineChartOptions = {
            ...commonChartOptions, // Spread common options
            series: [{
                name: "Desktops",
                data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
            }],
            chart: { ...commonChartOptions.chart, type: 'line', zoom: { enabled: false } },
            xaxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                labels: {
                    style: {
                        colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' // Theme-based label color
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' // Theme-based label color
                    }
                }
            },
            // Override specific common options if needed
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 }
        };
        try {
            const lineChart = new ApexCharts(lineChartElement, lineChartOptions);
            lineChart.render();
            window.addEventListener('themeChanged', () => lineChart.updateOptions({ theme: { mode: getCurrentTheme() }, grid: { borderColor: getCurrentTheme() === 'dark' ? '#374151' : '#e5e7eb' }, xaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } }, yaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } }, tooltip: { theme: getCurrentTheme() } }));
        } catch (e) {
            console.error("charts.js: Error rendering line chart:", e);
        }
    } else {
        console.warn("charts.js: Element #line-chart not found.");
    }


    // 2. Area Chart
    const areaChartElement = document.querySelector("#area-chart");
    if (areaChartElement) {
        const areaChartOptions = {
            ...commonChartOptions,
            series: [{
                name: 'STOCK ABC',
                data: [30, 40, 35, 50, 49, 60, 70, 91, 125]
            }],
            chart: { ...commonChartOptions.chart, type: 'area', zoom: { enabled: false } },
            xaxis: {
                type: 'datetime',
                categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z", "2018-09-19T07:30:00.000Z", "2018-09-19T08:30:00.000Z"],
                labels: {
                    style: {
                        colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280'
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280'
                    }
                }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.3,
                    stops: [0, 90, 100]
                }
            },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 }
        };
        try {
            const areaChart = new ApexCharts(areaChartElement, areaChartOptions);
            areaChart.render();
            window.addEventListener('themeChanged', () => areaChart.updateOptions({ theme: { mode: getCurrentTheme() }, grid: { borderColor: getCurrentTheme() === 'dark' ? '#374151' : '#e5e7eb' }, xaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } }, yaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } }, tooltip: { theme: getCurrentTheme() } }));
        } catch (e) {
            console.error("charts.js: Error rendering area chart:", e);
        }
    } else {
        console.warn("charts.js: Element #area-chart not found.");
    }


    // 3. Column Chart (Original Revenue Chart)
    const revenueChartElement = document.querySelector("#revenue-chart");
    if (revenueChartElement) {
        const revenueChartOptions = {
            ...commonChartOptions,
            series: [{ name: 'Net Profit', data: [44, 55, 57, 56, 61, 58, 63, 60, 66] }, { name: 'Revenue', data: [76, 85, 101, 98, 87, 105, 91, 114, 94] }],
            chart: { ...commonChartOptions.chart, type: 'bar' }, // Type is bar for column chart
            plotOptions: { bar: { horizontal: false, columnWidth: '55%', endingShape: 'rounded' } },
            dataLabels: { enabled: false },
            stroke: { ...commonChartOptions.stroke, show: true, width: 2, colors: ['transparent'] },
            xaxis: {
                categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                labels: {
                    style: {
                        colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280'
                    }
                }
            },
            yaxis: {
                title: { text: '$ (thousands)', style: { color: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } },
                labels: {
                    style: {
                        colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280'
                    }
                }
            },
            fill: { opacity: 1 },
            tooltip: { ...commonChartOptions.tooltip, y: { formatter: function (val) { return "$ " + val + " thousands" } } }
        };
        try {
            const revenueChart = new ApexCharts(revenueChartElement, revenueChartOptions);
            revenueChart.render();
            window.addEventListener('themeChanged', () => revenueChart.updateOptions({ theme: { mode: getCurrentTheme() }, grid: { borderColor: getCurrentTheme() === 'dark' ? '#374151' : '#e5e7eb' }, xaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } }, yaxis: { title: { style: { color: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } }, labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } }, tooltip: { theme: getCurrentTheme() } }));
        } catch (e) {
            console.error("charts.js: Error rendering revenue (column) chart:", e);
        }
    } else {
        console.warn("charts.js: Element #revenue-chart not found.");
    }


    // 4. Bar Chart (Horizontal)
    const barChartElement = document.querySelector("#bar-chart");
    if (barChartElement) {
        const barChartOptions = {
            ...commonChartOptions,
            series: [{ data: [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 1380] }],
            chart: { ...commonChartOptions.chart, type: 'bar' },
            plotOptions: { bar: { borderRadius: 4, horizontal: true, } }, // Set horizontal: true
            xaxis: {
                categories: ['South Korea', 'Canada', 'United Kingdom', 'Netherlands', 'Italy', 'France', 'Japan', 'United States', 'China', 'Germany'],
                labels: {
                    style: {
                        colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280'
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280'
                    }
                }
            }
        };
        try {
            const barChart = new ApexCharts(barChartElement, barChartOptions);
            barChart.render();
            window.addEventListener('themeChanged', () => barChart.updateOptions({ theme: { mode: getCurrentTheme() }, grid: { borderColor: getCurrentTheme() === 'dark' ? '#374151' : '#e5e7eb' }, xaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } }, yaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } }, tooltip: { theme: getCurrentTheme() } }));
        } catch (e) {
            console.error("charts.js: Error rendering bar chart:", e);
        }
    } else {
        console.warn("charts.js: Element #bar-chart not found.");
    }


    // 5. Pie Chart (Original Traffic Chart)
    const trafficChartElement = document.querySelector("#traffic-chart");
    if (trafficChartElement) {
        const trafficChartOptions = {
            ...commonChartOptions,
            series: [44, 55, 13, 43, 22],
            chart: { ...commonChartOptions.chart, type: 'pie' },
            labels: ['Direct', 'Search', 'Referral', 'Social', 'Email'],
            legend: {
                position: 'bottom',
                labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' }
            },
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }]
        };
        try {
            const trafficChart = new ApexCharts(trafficChartElement, trafficChartOptions);
            trafficChart.render();
            window.addEventListener('themeChanged', () => trafficChart.updateOptions({ theme: { mode: getCurrentTheme() }, legend: { labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' } }, tooltip: { theme: getCurrentTheme() } }));
        } catch (e) {
            console.error("charts.js: Error rendering traffic (pie) chart:", e);
        }
    } else {
        console.warn("charts.js: Element #traffic-chart not found.");
    }


    // 6. Donut Chart
    const donutChartElement = document.querySelector("#donut-chart");
    if (donutChartElement) {
        const donutChartOptions = {
            ...commonChartOptions,
            series: [44, 55, 41, 17, 15],
            chart: { ...commonChartOptions.chart, type: 'donut' },
            labels: ['Apple', 'Mango', 'Orange', 'Watermelon', 'Banana'],
            legend: {
                position: 'bottom',
                labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' }
            },
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }]
        };
        try {
            const donutChart = new ApexCharts(donutChartElement, donutChartOptions);
            donutChart.render();
            window.addEventListener('themeChanged', () => donutChart.updateOptions({ theme: { mode: getCurrentTheme() }, legend: { labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' } }, tooltip: { theme: getCurrentTheme() } }));
        } catch (e) {
            console.error("charts.js: Error rendering donut chart:", e);
        }
    } else {
        console.warn("charts.js: Element #donut-chart not found.");
    }


    // 7. Radial Bar Chart
    const radialBarChartElement = document.querySelector("#radialbar-chart");
    if (radialBarChartElement) {
        const radialBarOptions = {
            ...commonChartOptions,
            series: [76, 67, 61, 90], // Percentages
            chart: { ...commonChartOptions.chart, type: 'radialBar' },
            plotOptions: {
                radialBar: {
                    offsetY: 0,
                    startAngle: 0,
                    endAngle: 270,
                    hollow: {
                        margin: 5,
                        size: '30%',
                        background: 'transparent', // Use transparent background
                        image: undefined,
                    },
                    dataLabels: {
                        name: { show: false }, // Hide names like 'series-1'
                        value: { show: false }, // Hide individual values
                        total: {
                            show: true, // Show the total/average if desired
                            label: 'Total',
                            formatter: function (w) {
                                // Example calculation: Average of the series
                                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                const average = total / w.globals.series.length;
                                return average.toFixed(0) + '%'; // Display average percentage
                            },
                            color: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' // Label color
                        }
                    }
                }
            },
            // colors: ['#1ab7ea', '#0084ff', '#39539E', '#0077B5'], // Custom colors if needed
            labels: ['Vimeo', 'Messenger', 'Facebook', 'LinkedIn'],
            legend: {
                show: true,
                floating: true,
                fontSize: '12px',
                position: 'left',
                offsetX: 50, // Adjust position as needed
                offsetY: 15,
                labels: {
                    useSeriesColors: true,
                    colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937'
                },
                formatter: function (seriesName, opts) {
                    return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex] + '%'
                },
                itemMargin: {
                    vertical: 3
                }
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    legend: { show: false } // Hide legend on small screens
                }
            }]
        };
        try {
            const radialBarChart = new ApexCharts(radialBarChartElement, radialBarOptions);
            radialBarChart.render();
            window.addEventListener('themeChanged', () => radialBarChart.updateOptions({
                theme: { mode: getCurrentTheme() },
                plotOptions: { radialBar: { dataLabels: { total: { color: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' } } } },
                legend: { labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' } },
                tooltip: { theme: getCurrentTheme() }
            }));
        } catch (e) {
            console.error("charts.js: Error rendering radial bar chart:", e);
        }
    } else {
        console.warn("charts.js: Element #radialbar-chart not found.");
    }

    // 8. Polar Area Chart
    const polarAreaChartElement = document.querySelector("#polararea-chart");
    if (polarAreaChartElement) {
        const polarAreaOptions = {
            ...commonChartOptions,
            series: [14, 23, 21, 17, 15, 10, 12, 17, 21],
            chart: { ...commonChartOptions.chart, type: 'polarArea' },
            stroke: { colors: [getCurrentTheme() === 'dark' ? '#374151' : '#fff'] }, // Border colors between segments
            fill: { opacity: 0.8 },
            labels: ['Rose A', 'Rose B', 'Rose C', 'Rose D', 'Rose E', 'Rose F', 'Rose G', 'Rose H', 'Rose I'],
            legend: {
                position: 'bottom',
                labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' }
            },
            yaxis: {
                show: false // Hide the radial axis labels/lines for simplicity
            },
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }]
        };
        try {
            const polarAreaChart = new ApexCharts(polarAreaChartElement, polarAreaOptions);
            polarAreaChart.render();
            window.addEventListener('themeChanged', () => polarAreaChart.updateOptions({
                theme: { mode: getCurrentTheme() },
                stroke: { colors: [getCurrentTheme() === 'dark' ? '#374151' : '#fff'] },
                legend: { labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' } },
                tooltip: { theme: getCurrentTheme() }
            }));
        } catch (e) {
            console.error("charts.js: Error rendering polar area chart:", e);
        }
    } else {
        console.warn("charts.js: Element #polararea-chart not found.");
    }


    // 9. Radar Chart
    const radarChartElement = document.querySelector("#radar-chart");
    if (radarChartElement) {
        const radarOptions = {
            ...commonChartOptions,
            series: [{
                name: 'Series 1',
                data: [80, 50, 30, 40, 100, 20],
            }, {
                name: 'Series 2',
                data: [20, 30, 40, 80, 20, 80],
            }, {
                name: 'Series 3',
                data: [44, 76, 78, 13, 43, 10],
            }],
            chart: { ...commonChartOptions.chart, type: 'radar' },
            // colors: ['#FF4560', '#008FFB', '#00E396'], // Custom colors if needed
            stroke: { width: 1 },
            fill: { opacity: 0.4 },
            markers: { size: 3, strokeWidth: 1 },
            xaxis: {
                categories: ['2011', '2012', '2013', '2014', '2015', '2016'],
                labels: {
                    style: {
                        colors: [getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280'], // Array needed for radar labels
                        fontSize: '11px'
                    }
                }
            },
            yaxis: {
                show: false // Hide y-axis labels for cleaner look
            },
            legend: {
                position: 'bottom',
                labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' }
            }
        };
        try {
            const radarChart = new ApexCharts(radarChartElement, radarOptions);
            radarChart.render();
            window.addEventListener('themeChanged', () => radarChart.updateOptions({
                theme: { mode: getCurrentTheme() },
                xaxis: { labels: { style: { colors: [getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280'] } } },
                legend: { labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' } },
                tooltip: { theme: getCurrentTheme() }
            }));
        } catch (e) {
            console.error("charts.js: Error rendering radar chart:", e);
        }
    } else {
        console.warn("charts.js: Element #radar-chart not found.");
    }

    // 10. Scatter Chart
    const scatterChartElement = document.querySelector("#scatter-chart");
    if (scatterChartElement) {
        const scatterOptions = {
            ...commonChartOptions,
            series: [{
                name: "SAMPLE A",
                data: [[16.4, 5.4], [21.7, 2], [25.4, 3], [19, 2], [10.9, 1], [13.6, 3.2], [10.9, 7.4], [10.9, 0], [10.9, 8.2], [16.4, 0], [16.4, 1.8], [13.6, 0.3], [13.6, 0], [29.9, 0], [27.1, 2.3], [16.4, 0], [13.6, 3.7], [10.9, 5.2], [16.4, 6.5], [10.9, 0], [24.5, 7.1], [10.9, 0], [8.1, 4.7]]
            }, {
                name: "SAMPLE B",
                data: [[36.4, 13.4], [1.7, 11], [5.4, 8], [9, 17], [1.9, 4], [3.6, 12.2], [1.9, 14.4], [1.9, 9], [1.9, 13.2], [1.4, 7], [6.4, 8.8], [3.6, 4.3], [1.6, 10], [9.9, 2], [7.1, 15], [1.4, 0], [3.6, 13.7], [1.9, 15.2], [6.4, 16.5], [0.9, 10], [4.5, 17.1], [10.9, 10], [0.1, 14.7]]
            }],
            chart: { ...commonChartOptions.chart, type: 'scatter', zoom: { enabled: true, type: 'xy' } },
            xaxis: {
                tickAmount: 10,
                labels: {
                    formatter: function (val) { return parseFloat(val).toFixed(1) },
                    style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' }
                }
            },
            yaxis: {
                tickAmount: 7,
                labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } }
            },
            legend: {
                position: 'bottom',
                labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' }
            }
        };
        try {
            const scatterChart = new ApexCharts(scatterChartElement, scatterOptions);
            scatterChart.render();
            window.addEventListener('themeChanged', () => scatterChart.updateOptions({
                theme: { mode: getCurrentTheme() },
                grid: { borderColor: getCurrentTheme() === 'dark' ? '#374151' : '#e5e7eb' },
                xaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } },
                yaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } },
                legend: { labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' } },
                tooltip: { theme: getCurrentTheme() }
            }));
        } catch (e) {
            console.error("charts.js: Error rendering scatter chart:", e);
        }
    } else {
        console.warn("charts.js: Element #scatter-chart not found.");
    }

    // 11. Bubble Chart
    const bubbleChartElement = document.querySelector("#bubble-chart");
    if (bubbleChartElement) {
        // Helper function to generate bubble data
        function generateBubbleData(baseval, count, yrange) {
            var i = 0; var series = [];
            while (i < count) {
                var x = Math.floor(Math.random() * (750 - 1 + 1)) + 1;
                var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
                var z = Math.floor(Math.random() * (75 - 15 + 1)) + 15; // Bubble size
                series.push([x, y, z]); baseval += 86400000; i++;
            } return series;
        }

        const bubbleOptions = {
            ...commonChartOptions,
            series: [
                { name: 'Bubble1', data: generateBubbleData(new Date('11 Feb 2017 GMT').getTime(), 20, { min: 10, max: 60 }) },
                { name: 'Bubble2', data: generateBubbleData(new Date('11 Feb 2017 GMT').getTime(), 20, { min: 10, max: 60 }) },
                { name: 'Bubble3', data: generateBubbleData(new Date('11 Feb 2017 GMT').getTime(), 20, { min: 10, max: 60 }) }
            ],
            chart: { ...commonChartOptions.chart, type: 'bubble', zoom: { enabled: true, type: 'xy' } },
            dataLabels: { enabled: false },
            fill: { opacity: 0.7 },
            xaxis: {
                tickAmount: 12, type: 'category',
                labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } }
            },
            yaxis: {
                max: 70,
                labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } }
            },
            legend: {
                position: 'bottom',
                labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' }
            }
        };
        try {
            const bubbleChart = new ApexCharts(bubbleChartElement, bubbleOptions);
            bubbleChart.render();
            window.addEventListener('themeChanged', () => bubbleChart.updateOptions({
                theme: { mode: getCurrentTheme() },
                grid: { borderColor: getCurrentTheme() === 'dark' ? '#374151' : '#e5e7eb' },
                xaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } },
                yaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } },
                legend: { labels: { colors: getCurrentTheme() === 'dark' ? '#D1D5DB' : '#1F2937' } },
                tooltip: { theme: getCurrentTheme() }
            }));
        } catch (e) {
            console.error("charts.js: Error rendering bubble chart:", e);
        }
    } else {
        console.warn("charts.js: Element #bubble-chart not found.");
    }

    // 12. Heatmap Chart
    const heatmapChartElement = document.querySelector("#heatmap-chart");
    if (heatmapChartElement) {
        // Helper function to generate heatmap data
        function generateHeatmapData(count, yrange) {
            var i = 0; var series = [];
            while (i < count) {
                var x = 'W' + (i + 1).toString();
                var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
                series.push({ x: x, y: y }); i++;
            } return series;
        }

        const heatmapOptions = {
            ...commonChartOptions,
            series: [
                { name: 'Metric 1', data: generateHeatmapData(18, { min: 0, max: 90 }) },
                { name: 'Metric 2', data: generateHeatmapData(18, { min: 0, max: 90 }) },
                { name: 'Metric 3', data: generateHeatmapData(18, { min: 0, max: 90 }) },
                { name: 'Metric 4', data: generateHeatmapData(18, { min: 0, max: 90 }) },
                { name: 'Metric 5', data: generateHeatmapData(18, { min: 0, max: 90 }) }
            ],
            chart: { ...commonChartOptions.chart, type: 'heatmap' },
            dataLabels: { enabled: false },
            plotOptions: {
                heatmap: {
                    colorScale: {
                        ranges: [
                            { from: 0, to: 20, name: 'Low', color: '#00A100' },
                            { from: 21, to: 50, name: 'Medium', color: '#128FD9' },
                            { from: 51, to: 90, name: 'High', color: '#FFB200' }
                        ]
                    }
                }
            },
            xaxis: {
                type: 'category',
                labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } }
            },
            yaxis: {
                labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } }
            },
            legend: {
                show: false // Hide legend for this example, colors indicate range
            }
        };
        try {
            const heatmapChart = new ApexCharts(heatmapChartElement, heatmapOptions);
            heatmapChart.render();
            window.addEventListener('themeChanged', () => heatmapChart.updateOptions({
                theme: { mode: getCurrentTheme() },
                xaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } },
                yaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } },
                tooltip: { theme: getCurrentTheme() }
            }));
        } catch (e) {
            console.error("charts.js: Error rendering heatmap chart:", e);
        }
    } else {
        console.warn("charts.js: Element #heatmap-chart not found.");
    }

    // 13. Candlestick Chart
    const candlestickChartElement = document.querySelector("#candlestick-chart");
    if (candlestickChartElement) {
        // Sample Candlestick Data (replace with real data)
        const candlestickData = [
            { x: new Date(1538778600000), y: [6629.81, 6650.5, 6623.04, 6633.33] }, { x: new Date(1538780400000), y: [6632.01, 6643.59, 6620, 6630.11] },
            { x: new Date(1538782200000), y: [6630.71, 6648.95, 6623.34, 6635.65] }, { x: new Date(1538784000000), y: [6635.65, 6651, 6629.67, 6638.24] },
            { x: new Date(1538785800000), y: [6638.24, 6640, 6620, 6624.47] }, { x: new Date(1538787600000), y: [6624.53, 6636.03, 6621.68, 6624.31] },
            { x: new Date(1538789400000), y: [6624.61, 6632.2, 6617, 6626.02] }, { x: new Date(1538791200000), y: [6627, 6627.62, 6584.22, 6586.02] },
            { x: new Date(1538793000000), y: [6588.86, 6595.97, 6570, 6583.02] }, { x: new Date(1538794800000), y: [6583.02, 6593.99, 6575, 6587.16] }
        ];

        const candlestickOptions = {
            ...commonChartOptions,
            series: [{ data: candlestickData }],
            chart: { ...commonChartOptions.chart, type: 'candlestick' },
            xaxis: { type: 'datetime', labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } },
            yaxis: { tooltip: { enabled: true }, labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } },
            plotOptions: {
                candlestick: {
                    colors: {
                        upward: '#00B746',   // Green for price up
                        downward: '#EF403C' // Red for price down
                    }
                }
            },
            tooltip: { ...commonChartOptions.tooltip, x: { format: 'dd MMM yyyy HH:mm' } }
        };
        try {
            const candlestickChart = new ApexCharts(candlestickChartElement, candlestickOptions);
            candlestickChart.render();
            window.addEventListener('themeChanged', () => candlestickChart.updateOptions({
                theme: { mode: getCurrentTheme() },
                grid: { borderColor: getCurrentTheme() === 'dark' ? '#374151' : '#e5e7eb' },
                xaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } },
                yaxis: { labels: { style: { colors: getCurrentTheme() === 'dark' ? '#9CA3AF' : '#6B7280' } } },
                tooltip: { theme: getCurrentTheme() }
            }));
        } catch (e) {
            console.error("charts.js: Error rendering candlestick chart:", e);
        }
    } else {
        console.warn("charts.js: Element #candlestick-chart not found.");
    }


    // 14. Treemap Chart
    const treemapChartElement = document.querySelector("#treemap-chart");
    if (treemapChartElement) {
        const treemapOptions = {
            ...commonChartOptions,
            series: [
                {
                    data: [
                        { x: 'New Delhi', y: 218 }, { x: 'Mumbai', y: 149 }, { x: 'Bangalore', y: 184 },
                        { x: 'Hyderabad', y: 55 }, { x: 'Ahmedabad', y: 84 }, { x: 'Chennai', y: 111 },
                        { x: 'Kolkata', y: 70 }, { x: 'Surat', y: 47 }, { x: 'Pune', y: 101 },
                        { x: 'Jaipur', y: 80 }, { x: 'Lucknow', y: 67 }, { x: 'Kanpur', y: 98 }
                    ]
                }
            ],
            chart: { ...commonChartOptions.chart, type: 'treemap' },
            legend: { show: false },
            plotOptions: {
                treemap: {
                    distributed: true, // Use different colors for each block
                    enableShades: false, // Disable shades for flat colors
                    colorScale: { // Optional: Define specific color ranges if needed
                        // ranges: [ { from: ?, to: ?, color: ? } ]
                    }
                }
            },
            dataLabels: {
                enabled: true,
                style: { fontSize: '12px' },
                formatter: function (text, op) { return [text, op.value] }, // Show label and value
                offsetY: -4
            }
        };
        try {
            const treemapChart = new ApexCharts(treemapChartElement, treemapOptions);
            treemapChart.render();
            window.addEventListener('themeChanged', () => treemapChart.updateOptions({
                theme: { mode: getCurrentTheme() },
                tooltip: { theme: getCurrentTheme() }
            }));
        } catch (e) {
            console.error("charts.js: Error rendering treemap chart:", e);
        }
    } else {
        console.warn("charts.js: Element #treemap-chart not found.");
    }


    // --- End Chart Initialization ---

    // Optional: Add listener for theme changes to update charts
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            // Dispatch a custom event that charts can listen for
            window.dispatchEvent(new CustomEvent('themeChanged'));
        });
    }
    // Also dispatch on initial load based on system preference potentially handled by theme.js
    // Consider adding a slight delay if theme.js applies theme after initial load
    // setTimeout(() => window.dispatchEvent(new CustomEvent('themeChanged')), 100);

} // End of initializeMyCharts function


// --- Execution Logic ---
// Run the chart initialization function when the DOM is ready
// Using 'defer' on the script tag is usually sufficient, but this adds robustness.
if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
    initializeMyCharts();
} else {
    document.addEventListener('DOMContentLoaded', initializeMyCharts);
    // As a fallback if DOMContentLoaded fires before ApexCharts loads (unlikely with defer but possible):
    // window.addEventListener('load', initializeMyCharts); // Use load if DOMContentLoaded isn't enough
}