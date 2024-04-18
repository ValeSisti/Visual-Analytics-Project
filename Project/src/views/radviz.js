import * as d3 from "d3";
import { radviz, radvizDA } from "d3-radviz";
import {
  colorByRole,
  isPlayerSelected,
  isPlayerSelectedFromPC,
  isPlayerSelectedFromTable,
  selected_players,
  selected_players_from_pc,
  selected_players_from_table,
} from "../utils";
import { dropdownChange } from "./dropdown_stats";
import { updateRadviz, updateRadvizColors } from "./update_functions";
import datasetAttack from "../dataset/players_22_attack.csv";
import datasetDefending from "../dataset/players_22_defending.csv";
import datasetPhysic from "../dataset/players_22_physic.csv";
import datasetGoalkeeper from "../dataset/players_22_gk.csv";
import datasetOverall from "../dataset/players_22_overall.csv";
import starting_overall from "../dataset/overall.csv";
import starting_attack from "../dataset/attack.csv";
import starting_defending from "../dataset/defending.csv";
import starting_gk from "../dataset/gk.csv";
import starting_physic from "../dataset/physic.csv";

export var rad;

d3.selectAll('input[name="radio_radviz"]').on("change", function () {
  updateRadvizColors();
});

d3.select("#selected_button").on("click", function () {
  let entries_selected = [];
  let dimensions_set = [];
  rad.data().dimensions.forEach(function () {
    dimensions_set.push([]);
  });

  rad.data().entries.forEach(function (p, i) {
    if (isPlayerSelectedFromTable(p.original.sofifa_id)) {
      entries_selected.push(p);
      rad.data().dimensions.forEach(function (v, j) {
        dimensions_set[j].push(p.dimensions[v.id]);
      });
    }
  });

  let subset_selected = Object.assign({}, rad.data());
  subset_selected.entries = entries_selected;
  if (dimensions_set[0].length < 2) {
    alert("You should select at least 2 players from the list");
  } else {
    rad.updateRadviz(radvizDA.minEffectivenessErrorHeuristic(subset_selected));
    d3.selectAll(".data_point").attr("id", (d) => {
      d.id = d.original.sofifa_id;
      return "rp_" + d.original.sofifa_id;
    });

    d3.selectAll(".data_point").each(function (d) {
      if (isPlayerSelectedFromTable(d.original.sofifa_id)) {
        d3.select("#rp_" + d.original.sofifa_id)
          .style("stroke-width", 0.5)
          .style("stroke-opacity", 1)
          .raise()
          .attr("r", 2.5);
      }
    });

    updateRadviz();
  }
});

d3.select("#reset_button").on("click", function () {
  rad.updateRadviz(radvizDA.minEffectivenessErrorHeuristic(rad.data()));
  d3.selectAll(".data_point").attr("id", (d) => {
    d.id = d.original.sofifa_id;
    return "rp_" + d.original.sofifa_id;
  });
  updateRadviz();
});

export function getDataset() {
  var selected_dataset;
  var selectedVal = d3.select("#dropdown_stats").property("value");

  if (d3.select("#all_checkbox").property("checked")) {
    if (selectedVal == "a") {
      selected_dataset = starting_attack;
    }
    if (selectedVal == "d") {
      selected_dataset = starting_defending;
    }
    if (selectedVal == "p") {
      selected_dataset = starting_physic;
    }
    if (selectedVal == "k") {
      selected_dataset = starting_gk;
    }
    if (selectedVal == "o") {
      selected_dataset = starting_overall;
    }
  } else {
    if (selectedVal == "a") {
      selected_dataset = datasetAttack;
    }
    if (selectedVal == "d") {
      selected_dataset = datasetDefending;
    }
    if (selectedVal == "p") {
      selected_dataset = datasetPhysic;
    }
    if (selectedVal == "k") {
      selected_dataset = datasetGoalkeeper;
    }
    if (selectedVal == "o") {
      selected_dataset = datasetOverall;
    }
  }
  return selected_dataset;
}

var y;
var ee_line_initialized = false;

function radvizLegend() {
  let ele = document.getElementById("legend-radviz"),
    eleStyle = window.getComputedStyle(ele);
  let posizione_height = ele.getBoundingClientRect().height;
  let posizione_width = ele.getBoundingClientRect().width;
  let margin = {
    top: (posizione_height / 100) * 12,
    right: (posizione_width / 100) * 10,
    bottom: (posizione_height / 100) * 10,
    left: (posizione_width / 100) * 10,
  };

  var padding = 9;

  var barHeight = 8;

  let height = 180;
  let width = 8;

  var colorRange = ["#C0D9CC", "#F6F6F4", "#925D60", "#B74F55", "#969943"];

  var svgHeight = 200;
  var svgWidth = 40;

  let svg = d3
    .select("#legend-radviz")
    .append("svg")
    .attr("viewBox", [
      0,
      0,
      svgWidth + margin.left + margin.right,
      svgHeight + margin.top + margin.bottom,
    ]);

  let g = svg
    .append("g")
    .attr("transform", "translate( 27 ," + margin.top / 2 + ")");

  var linearGradient = g
    .append("defs")
    .append("linearGradient")
    .attr("id", "linear-gradient")
    .attr("gradientTransform", "rotate(90)");

  g.append("rect")
    .attr("id", "rect-gradient")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height - margin.top)
    .attr("transform", `translate(0, 10)`);

  y = d3
    .scaleLinear()
    .domain([0, 1])
    .range([10, height + 10]);

  var translate_value = width + 27;

  svg
    .append("g")
    .attr("id", "yAxis_rad")
    .attr(
      "transform",
      "translate(" + translate_value + "," + margin.top / 2 + ")"
    )
    .call(d3.axisRight(y));

  d3.selectAll(".tick").style("font-size", 6.5);

  createGradient();
}

function createGradient() {
  let ele = document.getElementById("legend-radviz"),
    eleStyle = window.getComputedStyle(ele);
  let posizione_height = ele.getBoundingClientRect().height;
  let posizione_width = ele.getBoundingClientRect().width;
  let margin = {
    top: (posizione_height / 100) * 12,
    right: (posizione_width / 100) * 10,
    bottom: (posizione_height / 100) * 10,
    left: (posizione_width / 100) * 10,
  };
  var padding = 9;

  var barHeight = 8;

  let height = 130;
  let width = 8;

  d3.select("#linear-gradient").selectAll("*").remove();
  let color = function (x) {
    return d3.interpolateWarm(d3.scaleLinear().domain([0, 1]).range([1, 0])(x));
  };

  var linearGradient = d3.select("#linear-gradient");

  linearGradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", () => {
      return color(0);
    });

  linearGradient
    .append("stop")
    .attr("offset", "25%")
    .attr("stop-color", () => {
      return color(0.25);
    });

  linearGradient
    .append("stop")
    .attr("offset", "50%")
    .attr("stop-color", () => {
      return color(0.5);
    });

  linearGradient
    .append("stop")
    .attr("offset", "75%")
    .attr("stop-color", () => {
      return color(0.75);
    });

  linearGradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", () => {
      return color(1);
    });

  //.style("stroke", "black")
  //.style("stroke-width", 1)
  d3.select("#rect-gradient").style("fill", "url(#linear-gradient)");
}

export function drawRadViz() {
  radvizLegend();
  var margin = { top: 30, right: 0, bottom: 50, left: 30 },
    width = 100 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

  const radius = (150 - 150 * (15 / 100) * 2) / 2;

  let translate_value = 27;

  var effectiveness_error;

  var div = d3
    .select("#radviz")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  rad = radviz();
  d3.csv(getDataset()).then((dataset) => {
    rad.data(dataset);

    rad.data().dimensions.shift(); //removes sofifa_id

    const set = rad.data().dimensions.map((d) => d.values);

    rad.setFunctionClick(onclick);
    rad.setFunctionMouseOver(mouseover);
    rad.setFunctionMouseOut(mouseout);
    let results1 = function (error_value) {
      effectiveness_error = error_value.toFixed(4);

      var svg_legend = d3.select("#legend-radviz").select("svg");
      if (!ee_line_initialized) {
        svg_legend
          .append("line")
          .attr("class", "ee_value_line")
          .attr("x1", -5) //<<== value of x
          .attr("y1", y(effectiveness_error))
          .attr("x2", 12) //<<== value of x
          .attr("y2", y(effectiveness_error))
          .attr("transform", "translate(" + translate_value + ", 0)")
          .style("stroke-width", 1)
          .style("stroke", function (d) {
            return "black";
          })
          .style("fill", "none");

        svg_legend
          .append("text")
          .attr("class", "ee_line_text")
          .attr("x", 0)
          .attr("dx", ".35em")
          .attr("y", y(effectiveness_error))
          .attr("transform", "translate( 10, 0)")
          .style("fill", function (d) {
            return "white";
          })
          .style("text-anchor", "middle")
          .style("font-size", "6px")
          .text(effectiveness_error);

        ee_line_initialized = true;
      } else {
        svg_legend
          .select(".ee_value_line")
          .attr("x1", -5) //<<== value of x
          .attr("y1", y(effectiveness_error))
          .attr("x2", 12) //<<== value of x
          .attr("y2", y(effectiveness_error))
          .attr("transform", "translate(" + translate_value + ", 0)");

        svg_legend
          .select(".ee_line_text")
          .attr("x", 0)
          .attr("dx", ".35em")
          .attr("y", y(effectiveness_error))
          .attr("transform", "translate( 10, 0)")
          .style("fill", function (d) {
            return "white";
          })
          .text(effectiveness_error);
      }
    };
    rad.setFunctionUpdateResults(results1);

    rad.setRightClick(false);
    rad.disableDraggableAnchors(false);
    rad.setDefaultColorPoints("purple");
    rad.updateRadviz(radvizDA.minEffectivenessErrorHeuristic(rad.data()));

    rad.decreaseLevelGrid();
    rad.decreaseLevelGrid();
    rad.decreaseLevelGrid();

    d3.select("#radviz").call(rad);
    d3.select("#radviz")
      .selectAll("text")
      .attr("fill", "#eeeeee")
      .style("font-size", 3.8)
      .attr("x", (d, i) => {
        return (radius - 5) * Math.cos(-Math.PI / 2 + d.start);
      });
    d3.select("#radviz")
      .select("svg")
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      )
      .attr("width", "27vmin")
      .attr("height", "27vmin");

    d3.select("#radviz")
      .selectAll("g")
      .attr("transform", "translate(" + 100 / 2 + "," + 100 / 2 + ")");

    d3.selectAll(".grid-" + rad.getIndex())
      .style("fill", "#393e46")
      .style("stroke", "#CDCDCD")
      .style("stroke-opacity", 0.3)
      .style("stroke-width", "0.50px")
      .style("opacity", "1");

    d3.select("#circumference-" + rad.getIndex())
      .style("stroke", "white")
      .style("stroke-width", "2px"); //cambia lo stile del radviz(sfondo nero e linee bianche)

    d3.selectAll('input[name="radio_radviz"]').on("change", function () {
      //Cambiamo i colori dei pallini in base al radio button
      var colorSelected = d3
        .select('input[name="radio_radviz"]:checked')
        .property("value");
      if (colorSelected == "ee") {
        rad.setColorPoint(0);
        d3.selectAll(".data_point").each(function (d) {
          if (isPlayerSelectedFromTable(d.original.sofifa_id)) {
            d3.select("#rp_" + d.original.sofifa_id)
              .style("stroke-width", 0.5)
              .style("stroke-opacity", 1)
              .raise()
              .attr("r", 2.5);
          }
        });
      }
      if (colorSelected == "c") {
        d3.selectAll(".data_point").each(function (d) {
          d3.select(this)
            .transition()
            .duration(1000)
            .style("fill", (d) => {
              return colorByRole[d.attributes.Positions];
            });
        });
      }
    });

    d3.selectAll(".data_point").attr("id", (d) => {
      return "rp_" + d.original.sofifa_id;
    });

    var rad_width = d3
      .select(".radviz-svg-" + rad.getIndex())
      .node()
      .getBoundingClientRect().width;

    d3.select(".radviz-svg-" + rad.getIndex())
      .attr("width", rad_width + 70 + "px")
      .attr("preserveAspectRatio", null);
  });

  var dropdown = d3.select("#dropdown_stats").on("change", dropdownChange);
}

let mouseover = function (angles, d) {
  var div = d3.select("#radviz").select(".tooltip");

  if (isPlayerSelectedFromTable(d.original.sofifa_id)) {
    d3.select("#rp_" + d.original.sofifa_id)
      .style("stroke-width", 0.5)
      .style("stroke-opacity", 1)
      .raise();
  }

  if (
    !d3
      .select("#rp_" + d.original.sofifa_id)
      .attr("class")
      .includes("non_brushed")
  ) {
    d3.select("#rp_" + d.original.sofifa_id)
      .style("stroke-width", 0.5)
      .raise()
      .attr("r", 2.5);

    div.transition().duration(200).style("opacity", 0.9);
    div
      .html(d.original["short_name"])
      .style("left", event.pageX + "px")
      .style("top", event.pageY - 28 + "px");
  }
};

let mouseout = function (d) {
  var div = d3.select("#radviz").select(".tooltip");

  if (!isPlayerSelectedFromTable(d.original.sofifa_id)) {
    if (!d.selected) {
      d3.select("#rp_" + d.original.sofifa_id)
        .style("stroke-width", 0.2)
        .attr("r", 1);
    }
  }

  div.transition().duration(500).style("opacity", 0);
};

export function redrawRadviz() {
  var margin = { top: 30, right: 0, bottom: 50, left: 30 },
    width = 100 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

  const radius = (150 - 150 * (15 / 100) * 2) / 2;

  d3.csv(getDataset()).then((dataset) => {
    rad.data(dataset);

    rad.data().dimensions.shift(); //removes sofifa_id

    const set = rad.data().dimensions.map((d) => d.values);

    rad.setFunctionClick(onclick);
    rad.setFunctionMouseOver(mouseover);
    rad.setFunctionMouseOut(mouseout);
    rad.setRightClick(false);
    rad.disableDraggableAnchors(false);
    rad.setDefaultColorPoints("purple");
    rad.updateRadviz(radvizDA.minEffectivenessErrorHeuristic(rad.data()));
    d3.select("#radviz").selectAll("svg").remove();
    rad.remove();
    d3.select("#radviz").call(rad);
    d3.select("#radviz")
      .selectAll("text")
      .attr("fill", "#eeeeee")
      .style("font-size", 3.8)
      .attr("x", (d, i) => {
        return (radius - 5) * Math.cos(-Math.PI / 2 + d.start);
      });
    d3.select("#radviz")
      .select("svg")
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      )
      .attr("width", "27vmin")
      .attr("height", "27vmin");

    d3.select("#radviz")
      .selectAll("g")
      .attr("transform", "translate(" + 100 / 2 + "," + 100 / 2 + ")");

    d3.selectAll(".grid-" + rad.getIndex())
      .style("fill", "#393e46")
      .style("stroke", "#CDCDCD")
      .style("stroke-opacity", 0.3)
      .style("stroke-width", "0.50px")
      .style("opacity", "1");

    d3.select("#circumference-" + rad.getIndex())
      .style("stroke", "white")
      .style("stroke-width", "2px"); //cambia lo stile del radviz(sfondo nero e linee bianche)

    d3.selectAll('input[name="radio_radviz"]').on("change", function () {
      //Cambiamo i colori dei pallini in base al radio button
      var colorSelected = d3
        .select('input[name="radio_radviz"]:checked')
        .property("value");
      if (colorSelected == "ee") {
        rad.setColorPoint(0);
        d3.selectAll(".data_point").each(function (d) {
          if (isPlayerSelectedFromTable(d.original.sofifa_id)) {
            d3.select("#rp_" + d.original.sofifa_id)
              .style("stroke-width", 0.5)
              .style("stroke-opacity", 1)
              .raise()
              .attr("r", 2.5);
          }
        });
      }
      if (colorSelected == "c") {
        d3.selectAll(".data_point").each(function (d) {
          d3.select(this)
            .transition()
            .duration(1000)
            .style("fill", (d) => {
              return colorByRole[d.attributes.Positions];
            });
        });
      }
    });

    d3.selectAll(".data_point").attr("id", (d) => {
      return "rp_" + d.original.sofifa_id;
    });

    updateRadvizColors();

    var rad_width = d3
      .select(".radviz-svg-" + rad.getIndex())
      .node()
      .getBoundingClientRect().width;

    d3.select(".radviz-svg-" + rad.getIndex())
      .attr("width", rad_width + 70 + "px")
      .attr("preserveAspectRatio", null);

    setTimeout(function () {
      updateRadviz();
      /* if (selected_players_from_table.length > 0) {
        //rendiamo i pallini dei giocatori selezionati dalla tabella colorati e più grandi
        selected_players_from_table.forEach(function (player_id) {

          d3.select("#rp_" + String(player_id))
            .style(
              //point id example: p_1974-1643655473284
              "stroke-width",
              0.5
            )
            .raise()
            .attr("r", 2.5);
        });
      } else if (
        selected_players.length > 0 &&
        selected_players_from_pc.length == 0
      ) {
        d3.selectAll(".data_point").each(function (d) {
          var class_name = d3
            .select("#rp_" + d.original.sofifa_id)
            .attr("class");
          var class_substrings = class_name.split(" ");
          if (!isPlayerSelected(d.original.sofifa_id)) {
            d3.select(this)
              .transition()
              .duration(500)
              .style("stroke-width", 0.2)
              .style("opacity", 0.05)
              .attr(
                "class",
                class_name + " non_brushed"
              );
          } else {
            if (class_name.includes("non_brushed")) {
              d3.select(this).attr(
                "class",
                class_name.split(" non_brushed")[0]
              );
            }
            //make them bigger
            d3.select(this)
              .raise()
              .transition()
              .duration(500)
              .style("opacity", 1);
          }
        });
      } else if (
        selected_players_from_pc.length > 0 &&
        selected_players.length == 0
      ) {
        d3.selectAll(".data_point").each(function (d) {
          var class_name = d3
            .select("#rp_" + d.original.sofifa_id)
            .attr("class");
          var class_substrings = class_name.split(" ");
          if (!isPlayerSelectedFromPC(d.original.sofifa_id)) {
            d3.select(this)
              .style("stroke-width", 0.2)
              .style("opacity", 0.05)
              .attr(
                "class",
                class_name + " non_brushed"
              );
          } else {
            d3.select(this).style("opacity", 1).raise();
            if (class_substrings.length == 3) {
              d3.select(this).attr(
                "class",
                class_name.split(" non_brushed")[0]
              );
            }
          }
        });
      } else if (
        selected_players_from_pc.length > 0 &&
        selected_players.length > 0
      ) {
        d3.selectAll(".data_point").each(function (d) {
          var class_name = d3
            .select("#rp_" + d.original.sofifa_id)
            .attr("class");
          var class_substrings = class_name.split(" ");
          if (
            !isPlayerSelectedFromPC(d.original.sofifa_id) ||
            !isPlayerSelected(d.original.sofifa_id)
          ) {
            d3.select(this)
              .transition()
              .duration(500)
              .style("stroke-width", 0.2)
              .style("opacity", 0.05)
              .attr(
                "class",
                class_name + " non_brushed"
              );
          } else {
            d3.select(this).style("opacity", 1).raise();
            if (class_substrings.length == 3) {
              d3.select(this).attr(
                "class",
                class_name.split(" non_brushed")[0]
              );
            }
          }
        });
      }
    */
    }, 100);
  });
}

if (module.hot) {
  module.hot.accept(
    [
      "../dataset/players_22_attack.csv",
      "../dataset/players_22_defending.csv",
      "../dataset/players_22_physic.csv",
      "../dataset/players_22_gk.csv",
      "../dataset/players_22_overall.csv",
    ],
    function () {
      redrawRadviz();
    }
  );
}
