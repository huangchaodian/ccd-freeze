import * as echarts from 'echarts';
export function initLineChart2(chartDom,_rawData,title) {
    var myChart = echarts.init(chartDom);
    var option = {
        dataset: [
            {
                id: 'dataset_raw',
                source: _rawData
            },
            {
                id: 'UserLearning',
                fromDatasetId: 'dataset_raw',
                transform: {
                    type: 'filter',
                    config: {
                        and: [
                            {dimension: 'Effect', '=': 'UserLearning'}
                        ]
                    }
                }
            },
            {
                id: 'Personalization',
                fromDatasetId: 'dataset_raw',
                transform: {
                    type: 'filter',
                    config: {
                        and: [
                            {dimension: 'Effect', '=': 'Personalization'}
                        ]
                    }
                }
            },
            {
                id: 'Direct',
                fromDatasetId: 'dataset_raw',
                transform: {
                    type: 'filter',
                    config: {
                        and: [
                            {dimension: 'Effect', '=': 'Direct'}
                        ]
                    }
                }
            },
        ],
        title: {
            text: title,
        },
        tooltip: {
            order: 'valueDesc',
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            nameLocation: 'middle'
        },
        yAxis: {
            min:-0.3,
            max:0.5,
            name: 'Rate'
        },
        series: [
            {
                type: 'line',
                datasetId: 'UserLearning',
                showSymbol: false,
                encode: {
                    x: 'Day',
                    y: 'Rate',
                    itemName: 'Day',
                    tooltip: ['Effect','Rate',]
                },
                endLabel: {
                    show: true,
                    formatter: function (params) {
                        return params.value[2];
                    }
                },
            },
            {
                type: 'line',
                datasetId: 'Personalization',
                showSymbol: false,
                encode: {
                    x: 'Day',
                    y: 'Rate',
                    itemName: 'Day',
                    tooltip: ['Effect','Rate',]
                },
                endLabel: {
                    show: true,
                    formatter: function (params) {
                        return params.value[2];
                    }
                },
            },
            {
                type: 'line',
                datasetId: 'Direct',
                showSymbol: false,
                encode: {
                    x: 'Day',
                    y: 'Rate',
                    itemName: 'Day',
                    tooltip: ['Effect','Rate',]
                },
                endLabel: {
                    show: true,
                    formatter: function (params) {
                        return params.value[2];
                    }
                },

            },
        ]
    };
    myChart.setOption(option);
}

