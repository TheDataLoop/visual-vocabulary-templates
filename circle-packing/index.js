/**
 * Bootstrapping code for line chart
 */

import * as d3 from "d3";
import * as gLegend from "g-legend";
import gChartframe from "g-chartframe";
import * as gAxis from "g-axis";
import * as parseData from "./parseData.js";
import * as circlePacking from "./circlePacking.js";

const dataFile = "data.csv";

const rootName = "Birds"; // If not set defaults to Root
const attrToShow = "Breeding";
const padding = 3;

const displayHierarchy = false;
const displayOuterCircle = false;
const showAllLabels = false;
const filterGroups = ["Red", "Amber"];

const legendAlign = 'vert'; // hori or vert, alignment of the legend
const legendType = 'circ'; // rect, line or circ, geometry of legend marker

const sharedConfig = {
    title: "Title not yet added",
    subtitle: "Subtitle not yet added",
    source: "Source not yet added"
};

// Individual frame configuration, used to set margins (defaults shown below) etc
const frame = {
    webS: gChartframe
        .webFrameS(sharedConfig)
        .margin({ top: 100, left: 15, bottom: 82, right: 5 })
        // .title('Put headline here') // use this if you need to override the defaults
        // .subtitle("Put headline |here") //use this if you need to override the defaults
        .height(400),

    webM: gChartframe
        .webFrameM(sharedConfig)
        .margin({
            top: 100,
            left: 20,
            bottom: 86,
            right: 5
        })
        // .title("Put headline here")
        .height(500),

    webL: gChartframe
        .webFrameL(sharedConfig)
        .margin({
            top: 100,
            left: 20,
            bottom: 104,
            right: 5
        })
        // .title("Put headline here")
        .height(700)
        .fullYear(true),

    webMDefault: gChartframe
        .webFrameMDefault(sharedConfig)
        .margin({
            top: 100,
            left: 20,
            bottom: 86,
            right: 5
        })
        // .title("Put headline here")
        .height(500),

    print: gChartframe
        .printFrame(sharedConfig)
        .margin({ top: 40, left: 7, bottom: 35, right: 7 })
        // .title("Put headline here")
        .width(53.71) // 1 col
        //.width(112.25)// 2 col
        // .width(170.8)// 3 col
        // .width(229.34)// 4 col
        // .width(287.88)// 5 col
        // .width(346.43)// 6 col
        // .width(74)// markets std print
        .height(69.85), // std print (Use 58.21mm for markets charts that matter)

    social: gChartframe
        .socialFrame(sharedConfig)
        .margin({
            top: 140,
            left: 40,
            bottom: 138,
            right: 40
        })
        // .title("Put headline here")
        .width(612)
        .height(612), // 700 is ideal height for Instagram

    video: gChartframe.videoFrame(sharedConfig).margin({
        left: 207,
        right: 207,
        bottom: 210,
        top: 233
    })
    // .title("Put headline here")
};

// add the frames to the page...
d3.selectAll(".framed").each(function addFrames() {
    const figure = d3.select(this).attr("class", "button-holder");

    figure.select("svg").call(frame[figure.node().dataset.frame]);
});
parseData
    .load(dataFile, { displayHierarchy, rootName, attrToShow, filterGroups, showAllLabels })
    .then(({ plotData, groupNames }) => {
        Object.keys(frame).forEach(frameName => {
            const currentFrame = frame[frameName];

            const myLegend = gLegend.legend();

            const myChart = circlePacking
                .draw()
                .groupNames(groupNames)
                .rem(currentFrame.rem())
                .colourPalette(frameName);

            // Set up packing function
            const pack = d3
                .pack()
                .size([
                    currentFrame.dimension().width,
                    currentFrame.dimension().height * 1.1
                ])
                .padding(padding);

            // Run packing function on plot data
            pack(plotData);

            currentFrame
                .plot()
                .append("g")
                .attr("class", "pack-container")
                .selectAll(".pack-circle")
                .data(plotData.descendants())
                .enter()
                .append("g")
                .attr("class", "pack-circle")
                .call(myChart);

            if (!displayOuterCircle) {
                currentFrame
                    .plot()
                    .select(".node--root")
                    .style("display", "none");
            }

            myLegend
              .frameName(frameName)
              .seriesNames(groupNames)
              .colourPalette((frameName))
              .rem(myChart.rem())
              .geometry(legendType)
              .alignment(legendAlign);
          // Draw the Legend
          currentFrame.plot()
            .append('g')
            .attr('id', 'legend')
            .selectAll('.legend')
              .data(() => {
                if (filterGroups.lenth > 0) {
                  return filterGroups
                }
                if (!displayOuterCircle) {
                  return groupNames.filter(d => d !== rootName);
                }
                return groupNames;
              })
              .enter()
              .append('g')
              .classed('legend', true)
              .call(myLegend);

          const legendSelection = currentFrame.plot().select('#legend');
          legendSelection.attr('transform', `translate(0,${-currentFrame.rem()})`);
        });
        // addSVGSavers('figure.saveable');
    });
