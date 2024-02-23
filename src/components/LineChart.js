import * as echarts from 'echarts';
export function initLineChart(chartDom,_rawData) {
    var myChart = echarts.init(chartDom);
    var option = {
        dataset: [
            {
                id: 'dataset_raw',
                source: _rawData
            },
            {
                id: 'CCD',
                fromDatasetId: 'dataset_raw',
                transform: {
                    type: 'filter',
                    config: {
                        and: [
                            {dimension: 'Method', '=': 'CCD'}
                        ]
                    }
                }
            },
            {
                id: 'CCD-NoRecommend',
                fromDatasetId: 'dataset_raw',
                transform: {
                    type: 'filter',
                    config: {
                        and: [
                            {dimension: 'Method', '=': 'CCD-NoRecommend'}
                        ]
                    }
                }
            },
            {
                id: 'Cluster-CCD',
                fromDatasetId: 'dataset_raw',
                transform: {
                    type: 'filter',
                    config: {
                        and: [
                            {dimension: 'Method', '=': 'Cluster-CCD'}
                        ]
                    }
                }
            },
            {
                id: 'CCD-Freeze',
                fromDatasetId: 'dataset_raw',
                transform: {
                    type: 'filter',
                    config: {
                        and: [
                            {dimension: 'Method', '=': 'CCD-Freeze'}
                        ]
                    }
                }
            },
            {
                id: 'CCD-Switch',
                fromDatasetId: 'dataset_raw',
                transform: {
                    type: 'filter',
                    config: {
                        and: [
                            {dimension: 'Method', '=': 'CCD-Switch'}
                        ]
                    }
                }
            }
        ],
        title: {
            text: 'average watch rate of treated users'
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
            min:0.3,
            max:0.8,
            name: 'Rate'
        },
        series: [
            {
                type: 'line',
                datasetId: 'CCD-NoRecommend',
                showSymbol: false,
                encode: {
                    x: 'Day',
                    y: 'Rate',
                    labelName:['Method'],
                    itemName: 'Day',
                    tooltip: ['Method','Rate',]
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
                datasetId: 'CCD',
                showSymbol: false,
                encode: {
                    x: 'Day',
                    y: 'Rate',
                    labelName:['Method'],
                    itemName: 'Day',
                    tooltip: ['Method','Rate',]
                },
                endLabel: {
                    show: true,
                    formatter: function (params) {
                        return params.value[2] ;
                    }
                },
            },
            {
                type: 'line',
                datasetId: 'Cluster-CCD',
                showSymbol: false,
                encode: {
                    x: 'Day',
                    y: 'Rate',
                    labelName:['Method'],
                    itemName: 'Day',
                    tooltip: ['Method','Rate',]
                },
                endLabel: {
                    show: true,
                    formatter: function (params) {
                        return params.value[2] ;
                    }
                },
            },
            {
                type: 'line',
                datasetId: 'CCD-Switch',
                showSymbol: false,
                encode: {
                    x: 'Day',
                    y: 'Rate',
                    labelName:['Method'],
                    itemName: 'Day',
                    tooltip: ['Method','Rate',]
                },
                endLabel: {
                    show: true,
                    formatter: function (params) {
                        return params.value[2] ;
                    }
                },
            },
            {
                type: 'line',
                datasetId: 'CCD-Freeze',
                showSymbol: false,
                encode: {
                    x: 'Day',
                    y: 'Rate',
                    labelName:['Method'],
                    itemName: 'Day',
                    tooltip: ['Method','Rate',]
                },
                endLabel: {
                    show: true,
                    formatter: function (params) {
                        return params.value[2];
                    }
                },
            }
        ]
    };
    myChart.setOption(option);
}

