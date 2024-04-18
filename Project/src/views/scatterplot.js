import * as d3 from "d3";
import dataset from "../dataset/players_22_dimensionality_reduction_result.csv";
import starting_dataset from "../dataset/dimensionality_reduction_result.csv";
import {
  colorByRole,
  addPlayerToSelection,
  emptySelection,
  emptySelectionFromPC,
  selected_players,
  selected_players_from_pc,
  checkboxes_selected,
  addToCheckboxSelection,
  removeFromCheckboxSelection,
  addAllRolesToCheckBoxSelection,
  removeNotSelectedCheckboxes,
  isPlayerSelectedFromTable,
  isPlayerSelectedFromPC,
  isTheSameRequest,
  selected_players_from_table,
} from "../utils";
import {
  updateFromScatterplot,
  updateFromCheckboxes,
} from "./update_functions";
import { dropdownLCChange } from "./line_chart";
import { rad, redrawRadviz } from "./radviz";

function getDropdownValue() {
  const selectedVal = d3.select("#dropdown_scatterplot").property("value");
  if (selectedVal == "pca") {
    return "pca";
  }
  if (selectedVal == "tsne") {
    return "tsne";
  }
}

export var colDict = {
  0: d3.schemeDark2[0],
  1: d3.schemeDark2[2],
  2: d3.schemeDark2[3],
  3: d3.schemeDark2[4],
  4: d3.schemeDark2[5],
};

d3.select("#dropdown_scatterplot").on("change", dropdownScatterplotChange);

var radio_value = d3.select("#dropdown_cluster").property("value");

var lastCheckSelected;

var div;

var clust_payload = "none";

const axios = require("axios");
async function makeRequest() {
  d3.select(".loader-sp").style("display", null);
  d3.select(".loader-rv").style("display", null);
  d3.select(".loader-lc").style("display", null);
  d3.select("#scatterplot").select("#circle_container").style("opacity", 0.1);
  d3.select("#points-g-" + rad.getIndex()).style("opacity", 0.1);
  d3.select("#line_chart").select(".line").style("opacity", 0.1);

  updateFromCheckboxes();
  let payload = { positions: checkboxes_selected, radio: radio_value };

  axios.get("http://127.0.0.1:5000/flask_get").then((res) => {
    lastCheckSelected = res.data;

    var lastCheckedRolesList = lastCheckSelected.split(",");

    if (!isTheSameRequest(lastCheckedRolesList, checkboxes_selected)) {
      axios.post("http://127.0.0.1:5000/flask", payload).then(function () {
        d3.select(".loader-sp").style("display", "none");
        d3.select(".loader-rv").style("display", "none");
        d3.select(".loader-lc").style("display", "none");
        d3.select("#scatterplot")
          .select("#circle_container")
          .style("opacity", 1);
        d3.select("#points-g-" + rad.getIndex()).style("opacity", 1);
        d3.select("#line_chart").select(".line").style("opacity", 1);
      });
    } else {
      d3.select(".loader-sp").style("display", "none");
      d3.select(".loader-rv").style("display", "none");
      d3.select(".loader-lc").style("display", "none");
      d3.select("#scatterplot").select("#circle_container").style("opacity", 1);
      d3.select("#points-g-" + rad.getIndex()).style("opacity", 1);
      d3.select("#line_chart").select(".line").style("opacity", 1);
      updateScatterplot();
      dropdownLCChange();
      redrawRadviz();
    }
  });
  //trasformiamo la stringa letta nel file in lista di stringhe
}

function makeClusterRequest() {
  if (d3.select("#all_checkbox").property("checked")) {
    clust_payload = "all";
  } else {
    clust_payload = "none";
  }
  let payload = { positions: clust_payload, radio: radio_value };
  axios.post("http://127.0.0.1:5000/flask", payload);
}

d3.select("#dropdown_cluster").on("change", function () {
  radio_value = d3.select("#dropdown_cluster").property("value");
  if (radio_value == "no") {
    updateScatterplot();
  } else {
    makeClusterRequest();
  }
});

d3.select("#f_checkbox").on("change", function () {
  if (d3.select("#f_checkbox").property("checked")) {
    //se All era selezionato allora tolgo tutto dalla lista e lo deseleziono
    if (d3.select("#all_checkbox").property("checked")) {
      removeNotSelectedCheckboxes();
      d3.select("#all_checkbox").property("checked", false);
    }
    addToCheckboxSelection("Forward");
    makeRequest();
  }
  if (
    !d3.select("#f_checkbox").property("checked") &&
    checkboxes_selected.includes("Forward")
  ) {
    removeFromCheckboxSelection("Forward");
    makeRequest();
  }
});
d3.select("#m_checkbox").on("change", function () {
  if (d3.select("#m_checkbox").property("checked")) {
    //se All era selezionato allora tolgo tutto dalla lista e lo deseleziono
    if (d3.select("#all_checkbox").property("checked")) {
      removeNotSelectedCheckboxes();
      d3.select("#all_checkbox").property("checked", false);
    }
    addToCheckboxSelection("Midfielder");
    makeRequest();
  }
  if (
    !d3.select("#m_checkbox").property("checked") &&
    checkboxes_selected.includes("Midfielder")
  ) {
    removeFromCheckboxSelection("Midfielder");
    makeRequest();
  }
});
d3.select("#d_checkbox").on("change", function () {
  if (d3.select("#d_checkbox").property("checked")) {
    //se All era selezionato allora tolgo tutto dalla lista e lo deseleziono
    if (d3.select("#all_checkbox").property("checked")) {
      removeNotSelectedCheckboxes();
      d3.select("#all_checkbox").property("checked", false);
    }
    addToCheckboxSelection("Defender");
    makeRequest();
  }
  if (
    !d3.select("#d_checkbox").property("checked") &&
    checkboxes_selected.includes("Defender")
  ) {
    removeFromCheckboxSelection("Defender");

    makeRequest();
  }
});
d3.select("#gk_checkbox").on("change", function () {
  if (d3.select("#gk_checkbox").property("checked")) {
    //se All era selezionato allora tolgo tutto dalla lista e lo deseleziono
    if (d3.select("#all_checkbox").property("checked")) {
      removeNotSelectedCheckboxes();
      d3.select("#all_checkbox").property("checked", false);
    }
    addToCheckboxSelection("Goalkeeper");
    makeRequest();
  }
  if (
    !d3.select("#gk_checkbox").property("checked") &&
    checkboxes_selected.includes("Goalkeeper")
  ) {
    removeFromCheckboxSelection("Goalkeeper");
    makeRequest();
  }
});
d3.select("#all_checkbox").on("change", function () {
  if (
    d3.select("#all_checkbox").property("checked") &&
    checkboxes_selected.length > 0
  ) {
    addAllRolesToCheckBoxSelection();
    makeRequest();
  }
});

var selected_dataset;

if (d3.select("#all_checkbox").property("checked")) {
  selected_dataset = starting_dataset;
} else {
  selected_dataset = dataset;
}

const margin = { top: 30, right: 20, bottom: 30, left: 20 },
  width = 500 - margin.left - margin.right,
  height = 330 - margin.top - margin.bottom;

export const drawSP = function () {
  div = d3
    .select("#scatterplot")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  var svg = d3
    .select("#scatterplot")
    .append("svg")
    .attr("viewBox", [
      0,
      0,
      width + margin.left + margin.right,
      height + margin.top + margin.bottom,
    ])
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  //Read the data
  d3.csv(selected_dataset, function (d) {
    var x_comp, y_comp, cluster;
    if (getDropdownValue() == "pca") {
      x_comp = d.pca_comp_0;
      y_comp = d.pca_comp_1;
      cluster = d.cluster_pca;
    }
    if (getDropdownValue() == "tsne") {
      x_comp = d.tsne_comp_0;
      y_comp = d.tsne_comp_1;
      cluster = d.cluster_tsne;
    }
    return {
      x_comp: x_comp,
      y_comp: y_comp,
      sofifa_id: d.sofifa_id,
      position: d.Positions,
      cluster: cluster,
      short_name: d.short_name,
    };
  }).then(function (data) {
    // Add X axis
    const x = d3
      .scaleLinear()
      .domain(
        d3.extent(data, function (d) {
          return +d.x_comp;
        })
      )
      .range([0, width]);
    svg
      .append("g")
      .attr("id", "xAxis_sp")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3
      .scaleLinear()
      .domain(
        d3.extent(data, function (d) {
          return +d.y_comp;
        })
      )
      .range([height, 0]);
    svg.append("g").attr("id", "yAxis_sp").call(d3.axisLeft(y));

    svg
      .append("g")
      .attr("class", "brush")
      .call(
        d3
          .brush()
          .extent([
            [0, 0],
            [width, height],
          ])
          .on("start", brushstarted)
          .on("brush", brushed)
          .on("end", brushended)
      );

    // Add dots
    var circles = svg
      .append("g")
      .attr("id", "circle_container")
      .selectAll("circle")
      .data(data, (d) => {
        return d.sofifa_id;
      })
      .join("circle")
      .attr("id", function (d) {
        return "sp_circle_" + d.sofifa_id;
      })
      .attr("cx", function (d) {
        return x(d.x_comp);
      })
      .attr("cy", function (d) {
        return y(d.y_comp);
      })
      .attr("r", 4)
      .style("fill", function (d) {
        if (selected_players_from_pc.length != 0) {
          if (
            isPlayerSelectedFromPC(d.sofifa_id) ||
            isPlayerSelectedFromTable(d.sofifa_id)
          ) {
            if (radio_value == "no") {
              return colorByRole[d.position];
            } else {
              return colDict[d.cluster];
            }
          }
        } else {
          if (radio_value == "no") {
            return colorByRole[d.position];
          } else {
            return colDict[d.cluster];
          }
        }
        //
      })
      .style("stroke", "black")
      .style("stroke-width", 0.5)
      .style("stroke-opacity", 0.4)
      .attr("class", "brushed")
      .on("mouseover", circleMouseover)
      .on("mouseout", circleMouseout);
  });

  updateLegend();
};

function circleMouseover(event, d) {
  if (isPlayerSelectedFromTable(d.sofifa_id)) {
    d3.select("#sp_circle_" + d.sofifa_id)
      .style("stroke-width", 2)
      .style("stroke-opacity", 1)
      .raise();
    div.transition().duration(200).style("opacity", 0.9);
    div
      .html(d.short_name)
      .style("left", event.pageX + "px")
      .style("top", event.pageY - 28 + "px");
  } else if (isPlayerSelectedFromPC(d.sofifa_id)) {
    d3.select("#sp_circle_" + d.sofifa_id)
      .attr("r", 8)
      .style("stroke-width", 2)
      .style("stroke-opacity", 1)
      .raise();
    div.transition().duration(200).style("opacity", 0.9);
    div
      .html(d.short_name)
      .style("left", event.pageX + "px")
      .style("top", event.pageY - 28 + "px");
  } else {
    if (d3.select(this).attr("class") == "brushed") {
      d3.select("#sp_circle_" + d.sofifa_id)
        .style("stroke-width", 2)
        .style("stroke-opacity", 1)
        .attr("r", 8)
        .raise();
      div.transition().duration(200).style("opacity", 0.9);
      div
        .html(d.short_name)
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
    }
  }
}

function circleMouseout(event, d) {
  if (!isPlayerSelectedFromTable(d.sofifa_id)) {
    d3.select("#sp_circle_" + d.sofifa_id)
      .style("stroke-width", 0.5)
      .style("stroke-opacity", 0.4)
      .attr("r", 4);
  }

  div.transition().duration(500).style("opacity", 0);
}

function brushed(event, d) {
  d3.select("#parallelcoords")
    .selectAll(".foreground")
    .selectAll("path")
    .style("display", null);

  if (event.selection != null) {
    var circles = d3.select("#scatterplot").selectAll("circle");
    // revert circles to initial style
    var non_brushed_circles = circles.attr("class", "non_brushed");

    var brush_coords = d3.brushSelection(this);

    // style brushed circles
    var brushed_circles = circles
      .filter(function (d) {
        var cx = d3.select(this).attr("cx"),
          cy = d3.select(this).attr("cy");

        return isBrushed(brush_coords, cx, cy);
      })
      .attr("class", "brushed");

    non_brushed_circles.each(function (d) {
      if (!isPlayerSelectedFromTable(d.sofifa_id)) {
        d3.select(this)
          .style("fill", "grey")
          .attr("r", 4)
          .style("stroke", "black")
          .style("opacity", 0.1);
      }
    });

    brushed_circles.each(function (d) {
      if (!isPlayerSelectedFromTable(d.sofifa_id)) {
        d3.select(this)
          .style("fill", function (d) {
            if (radio_value == "no") {
              return colorByRole[d.position];
            } else {
              return colDict[d.cluster];
            }
          })
          .style("stroke-opacity", 0.7)
          .style("opacity", 1.0);
      }
    });
  }
}
function brushstarted(event, d) {
  emptySelectionFromPC();
  emptySelection();
}
function brushended(event, d) {
  d3.selectAll(".brushed").each(function (d) {
    addPlayerToSelection(d.sofifa_id);
  });
  if (event.selection == null || selected_players.length == 0) {

    d3.select("#scatterplot")
      .select("g")
      .select(".brush")
      .call(d3.brush().clear); //rimuove il brush

    emptySelection();
    var circles = d3.select("#scatterplot").selectAll("circle");
    // revert circles to initial style
    var brushed_circles = circles.attr("class", "brushed");

    brushed_circles.each(function (d) {
      if (!isPlayerSelectedFromTable(d.sofifa_id)) {
        d3.select(this)
          .style("fill", function (d) {
            if (radio_value == "no") {
              return colorByRole[d.position];
            } else {
              return colDict[d.cluster];
            }
          })
          .attr("r", 4)
          .style("stroke", "black")
          .style("stroke-opacity", 0.4)
          .style("opacity", 1.0);
      }
    });
  }

  updateFromScatterplot();
}

function isBrushed(brush_coords, cx, cy) {
  var x0 = brush_coords[0][0],
    x1 = brush_coords[1][0],
    y0 = brush_coords[0][1],
    y1 = brush_coords[1][1];

  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function dropdownScatterplotChange() {
  d3.select("#scatterplot") //rimuove il brush se c'era
    .select("g")
    .select(".brush")
    .call(d3.brush().clear);

  var radio_value = d3.select("#dropdown_cluster").property("value");
  if (d3.select("#all_checkbox").property("checked")) {
    selected_dataset = starting_dataset;
  } else {
    selected_dataset = dataset;
  }
  d3.csv(selected_dataset, function (d) {
    var x_comp, y_comp, cluster;
    if (getDropdownValue() == "pca") {
      x_comp = d.pca_comp_0;
      y_comp = d.pca_comp_1;
      cluster = d.cluster_pca;
    }
    if (getDropdownValue() == "tsne") {
      x_comp = d.tsne_comp_0;
      y_comp = d.tsne_comp_1;
      cluster = d.cluster_tsne;
    }
    return {
      x_comp: x_comp,
      y_comp: y_comp,
      sofifa_id: d.sofifa_id,
      position: d.Positions,
      cluster: cluster,
      short_name: d.short_name,
    };
  }).then(function (data) {
    const x = d3
      .scaleLinear()
      .domain(
        d3.extent(data, function (d) {
          return +d.x_comp;
        })
      )
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain(
        d3.extent(data, function (d) {
          return +d.y_comp;
        })
      )
      .range([height, 0]);

    d3.select("#xAxis_sp").transition().duration(1000).call(d3.axisBottom(x));

    d3.select("#yAxis_sp").transition().duration(1000).call(d3.axisLeft(y));

    var svg = d3.select("#scatterplot");

    svg
      .selectAll("circle")
      .data(data, (d) => {
        return d.sofifa_id;
      })
      .transition()
      .duration(1000)
      .attr("cx", function (d) {
        return x(d.x_comp);
      })
      .attr("cy", function (d) {
        return y(d.y_comp);
      })
      .style("fill", function (d) {
        return getCircleColor(d);
      });
  });
}

function updateScatterplot() {
  var radio_value = d3.select("#dropdown_cluster").property("value");
  if (d3.select("#all_checkbox").property("checked")) {
    selected_dataset = starting_dataset;
  } else {
    selected_dataset = dataset;
  }

  d3.csv(selected_dataset, function (d) {
    var x_comp, y_comp, cluster;
    if (getDropdownValue() == "pca") {
      x_comp = d.pca_comp_0;
      y_comp = d.pca_comp_1;
      cluster = d.cluster_pca;
    }
    if (getDropdownValue() == "tsne") {
      x_comp = d.tsne_comp_0;
      y_comp = d.tsne_comp_1;
      cluster = d.cluster_tsne;
    }
    return {
      x_comp: x_comp,
      y_comp: y_comp,
      sofifa_id: d.sofifa_id,
      position: d.Positions,
      cluster: cluster,
      short_name: d.short_name,
    };
  }).then(function (data) {
    const x = d3
      .scaleLinear()
      .domain(
        d3.extent(data, function (d) {
          return +d.x_comp;
        })
      )
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain(
        d3.extent(data, function (d) {
          return +d.y_comp;
        })
      )
      .range([height, 0]);

    d3.select("#xAxis_sp").transition().duration(1000).call(d3.axisBottom(x));

    d3.select("#yAxis_sp").transition().duration(1000).call(d3.axisLeft(y));

    var svg = d3.select("#scatterplot");

    var points = svg
      .select("#circle_container")
      .selectAll("circle")
      .data(data, function (d) {
        return d.sofifa_id;
      });

    points.join(
      (enter) => {
        enter
          .append("circle")
          .attr("cx", function (d) {
            return x(d.x_comp);
          })
          .attr("cy", function (d) {
            return y(d.y_comp);
          })
          .attr("id", function (d) {
            return "sp_circle_" + d.sofifa_id;
          })
          .attr("r", 4)
          .attr("class", "brushed")
          .style("fill", function (d) {
            return getCircleColor(d);
          })
          .style("stroke", "black")
          .style("stroke-width", 0.5)
          .style("stroke-opacity", 0.4)
          .on("mouseover", circleMouseover)
          .on("mouseout", circleMouseout)

          .style("opacity", 0)
          .transition()
          .duration(1000)
          .style("opacity", 1);
      },
      (update) => {
        update
          .transition()
          .duration(1000)
          .attr("cx", function (d) {
            return x(d.x_comp);
          })
          .attr("cy", function (d) {
            return y(d.y_comp);
          })
          .style("fill", function (d) {
            return getCircleColor(d);
          });
      },
      (exit) => {
        exit.transition().duration(1000).style("opacity", 0).remove();
      }
    );

    selected_players_from_table.forEach(function (player_id) {
      d3.select("#sp_circle_" + String(player_id))
        .style("stroke-width", 2)
        .style("stroke-opacity", 1)
        .attr("r", 10)
        .raise();
    });
  });
  updateLegend();
}

export function updateLegend() {
  var legend_data = [];
  var radio_value = d3.select("#dropdown_cluster").property("value");
  if (radio_value != "no") {
    var num_clusters = parseInt(radio_value);
    for (var i = 0; i < num_clusters; i++) {
      legend_data.push({
        text: "Cluster " + (i + 1),
        color: colDict[i],
        cluster_num: i + 1,
      });
    }
  }

  var legend_elements = d3
    .select("#legend-cluster")
    .selectAll(".legend-elem-cluster")
    .data(legend_data);

  legend_elements.join(
    (enter) => {
      var legend_elem = enter
        .append("div")
        .attr("class", "legend-elem-cluster");
      legend_elem
        .append("svg")
        .attr("id", "circle-cluster")
        .style("background", function (d) {
          return d.color;
        });

      legend_elem.append("text").text(function (d) {
        return d.text;
      });
    },
    (update) => {
      var legend_elem = update.selectAll(".legend-elem-cluster");
      legend_elem.select("#circle-cluster").style("background", function (d) {
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

export function getCircleColor(d) {
  var class_name = d3.select("#sp_circle_" + d.sofifa_id).attr("class");

  if (
    selected_players_from_pc.length == 0 &&
    selected_players_from_table.length == 0
  ) {
    //if nothing is selected
    if (radio_value == "no") {
      return colorByRole[d.position];
    } else {
      return colDict[d.cluster];
    }
  } else {
    if (selected_players_from_pc.length == 0) {
      if (class_name == "brushed" || isPlayerSelectedFromTable(d.sofifa_id)) {
        if (radio_value == "no") {
          return colorByRole[d.position];
        } else {
          return colDict[d.cluster];
        }
      } else {
        return "grey";
      }
    } else {
      if (
        isPlayerSelectedFromPC(d.sofifa_id) ||
        isPlayerSelectedFromTable(d.sofifa_id)
      ) {
        if (radio_value == "no") {
          return colorByRole[d.position];
        } else {
          return colDict[d.cluster];
        }
      } else {
        return "grey";
      }
    }
  }
}

if (module.hot) {
  module.hot.accept(
    [
      "../dataset/players_22_dimensionality_reduction_result.csv",
      "../dataset/dimensionality_reduction_result.csv",
    ],
    function () {
      updateScatterplot();
    }
  );
}
