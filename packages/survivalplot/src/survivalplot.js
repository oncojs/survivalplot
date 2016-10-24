const _ = require('lodash')
const d3 = require('d3')

const linearScale = d3.scale ? d3.scale.linear : d3.scaleLinear

const defaultOptions = {
  onMouseEnterDonor: _.noop,
  onMouseLeaveDonor: _.noop,
  onClickDonor: _.noop,
  palette: ['#0e6402', '#c20127', '#00005d'],
  xAxisLabel: 'Survival Rate',
  yAxisLabel: 'Duration (days)',
  margins: {
    top: 20,
    right: 20,
    bottom: 46,
    left: 60,
  },
  shouldShowLabels: true
}

export function renderPlot (params) {
  const {
    svg,
    container,
    dataSets,
    disabledDataSets,
    onMouseEnterDonor,
    onMouseLeaveDonor,
    onClickDonor,
    palette,
    xAxisLabel,
    yAxisLabel,
    margins,
    shouldShowLabels,
  } = _.defaultsDeep({}, params, defaultOptions)


  const containerBounds = container.getBoundingClientRect()

  var outerWidth = containerBounds.width
  var outerHeight = params.height || outerWidth * 0.5

  var axisWidth = outerWidth - margins.left - margins.right
  var axisHeight = outerHeight - margins.top - margins.bottom

  var longestDuration = _.max(dataSets
      .filter(function (data) {
        return !_.includes(disabledDataSets, data) && data.donors.length
      })
      .map(function (data) {
        return data.donors.slice(-1)[0].time
      }))
  
  var xDomain = params.xDomain || [0, longestDuration]
  var onDomainChange = params.onDomainChange

  var x = linearScale()
    .range([0, axisWidth])

  var y = linearScale()
    .range([axisHeight, 0])

  var xAxis = d3.svg
      ? d3.svg.axis().scale(x).orient('bottom')
      : d3.axisBottom().scale(x)

  var yAxis = d3.svg
    ? d3.svg.axis().scale(y).orient('left')
    : d3.axisLeft().scale(y)

  svg
    .attr('width', outerWidth)
    .attr('height', outerHeight)

  var wrapperFragment = document.createDocumentFragment()

  var wrapper = d3.select(wrapperFragment).append('svg:g')
      .attr('class', 'wrapper')
      .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')')

  x.domain([xDomain[0], xDomain[1]])
  y.domain([0, 1])

  // Draw x axis
  wrapper.append('svg:g')
    .attr('class', 'x axis')
    .attr('transform', 'translate( 0,' + axisHeight + ')')
    .call(xAxis)
    .append('svg:text')
      .attr('class', 'axis-label')
      .attr('dy', 30)
      .attr('x', axisWidth / 2)
      .style('text-anchor', 'end')
      .text(xAxisLabel)

  // Draw y axis
  wrapper.append('svg:g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('svg:text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', - (margins.top + axisHeight / 2))
      .text(yAxisLabel)

  var brush = d3.svg
    ? d3.svg.brush().x(x)
    : d3.brushX()

  brush.on('brushend', function brushend() {
    var extent = brush.extent()
    svg.select('.brush').call(brush.clear())
    if (extent[1] - extent[0] > 1) {
      onDomainChange(extent)
    }
  })

  wrapper.append('svg:g')
    .attr('class', 'brush')
    .call(brush)
    .selectAll('rect')
    .attr('height', axisHeight)

  var maskName = 'mask_' + _.uniqueId()

  svg.append('svg:clipPath')
    .attr('id', maskName)
    .append('svg:rect')
      .attr('x', 0)
      .attr('y', -10)
      .attr('width', axisWidth)
      .attr('height', axisHeight + margins.top)

  dataSets.forEach(function (data, i) {
    if (_.includes(disabledDataSets, data)) {
      return
    }
    var line = d3.svg.area()
      .interpolate('step-before')
      .x(function(p) { return x(p.x) })
      .y(function(p) { return y(p.y) })

    var setGroup = wrapper.append('svg:g')
      .attr('class', 'serie')
      .attr('set-id', data.meta.id)
      .attr('clip-path', 'url(' + window.location.href + '#' + maskName + ')')

    var setColor = palette[i % palette.length]


    var donorsInRange = data.donors.filter(function (donor, i, arr) {
      return _.inRange(donor.time, xDomain[0], xDomain[1] + 1) ||
        ( arr[i - 1] && donor.time >= xDomain[1] && arr[i - 1].time <= xDomain[1] ) ||
        ( arr[i + 1] && donor.time <= xDomain[0] && arr[i + 1].time >= xDomain[0] )
    })

    // Draw the data as an svg path
    setGroup.append('svg:path')
      .datum(donorsInRange
        .map(function (d) { return {x: d.time, y: d.survivalEstimate} }))
      .attr('class', 'line')
      .attr('d', line)
      .attr('stroke', setColor)

    // Draw the data points as circles
    var markers = setGroup.selectAll('circle')
      .data(donorsInRange)
      .enter()

    markers = markers.append('svg:line')
      .attr('class', 'point-line')
      .attr('status', function (d) { return d.status })
      .attr('x1', function(d) { return x(d.time) })
      .attr('y1', function(d) { return y(d.survivalEstimate) })
      .attr('x2', function(d) { return x(d.time) })
      .attr('y2', function(d) { return y(d.survivalEstimate) + (d.status === 'deceased' ? 10 : -5) })
      .attr('stroke', setColor)

    markers
      .on('mouseover', function (d) {
        onMouseEnterDonor(d3.event, d)
      })
      .on('mouseout', function (d) {
        onMouseLeaveDonor(d3.event, d)
      })
      .on('click', function (d) {
        onClickDonor(d3.event, d)
      })

    if (shouldShowLabels) {
      setGroup.selectAll('circle')
        .data(donorsInRange.slice(-1))
        .enter()
        .append('svg:text')
          .attr('x', d => x(d.time))
          .attr('y', d => y(d.survivalEstimate))
          .attr('dy', '-0.5em')
          .attr('text-anchor', 'end')
          .attr('fill', setColor)
          .append('svg:tspan')
            .text(d => `S`)
            .append('svg:tspan')
              .attr('font-size', '0.7em')
              .attr('baseline-shift', '-15%')
              .text(d => `${i + 1}`)
    }
  })
  
  svg.node().appendChild(wrapperFragment)

  return svg
}
