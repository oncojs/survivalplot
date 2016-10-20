import React, { Component, PropTypes } from 'react'
import _ from 'lodash'
import { renderPlot } from '@oncojs/survivalplot'
import d3 from 'd3'

function isElementFullScreen (element) {
  return _.includes([
    document.fullscreenElement,
    document.webkitFullscreenElement,
    document.mozFullscreenElement,
    ], element)
}

export class SurvivalPlot extends Component {
  state = {
    xDomain: undefined,
    disabledDataSets: undefined,
  }

  static propTypes = {
    dataSets: PropTypes.array.isRequired,
    palette: PropTypes.array,
    censoredStatuses: PropTypes.array,
    onMouseEnterDonor: PropTypes.func,
    onMouseLeaveDonor: PropTypes.func,
    onClickDonor: PropTypes.func,
    margins: PropTypes.object,
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
  }

  static defaultProps = {
    palette: ['#0e6402', '#c20127', '#00005d'],
    censoredStatuses: ['alive'],
    margins: {
      top: 20,
      right: 20,
      bottom: 46,
      left: 60,
    },
    onMouseEnterDonor(event, donor) {
      console.log({
        donor: {
          ...donor,
          isCensored: _.includes(this.props.censoredStatuses, donor.status),
        },
      })
    },
    onMouseLeaveDonor () {
      console.log('onMouseLeaveDonor')
    },
    onClickDonor (e, donor) {
      console.log('onClickDonor')
    },
    xAxisLabel: 'Survival Rate',
    yAxisLabel: 'Duration (days)',
  };

  stateStack = []

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)
  }

  componentDidUpdate() {
    this.update()
  }

  componentDidMount () {
    this.svg = this.refs.svg;
    this.update()
  }

  updateState = newState => {
    this.stateStack = this.stateStack.concat(this.state)
    this.setState(newState)
  }

  update = params => {
    var state = this.state
    var container = this.refs.container
    var svg = this.refs.svg

    svg.selectAll('*').remove()

    renderPlot(_.defaults({
      svg,
      container, 
      dataSets: this.props.dataSets,
      disabledDataSets: state.disabledDataSets,
      palette: this.props.palette,
      markerType: 'line',
      xDomain: state.xDomain,
      xAxisLabel: 'Duration (days)',
      yAxisLabel: 'Survival Rate',
      height: isElementFullScreen(container) ? ( window.innerHeight - 100 ) : 0,
      onMouseEnterDonor: this.props.onMouseEnterDonor.bind(this),
      onMouseLeaveDonor: this.props.onMouseLeaveDonor.bind(this),
      onClickDonor: this.props.onClickDonor,
      onDomainChange: (newXDomain) => this.updateState({xDomain: newXDomain}),
      margins: {
        top: 20,
        right: 20,
        bottom: 46,
        left: 60,
      },
    }, params))
  }

  render() {
    return (
      <div ref="container">
        <svg ref="svg"/>
      </div>
    )
  }
}