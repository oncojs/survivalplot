import React, { Component, PropTypes } from 'react'
import isEqual from 'lodash.isequal'
import defaults from 'lodash.defaults'
import { renderPlot } from '@oncojs/survivalplot'

function isElementFullScreen (element) {
  return [
    document.fullscreenElement,
    document.webkitFullscreenElement,
    document.mozFullscreenElement,
  ].indexOf(element) >= 0
}

export class SurvivalPlot extends Component {
  state = {
    xDomain: undefined,
    disabledDataSets: undefined
  }

  static propTypes = {
    className: PropTypes.string,
    dataSets: PropTypes.array.isRequired,
    palette: PropTypes.array,
    censoredStatuses: PropTypes.array,
    onMouseEnterDonor: PropTypes.func,
    onMouseLeaveDonor: PropTypes.func,
    onClickDonor: PropTypes.func,
    margins: PropTypes.object,
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
    getSetSymbol: PropTypes.func,
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
          isCensored: this.props.censoredStatuses.indexOf(donor.status) >= 0,
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
    return !isEqual(this.props, nextProps) || !isEqual(this.state, nextState)
  }

  componentDidUpdate() {
    this.update()
  }

  componentDidMount () {
    this.update()
  }

  updateState = newState => {
    this.stateStack = this.stateStack.concat(this.state)
    this.setState(newState)
  }

  update = params => {
    var state = this.state
    var container = this._container

    renderPlot(defaults({
      container, 
      dataSets: this.props.dataSets,
      disabledDataSets: state.disabledDataSets,
      palette: this.props.palette,
      xDomain: state.xDomain,
      xAxisLabel: 'Duration (days)',
      yAxisLabel: 'Survival Rate',
      height: isElementFullScreen(container) ? ( window.innerHeight - 100 ) : 0,
      getSetSymbol: this.props.getSetSymbol,
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
      <div
        ref={c => this._container = c}
        className={this.props.className || ''}
      />
    )
  }
}
