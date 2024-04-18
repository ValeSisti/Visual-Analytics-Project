import * as d3 from "d3";
import { getDataset, redrawRadviz } from "./radviz";
import { RadarChart } from "./radar";
import {
  colors,
  getPlayerData,
  isPlayerSelectedFromTable,
  selected_players_from_table,
} from "../utils";

export var dropdownChange = function () {
  var dataset = getDataset();

  //Radar ------------------------------------------------------------

  var radarChartOptions = {
    w: 300,
    h: 130,
    margin: { top: 30, right: 0, bottom: 50, left: -28 },
    levels: 6,
    roundStrokes: true,
    color: d3.scaleOrdinal().range(["#AFC52F", "#ff6600", "#2a2fd4"]),
    format: ".0f",
  };
  var players = [];
  var player_axis = [];

  d3.csv(dataset, function (d) {
    if (isPlayerSelectedFromTable(d.sofifa_id)) {
      var player_data = getPlayerData(d, colors(d.sofifa_id));
      players.push(player_data);
    }
    if (player_axis.length == 0) {
      var player_data = getPlayerData(d, colors(d.sofifa_id));
      player_axis.push(player_data);
    }
  }).then((dataset) => {
    d3.select("#radar").selectAll("svg").remove();
    let svg_radar = RadarChart(
      ".radarChart",
      players,
      player_axis,
      radarChartOptions
    );
  });

  //RadViz
  redrawRadviz();

};
