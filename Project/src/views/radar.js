import * as d3 from "d3";
import {
  getPlayerData,
  isPlayerSelectedFromTable,
  selected_players_data,
  colors,
} from "../utils";
import { dropdownChange } from "./dropdown_stats";
import { getDataset } from "./radviz";

var margin = { top: 30, right: 0, bottom: 50, left: -28 },
  width = Math.min(400, window.innerWidth / 4) - margin.left - margin.right,
  height = Math.min(width, window.innerHeight - margin.top - margin.bottom);

var radarChartOptions = {
  w: 300,
  h: 130,
  margin: margin,
  levels: 6,
  roundStrokes: true,
  format: ".0f",
};

var players = [];
var player_axis = [];

function drawRadar() {
  var dataset = getDataset();

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
    // Draw the chart, get a reference the created svg element :
    var dropdown = d3.select("#dropdown_stats").on("change", dropdownChange);
    var div = d3
      .select(".radarChart")
      .append("div")
      .attr("class", "tooltip_player_radar")
      .style("opacity", 0);
    var div_value = d3
      .select(".radarChart")
      .append("div")
      .attr("class", "tooltip_value")
      .style("opacity", 0);
    let svg_radar = RadarChart(
      ".radarChart",
      players,
      player_axis,
      radarChartOptions
    );
  });
}

const max = Math.max;
const sin = Math.sin;
const cos = Math.cos;
const HALF_PI = Math.PI / 2;

export var RadarChart = function RadarChart(
  parent_selector,
  data,
  player_axis,
  options
) {
  const wrap = (text, width) => {
    text.each(function () {
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.4, // ems
        y = text.attr("y"),
        x = text.attr("x"),
        dy = parseFloat(text.attr("dy")),
        tspan = text
          .text(null)
          .append("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", dy + "em");

      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text
            .append("tspan")
            .attr("x", x)
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "em")
            .text(word);
        }
      }
    });
  }; //wrap

  const cfg = {
    w: 600, //Width of the circle
    h: 600, //Height of the circle
    margin: { top: 20, right: 20, bottom: 20, left: 20 }, //The margins of the SVG
    levels: 3, //How many levels or inner circles should there be drawn
    maxValue: 100, //What is the value that the biggest circle will represent
    labelFactorX: 1.5, //How much farther than the radius of the outer circle should the labels be placed
    labelFactorY: 1.25, //How much farther than the radius of the outer circle should the labels be placed
    wrapWidth: 60, //The number of pixels after which a label needs to be given a new line
    opacityArea: 0.35, //The opacity of the area of the blob
    dotRadius: 3, //The size of the colored circles of each blog
    opacityCircles: 0.1, //The opacity of the circles of each blob
    strokeWidth: 2, //The width of the stroke around each blob
    roundStrokes: false, //If true the area and stroke will follow a round path (cardinal-closed)
    color: d3.scaleOrdinal(d3.schemeCategory10), //Color function,
    format: ".2%",
    unit: "",
    legend: false,
  };

  //Put all of the options into a variable called cfg
  if ("undefined" !== typeof options) {
    for (var i in options) {
      if ("undefined" !== typeof options[i]) {
        cfg[i] = options[i];
      }
    } //for i
  } //if

  //If the supplied maxValue is smaller than the actual one, replace by the max in the data

  let maxValue = 0;
  for (let j = 0; j < data.length; j++) {
    for (let i = 0; i < data[j].axes.length; i++) {
      data[j].axes[i]["id"] = parseInt(data[j].sofifa_id);
      if (parseInt(data[j].axes[i]["value"]) > maxValue) {
        maxValue = parseInt(data[j].axes[i]["value"]);
      }
    }
  }
  maxValue = max(cfg.maxValue, maxValue);
  const allAxis = player_axis[0].axes.map((i, j) => i.axis), //Names of each axis
    total = allAxis.length, //The number of different axes
    radius = Math.min(cfg.w / 2, cfg.h / 2), //Radius of the outermost circle
    Format = d3.format(cfg.format), //Formatting
    angleSlice = (Math.PI * 2) / total; //The width in radians of each "slice"
  //Scale for the radius
  const rScale = d3.scaleLinear().range([0, radius]).domain([0, maxValue]);

  /////////////////////////////////////////////////////////
  //////////// Create the container SVG and g /////////////
  /////////////////////////////////////////////////////////
  const parent = d3.select(parent_selector);

  //Remove whatever chart with the same id/class was present before
  parent.select("svg").remove();

  //Initiate the radar chart SVG
  let svg = parent
    .append("svg")
    .attr("viewBox", [
      0,
      0,
      cfg.w + cfg.margin.left + cfg.margin.right,
      cfg.h + cfg.margin.top + cfg.margin.bottom,
    ])
    .attr("class", "radar");

  //Append a g element
  let g = svg
    .append("g")
    .attr(
      "transform",
      "translate(" +
        (cfg.w / 2 + cfg.margin.left) +
        "," +
        (cfg.h / 2 + cfg.margin.top) +
        ")"
    );

  /////////////////////////////////////////////////////////
  /////////////// Draw the Circular grid //////////////////
  /////////////////////////////////////////////////////////

  //Wrapper for the grid & axes
  let axisGrid = g.append("g").attr("class", "axisWrapper");

  //Draw the background circles
  axisGrid
    .selectAll(".levels")
    .data(d3.range(1, cfg.levels + 1).reverse())
    .enter()
    .append("circle")
    .attr("class", "gridCircle")
    .attr("r", (d) => (radius / cfg.levels) * d)
    .style("fill", "none")
    .style("stroke", "#CDCDCD")
    .style("stroke-opacity", 0.3);

  //Text indicating at what % each level is
  axisGrid
    .selectAll(".axisLabel")
    .data(d3.range(1, cfg.levels + 1).reverse())
    .enter()
    .append("text")
    .attr("class", "axisLabel")
    .attr("x", 4)
    .attr("y", (d) => (-d * radius) / cfg.levels)
    .attr("dy", "0.4em")
    .style("font-size", "8px")
    .attr("fill", "#eeeeee")
    .text((d) => Format((maxValue * d) / cfg.levels) + cfg.unit);

  /////////////////////////////////////////////////////////
  //////////////////// Draw the axes //////////////////////
  /////////////////////////////////////////////////////////

  //Create the straight lines radiating outward from the center
  var axis = axisGrid
    .selectAll(".axis")
    .data(allAxis)
    .enter()
    .append("g")
    .attr("class", "axis");
  //Append the lines
  axis
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr(
      "x2",
      (d, i) => rScale(maxValue * 1.1) * cos(angleSlice * i - HALF_PI)
    )
    .attr(
      "y2",
      (d, i) => rScale(maxValue * 1.1) * sin(angleSlice * i - HALF_PI)
    )
    .attr("class", "line")
    .style("stroke", "white")
    .style("stroke-width", "1.5px");

  //Append the labels at each axis
  axis
    .append("text")
    .attr("class", "legend")
    .style("font-size", "7px")
    .attr("fill", "#eeeeee")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr(
      "x",
      (d, i) =>
        rScale(maxValue * cfg.labelFactorX) * cos(angleSlice * i - HALF_PI)
    )
    .attr(
      "y",
      (d, i) =>
        rScale(maxValue * cfg.labelFactorY) * sin(angleSlice * i - HALF_PI)
    )
    .text((d) => d)
    .call(wrap, cfg.wrapWidth);

  /////////////////////////////////////////////////////////
  ///////////// Draw the radar chart blobs ////////////////
  /////////////////////////////////////////////////////////

  //The radial line function
  const radarLine = d3
    .radialLine()
    .curve(d3.curveLinearClosed)
    .radius((d) => rScale(d.value))
    .angle((d, i) => i * angleSlice);

  if (cfg.roundStrokes) {
    radarLine.curve(d3.curveCardinalClosed);
  }

  //Create a wrapper for the blobs
  const blobWrapper = g
    .selectAll(".radarWrapper")
    .data(data, (d) => {
      return d["sofifa_id"];
    })
    .enter()
    .append("g")
    .attr("class", "radarWrapper")
    .attr("id", (d) => "rw-" + String(d.sofifa_id));

  blobWrapper
    .on("mouseover", function (event, d) {
      d3.selectAll(".radarWrapper")
        .transition()
        .duration(200)
        .style("opacity", 0.3);

      d3.select("#rw-" + String(d.sofifa_id))
        .transition()
        .duration(200)
        .style("opacity", 1);
      var div = d3.select(".radarChart").select(".tooltip_player_radar");
      div.transition().duration(200).style("opacity", 0.9);
      div
        .html(d.short_name)
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px")
        .style("background", d.color);
    })
    .on("mouseout", () => {
      //Bring back all blobs
      d3.selectAll(".radarWrapper")
        .transition()
        .duration(200)
        .style("opacity", 1);
      var div = d3.select(".radarChart").select(".tooltip_player_radar");
      div.transition().duration(500).style("opacity", 0);
    });

  //Create the outlines
  blobWrapper
    .append("path")
    .attr("class", "radarStroke")
    .attr("d", function (d, i) {
      return radarLine(d.axes);
    })
    .style("stroke-width", cfg.strokeWidth + "px")
    .style("stroke", (d, i) => d.color)
    .style("fill", "none");

  //Append the circles
  var circleColor;
  blobWrapper
    .selectAll(".radarCircle")
    .data((d) => {
      return d.axes;
    })
    .enter()
    .append("circle")
    .attr("class", "radarCircle")
    .attr("r", function (d, i, n) {
      return cfg.dotRadius;
    })
    .attr("cx", (d, i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
    .attr("cy", (d, i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
    .style("fill", (d) => {
      return d.color;
    })
    .style("fill-opacity", 0.8);

  /////////////////////////////////////////////////////////
  //////// Append invisible circles for tooltip ///////////
  /////////////////////////////////////////////////////////

  //Wrapper for the invisible circles on top
  const blobCircleWrapper = g
    .selectAll(".radarCircleWrapper")
    .data(data, (d) => d["sofifa_id"])
    .enter()
    .append("g")
    .attr("class", "radarCircleWrapper");

  //Append a set of invisible circles on top for the mouseover pop-up
  blobCircleWrapper
    .selectAll(".radarInvisibleCircle")
    .data((d) => d.axes)
    .enter()
    .append("circle")
    .attr("class", "radarInvisibleCircle")
    .attr("r", cfg.dotRadius * 1.5)
    .attr("cx", (d, i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
    .attr("cy", (d, i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", function (event, d) {
      var div_value = d3.select(".radarChart").select(".tooltip_value");
      div_value.transition().duration(200).style("opacity", 0.9);
      div_value
        .html(Math.trunc(d.value))
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      var div_value = d3.select(".radarChart").select(".tooltip_value");
      div_value.transition().duration(500).style("opacity", 0);
    });

  const tooltip = g
    .append("text")
    .attr("class", "tooltip")
    .attr("x", 0)
    .attr("y", 0)
    .style("font-size", "10px")
    .style("fill", "#eeeeee")
    .style("display", "none")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em");

  if (cfg.legend !== false && typeof cfg.legend === "object") {
    let legendZone = svg.append("g");
    let names = data.map((el) => el.sofifa_id);
    if (cfg.legend.title) {
      let title = legendZone
        .append("text")
        .attr("class", "title")
        .attr(
          "transform",
          `translate(${cfg.legend.translateX},${cfg.legend.translateY - 50})`
        )
        .attr("x", cfg.w - 70)
        .attr("y", 10)
        .attr("font-size", "10px")
        .attr("fill", "#404040")
        .text(cfg.legend.title);
    }
    let legend = legendZone
      .append("g")
      .attr("class", "legend")
      .attr("height", 100)
      .attr("width", 200)
      .attr(
        "transform",
        `translate(${cfg.legend.translateX},${cfg.legend.translateY - 30})`
      );
    // Create rectangles markers
    legend
      .selectAll("rect")
      .data(names)
      .enter()
      .append("rect")
      .attr("x", cfg.w - 65)
      .attr("y", (d, i) => i * 20)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", (d, i) => cfg.color(i));
    // Create labels
    legend
      .selectAll("text")
      .data(names)
      .enter()
      .append("text")
      .attr("x", cfg.w - 52)
      .attr("y", (d, i) => i * 20 + 9)
      .attr("font-size", "8px")
      .attr("fill", "#737373")
      .text((d) => d);
  }
  return svg;
};

export function updateRadarLegend() {
  var legend_data = [];

  for (var i = 0; i < selected_players_data.length; i++) {
    legend_data.push({
      sofifa_id: selected_players_data[i].sofifa_id,
      text: selected_players_data[i].name,
      color: colors(selected_players_data[i].sofifa_id),
    });
  }

  var legend_elements = d3
    .select("#legend-radar")
    .selectAll(".legend-elem-radar")
    .data(legend_data, function (d) {
      return d.sofifa_id;
    });

  legend_elements.join(
    (enter) => {
      var legend_elem = enter
        .append("div")
        .attr("class", "legend-elem-radar")
        .attr("id", function (d) {
          return "lcr_" + d.sofifa_id;
        });
      legend_elem
        .append("svg")
        .attr("id", "circle-radar")
        .style("background", function (d) {
          return d.color;
        });

      legend_elem.append("text").text(function (d) {
        return d.text;
      });
    },
    (update) => {
      var legend_elem = update.selectAll(".legend-elem-radar");
      legend_elem.select("#circle-radar").style("background", function (d) {
        return d.color;
      });

      legend_elem.select("text").text(function (d) {
        return d.text;
      });
    },
    (exit) => {
      exit.transition().duration(500).style("opacity", 0).remove();
    }
  );
}

export default drawRadar;
