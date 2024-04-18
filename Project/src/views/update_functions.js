import * as d3 from "d3";
import {
  isPlayerSelected,
  getPlayerData,
  colorByRole,
  selected_players,
  isPlayerSelectedFromTable,
  isPlayerSelectedFromPC,
  selected_players_from_table,
  selected_players_from_pc,
  addPlayerSelectedFromPC,
  removePlayerSelectedFromPC,
  emptySelectionFromPC,
  emptySelection,
  isCheckboxSelected,
  setListData,
  colors,
} from "../utils";
import dataset_list from "../dataset/players_22_list.csv";
import dataset from "../dataset/players_22_parallel_coordinates.csv";
import { rad, getDataset } from "./radviz";
import {
  getLineChartDataset,
  dropdownSelected,
  brush_selection,
  x,
  x_r,
  xAxis,
} from "./line_chart";
import { onTableElementClick } from "./table";
import starting_dataset from "../dataset/list_values.csv";
import { colDict, getCircleColor } from "./scatterplot";
import { highlight, doNotHighlight } from "./parallel_coordinates";


export function updateFromScatterplot() {
  //far ridisegnare il line chart, il radar, il radviz e la lista con i dati relativi ai soli giocatori "brushati";
  //nelle parallel coordinates evidenziamo i giocatori relativi alla selezione

  updateTable();
  updateParallelCoordinates();
  updateRadviz();
}

export function updateFromParallelCoords() {
  //far ridisegnare il line chart, il radar, il radviz e la lista con i dati relativi ai soli giocatori "brushati";
  //nelle parallel coordinates evidenziamo i giocatori relativi alla selezione
  updateTable();
  updateRadviz();
  updateScatterplot();
}

export function updateFromCheckboxes() {
  //rimuove il brush dallo scatterplot se c'era
  d3.select("#scatterplot").select("g").select(".brush").call(d3.brush().clear);

  var circles = d3.select("#scatterplot").selectAll("circle");
  var radio_value = d3.select("#dropdown_cluster").property("value");
  // revert circles to initial style
  circles
    .attr("class", "brushed")
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

  //rimuoviamo i brush dalle parallel coords se c'erano
  d3.select("#parallelcoords")
    .selectAll(".brush")
    .each(function () {
      d3.select(this).call(d3.brush().clear);
    });

  //svuotiamo le selezioni
  emptySelection();
  emptySelectionFromPC();

  //aggiorniamo la tabella con i soli ruoli selezionati
  updateTable();

  //aggiorniamo le parallel coordinates con i soli ruoli selezionati
  updateParallelCoordinates();
}

// UPDATE RADAR -----------------------------------------------------

export function updateRadar() {
  var dataset = getDataset();
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
  }).then((data) => {
    updateRadarSVG(players, player_axis);
  });
}

function updateRadarSVG(players, player_axis) {
  var g = d3.select(".radarChart").select("svg").select("g");
  var selection_radarWrapper = g
    .selectAll(".radarWrapper")
    .data(players, (d) => {
      return d["sofifa_id"];
    });

  var selection_circleWrapper = g
    .selectAll(".radarCircleWrapper")
    .data(players, (d) => {
      return d["sofifa_id"];
    });

  var margin = { top: 30, right: 0, bottom: 50, left: -28 },
    width = Math.min(400, window.innerWidth / 4) - margin.left - margin.right,
    height = Math.min(width, window.innerHeight - margin.top - margin.bottom);
  const cfg = {
    w: 300,
    h: 130,
    margin: margin, //The margins of the SVG
    levels: 6, //How many levels or inner circles should there be drawn
    maxValue: 100, //What is the value that the biggest circle will represent
    labelFactor: 1.25, //How much farther than the radius of the outer circle should the labels be placed
    wrapWidth: 60, //The number of pixels after which a label needs to be given a new line
    opacityArea: 0.35, //The opacity of the area of the blob
    dotRadius: 3, //The size of the colored circles of each blog
    opacityCircles: 0.1, //The opacity of the circles of each blob
    strokeWidth: 2, //The width of the stroke around each blob
    roundStrokes: true, //If true the area and stroke will follow a round path (cardinal-closed)
    color: d3.scaleOrdinal(d3.schemeCategory10), //Color function,
    format: ".0f",
    unit: "",
    legend: false,
  };

  const maxValue = 100;
  const allAxis = player_axis[0].axes.map((i, j) => i.axis), //Names of each axis
    total = allAxis.length, //The number of different axes
    radius = Math.min(cfg.w / 2, cfg.h / 2), //Radius of the outermost circle
    Format = d3.format(cfg.format), //Formatting
    angleSlice = (Math.PI * 2) / total;
  const rScale = d3.scaleLinear().range([0, radius]).domain([0, maxValue]);
  var parent = d3.select(".radarChart");
  const radarLine = d3
    .radialLine()
    .curve(d3.curveLinearClosed)
    .radius((d) => rScale(d.value))
    .angle((d, i) => i * angleSlice);

  radarLine.curve(d3.curveCardinalClosed);


  const max = Math.max;
  const sin = Math.sin;
  const cos = Math.cos;
  const HALF_PI = Math.PI / 2;

  selection_radarWrapper.join(
    (enter) => {
      const blobWrapper = enter //enter -> giocatori che vengono aggiunti, dobbiamo creare un nuovo "item html" che li rappresenti
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
          //Bring back the hovered over blob
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
    },
    (update) => {
    },
    (exit) => {
      exit //exit -> giocatori che vengono rimossi
        .transition()
        .duration(750)
        .style("opacity", 0)
        .remove();
    }
  );

  //CERCHIETTI-----
  selection_circleWrapper
    .exit()
    .transition()
    .duration(750)
    .style("opacity", 0)
    .remove();

  const blobCircleWrapper = selection_circleWrapper
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

}

// UPDATE TABLE -----------------------------------------------------

function updateTable() {
  d3.csv(dataset_list, function (d) {
    if (isCheckboxSelected(d.Positions)) {
      //se ci sono giocatori selezionati solo dallo scatterplot
      if (selected_players.length > 0 && selected_players_from_pc.length == 0) {
        if (isPlayerSelected(d.sofifa_id)) {
          return {
            name: d.short_name,
            pic: d.player_face_url,
            role: d.Positions,
            sofifa_id: d.sofifa_id,
            club: d.club_name,
            foot: d.preferred_foot,
            contract: d.club_contract_valid_until,
          };
        }
      }
      //se ci sono giocatori selezionati solo dalle parallel coordinates
      else if (
        selected_players_from_pc.length > 0 &&
        selected_players.length == 0
      ) {
        if (isPlayerSelectedFromPC(d.sofifa_id)) {
          return {
            name: d.short_name,
            pic: d.player_face_url,
            role: d.Positions,
            sofifa_id: d.sofifa_id,
            club: d.club_name,
            foot: d.preferred_foot,
            contract: d.club_contract_valid_until,
          };
        }
      }
      //se ci sono giocatori selezionati in entrambi
      else if (
        selected_players_from_pc.length > 0 &&
        selected_players.length > 0
      ) {
        if (
          isPlayerSelected(d.sofifa_id) &&
          isPlayerSelectedFromPC(d.sofifa_id)
        ) {
          return {
            name: d.short_name,
            pic: d.player_face_url,
            role: d.Positions,
            sofifa_id: d.sofifa_id,
            club: d.club_name,
            foot: d.preferred_foot,
            contract: d.club_contract_valid_until,
          };
        }
      }
      //se non ci sono giocatori giocatori selezionati
      else {
        return {
          name: d.short_name,
          pic: d.player_face_url,
          role: d.Positions,
          sofifa_id: d.sofifa_id,
          club: d.club_name,
          foot: d.preferred_foot,
          contract: d.club_contract_valid_until,
        };
      }
    }
  }).then(function (data) {
    setListData(data);
    var titles = [name];

    var rows = d3
      .select(".list")
      .select("table")
      .select("tbody")
      .selectAll("tr")
      .data(data, (d) => {
        return d.sofifa_id;
      });

    rows.join(
      //righe aggiunte
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
          })
          .style("background", function (d) {
            if (isPlayerSelectedFromTable(d.sofifa_id)) {
              return colorByRole[d.role];
            } else {
              return null;
            }
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
            if (isPlayerSelectedFromTable(d.sofifa_id)) {
              return "1.5px solid white";
            } else {
              return "1.5px solid " + colorByRole[d.role];
            }
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
          .on("click", onTableElementClick)
          .select(function () {
            return this.parentNode;
          })
          .style("visibility", function (d) {
            if (isPlayerSelectedFromTable(d.sofifa_id)) {
              return "hidden";
            } else {
              return "none";
            }
          });
      },
      //righe aggiornate
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

      //righe rimosse
      (exit) => {
        exit 
          .remove();
      }
    );
  });
}

// UPDATE PARALLEL COORDINATES -----------------------------------------------------

function updateParallelCoordinates() {
  var div = d3.select("#parallelcoords").select(".tooltip");

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

  var svg = d3.select("#parallelcoords").select("svg").select("g");

  //rimuoviamo il vecchio brush se c'era
  svg.selectAll(".brush").each(function () {
    d3.select(this).call(d3.brush().clear); //rimuove il brush
  });

  d3.csv(dataset, function (d) {
    if (isCheckboxSelected(d.Positions)) {
      if (selected_players.length > 0) {
        if (isPlayerSelected(d.sofifa_id)) {
          return d;
        }
      } else {
        return d;
      }
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
    //

    // Add grey background lines for context.
    background = svg
      .selectAll(".background")
      .selectAll("path")
      .data(data, (d) => {
        return d.sofifa_id;
      });

    background.join(
      (enter) => {
        enter
          .append("path")
          .attr("d", line)
          .attr("id", function (d) {
            return "line_bg_" + d.sofifa_id;
          })
          .style("stroke-width", function (d) {
            if (isPlayerSelectedFromTable(d.sofifa_id)) {
              return "13px";
            } else {
              return "2px";
            }
          })
          .style("stroke", function (d) {
            if (isPlayerSelectedFromTable(d.sofifa_id)) {
              return "black";
            } else {
              return "grey";
            }
          })
          .style("opacity", function (d) {
            if (isPlayerSelectedFromTable(d.sofifa_id)) {
              return "1";
            } else {
              return "0.1";
            }
          });
      },
      (update) => {
        update
          .attr("d", line)
          .attr("id", function (d) {
            return "line_bg_" + d.sofifa_id;
          })
          .transition()
          .duration(500)
          .style("stroke-width", function (d) {
            if (isPlayerSelectedFromTable(d.sofifa_id)) {
              return "13px";
            } else {
              return "2px";
            }
          })
          .style("stroke", function (d) {
            if (isPlayerSelectedFromTable(d.sofifa_id)) {
              return "black";
            } else {
              return "grey";
            }
          })
          .style("opacity", function (d) {
            if (isPlayerSelectedFromTable(d.sofifa_id)) {
              return "1";
            } else {
              return "0.1";
            }
          });
      },
      (exit) => {
        exit.transition().duration(500).style("opacity", 0).remove();
      }
    );

    foreground = svg
      .selectAll(".foreground")
      .selectAll("path")
      .data(data, (d) => {
        return d.sofifa_id;
      });

    foreground.style("display", null).style("opacity", 1);

    foreground.join(
      (enter) => {
        enter
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
          .style("stroke-width", function (d) {
            if (isPlayerSelectedFromTable(d.sofifa_id)) {
              return "10px";
            } else {
              return "2px";
            }
          })
          .style("opacity", function (d) {
            if (
              isPlayerSelectedFromTable(d.sofifa_id) ||
              selected_players.length != 0
            ) {
              return "1";
            } else if (selected_players.length == 0) {
              return "1";
            } else {
              return "0";
            }
          })
          .on("mouseover", highlight)
          .on("mouseleave", doNotHighlight);
      },
      (update) => {
        update
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
          .on("mouseover", highlight)
          .on("mouseleave", doNotHighlight);
      },
      (exit) => {
        exit.transition().duration(500).style("opacity", 0).remove();
      }
    );

    // Add a group element for each dimension.
    var g = svg
      .selectAll(".dimension")
      .data(dimensions, (d) => {
        return d;
      })
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
              .duration(0)
              .attr("visibility", null);
          })
      );

    // Add an axis and title.

    svg
      .selectAll(".dimension")
      .selectAll(".axis")
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

    svg
      .selectAll(".dimension")
      .selectAll(".brush")
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
    //emptySelectionFromTable();
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

    // Change line visibility based on brush extent.

    var foreground = d3.select(".foreground").selectAll("path");
    if (actives.length === 0) {
      emptySelectionFromPC();
      foreground.style("display", null).style("opacity", 1);
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
    //updateParallelCoordsFromTable();
  }

  // Handles a brush event, toggling the display of foreground lines.
  function brushended() {
    emptySelectionFromPC();

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
      foreground.style("display", null);
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
}

// UPDATE RADVIZ --------------------------------------------------------

export function updateRadviz() {

  d3.selectAll(".data_point").style("stroke-width", 0.2).attr("r", 1);

  if (selected_players_from_table.length > 0) {
    //rendiamo i pallini dei giocatori selezionati dalla tabella colorati e più grandi
    selected_players_from_table.forEach(function (player_id) {
      d3.select("#rp_" + String(player_id))
        .style(
          //point id example: p_1974-1643655473284
          "stroke-width",
          0.5
        )
        .style("stroke-opacity", 1)
        .raise()
        .attr("r", 2.5);
    });
  }

  var colorSelected = d3
    .select('input[name="radio_radviz"]:checked')
    .property("value");

  if (selected_players.length > 0 && selected_players_from_pc.length == 0) {
    d3.selectAll(".data_point").each(function (d) {
      var class_name = d3.select("#rp_" + d.original.sofifa_id).attr("class");
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
        d3.select(this).raise().transition().duration(500).style("opacity", 1);
      }
    });
  }
  //se ci sono giocatori selezionati solo dalle parallel coordinates
  else if (
    selected_players_from_pc.length > 0 &&
    selected_players.length == 0
  ) {
    d3.selectAll(".data_point").each(function (d) {
      var class_name = d3.select("#rp_" + d.original.sofifa_id).attr("class");
      var class_substrings = class_name.split(" ");
      if (!isPlayerSelectedFromPC(d.original.sofifa_id)) {
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
  //se ci sono giocatori selezionati in entrambi
  else if (selected_players_from_pc.length > 0 && selected_players.length > 0) {
    d3.selectAll(".data_point").each(function (d) {
      var class_name = d3.select("#rp_" + d.original.sofifa_id).attr("class");
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
  } //se non ci sono giocatori giocatori selezionati
  else {
    d3.selectAll(".data_point").each(function (d) {
      var class_name = d3.select("#rp_" + d.original.sofifa_id).attr("class");
      var class_substrings = class_name.split(" ");
      d3.select(this)
        .style("opacity", 1)

        .raise();

      if (class_substrings.length == 3) {
        d3.select(this).attr(
          "class",
          class_name.split(" non_brushed")[0]
        );
      }
    });
  }
  //show only selected players
  //}
  //);
}

export function updateLineChart() {
  var dataset;
  if (d3.select("#all_checkbox").property("checked")) {
    dataset = starting_dataset;
  } else {
    dataset = getLineChartDataset();
  }

  var players_from_table = [];

  d3.csv(
    dataset,

    // When reading the csv, I must format variables:
    function (d) {
      var value;
      var percentile_value;
      var percentile_wage;
      if (dropdownSelected == "tv") {
        value = d.value_eur;
        percentile_value = d.percentile;
        percentile_wage = d.percentile_wage;
      }
      if (dropdownSelected == "pw") {
        value = d.wage_eur;
        percentile_value = d.percentile_value;
        percentile_wage = d.percentile;
      }
      if (isPlayerSelectedFromTable(d.sofifa_id)) {
        players_from_table.push({
          sofifa_id: d.sofifa_id,
          value: d.value_eur,
          wage: d.wage_eur,
          count: d.count,
          position: d.Positions,
          percentile_value: percentile_value,
          percentile_wage: percentile_wage,
          name: d.short_name,
        });
      }
      return {
        value: value,
        count: d.count,
        percentile: d.percentile,
        player_id: d.sofifa_id,
        position: d.Positions,
        name: d.short_name,
      };
    }
  ).then(function (data) {
    //line_chart_data = data;
    const margin = { top: 70, right: 80, bottom: 30, left: 80 },
      width = 1750 - margin.left - margin.right,
      height = 480 - margin.top - margin.bottom,
      height_r = 180 - margin.top - margin.bottom;

    var svg = d3.select("#line_chart").select("svg").select("g");
    var svg_r = d3
      .select("#line_chart_range_selector")
      .select("svg")
      .select("g");

    x.domain(
      d3.extent(data, function (d) {
        return +d.value;
      })
    );
    if (brush_selection) {
      x.domain(brush_selection.map(x_r.invert, x_r));
      xAxis.call(d3.axisBottom(x));
    }

    var playerLines = svg
      .selectAll(".groupLine")
      .data(players_from_table, (d) => {
        return d.sofifa_id;
      });

    playerLines.join(
      (enter) => {
        var groupLine = enter
          .append("g")
          .attr("class", "groupLine")
          .attr("id", function (d) {
            return "pl_" + d.sofifa_id;
          });

        //create the line
        groupLine
          .append("line")
          .attr("class", "playerLine")

          .attr("x1", function (d) {
            if (dropdownSelected == "tv") {
              return x(d.value);
            }
            if (dropdownSelected == "pw") {
              return x(d.wage);
            }
          }) //<<== value of x
          .attr("y1", height)
          .attr("x2", function (d) {
            if (dropdownSelected == "tv") {
              return x(d.value);
            }
            if (dropdownSelected == "pw") {
              return x(d.wage);
            }
          }) //<<== value of x
          .attr("y2", 0)
          .style("stroke-width", 3)
          .style("stroke", function (d) {
            return colorByRole[d.position];
          })
          .style("fill", "none");

        //create the text for the name
        groupLine
          .append("text")
          .attr("class", "pinNameText")
          .attr("x", function (d) {
            if (dropdownSelected == "tv") {
              return x(d.value);
            }
            if (dropdownSelected == "pw") {
              return x(d.wage);
            }
          })
          .attr("dx", ".35em")
          .attr("y", -40)
          .style("fill", function (d) {
            return colorByRole[d.position];
          })
          .style("text-anchor", "middle")
          .style("font-size", "20px")
          .text(function (d) {
            return d.name;
          });

        //create the text for the percentile
        groupLine
          .append("text")
          .attr("class", "pinPcntText")
          .attr("x", function (d) {
            if (dropdownSelected == "tv") {
              return x(d.value);
            }
            if (dropdownSelected == "pw") {
              return x(d.wage);
            }
          })
          .attr("dx", ".35em")
          .attr("y", -8)
          .style("fill", function (d) {
            return colorByRole[d.position];
          })
          .style("text-anchor", "middle")
          .style("font-size", "20px")
          .text(function (d) {
            if (dropdownSelected == "tv") {
              return "(Percentile: " + d.percentile_value + ")";
            }
            if (dropdownSelected == "pw") {
              return "(Percentile: " + d.percentile_wage + ")";
            }
          });
        groupLine.on("mouseover", mouseover_lc).on("mouseout", mouseout_lc);
      },
      (update) => {
        //non dovrebbe servire, quindi lo lascio vuoto
      },
      (exit) => {
        exit.transition().duration(500).style("opacity", 0).remove();
      }
    );

    //RANGE
    var playerLines_r = svg_r
      .selectAll(".groupLine_r")
      .data(players_from_table, (d) => {
        return d.sofifa_id;
      });

    playerLines_r.join(
      (enter) => {
        var groupLine_r = enter
          .append("g")
          .attr("class", "groupLine_r")
          .attr("id", function (d) {
            return "pl_r_" + d.sofifa_id;
          });

        //create the line
        groupLine_r
          .append("line")
          .attr("class", "playerLine_r")

          .attr("x1", function (d) {
            if (dropdownSelected == "tv") {
              return x_r(d.value);
            }
            if (dropdownSelected == "pw") {
              return x_r(d.wage);
            }
          }) //<<== value of x
          .attr("y1", height_r)
          .attr("x2", function (d) {
            if (dropdownSelected == "tv") {
              return x_r(d.value);
            }
            if (dropdownSelected == "pw") {
              return x_r(d.wage);
            }
          }) //<<== value of x
          .attr("y2", 0)
          .style("stroke-width", 3)
          .style("stroke", function (d) {
            return colorByRole[d.position];
          })
          .style("fill", "none");

        groupLine_r.on("mouseover", mouseover_lc).on("mouseout", mouseout_lc);
      },
      (update) => {
        //non dovrebbe servire, quindi lo lascio vuoto
      },
      (exit) => {
        exit.transition().duration(500).style("opacity", 0).remove();
      }
    );

    function mouseover_lc(event, d) {
      d3.selectAll(".groupLine").style("opacity", 0.1);
      d3.selectAll(".groupLine_r").style("opacity", 0.1);
      d3.select("#pl_" + d.sofifa_id).style("opacity", 1);
      d3.select("#pl_r_" + d.sofifa_id).style("opacity", 1);
    }
    function mouseout_lc(event, d) {
      d3.selectAll(".groupLine").style("opacity", 1);
      d3.selectAll(".groupLine_r").style("opacity", 1);
    }
  });
}

export function updateScatterplot() {
  //rimuove il brush dallo scatterplot se c'era
  var scatterplot = d3.select("#scatterplot").select("g");
  var radio_value = d3.select("#dropdown_cluster").property("value");

  scatterplot.selectAll("circle").attr("class", "brushed");

  //se ci sono giocatori selezionati solo dalla TABLE -------------------
  if (
    selected_players_from_table.length > 0 &&
    selected_players_from_pc.length == 0
  ) {
    d3.select("#scatterplot")
      .select("#circle_container")
      .selectAll("circle")
      .attr("r", 4)
      .style("fill", function (d) {
        return getCircleColor(d);
      })
      .style("opacity", 1)
      .style("stroke-width", 0.5);

    //rendiamo i pallini dei giocatori selezionati dalla tabella colorati e più grandi
    selected_players_from_table.forEach(function (player_id) {
      d3.select("#scatterplot")
        .select("#circle_container")
        .select("#sp_circle_" + String(player_id))
        .style("stroke-opacity", 1)
        .style("stroke-width", 2)
        .style("opacity", 1)
        .attr("r", 10)
        .style("fill", function (d) {
          return getCircleColor(d);
        })
        .raise();
    });
  }
  //se ci sono giocatori selezionati solo dalle PARALLEL COORDINATES -------------------
  else if (
    selected_players_from_pc.length > 0 &&
    selected_players_from_table.length == 0
  ) {
    scatterplot.select(".brush").call(d3.brush().clear); //rimuove il brush se c'era

    scatterplot.selectAll("circle").each(function (d) {
      if (isPlayerSelectedFromPC(d.sofifa_id)) {
        d3.select(this).attr("class", "brushed");
      } else {
        d3.select(this).attr("class", "non_brushed");
      }
    });

    //abbassiamo l'opacity di tutti i pallini e li facciamo grigi
    d3.select("#scatterplot")
      .select("#circle_container")
      .selectAll("circle")
      .attr("r", 4)
      .style("opacity", 0.1)
      .style("stroke-opacity", 0.4)
      .style("fill", "grey");

    //rendiamo i pallini dei giocatori selezionati dalla tabella colorati e più grandi
    selected_players_from_pc.forEach(function (player_id) {
      d3.select("#scatterplot")
        .select("#circle_container")
        .select("#sp_circle_" + String(player_id))
        .attr("r", 4)
        .style("fill", function (d) {
          return getCircleColor(d);
        })
        .style("stroke-width", 0.5)
        .style("opacity", 1)
        .raise();
    });
  }
  //se ci sono giocatori selezionati in ENTRAMBI -------------------
  else if (
    selected_players_from_pc.length > 0 &&
    selected_players_from_table.length > 0
  ) {
    scatterplot.select(".brush").call(d3.brush().clear);
    //abbassiamo l'opacity di tutti i pallini e li facciamo grigi
    d3.select("#scatterplot")
      .select("#circle_container")
      .selectAll("circle")
      .style("opacity", 0.1)
      .style("stroke-opacity", 0.4)
      .style("fill", "grey");

    d3.select("#scatterplot")
      .select("#circle_container")
      .selectAll(".brushed")
      .attr("r", 4);

    //rendiamo i pallini dei giocatori selezionati dalla tabella colorati e più grandi
    selected_players_from_pc.forEach(function (player_id) {
      d3.select("#scatterplot")
        .select("#circle_container")
        .select("#sp_circle_" + String(player_id))
        .attr("r", 4)
        .style("fill", function (d) {
          return getCircleColor(d);
        })
        .style("opacity", 1)
        .raise();
    });

    selected_players_from_table.forEach(function (player_id) {
      d3.select("#scatterplot")
        .select("#circle_container")
        .select("#sp_circle_" + String(player_id))
        .attr("r", 10)
        .style("fill", function (d) {
          return getCircleColor(d);
        })
        .style("stroke-width", 2)
        .style("stroke-opacity", 1)
        .style("opacity", 1)
        .raise();
    });
  }

  //se non ci sono giocatori giocatori selezionati -------------------
  else {
    //reset the default style of the circles
    if (selected_players.length == 0) {
      d3.select("#scatterplot")
        .select("#circle_container")
        .selectAll("circle")
        .attr("r", 4)
        .style("opacity", 1)
        .style("stroke-opacity", 0.4)
        .style("stroke-width", 0.5)
        .style("fill", function (d) {
          return getCircleColor(d);
        });
    } else {
      d3.select("#scatterplot")
        .select("#circle_container")
        .selectAll(".brushed")
        .style("stroke-width", 0.5)
        .attr("r", 4);
    }
  }
}

export function updateParallelCoordsFromTable() {
  var foreground = d3
    .select("#parallelcoords")
    .select("svg")
    .select("g")
    .select(".foreground")
    .style("opacity", 1);

  var background = d3
    .select("#parallelcoords")
    .select("svg")
    .select("g")
    .select(".background")
    .selectAll("path")
    .style("fill", "none")
    .style("stroke", "grey")
    .style("opacity", 0.1)
    .style("stroke-width", "2px");

  if (
    selected_players_from_table.length > 0 &&
    selected_players_from_pc.length == 0
  ) {
    foreground
      .selectAll("path")
      .style("opacity", "0");

    background
      .style("stroke", function (d) {
        return colorByRole[d.Positions];
      })
      .style("stroke-width", "2px")
      .style("opacity", "1");
    selected_players_from_table.forEach(function (player_id) {
      foreground
        .select("#line_pc_" + player_id)
        .style("stroke", function (d) {
          return colorByRole[d.Positions];
        })
        .style("stroke-width", "10px")
        .style("opacity", "1")
        .style("display", null)
        .raise();

      //background
      d3.select("#line_bg_" + player_id)
        .style("stroke", "black")
        .style("stroke-width", "13px")
        .style("opacity", "1")
        .raise();
    });
  } else if (
    selected_players_from_table.length > 0 &&
    selected_players_from_pc.length > 0
  ) {
    foreground
      .selectAll("path")
      .style("stroke", function (d) {
        return colorByRole[d.Positions];
      })
      .style("stroke-width", "2px")
      .style("opacity", "1");

    selected_players_from_table.forEach(function (player_id) {
      foreground
        .select("#line_pc_" + player_id)
        .style("stroke", function (d) {
          return colorByRole[d.Positions];
        })
        .style("stroke-width", "10px")
        .style("opacity", 1)
        .style("display", null)
        .raise();

      //background
      d3.select("#line_bg_" + player_id)
        .style("stroke", "black")
        .style("stroke-width", "13px")
        .style("opacity", 1)
        .raise();
    });
  } else {
    foreground
      .selectAll("path")
      .style("opacity", "1")
      .style("stroke", function (d) {
        return colorByRole[d.Positions];
      })
      .style("stroke-width", "2px");
  }
}

export function updateRadvizColors() {
  //Cambiamo i colori dei pallini in base al radio button
  var colorSelected = d3
    .select('input[name="radio_radviz"]:checked')
    .property("value");
  if (colorSelected == "ee") {
    rad.setColorPoint(0);
  }
  if (colorSelected == "c") {
    d3.selectAll(".data_point").each(function (d) {
      d3.select(this).style("fill", (d) => {
        return colorByRole[d.attributes.Positions];
      });
    });
  }
}
