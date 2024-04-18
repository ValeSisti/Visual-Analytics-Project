import * as d3 from "d3";
import dataset from "../dataset/players_22_parallel_coordinates.csv";
import {
  addPlayerSelectedFromPC,
  isPlayerSelectedFromPC,
  removePlayerSelectedFromPC,
  emptySelectionFromPC,
  isCheckboxSelected,
  isPlayerSelectedFromTable,
  selected_players_from_table,
  selected_players_data,
  colorByRole,
} from "../utils";
import {
  updateFromParallelCoords,
  updateParallelCoordsFromTable,
} from "./update_functions";


const svgWidth = 2000,
  svgHeight = 790,
  margin = { top: 50, right: 0, bottom: 30, left: 80 },
  width = svgWidth - margin.left - margin.right,
  height = svgHeight - margin.top - margin.bottom;

var x,
  y = {},
  dimensions,
  dragging = {},
  background,
  foreground;

export const drawParallelCoords = function () {
  var div = d3
    .select("#parallelcoords")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  var svg = d3
    .select("#parallelcoords")
    .append("svg")
    .attr("viewBox", [
      0,
      0,
      width + margin.left + margin.right,
      height + margin.top + margin.bottom,
    ])
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.csv(dataset, function (d) {
    if (isCheckboxSelected(d.Positions)) {
      return d;
    }
  }).then(function (data) {
    const color = d3
      .scaleOrdinal()
      .domain(["Forward", "Midfielder", "Defender", "Goalkeeper"])
      .range([
        d3.schemeCategory10[1],
        d3.schemeCategory10[2],
        d3.schemeCategory10[6],
        d3.schemeCategory10[9],
      ]);
    // Here I set the list of dimension manually to control the order of axis:

    // Extract the list of dimensions as keys and create a y scale for each.

    dimensions = Object.keys(data[0]).filter(function (key) {
      if (key !== "") {
        y[key] = d3
          .scaleLinear()
          .domain(
            d3.extent(data, function (d) {
              return +d[key];
            })
          )
          .range([height, 0]);
        return key;
      }
    });

    dimensions.shift(); //droppiamo sofifa_id
    dimensions.shift(); //droppiamo short_name

    // For each dimension, I build a linear scale. I store all in a y object

    for (var i in dimensions) {
      name = dimensions[i];
      if (name == "League" || name == "Positions") {
        y[name] = d3
          .scalePoint()
          .domain(
            data.map(function (d) {
              return d[name];
            })
          )
          .range([height - margin.bottom, margin.top]);
      } else {
        y[name] = d3
          .scaleLinear()
          .domain(
            d3.extent(data, function (d) {
              return +d[name];
            })
          )
          .range([height - margin.bottom, margin.top]);
      }
    }

    // Creata a x scale for each dimension
    x = d3
      .scalePoint()
      .domain(dimensions)
      .padding(1)
      .range([margin.left, width - margin.right]);

    // Add grey background lines for context.
    background = svg
      .append("g")
      .attr("class", "background")
      .selectAll("path")
      .data(data, (d) => {
        return d.sofifa_id;
      })

      .enter()
      .append("path")
      .attr("d", line)
      .attr("id", function (d) {
        return "line_bg_" + d.sofifa_id;
      })
      .style("stroke-width", "2px");

    // Add blue foreground lines for focus.
    foreground = svg
      .append("g")
      .attr("class", "foreground")
      .selectAll("path")
      .data(data, (d) => {
        return d.sofifa_id;
      })
      .enter()
      .append("path")
      .attr("d", line)
      .attr("class", function (d) {
        return "line_pc " + d.Positions;
      })
      .attr("id", function (d) {
        return "line_pc_" + d.sofifa_id;
      })
      .style("stroke", function (d) {
        return color(d.Positions);
      })
      .style("stroke-width", "2px")
      .style("opacity", "1")
      .on("mouseover", highlight)
      .on("mouseleave", doNotHighlight);

    // Add a group element for each dimension.
    var g = svg
      .selectAll(".dimension")
      .data(dimensions, (d) => {
        return d;
      })
      .enter()
      .append("g")
      .attr("class", "dimension")
      .attr("transform", function (d) {
        return "translate(" + x(d) + ")";
      })
      .call(
        d3
          .drag()
          .on("start", function (event, d) {
            var foreground = d3.select(".foreground").selectAll("path");
            var background = d3.select(".background").selectAll("path");

            dragging[d] = x(d);
            background.attr("visibility", "hidden");
          })
          .on("drag", function (event, d) {
            var foreground = d3.select(".foreground").selectAll("path");
            var background = d3.select(".background").selectAll("path");
            dragging[d] = Math.min(width, Math.max(0, event.x));
            foreground.attr("d", line);
            dimensions.sort(function (a, b) {
              return position(a) - position(b);
            });
            x.domain(dimensions);
            g.attr("transform", function (d) {
              return "translate(" + position(d) + ")";
            });
          })
          .on("end", function (event, d) {
            var foreground = d3.select(".foreground").selectAll("path");
            var background = d3.select(".background").selectAll("path");
            delete dragging[d];
            transition(d3.select(this)).attr(
              "transform",
              "translate(" + x(d) + ")"
            );
            transition(foreground).attr("d", line);
            background
              .attr("d", line)
              .transition()
              //.delay(500)
              .duration(0)
              .attr("visibility", null);
          })
      );

    // Add an axis and title.
    g.append("g")
      .data(dimensions, function (d) {
        return d;
      })
      .attr("class", "axis")
      .each(function (d) {
        d3.select(this).call(d3.axisLeft().scale(y[d]));
      })
      .style("font-size", "18px") 
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function (d) {
        return d;
      })
      .style("font-size", "23px") 
      .style("fill", "white");

    // Add and store a brush for each axis.
    g.append("g")
      .attr("class", "brush")
      .each(function (d) {
        d3.select(this).call(
          (y[d].brush = d3
            .brushY()
            .extent([
              [-10, margin.top - 10],
              [10, height - margin.bottom + 10],
            ])
            .on("start", brushstart)
            .on("brush", brush)
            .on("end", brushended))
        );
      })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);
  });

  function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
  }

  function transition(g) {
    return g.transition().duration(500);
  }

  // Take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function line(d) {
    return d3.line()(
      dimensions.map(function (key) {
        return [x(key), y[key](d[key])];
      })
    );
  }

  function brushstart(event) {
    event.sourceEvent.stopPropagation();
  }

  // Handles a brush event, toggling the display of foreground lines.
  function brush() {
    // Get a set of dimensions with active brushes and their current extent.
    var actives = [];

    svg
      .selectAll(".brush")
      .filter(function (d) {
        return d3.brushSelection(this);
      })
      .each(function (key) {
        actives.push({
          dimension: key,
          extent: d3.brushSelection(this),
        });
      });

    var background = d3
      .select("#parallelcoords")
      .select("svg")
      .select("g")
      .select(".background")
      .style("opacity", 1);

    // Change line visibility based on brush extent.
    var foreground = d3.select(".foreground").selectAll("path");
    if (actives.length === 0) {
      emptySelectionFromPC();
      foreground
        .style("display", null)
        .style("stroke", function (d) {
          return colorByRole[d.Positions];
        })
        .style("stroke-width", "2px")
        .style("opacity", "1");
    } else {
      foreground.style("display", function (d) {
        if (isPlayerSelectedFromTable(d.sofifa_id)) {
          return null;
        } else {
          return actives.every(function (brushObj) {
            return (
              brushObj.extent[0] <=
                y[brushObj.dimension](d[brushObj.dimension]) &&
              y[brushObj.dimension](d[brushObj.dimension]) <= brushObj.extent[1]
            );
          })
            ? null
            : "none";
        }
      });
    }
    updateParallelCoordsFromTable();
  }
  // Handles a brush event, toggling the display of foreground lines.
  function brushended() {
    // Get a set of dimensions with active brushes and their current extent.
    var actives = [];
    svg
      .selectAll(".brush")
      .filter(function (d) {
        return d3.brushSelection(this);
      })
      .each(function (key) {
        actives.push({
          dimension: key,
          extent: d3.brushSelection(this),
        });
      });

    // Change line visibility based on brush extent.
    var foreground = d3.select(".foreground").selectAll("path");
    if (actives.length === 0) {
      emptySelectionFromPC();
      foreground
        .style("display", null)
        .style("stroke", function (d) {
          return colorByRole[d.Positions];
        })
        .style("stroke-width", "2px")
        .style("opacity", "1");
    } else {
      foreground.style("display", function (d) {
        var isSelected = actives.every(function (brushObj) {
          return (
            brushObj.extent[0] <=
              y[brushObj.dimension](d[brushObj.dimension]) &&
            y[brushObj.dimension](d[brushObj.dimension]) <= brushObj.extent[1]
          );
        });
        if (isSelected) {
          if (!isPlayerSelectedFromPC(d.sofifa_id)) {
            addPlayerSelectedFromPC(d.sofifa_id);
          }

          return null;
        } else {
          d3.select("#sp_circle_" + d.sofifa_id).attr("class", "non_brushed");
          if (isPlayerSelectedFromPC(d.sofifa_id)) {
            removePlayerSelectedFromPC(d.sofifa_id);
          }

          return "none";
        }
      });
    }
    updateFromParallelCoords();
    updateParallelCoordsFromTable();
  }
};

// Highlight the specie that is hovered
export function highlight(event, d) {
  var selected_player = d.sofifa_id;
  // first every group turns grey
  if (selected_players_from_table.length > 0) {
    d3.select("#parallelcoords")
      .select("svg")
      .select("g")
      .select(".background")
      .style("opacity", 0);
  }

  d3.selectAll(".line_pc")
    .style("stroke", "grey")
    .style("stroke-width", "1px")
    .style("opacity", "0.1");
  // Second the hovered specie takes its color
  d3.select("#line_pc_" + selected_player)
    .style("stroke", colorByRole[d.Positions])
    .style("stroke-width", "7px")
    .style("opacity", "1")
    .raise();

  selected_players_data.forEach(function (player_data) {
    d3.select("#line_pc_" + player_data.sofifa_id)
      .style("stroke", colorByRole[player_data.role])
      .style("stroke-width", "10px")
      .style("opacity", "1")
      .raise();

    d3.select("#line_bg_" + player_data.sofifa_id)
      .style("stroke", "black")
      .style("stroke-width", "13px")
      .style("opacity", "1")
      .raise();
  });

  var div = d3.select("#parallelcoords").select(".tooltip");

  div.transition().duration(200).style("opacity", 0.9);
  div
    .html(d.short_name)
    .style("left", event.pageX + "px")
    .style("top", event.pageY - 28 + "px");
}

// Unhighlight
export function doNotHighlight(event, d) {
  if (selected_players_from_table.length > 0) {
    d3.select("#parallelcoords")
      .select("svg")
      .select("g")
      .select(".background")
      .style("opacity", 1);
  }

  d3.selectAll(".line_pc")
    .style("stroke", function (d) {
      return colorByRole[d.Positions];
    })
    .style("stroke-width", "2px")
    .style("opacity", "1");
  selected_players_data.forEach(function (player_data) {
    d3.select("#line_pc_" + player_data.sofifa_id)
      .style("stroke", colorByRole[player_data.role])
      .style("stroke-width", "10px")
      .style("opacity", "1");

    d3.select("#line_bg_" + player_data.sofifa_id)
      .style("stroke", "black")
      .style("stroke-width", "13px")
      .style("opacity", "1")
      .raise(); 
  });
  var div = d3.select("#parallelcoords").select(".tooltip");

  div.transition().duration(500).style("opacity", 0);
}
