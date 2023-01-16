/*
* Visualization 1 - Task 1 Framework
* Copyright (C) University of Passau
*   Faculty of Computer Science and Mathematics
*   Chair of Cognitive sensor systems
* Maintenance:
*   2022, Alexander Gall <alexander.gall@uni-passau.de>
*   2022, Anja Heim <Anja.Heim@uni-passau.de>
*
* All rights reserved.
*
* Acknowledgements:
*   Special thanks to the TU Wien for providing the basic framework:
*       Institute of Visual Computing and Human-Centered Technology
*       Research Unit of Computer Graphics
*/

// scatterplot axes
let xAxis, yAxis, xAxisLabel, yAxisLabel;
// radar chart axes
let radarAxes, radarAxesAngle;

let dimensions = ["dimension 1", "dimension 2", "dimension 3", "dimension 4", "dimension 5", "dimension 6"];
//*HINT: the first dimension is often a label; you can simply remove the first dimension with
// dimensions.splice(0, 1);

// the visual channels we can use for the scatterplot
let channels = ["scatterX", "scatterY", "size"];

// size of the plots
let margin, width, height, radius;
// svg containers
let scatter, radar;
// parsed data
let parsedData;
// true if the data loaded was loaded
let dataLoaded = false;
// used to adjust the max values
let maxPuffer = 1.10
// used to adjust the min values
let minPuffer = 0.90
// max number on entries in legend
let maxNumberOfEntriesInLegend = 5;

// create the base of the page
function init() {
    // define size of plots
    margin = {top: 20, right: 20, bottom: 20, left: 50};
    width = 600;
    height = 500;
    radius = width / 2;

    // scatterplot SVG container and axes
    scatter = d3.select("#sp").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    // radar chart SVG container and axes
    radar = d3.select("#radar").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

    // read and parse input file
    let fileInput = document.getElementById("upload"), readFile = function () {

        // clear existing visualizations
        clear();

        let reader = new FileReader();
        reader.onloadend = function () {
            console.log("data loaded:\n" + reader.result);

            // IMPLEMENTED: parse reader.result data and call initVis with the parsed data!
            parsedData = d3.csvParse(reader.result);

            // keep the first column and remove all other non-numeric rows and columns containing empty values
            parsedData.forEach(function (row) {
                let keys = Object.keys(row);
                for (let i = 1; i < keys.length; i++) {
                    if (isNaN(row[keys[i]]) || row[keys[i]] === "") {
                        delete row[keys[i]];
                    }
                }
            });

            // add an id column at the end for better data handling
            parsedData.forEach((row, index) => {
                row.csvID = index + 1;
            });

            initVis();
        };
        reader.readAsBinaryString(fileInput.files[0]);
    };
    fileInput.addEventListener('change', readFile);
}

// initialize visualisation
function initVis() {
    // IMPLEMENTED: parse dimensions (i.e., attributes) from input file
    dimensions = Object.keys(parsedData[0]) // load all dimensions from the parsed data
    dimensions.splice(0, 1); // remove the non-numeric name dimension
    dimensions.splice(dimensions.length - 1, 1); // remove the csvID dimension

    // y scaling for scatterplot
    // IMPLEMENTED: set y domain for each dimension
    let yMin = minPuffer * d3.min(parsedData, function (d) {
        return parseFloat(d[dimensions[0]]);
    });

    let yMax = maxPuffer * d3.max(parsedData, function (d) {
        return parseFloat(d[dimensions[0]]);
    });

    let y = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height - margin.bottom - margin.top, margin.top])

    // x scaling for scatterplot
    // IMPLEMENTED: set x domain for each dimension
    let xMin = minPuffer * d3.min(parsedData, function (d) {
        return parseFloat(d[dimensions[0]]);
    });
    let xMax = maxPuffer * d3.max(parsedData, function (d) {
        return parseFloat(d[dimensions[0]]);
    });
    let x = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([margin.left, width - margin.left - margin.right])

    // scatterplot axes
    yAxis = scatter.append("g") // append the group element for yAxis
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ")")
        .call(d3.axisLeft(y));

    yAxisLabel = yAxis.append("text") // append the label element for yAxis
        .style("text-anchor", "middle")
        .attr("y", margin.top / 2)
        .text(dimensions[0]);

    xAxis = scatter.append("g") // append the group element for xAxis
        .attr("class", "axis")
        .attr("transform", "translate(0, " + (height - margin.bottom - margin.top) + ")")
        .call(d3.axisBottom(x));

    xAxisLabel = xAxis.append("text") // append the label element for xAxis
        .style("text-anchor", "middle")
        .attr("x", width - margin.right)
        .text(dimensions[0])

    // radar chart axes
    radarAxesAngle = Math.PI * 2 / dimensions.length; // calculate the angle between each dimension

    let axisRadius = d3.scaleLinear()
        .range([0, radius]);
    let maxAxisRadius = 0.75; // only 75% are used to ensure enough space for labels
    let textRadius = 0.8;

    // radar axes
    radarAxes = radar.selectAll(".axis")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "axis");

    radarAxes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function (d, i) {
            return radarX(axisRadius(maxAxisRadius), i);
        })
        .attr("y2", function (d, i) {
            return radarY(axisRadius(maxAxisRadius), i);
        })
        .attr("class", "line")
        .style("stroke", "black");

    // IMPLEMENTED: render grid lines in gray
    let ticks = [1, 2, 3, 4, 5, 6, 7]; // used to generate 7 grey gridlines.
    let gridScale = d3.scaleLinear()
        .domain([0, 7]) // 0, 7 for the seven ticks
        .range([0, 0.7 * radius]); // by default radius is 300. 70% are used for displaying the gridlines.

    ticks.forEach(t => {
        let points = dimensions.map((d, i) => [radarX(gridScale(t), i), radarY(gridScale(t), i)]);
        radar.append("polygon")
            .attr("points", points)
            .attr("fill", "none")
            .attr("stroke", "lightgray"); // or "gray"
    });

    // IMPLEMENTED: render correct axes labels
    radar.selectAll(".axisLabel")
        .data(dimensions)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", function (d, i) {
            return radarX(axisRadius(textRadius), i);
        })
        .attr("y", function (d, i) {
            return radarY(axisRadius(textRadius), i);
        })
        .text(function (d, i) {
            return dimensions[i];
        });

    // init menu for the visual channels
    channels.forEach(function (c) {
        initMenu(c, dimensions);
    });

    // refresh all select menus
    channels.forEach(function (c) {
        refreshMenu(c);
    });

    renderPlots();
}

// clear visualizations before loading a new file
function clear() {
    // clear shatter plot
    scatter.selectAll("*").remove();

    // clear radar chart
    radar.selectAll("*").remove();

    // clear legend
    d3.select("#legend").selectAll(".dot")
        .classed("selected", false)
        .style("fill", "black")
        .style("fill-opacity", 0.5)
    d3.select("#legend").selectAll("div")
        .remove();

    // mark data as unload
    dataLoaded = false;
}

// render scatterplot and radar chart
function renderPlots() {
    // IMPLEMENTED: get domain names from menu and label x- and y-axis
    let xValue = document.getElementById(channels[0]).value;
    let yValue = document.getElementById(channels[1]).value;
    let sizeValue = document.getElementById(channels[2]).value;

    // IMPLEMENTED: re-render axes
    // rerender axis-labels
    xAxisLabel.text(xValue);
    yAxisLabel.text(yValue);

    // rerender x-axis
    let xMin = minPuffer * d3.min(parsedData, function (d) {
        return parseFloat(d[xValue]);
    });

    let xMax = maxPuffer * d3.max(parsedData, function (d) {
        return parseFloat(d[xValue]);
    });

    let xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([margin.left, width - margin.left - margin.right]);

    // rerender y-axis
    let yMin = minPuffer * d3.min(parsedData, function (d) {
        return parseFloat(d[yValue]);
    });

    let yMax = maxPuffer * d3.max(parsedData, function (d) {
        return parseFloat(d[yValue]);
    });

    let yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height - margin.bottom - margin.top, margin.top])

    // rerender size-scale
    let sizeMin = d3.min(parsedData, function (d) {
        return parseFloat(d[sizeValue]);
    });

    let sizeMax = maxPuffer * d3.max(parsedData, function (d) {
        return parseFloat(d[sizeValue]);
    });

    let sizeScale = d3.scaleLinear()
        .domain([sizeMin, sizeMax])
        .range([3, 12]); // 3 and 12 are the smallest and largest size possible

    // redraw the x-axis and y-axis of the scatterplot
    xAxis.call(d3.axisBottom(xScale));
    yAxis.call(d3.axisLeft(yScale));

    // IMPLEMENTED: render dots
    // render the dots in the scatterplot
    let dots = scatter.append("g").selectAll("dot").data(parsedData);

    // if data is already loaded...
    if (dataLoaded) {
        // ...update the position of existing dots using animations
        scatter.selectAll(".dot")
            .merge(dots.enter())
            .transition() // used to animate the relocation of the dots
            .duration(500) // specify the duration of the transition
            .attr("cx", function (d) {
                return parseFloat(xScale(d[xValue]));
            })
            .attr("cy", function (d) {
                return parseFloat(yScale(d[yValue]));
            })
            .attr("r", function (d) {
                return parseFloat(sizeScale(d[sizeValue]));
            });
    } else {
        // ...otherwise create new dots
        dots.enter().append("circle")
            .attr("class", "dot")
            .attr("cx", function (d) {
                return parseFloat(xScale(d[xValue]));
            })
            .attr("cy", function (d) {
                return parseFloat(yScale(d[yValue]));
            })
            .attr("r", function (d) {
                return parseFloat(sizeScale(d[sizeValue]));
            })
            .attr("csvID", function (d) {
                return d.csvID;
            })
            .style("fill", "black")
            .style("fill-opacity", 0.5)

        addEventsToDots();

        // mark data as loaded
        dataLoaded = true;
    }
}

// adds events onto the dots
function addEventsToDots() {
    let tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    scatter.selectAll(".dot")
        .on('mouseover', function () {
            d3.select(this).transition()
                .duration('200')
                .style("fill-opacity", 1)

            // show tooltip
            tooltip.transition()
                .duration(100)
                .style("opacity", 1);

            // load content for the tooltip
            let content;
            for (let i = 0; i < parsedData.length; i++) {
                let row = parsedData[i];
                if (row.csvID === parseInt(this.getAttribute("csvID"))) {
                    let keys = Object.keys(row);
                    let newRow = {};
                    for (let j = 0; j < keys.length - 1; j++) {
                        newRow[keys[j]] = row[keys[j]];
                    }
                    content = newRow;
                    break;
                }
            }
            if (content !== undefined) {
                // format the content of the tooltip
                content = JSON.stringify(content)
                    .replace(/[{}",:]/g, function (match) {
                        if (match === ',') return '<br>';
                        if (match === ':') return ': ';
                        return '';
                    });
            }

            // add content to the tooltips
            tooltip.html(content)
                .style("left", (this.getBoundingClientRect().x + 10) + "px")
                .style("top", (this.getBoundingClientRect().y - 15) + "px");

        })
        .on('mouseout', function () {

            // if the dot is not selected, revert changes on mouseout
            if (!d3.select(this).classed("selected")) {
                d3.select(this).transition()
                    .duration('200')
                    .style("fill", 'black')
                    .style("fill-opacity", 0.5)
            }

            // hide tooltip on mouseout
            tooltip.transition()
                .duration('200')
                .style("opacity", 0);
        })
        .on('click', function () {
            let data = d3.select(this).data()[0];
            let name = Object.values(data)[0];
            let csvID = Object.values(data)[Object.values(data).length - 1]
            let isSelected = d3.select(this).classed("selected");
            let entriesInLegend = d3.select("#legend").selectAll("div").size();

            // select or unselect dot.
            if (isSelected) {
                removeSelection(csvID);
            } else if (entriesInLegend < maxNumberOfEntriesInLegend) {
                let nextColor = getNextAvailableColor()

                // select in scatterplot
                d3.select(this).classed("selected", true).transition().duration('200').style("fill", nextColor).style("fill-opacity", 1);

                // select in radar chart
                renderRadarPath(data, nextColor)

                //select in legend
                d3.select("#legend").append("div")
                    .html('<span class="color-circle" style="background-color:' + nextColor + '"></span> ' +
                        name + ' <button class="close" csvID="' + csvID + '" onclick=removeSelection()>x</button>');
            }
        });
}

// unselects a selected item
function removeSelection(csvID) {

    // get csvID from target
    if (csvID === undefined) {
        csvID = event.target.getAttribute("csvID")
    }

    // unselect in scatterplot
    scatter.selectAll("[csvID='" + csvID + "']").classed("selected", false).transition().duration('200').style("fill", 'black').style("fill-opacity", 0.5);

    // unselect in radar chart
    removeRadarPath(csvID);

    // unselect in legend
    d3.select("#legend").selectAll("div")
        .filter(function () {
            return d3.select(this).html().includes("\"" + csvID + "\"");
        }).remove();
}

// returns the next available color of the colors-array
function getNextAvailableColor() {
    // the available five colors are: violet, green, orange, red, blue
    let colors = ["rgb(138, 43, 226)", "rgb(0, 128, 0)", "rgb(255, 165, 0)", "rgb(255, 0, 0)", "rgb(0, 0, 255)"];

    // get all colors in use
    let usedColors = [];
    d3.select("#legend").selectAll("div .color-circle").each(function () {
        let element = this;
        let color = getComputedStyle(element).backgroundColor;
        usedColors.push(color);
    });

    // get the next available color
    let nextColor;
    for (let color of colors) {
        if (!usedColors.includes(color)) {
            nextColor = color;
            break;
        }
    }
    return nextColor;
}

// renders a path in the radar chart after selection in the scatterplot
function renderRadarPath(data, color) {
    // generate a line element to represent the path
    let line = d3.line()
        .x(d => d.x)
        .y(d => d.y);

    let coordinates = getPathCoordinates(data);

    //draw the path element
    radar.append("path")
        .datum(getPathCoordinates(data))
        .attr("d", line)
        .attr("stroke-width", 3)
        .attr("stroke", color)
        .attr("fill", "none")
        .attr("stroke-opacity", 1)
        .attr("opacity", 1)
        .attr("csvID", Object.values(data)[Object.values(data).length - 1]); // add csvID for addressing

    // draw circles at the end of each line
    for (let i = 0; i < coordinates.length - 1; i++) {
        radar.append("circle")
            .attr("cx", coordinates[i].x)
            .attr("cy", coordinates[i].y)
            .attr("r", 4)
            .attr("fill", color)
            .attr("csvID", Object.values(data)[Object.values(data).length - 1]);
    }
}

// unselects a rendered path
function removeRadarPath(csvID) {

    // remove all paths
    radar.selectAll("path")
        .filter(function () {
            return parseInt(this.getAttribute("csvID")) === parseInt(csvID);
        })
        .remove();

    // remove all circles
    radar.selectAll("circle")
        .filter(function () {
            return parseInt(this.getAttribute("csvID")) === parseInt(csvID);
        })
        .remove();
}

// calculates the coordinates for a path in the radar chart
function getPathCoordinates(data) {
    let coordinates = [];
    for (let i = 0; i < dimensions.length; i++) {
        let dimension = dimensions[i];
        let angle = (Math.PI / 2) + Math.PI + (2 * Math.PI * i / dimensions.length);

        // IMPLEMENTED: set radius domain for each dimension
        let radarMin = d3.min(parsedData, function (d) {
            return parseFloat(d[dimension]);
        });
        let radarMax = d3.max(parsedData, function (d) {
            return parseFloat(d[dimension]);
        });
        let radarScale = d3.scaleLinear()
            .domain([radarMin, radarMax])
            .range([0, radius * 0.75]); // use 75% of the value for a better looking representation

        let value = radarScale(data[dimension]);
        let x = Math.cos(angle) * value;
        let y = Math.sin(angle) * value;
        coordinates.push({x, y});
    }
    coordinates.push(coordinates[0]);
    return coordinates;
}

// calculates the x-coordinate of a point on the radar chart for a given radius and index
function radarX(radius, index) {
    return radius * Math.cos(radarAngle(index));
}

// calculates the y-coordinate of a point on the radar chart for a given radius and index
function radarY(radius, index) {
    return radius * Math.sin(radarAngle(index));
}

// calculate the angle at which each point of the radar chart should be plotted
function radarAngle(index) {
    return radarAxesAngle * index - Math.PI / 2;
}

// init scatterplot select menu
function initMenu(id, entries) {
    $("select#" + id).empty();

    entries.forEach(function (d) {
        $("select#" + id).append("<option>" + d + "</option>");
    });

    $("#" + id).selectmenu({
        select: function () {
            renderPlots();
        }
    });
}

// refresh menu after reloading data
function refreshMenu(id) {
    $("#" + id).selectmenu("refresh");
}