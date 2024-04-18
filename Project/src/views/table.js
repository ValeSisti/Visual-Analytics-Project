import * as d3 from "d3";
import dataset from "../dataset/players_22_list.csv";
import {
  isPlayerSelectedFromTable,
  colorByRole,
  isCheckboxSelected,
  addSelectedPlayerData,
  removeSelectedPlayerData,
  list_data,
  setListData,
  selected_players_data,
  selected_players_from_table,
} from "../utils";
import {
  updateLineChart,
  updateRadar,
  updateScatterplot,
  updateParallelCoordsFromTable,
  updateRadviz,
} from "./update_functions";
import { updateRadarLegend } from "./radar";

d3.select("#myInput").on("input", onTextChanged);

var filter = d3.select(".filter-container").node();
var filterHeight = filter.getBoundingClientRect().height;

var tableHeight = 450; 

d3.select(".list").style("max-height", tableHeight + "px");

var titles;

const drawTable = function () {
  const margin = { top: 20, right: 30, bottom: 30, left: 60 },
    width = 1750 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var table = d3.select(".list").append("table");

  d3.csv(dataset, function (d) {
    if (isCheckboxSelected(d.Positions)) {
      return {
        sofifa_id: d.sofifa_id,
        name: d.short_name,
        pic: d.player_face_url,
        role: d.Positions,
        club: d.club_name,
        foot: d.preferred_foot,
        contract: d.club_contract_valid_until,
      };
    }
  }).then(function (data) {
    setListData(data);
    var sortAscending = true;

    titles = [name];

    var rows = table
      .append("tbody")
      .selectAll("tr")
      .data(data, (d) => {
        return d.sofifa_id;
      })
      .enter()
      .append("tr")
      .attr("id", function (d) {
        return "tr_" + d.sofifa_id;
      });

    var td = rows
      .selectAll("td")
      .data(
        function (d) {
          return titles.map(function () {
            return {
              name: d.name,
              pic: d.pic,
              role: d.role,
              sofifa_id: d.sofifa_id,
              club: d.club,
              foot: d.foot,
              contract: d.contract,
            };
          });
        },
        (d) => {
          return d.sofifa_id;
        }
      )
      .enter()
      .append("td")
      .style("border", function (d) {
        return "1.5px solid" + colorByRole[d.role];
      });

    var div_row = td.append("div").attr("class", "row");

    var div_col1 = div_row.append("div").attr("class", "column1");

    var div_col2 = div_row.append("div").attr("class", "column2");

    var div_col3 = div_row.append("div").attr("class", "column3");

    div_col1
      .append("img")
      .attr("src", function (d) {
        return d.pic;
      })
      .attr("x", "0")
      .attr("y", "0")
      .attr("width", "30")
      .attr("height", "30")
      .style("border", function (d) {
        return "1.5px solid" + colorByRole[d.role];
      });

    div_col2
      .append("p")
      .attr("id", "name")
      .text(function (d) {
        return d.name;
      });

    div_col2
      .append("p")
      .attr("id", "club")
      .style("font-weight", 700)
      .text("Club: ")
      .append("tspan")
      .style("font-weight", 300)
      .text(function (d) {
        return d.club;
      });

    div_col2
      .append("p")
      .attr("id", "foot")
      .style("font-weight", 700)
      .text("Preferred foot: ")
      .append("tspan")
      .style("font-weight", 300)
      .text(function (d) {
        return d.foot;
      });

    div_col2
      .append("p")
      .attr("id", "contract")
      .style("font-weight", 700)
      .text("Contract valid until: ")
      .append("tspan")
      .style("font-weight", 300)
      .text(function (d) {
        return Math.trunc(d.contract);
      });

    div_col3
      .append("button")
      .attr("class", "plus-button")
      .append("i")
      .attr("class", "fa fa-plus")
      .on("click", onTableElementClick);
  });
};

export function onTableElementClick(event, d) {
  if (!isPlayerSelectedFromTable(d.sofifa_id)) {
    if (selected_players_from_table.length == 4) {
      alert("You cannot select more than 4 players");
    } else {
      addSelectedPlayerData({
        sofifa_id: d.sofifa_id,
        name: d.name,
        pic: d.pic,
        role: d.role,
        club: d.club,
        foot: d.foot,
        contract: d.contract,
      });

      d3.select(this.parentNode.parentNode.parentNode.parentNode) //seleziona il td che contiene questo div_col3
        .transition()
        .duration(400)
        .style("background", function (d) {
          return colorByRole[d.role];
        });

      d3.select(this.parentNode.parentNode.parentNode.parentNode)
        .select(".column1")
        .select("img")
        .transition()
        .duration(400)
        .style("border", "1.5px solid #eeeeee");

      //remove plus button
      d3.select(this.parentNode)
        .transition()
        .duration(400)
        .style("visibility", "hidden");
    }
  }
  updateLineChart();
  updateRadar();
  updateScatterplot();
  updateRadviz();
  updateParallelCoordsFromTable();
  updateFilter();
  updateRadarLegend();
}

export function onFilterClick(event, d) {
  removeSelectedPlayerData({
    sofifa_id: d.sofifa_id,
    name: d.name,
    pic: d.pic,
    role: d.role,
    club: d.club,
    foot: d.foot,
    contract: d.contract,
  });
  var selected_tr = d3.select("#tr_" + d.sofifa_id);
  selected_tr
    .select("td") //seleziona il td che contiene questo div_col3
    .transition()
    .duration(400)
    .style("background", "#222831") //resetta il colore del background di default
    .style("border", function (d) {
      return "1.5px solid " + colorByRole[d.role];
    });

  selected_tr
    .select("img")
    .transition()
    .duration(400)
    .style("border-color", function (d) {
      return colorByRole[d.role];
    });

  selected_tr
    .select(".plus-button")
    .transition()
    .duration(400)
    .style("visibility", "visible");

  updateLineChart();
  updateRadar();
  updateScatterplot();
  updateRadviz();
  updateParallelCoordsFromTable();
  updateFilter();
  updateRadarLegend();
}

export function sortTable() {
  //get all the rows
  var rows = d3.selectAll("tr");

  //sort them
  rows.sort(function (a, b) {
    var a_id = a.sofifa_id;
    var b_id = b.sofifa_id;
    if (isPlayerSelectedFromTable(a_id) && !isPlayerSelectedFromTable(b_id)) {
      return -1;
    }
    if (
      (isPlayerSelectedFromTable(a_id) && isPlayerSelectedFromTable(b_id)) ||
      (!isPlayerSelectedFromTable(a_id) && !isPlayerSelectedFromTable(b_id))
    ) {
      return 0;
    }
    if (!isPlayerSelectedFromTable(a_id) && isPlayerSelectedFromTable(b_id)) {
      return 1;
    }
  });
}

function onTextChanged() {
  var value = this.value;
  var data = [];
  list_data.forEach(function (row_element) {
    if (row_element.name.toUpperCase().includes(value.toUpperCase())) {
      data.push(row_element);
    }
  });

  var table_rows = d3
    .select(".list")
    .select("table")
    .select("tbody")
    .selectAll("tr")
    .data(data, function (d) {
      return d.sofifa_id;
    });

  table_rows.join(
    (enter) => {
      var new_rows = enter.append("tr").attr("id", function (d) {
        return "tr_" + d.sofifa_id;
      });
      var new_td = new_rows
        .selectAll("td")
        .data(
          function (d) {
            return titles.map(function () {
              return {
                name: d.name,
                pic: d.pic,
                role: d.role,
                sofifa_id: d.sofifa_id,
                club: d.club,
                foot: d.foot,
                contract: d.contract,
              };
            });
          },
          (d) => {
            return d.sofifa_id;
          }
        )
        .enter()
        .append("td")
        .style("border", function (d) {
          return "1.5px solid" + colorByRole[d.role];
        });

      var div_row = new_td.append("div").attr("class", "row");

      var div_col1 = div_row.append("div").attr("class", "column1");

      var div_col2 = div_row.append("div").attr("class", "column2");

      var div_col3 = div_row.append("div").attr("class", "column3");

      div_col1
        .append("img")
        .attr("src", function (d) {
          return d.pic;
        })
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", "30")
        .attr("height", "30")
        .style("border", function (d) {
          return "1.5px solid" + colorByRole[d.role];
        });

      div_col2
        .append("p")
        .attr("id", "name")
        .text(function (d) {
          return d.name;
        });

      div_col2
        .append("p")
        .attr("id", "club")
        .style("font-weight", 700)
        .text("Club: ")
        .append("tspan")
        .style("font-weight", 300)
        .text(function (d) {
          return d.club;
        });

      div_col2
        .append("p")
        .attr("id", "foot")
        .style("font-weight", 700)
        .text("Preferred foot: ")
        .append("tspan")
        .style("font-weight", 300)
        .text(function (d) {
          return d.foot;
        });

      div_col2
        .append("p")
        .attr("id", "contract")
        .style("font-weight", 700)
        .text("Contract valid until: ")
        .append("tspan")
        .style("font-weight", 300)
        .text(function (d) {
          return Math.trunc(d.contract);
        });

      div_col3
        .append("button")
        .attr("class", "plus-button")
        .append("i")
        .attr("class", "fa fa-plus")
        .on("click", onTableElementClick);
    },
    (update) => {
      var td = update.selectAll("td").data(
        function (d) {
          return titles.map(function () {
            return {
              name: d.name,
              pic: d.pic,
              role: d.role,
              sofifa_id: d.sofifa_id,
              club: d.club,
              foot: d.foot,
              contract: d.contract,
            };
          });
        },
        (d) => {
          return d.sofifa_id;
        }
      );

      var div_row = td.selectAll(".rows");
      var div_col1 = div_row.select(".column1");

      var div_col2 = div_row.select(".column2");

      var div_col3 = div_row.select(".column3");

      div_col1.select("img").attr("src", function (d) {
        return d.pic;
      });

      div_col2.select("#name").text(function (d) {
        return d.name;
      });
      div_col2
        .select("#club")
        .style("font-weight", 700)
        .text("Club: ")
        .append("tspan")
        .style("font-weight", 300)
        .text(function (d) {
          return d.club;
        });

      div_col2
        .select("#foot")
        .style("font-weight", 700)
        .text("Preferred foot: ")
        .append("tspan")
        .style("font-weight", 300)
        .text(function (d) {
          return d.foot;
        });

      div_col2
        .select("#contract")
        .style("font-weight", 700)
        .text("Contract valid until: ")
        .append("tspan")
        .style("font-weight", 300)
        .text(function (d) {
          return Math.trunc(d.contract);
        });
      div_col3.select("button").on("click", onTableElementClick);
    },
    (exit) => {
      exit 
        .remove();
    }
  );
}

function updateFilter() {
  var filter_list = d3
    .select(".filter-container")
    .selectAll(".child")
    .data(selected_players_data, function (d) {
      return d.sofifa_id;
    });
  filter_list.join(
    (enter) => {
      var player_div = enter
        .append("div")
        .attr("class", "child float-left-child")
        .style("border", function (d) {
          return "1px solid " + colorByRole[d.role];
        });
      player_div.append("text").text(function (player_data) {
        return player_data.name;
      });

      player_div
        .append("button")
        .attr("class", "btn-icon")
        .append("i")
        .attr("class", "fa fa-close")
        .on("click", onFilterClick);
    },
    (update) => {}, 
    (exit) => {
      exit.transition().duration(300).style("opacity", 0).remove();
    }
  );
  var filter = d3.select(".filter-container").node();
  var filterHeight = filter.getBoundingClientRect().height;

  var tableHeight = 450; 

  d3.select(".list").style("max-height", tableHeight + "px");
}

export default drawTable;
