import { Component, OnInit, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartDataset, ChartType, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'wisdom-water-demand-prediction',
  imports: [BaseChartDirective],
  templateUrl: './water-demand-prediction.component.html',
  styles: ``
})
export class WaterDemandPredictionComponent implements OnInit {

  ngOnInit() {
    this.addGraphToChart(this.test_data, "Test")
    this.addGraphToChart(this.test_data_2, "Testoman")

  }

  test_data: number[] = [1,2,3,4,5,6,7,8,9]
  test_data_2: number[] = [5,6,7,8,9,10,11,12]


  /**
   * The chart object, referenced from the html template
   */
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  /**
   * type of graph to use in chart
   */
  chartType: ChartType = 'line';

  /**
   * options used for the line chart to visualize prediction values
   */
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      y: {
        stacked: false,
        title: {
          display: true,
          text: "m^3"
        },
        grid: {
          display: true, // Show grid lines on the y-axis
          color: '#000000', // Customize the grid line color '#e0e0e0'
          lineWidth: 0.2, // Set the width of the grid lines
        },
      },
      x: {
        title: {
          display: true,
          text: "Time"
        },
        grid: {
          display: false, // Show grid lines on the y-axis
          color: '#000000', // Customize the grid line color
          lineWidth: 0.2, // Set the width of the grid lines
        },
      }
    },
  };

   /**
   * color of the ng2chart
   */
   chartColor: string = '#ffffff';

   backgroundPlugin: Plugin<'bar'> = {
    id: 'custom_canvas_background_color',
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      ctx.save();
      ctx.fillStyle = this.chartColor; // Set the background color to white
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    }
  };

  chartPlugins = [this.backgroundPlugin];

  /**
   * standard xAxis labels for prediction values
   */
  standardLabels: string[] = ['01:00', '02:00', '03:00',
    '04:00', '05:00', '06:00', '07:00',
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00']

  /**
   * data skeleton for the line graph
   */
  chartData: ChartData<'line'> = {
    labels: this.standardLabels, // X-axis labels
    datasets: [], // data points
  };

/**
   * Function to add new lines dynamically to the graph
   * @param label new data label
   * @param dataPoints the new prediction values
   * @param borderColor color to use
   */
addGraphToChart(dataPoints: number[], label: string): void {
  // Create a new dataset
  const newDataset: ChartDataset<'line'> = {
    label: label,
    data: dataPoints,
    borderColor: this.generateRandomColor(),
    fill: false,
  };

  // Add the new dataset to the existing chart data
  this.chartData.datasets.push(newDataset);

  // Update the chart to reflect the changes
  if (this.chart) {
    this.chart.update();
  }
}

/**
 * generate a random color from the color wheel
 * @returns random color code as string
 */
generateRandomColor(): string {
  const r = Math.floor(Math.random() * 256); // Random red value (0-255)
  const g = Math.floor(Math.random() * 256); // Random green value (0-255)
  const b = Math.floor(Math.random() * 256); // Random blue value (0-255)

  return `rgb(${r}, ${g}, ${b})`; // Return the color in rgb() format
}

}
