import d3 from 'd3';
import { select } from "d3-selection"

export function draw() {
    let lineWidth = 100
    let plotDim = [100,100];
    let yScale = d3.scaleLinear();
    let xScale = d3.scaleLinear();
    let sizeScale = d3.scaleSqrt();
    let intersect = false
    let seriesNames  = []; // eslint-disable-line
    let rem = 16;
    let formatDecimal = d3.format(".2f")
    let frameName = ''

    const colourScale = d3.scaleOrdinal();
    let offset = []


    function label(parent) {
        
        let radius;

        const textLabel = parent.append('g')
            .on('mouseover', pointer)
            .attr('id', 'labelHolder')

        textLabel.append('text')
            .attr('class', 'highlighted-label')
            .attr('x',d => xScale(d.targetX))
            .attr('y',d => yScale(d.targetY))
            .attr('dy',0)
            .text((d) => {
                if (intersect) {
                    radius = sizeScale(d.radius);
                }
                else {radius = d.radius};
                return d.title + ' '+ d.note
            })
            .call(wrap,lineWidth,d => xScale(d.targetX),"highlighted-label")
            .attr('transform', (d) => {
                offset = [geOffset(d)[0],geOffset(d)[1]];
                //console.log(d.xOffset,d.yOffset)

                //console.log ('returned offssets',d.xOffset, d.xOffset)
                return `translate(${offset[0]},${offset[1]})`
            })

        function geOffset(label) {
            let text = d3.select('#labelHolder');
            let labelDim = labelDimansions(text);
            //console.log('dimensions',labelDim)
            let posX = xScale(label.targetX);
            let posY = yScale(label.targetY);
            let xOffset = 0;
            let yOffset = 0;
                if (posX > plotDim[0]/2) {
                    xOffset = (0-(labelDim[0] - radius + rem))
                }
                if (posX < plotDim[0]/2) {
                    xOffset = radius + (rem);
                }
                if (posY > (plotDim[1]/2)) {
                    yOffset = (0 - (labelDim[1] + radius + rem ))
                }
                if (posY < (plotDim[1]/2)) {
                    yOffset = radius + rem 
                }
            return[xOffset,yOffset];
        }

        var path = textLabel.append('path')
            .attr('id', d=> d.title)
            .attr('stroke', '#000000')
            .attr('stroke-width', 1)

        var lineGenerator = d3.line()
            .curve(d3.curveBasis);

        path
            .attr("d", function(d) {
                let sourceX = xScale(d.targetX)
                let sourceY = yScale(d.targetY)
                let points = [
                    [sourceX, sourceY],
                    //[sourceX-20, sourceY],
                    [xScale(d.targetX), yScale(d.targetY)],
                ];
            let pathData = lineGenerator(points);
            return pathData
            })
            .transition()
            .attr("d", function(d) {
                let sourceX = xScale(d.targetX) + geOffset(d)[0]
                let sourceY = yScale(d.targetY) + geOffset(d)[1]
                let points = [
                    [sourceX, sourceY],
                    //[sourceX-20, sourceY],
                    [xScale(d.targetX), yScale(d.targetY)],
                ];
            let pathData = lineGenerator(points);
            return pathData
            })


        // d3.select(path)
        //   .attr("d", lineGenerator)
          //.attr("transform", null);

        //path.transition().attr("d", line);

        console.log(path.attr('d'[0]))

       textLabel
            .call(d3.drag()
                .subject(function() { 
                    const textEl = d3.select(this).select('text');
                    return {x: textEl.attr('x'), y: textEl.attr('y')};
                })
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        
        function pointer(d) {
            this.style.cursor = 'pointer';
        }

        function dragstarted(d) {
            d3.select(this).raise().classed('active', true);
        }

        function dragged(d) {
            let label = d3.select(this).select('text')
            //console.log (label.node())
            console.log ('label',label.attr('transform'));
            console.log ('label',label.node().transform.baseVal[0].matrix)
            let coords =[label.node().transform.baseVal[0].matrix.e, label.node().transform.baseVal[0].matrix.f];
            let sourceX = d3.event.x + coords[0]
            let sourceY = d3.event.y + coords[1]
            console.log ('coords',coords)
            d3.select(this).selectAll('tspan').attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
            d3.select(this).selectAll('text').attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
            d3.select(this).selectAll('path').attr("d", (el) => {
                let points = [
                    [sourceX, sourceY],
                    [xScale(d.targetX), yScale(d.targetY)],
                ];
                let pathData = lineGenerator(points);
                return pathData
            });
        }

        function dragended(d) {
            d3.select(this).classed('active', false);
        }

        function labelDimansions (label) {
            let labelWidth = label.node().getBBox().width;
            let labelHeight = label.node().getBBox().height;
            return ([labelWidth,labelHeight])
        }

        //wrap text function adapted from Mike Bostock
        function wrap(text, width,x, media) {
            text.each(function() {
                var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.0,
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("class", media).attr("x", x).attr("y", y).attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("class", media).attr("x", x).attr("y", y).attr("dy",++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        }

    }

    label.frameName = (d) => {
        frameName = d;
        return label;
    };
    label.seriesNames = (d) => {
        if (typeof d === 'undefined') return seriesNames;
        seriesNames = d;
        return label;
    };
    label.sizeScale = (d) => {
        if (!d) return sizeScale;
        sizeScale = d;
        intersect = true
        return label;
    };
    label.lineWidth = (d) => {
        if (!d) return lineWidth;
        lineWidth = d;
        return label;
    };
    label.plotDim = (d) => {
        if (!d) return window.plotDim;
        plotDim = d;
        return label;
    };
    label.xScale = (d) => {
        if (!d) return xScale;
        xScale = d;
        return label;
    };
    label.yScale = (d) => {
        if (!d) return yScale;
        yScale = d;
        return label;
    };

    return label;
}