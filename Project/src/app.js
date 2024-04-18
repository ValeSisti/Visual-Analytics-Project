import { drawRadViz } from "./views/radviz";
import drawRadar from "./views/radar";
import drawTable from "./views/table";
import { drawLC } from "./views/line_chart";
import { drawParallelCoords } from "./views/parallel_coordinates";
import { drawSP } from "./views/scatterplot";

const app = function () {
  drawRadViz();
  drawSP();
  drawRadar();
  drawParallelCoords();
  drawTable();
  drawLC();
};

export default app;
