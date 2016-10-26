import React, {PropTypes, Component} from 'react';
import ReactDOM from 'react-dom';
import builder from 'focus-core/component/builder';
import {translate} from 'focus-core/translation';
import uuid from 'uuid';

import Button from '../../components/button';


const Dropdown = {

  /**
  * Default props.
  * @returns {object} Defauilt props.
  */
  getDefaultProps() {
    return {
      position: 'right',
      top: false,
      iconProps: {
        name: 'more_vert'
      },
      shape: 'icon',
      operationList: []
    }
  },

  /**
  * Scope property validation.
  * @type {Object}
  */
  propTypes: {
    position: PropTypes.string.isRequired,
    iconProps: PropTypes.object,
    operationList: PropTypes.array,
    shape: PropTypes.string
  },

  getInitialState() {
    return {
      isTop: false
    }
  },

  /**
  * Component will mount
  */
  componentWillMount() {
    this._htmlId = uuid.v4();
  },

  /**
  * Called when component is mounted.
  */
  componentDidMount() {
    if (0 !== this.props.operationList.length && ReactDOM.findDOMNode(this.refs.dropdown)) {
      componentHandler.upgradeElement(ReactDOM.findDOMNode(this.refs.dropdown));
    }
    this.setTopOrBottom(ReactDOM.findDOMNode(this.refs.menuContainer));
  },

  /**
  * Component will receive props.
  * @param {Object} nextProps the next props
  */
  componentWillReceiveProps(nextProps) {
    if (0 !== nextProps.operationList.length && ReactDOM.findDOMNode(this.refs.dropdown)) {
      componentHandler.upgradeElement(ReactDOM.findDOMNode(this.refs.dropdown));
    }
  },


  /**
  * Called before component is unmounted.
  */
  componentWillUnmount() {
    if (0 !== this.props.operationList.length && ReactDOM.findDOMNode(this.refs.dropdown)) {
      componentHandler.downgradeElements(ReactDOM.findDOMNode(this.refs.dropdown));
    }
  },

  componentWillUpdate() {
    componentHandler.upgradeDom();
  },

  componentDidUpdate() {
    componentHandler.upgradeDom();
  },

  /**
  * Handle action on selected item.
  * @param {function} action Action to call
  * @returns {function} Function called when item is selected.
  * @private
  */
  _handleAction(action) {
    return () => {
      if (this.props.operationParam) {
        action(this.props.operationParam);
      } else {
        action();
      }
    };
  },

  /**
  * Determinates the position to display a from
  * @param {[type]} e [description]
  */
  setTopOrBottom(e) {
    const elementRectangle = e.target ? e.target.getBoundingClientRect() : e.getBoundingClientRect();
    const elementPosition = {top: elementRectangle.top, left: elementRectangle.left};
    const windowSize = {height: outerHeight, width: window.outerWidth};

    const percentTop = (elementPosition.top * 100) / windowSize.height;

    percentTop >= 75 ? this.setState({isTop: false}) : this.setState({isTop: true});
  },

  renderBottom(id) {
    const {position, operationList} = this.props;
    if (0 === operationList.length) {
      return null;
    }
    return (
      <div className={`common-parent-bottom-${position}`}>
        <ul className={`mdl-menu mdl-menu--top-${position} mdl-js-menu mdl-js-ripple-effect`} htmlFor={id} ref='dropdown'>
          {operationList.map((operation, idx) => {
            return (
              <li className={`mdl-menu__item ${operation.style}`} key={idx} onClick={this._handleAction(operation.action)}>
                {translate(operation.label)}
              </li>
            );
          })}
        </ul>
      </div>
    )
  },

  renderTop(id) {
    const {position, operationList} = this.props;
    if (0 === operationList.length) {
      return null;
    }
    return (
      <div className={`common-parent-top-${position}`}>
        <ul className={`mdl-menu mdl-menu--bottom-${position} mdl-js-menu mdl-js-ripple-effect`} htmlFor={id} ref='dropdown'>
          {operationList.map((operation, idx) => {
            return (
              <li className={`mdl-menu__item ${operation.style}`} key={idx} onClick={this._handleAction(operation.action)}>
                {translate(operation.label)}
              </li>
            );
          })}
        </ul>
      </div>
    )
  },

  /**
  * Render the component.
  * @returns  {XML} Htm code.
  */
  render() {
    const {iconProps, shape, top, position, operationList} = this.props;
    const {isTop} = this.state
    const id = this._htmlId;
    if (0 === operationList.length) {
      return null;
    }
    const menuPosition = isTop ? 'top-' + position : 'bottom-' + position;
    return (
      <div ref='menuContainer'>
        <Button icon={iconProps.name} id={id} isJs shape={shape} onClick={this.setTopOrBottom} />
        {!isTop ? this.renderBottom(id) : this.renderTop(id)}
      </div>
    );
  }
}

module.exports = builder(Dropdown);
