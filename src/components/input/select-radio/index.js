import React, { Component, PropTypes } from 'react';
import Radio from '../radio';
import uniqueId from 'lodash/utility/uniqueId';
import Translation from '../../../behaviours/translation';

@Translation
class SelectRadio extends Component {

    static defaultProps = {
        values: [],
        valueKey: 'code',
        labelKey: 'label',
        disabled: false
    };

    static propTypes = {
        values: PropTypes.array,
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
        valueKey: PropTypes.string,
        labelKey: PropTypes.string,
        onChange: PropTypes.func,
        disabled: PropTypes.bool
    };

    state = {
        uniqueName: uniqueId('options_'),
        value: this.props.value
    };

    componentWillReceiveProps(newProps) {
        this.setState({ value: newProps.value });
    }

    /**
     * Get the value from the select in the DOM.
     * @return {string, number} selected value
     */
    getValue() {
        return this.state.value;
    }

    /**
    * handle click on radio
    * @param {object} event - the click event
    */
    _handleRadioChange(newValue) {
        const { onChange } = this.props;
        if (onChange) {
            onChange(newValue);
            return;
        }
        //Set the state then call the change handler.
        this.setState({ value: newValue });
    }

    /**
     * Closure to capture key and radio status.
     * @param  {string} key the key of radio
     * @return {func} status closure
     */
    _getRadioChangeHandler(key) {
        return () => {
            this._handleRadioChange(key);
        };
    }

    /**
    * Render radio for each values
    * @return {XML} the different radio values
    */
    renderSelectRadios() {
        const { uniqueName } = this.state;

        return this.props.values.map((val, idx) => {
            const value = val[this.props.valueKey];
            const label = val[this.props.labelKey];
            const disabled = this.props.disabled;
            const isChecked = value === this.state.value;

            return (
                <Radio
                    key={idx}
                    label={this.i18n(label)}
                    name={uniqueName}
                    onChange={this._getRadioChangeHandler(value)}
                    value={isChecked}
                    disabled={disabled}
                />
            );
        });
    }

    render() {
        const { error, style } = this.props;

        return (
            <div data-focus='select-radio' data-valid={!error} style={style} >
                {this.renderSelectRadios()}
                {error && <div className='label-error'>{error}</div>}
            </div>
        );
    }
}

SelectRadio.displayName = 'SelectRadio';

export default SelectRadio;
