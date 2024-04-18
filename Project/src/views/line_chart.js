import * as d3 from "d3";
import {
  colorByRole,
  isPlayerSelectedFromTable,
} from "../utils";
import dataset_pw from "../dataset/players_22_list_wages.csv";
import dataset_tv from "../dataset/players_22_list_values.csv";
import starting_dataset_values from "../dataset/list_values.csv";
import starting_dataset_wages from "../dataset/list_wages.csv";

const margin = { top: 70, right: 80, bottom: 30, left: 80 },
  width = 1750 - margin.left - margin.right,
  height = 480 - margin.top - margin.bottom,
  height_r = 180 - margin.top - margin.bottom;

var dropdown_lc = d3.select("#dropdown_lc").on("change", dropdownLCChange);
var y, y_r, line_chart_data , xAxis_r, yAxis;
export var x, x_r, xAxis, line_chart_data, brush_selection;

export var dropdownSelected;

export function getLineChartDataset() {
  var selected_dataset;
  const selectedVal = d3.select("#dropdown_lc").property("value");

  if (d3.select("#all_checkbox").property("checked")) {
    if (selectedVal == "tv") {
      dropdownSelected = "tv";
      selected_dataset = starting_dataset_values;
    }
    if (selectedVal == "pw") {
      dropdownSelected = "pw";
      selected_dataset = starting_dataset_wages;
    }
  } else {
    if (selectedVal == "tv") {
      dropdownSelected = "tv";
      selected_dataset = dataset_tv;
    }
    if (selectedVal == "pw") {
      dropdownSelected = "pw";
      selected_dataset = dataset_pw;
    }
  }
  return selected_dataset;
}
export function getDropdownValue() {
  const selectedVal = d3.select("#dropdown_lc").property("value");
  if (selectedVal == "tv") {
    dropdownSelected = "tv";
  }
  if (selectedVal == "pw") {
    dropdownSelected = "pw";
  }
}

export function drawLC() {
  // set the dimensions and margins of the graph

  x = d3.scaleLinear().range([0, width]);

  y = d3.scaleLinear().range([height, 0]);

  x_r = d3.scaleLinear().range([0, width]);
  y_r = d3.scaleLinear().range([height_r, 0]);

  // define the line
  var valueline = d3
    .line()
    .x(function (d) {
      return x(d.value);
    })
    .y(function (d) {
      return y(d.count);
    });

  var valueline_r = d3
    .line()
    .x(function (d) {
      return x_r(d.value);
    })
    .y(function (d) {
      return y_r(d.count);
    });

  var div = d3
    .select("#line_chart")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // append the svg obgect to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin

  var svg = d3
    .select("#line_chart")
    .append("svg")
    .attr("viewBox", [
      0,
      0,
      width + margin.left + margin.right,
      height + margin.top + margin.bottom,
    ])
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top} )`);

  var clip = svg
    .append("defs")
    .append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width) 
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);

  var svg_r = d3
    .select("#line_chart_range_selector")
    .append("svg")
    .attr("viewBox", [
      0,
      0,
      width + margin.left + margin.right,
      height_r + margin.top + margin.bottom,
    ])
    .append("g")
    .attr("transform", `translate(${margin.left}, 0 )`);

  var clip_r = svg_r
    .append("defs")
    .append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width - margin.right - margin.left) 
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);

  // Get the data
  d3.csv(
    getLineChartDataset(),

    // When reading the csv, I must format variables:
    function (d) {
      getDropdownValue();
      var value;
      if (dropdownSelected == "tv") {
        value = d.value_eur;
      }
      if (dropdownSelected == "pw") {
        value = d.wage_eur;
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
    line_chart_data = data;
    x.domain(
      d3.extent(data, function (d) {
        return +d.value;
      })
    );

    y.domain([
      0,
      d3.max(data, function (d) {
        return +d.count;
      }),
    ]);

    x_r.domain(
      d3.extent(data, function (d) {
        return +d.value;
      })
    );

    y_r.domain([
      0,
      d3.max(data, function (d) {
        return +d.count;
      }),
    ]);

    // Add the valueline path.
    svg
      .append("g")
      .attr("clip-path", "url(#clip)")
      .append("path")
      .data([data])
      .attr("class", "line")
      .attr("d", valueline);
    svg_r
      .append("g")
      .attr("clip-path", "url(#clip_r)")
      .append("path")
      .data([data])
      .attr("class", "line_r")
      .attr("d", valueline_r);

    // add the dots with tooltips
    svg
      .selectAll(".circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "circle")
      .attr("r", 10)
      .attr("cx", function (d) {
        return x(d.value);
      })
      .attr("cy", function (d) {
        return y(d.count);
      })
      .style("fill", "#ffd369")
      .style("opacity", "0")
      .on("mouseover", function (event, d) {
        d3.select(this).style("opacity", "1");
        div.transition().duration(200).style("opacity", 0.9);
        div
          .html("Percentile: " + d.percentile)
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function (d) {
        d3.select(this).style("opacity", "0");
        div.transition().duration(500).style("opacity", 0);
      });

    // Add the X Axis
    xAxis = svg
      .append("g")
      .attr("id", "xAxis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g").attr("id", "yAxis").call(d3.axisLeft(y));

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "28px")
      .attr("fill", "#eeeeee")
      .text("Count");

    x_r.domain(
      d3.extent(data, function (d) {
        return +d.value;
      })
    );

    xAxis_r = svg_r
      .append("g")
      .attr("id", "xAxis_r")
      .attr("transform", "translate(0," + height_r + ")")
      .call(d3.axisBottom(x_r));

    svg_r
      .append("text")
      .attr(
        "transform",
        "translate(" + width / 2 + " ," + (height_r + margin.top + 20) + ")"
      )
      .style("text-anchor", "middle")
      .style("font-size", "28px")
      .attr("fill", "#eeeeee")
      .text("Euros");

    // Add Y axis
    y_r.domain([
      0,
      d3.max(data, function (d) {
        return +d.count;
      }),
    ]);

    const brush_r = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height_r],
      ])
      .on("brush", brushed)
      .on("end", brushended);

    const defaultSelection = [
      x(d3.utcYear.offset(x.domain()[0], 0)),
      x.range()[1],
    ];

    const gb = svg_r
      .append("g")
      .attr("class", "brush_lc")
      .call(brush_r)
      .call(brush_r.move, x_r.range());

    function brushed({ selection }) {
      brush_selection = selection;
      if (selection) {
        x.domain(selection.map(x_r.invert, x_r));
        xAxis.call(d3.axisBottom(x));
        svg.selectAll(".line").attr(
          "d",
          d3
            .line()
            .x(function (d) {
              return x(d.value);
            })
            .y(function (d) {
              return y(d.count);
            })
        );
        //cerchietti
        svg
          .selectAll(".circle")
          .attr("cx", function (d) {
            return x(d.value);
          })
          .attr("cy", function (d) {
            return y(d.count);
          });

        //groupLines
        svg
          .selectAll(".playerLine")
          .attr("x1", function (d) {
            if (dropdownSelected == "tv") {
              return x(d.value);
            }
            if (dropdownSelected == "pw") {
              return x(d.wage);
            }
          }) //<<== value of x
          .attr("x2", function (d) {
            if (dropdownSelected == "tv") {
              return x(d.value);
            }
            if (dropdownSelected == "pw") {
              return x(d.wage);
            }
          });

        svg.selectAll(".pinNameText").attr("x", function (d) {
          if (dropdownSelected == "tv") {
            return x(d.value);
          }
          if (dropdownSelected == "pw") {
            return x(d.wage);
          }
        });

        svg
          .selectAll(".pinPcntText")
          .attr("x", function (d) {
            if (dropdownSelected == "tv") {
              return x(d.value);
            }
            if (dropdownSelected == "pw") {
              return x(d.wage);
            }
          })
          .text(function (d) {
            if (dropdownSelected == "tv") {
              return "(Percentile: " + d.percentile_value + ")";
            }
            if (dropdownSelected == "pw") {
              return "(Percentile: " + d.percentile_wage + ")";
            }
          });
      }
    }

    function brushended({ selection }) {
      if (!selection) {
        gb.call(brush_r.move, x.range());
      }
    }
  });
}

export function dropdownLCChange() {
  var players_from_table = [];
  d3.csv(getLineChartDataset(), function (d) {
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
  }).then(function (data) {
    x.domain(
      d3.extent(data, function (d) {
        return +d.value;
      })
    );

    y.domain([
      0,
      d3.max(data, function (d) {
        return +d.count;
      }),
    ]);

    x_r.domain(
      d3.extent(data, function (d) {
        return +d.value;
      })
    );

    y_r.domain([
      0,
      d3.max(data, function (d) {
        return +d.count;
      }),
    ]);

    d3.select("#xAxis").transition().duration(1000).call(d3.axisBottom(x));

    d3.select("#yAxis").transition().duration(1000).call(d3.axisLeft(y));

    d3.select("#xAxis_r").transition().duration(1000).call(d3.axisBottom(x_r));

    var valueline = d3
      .line()
      .x(function (d) {
        return x(d.value);
      })
      .y(function (d) {
        return y(d.count);
      });
    var valueline_r = d3
      .line()
      .x(function (d) {
        return x_r(d.value);
      })
      .y(function (d) {
        return y_r(d.count);
      });

    d3.select("#line_chart")
      .selectAll(".line")
      .data([data])
      .transition()
      .duration(1000)
      .attr("d", valueline);

    d3.select("#line_chart_range_selector")
      .select(".line_r")
      .data([data])
      .transition()
      .duration(1000)
      .attr("d", valueline_r);

    //remove the old circles
    d3.select("#line_chart").selectAll(".circle").remove();

    var div = d3.select("#line_chart").select(".tooltip").style("opacity", 0);

    d3.select("#line_chart")
      .select("svg")
      .select("g")
      .selectAll(".circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "circle")
      .attr("r", 10)
      .attr("cx", function (d) {
        return x(d.value);
      })
      .attr("cy", function (d) {
        return y(d.count);
      })
      .style("fill", "#ffd369")
      .style("opacity", "0")
      .on("mouseover", function (event, d) {
        d3.select(this).style("opacity", "1");
        div.transition().duration(200).style("opacity", 0.9);
        div
          .html("Percentile: " + d.percentile)
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function (d) {
        d3.select(this).style("opacity", "0");
        div.transition().duration(500).style("opacity", 0);
      });

    const brush_r = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height_r],
      ])
      .on("brush", brushed)
      .on("end", brushended);
    //rimuoviamo il vecchio brush
    d3.select("#line_chart_range_selector").select(".brush_lc").remove();
    //lo appendiamo di nuovo
    d3.select("#line_chart_range_selector")
      .select("svg")
      .select("g")
      .append("g")
      .attr("class", "brush_lc")
      .call(brush_r)
      .call(brush_r.move, x_r.range());

    var svg = d3.select("#line_chart").select("svg").select("g");
    var svg_r = d3
      .select("#line_chart_range_selector")
      .select("svg")
      .select("g");

    d3.selectAll(".groupLine").remove();
    d3.selectAll(".groupLine_r").remove();
    var groupLines = svg
      .selectAll(".groupLine")
      .data(players_from_table)
      .enter()
      .append("g")
      .attr("class", "groupLine")
      .attr("id", function (d) {
        return "pl_" + d.sofifa_id;
      });
    var groupLines_r = svg_r
      .selectAll(".groupLine_r")
      .data(players_from_table)
      .enter()
      .append("g")
      .attr("class", "groupLine_r")
      .attr("id", function (d) {
        return "pl_r_" + d.sofifa_id;
      });

    //create the line
    groupLines
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
    groupLines
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
    groupLines
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

    groupLines.on("mouseover", mouseover_lc).on("mouseout", mouseout_lc);

    groupLines_r
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

    groupLines_r.on("mouseover", mouseover_lc).on("mouseout", mouseout_lc); //<<== value of x

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

    function brushed({ selection }) {
      if (selection) {
        var svg = d3.select("#line_chart").select("svg");
        x.domain(selection.map(x_r.invert, x_r));
        xAxis.call(d3.axisBottom(x));
        svg.selectAll(".line").attr(
          "d",
          d3
            .line()
            .x(function (d) {
              return x(d.value);
            })
            .y(function (d) {
              return y(d.count);
            })
        );
        //cerchietti
        svg
          .selectAll(".circle")
          .attr("cx", function (d) {
            return x(d.value);
          })
          .attr("cy", function (d) {
            return y(d.count);
          });

        //groupLines
        svg
          .selectAll(".playerLine")
          .attr("x1", function (d) {
            if (dropdownSelected == "tv") {
              return x(d.value);
            }
            if (dropdownSelected == "pw") {
              return x(d.wage);
            }
          }) //<<== value of x
          .attr("x2", function (d) {
            if (dropdownSelected == "tv") {
              return x(d.value);
            }
            if (dropdownSelected == "pw") {
              return x(d.wage);
            }
          });

        svg.selectAll(".pinNameText").attr("x", function (d) {
          if (dropdownSelected == "tv") {
            return x(d.value);
          }
          if (dropdownSelected == "pw") {
            return x(d.wage);
          }
        });

        svg
          .selectAll(".pinPcntText")
          .attr("x", function (d) {
            if (dropdownSelected == "tv") {
              return x(d.value);
            }
            if (dropdownSelected == "pw") {
              return x(d.wage);
            }
          })
          .text(function (d) {
            if (dropdownSelected == "tv") {
              return "(Percentile: " + d.percentile_value + ")";
            }
            if (dropdownSelected == "pw") {
              return "(Percentile: " + d.percentile_wage + ")";
            }
          });
      }
    }

    function brushended({ selection }) {
      if (!selection) {
        gb.call(brush_r.move, x.range());
      }
    }
  });
}


if (module.hot) {
  module.hot.accept(
    [
      "../dataset/players_22_list_values.csv",
      "../dataset/players_22_list_wages.csv",
    ],
    function () {
      dropdownLCChange();
    }
  );
}
