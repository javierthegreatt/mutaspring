export class Graph {
  constructor() {
    var container = document.createElement("div");
    var cvn = document.createElement("canvas");
    var ctx = cvn.getContext("2d");

    const data = {
      labels: [],
      datasets: [
        {
          data: [],
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    };

    const config = {
      type: "line",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            text: "Score (Avg.)",
            display: true,
          },
        },
      },
    };

    this._chart = new Chart(ctx, config);
    container.appendChild(cvn);
    container.style =
      "position: fixed; bottom: 0; left: 0; width:50% !important; max-width:300px; height:25% !important; max-height:200px;";

    document.body.appendChild(container);
    container.style.display = "none";
    this._container = container;
  }

  addRunInfo(info) {
    const values = this._chart.data.labels.length;

    if (values == 0) {
      this._container.style.display = "block";
      this._chart.update();
    }

    this._chart.data.labels[values] = info.generation;
    this._chart.data.datasets[0].data[values] = info.score;
    this._chart.update();
  }
}
