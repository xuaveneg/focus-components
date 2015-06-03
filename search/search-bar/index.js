let builder = require('focus').component.builder;
let type = require('focus').component.types;
let React = require('react');
let Scope = require('./scope').component;
let words = require('lodash/string/words');
let i18nMixin = require('../../common/i18n/mixin');

let SearchBar = {
    mixins: [i18nMixin],
    displayName: 'SearchInput',
    getDefaultProps: function () {
        return {
            placeholder: '',
            value: 'defaultValue',
            scope: undefined,
            scopes: [],
            minChar: 0,
            loading: false,
            helpTranslationPath: 'search.bar.help'
        };
    },
    propTypes: {
        placeholder: type('string'),
        value: type('string'),
        scope: type(['string', 'number']),
        scopes: type('array'),
        minChar: type('number'),
        loading: type('bool')
    },
    getInitialState: function () {
        return {
            value: this.props.value,
            scope: this.props.scope,
            loading: this.props.loading
        };
    },
    getValue: function getQuickSearchValue() {
        return {
            scope: this.refs.scope.getValue(),
            query: this.refs.query.getDOMNode().value
        };
    },
    _handleChange: function () {
        if (this.props.handleChange) {
            return this.props.handleChange(this.getValue());
        }
    },
    handleKeyUp: function handleKeyUpInputSearch(event) {
        let val = event.target.value;
        if (val.length >= this.props.minChar) {
            if (this.props.handleKeyUp) {
                this.props.handleKeyUp(event);
            }
            this._handleChange();
        }
    },
    _handleChangeScope: function handleChangeScope(event) {
        this.focusQuery();
        //If query not empty
        let query = this.getValue().query;
        if (!query || 0 === query.length) {
            return;
        }
        if (this.props.handleChangeScope) {
            this.props.handleChangeScope(event);
        }
        this._handleChange();
    },
    handleOnClickScope: function handleOnClickScope() {
        this.setState({scope: this.refs.scope.getValue()}, this._handleChangeScope(event));
    },
    renderHelp: function renderHelp() {
        return (
            <div className='sb-help' ref='help'>
                <span name='share'/>
                <span>{this.i18n(this.props.helpTranslationPath)}</span>
            </div>
        );
    },
    /** @inheritdoc */
    componentWillReceiveProps: function fieldWillReceiveProps(newProps) {
        if (newProps && newProps.loading !== undefined) {
            this.setState({loading: newProps.loading});
        }
    },
    focusQuery: function () {
        this.refs.query.getDOMNode().focus();
    },
    setStateFromSubComponent: function () {
        return this.setState(this.getValue(), this.focusQuery);
    },
    render: function renderSearchInput() {
        let loadingClassName = this.props.loading ? 'sb-loading' : '';
        return (
            <div data-focus='search-bar'>
                <Scope ref='scope' list={this.props.scopes} value={this.state.scope} handleOnClick={this.handleOnClickScope}/>
                <input ref='query' onKeyUp={this.handleKeyUp} type='search' className={loadingClassName}/>
                {this.renderHelp()}
            </div>
        );
    }
};

module.exports = builder(SearchBar);
