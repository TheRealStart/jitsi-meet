// @flow

import type { Dispatch } from 'redux';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { toggleScreensharing, getLocalVideoTrack } from '../../base/tracks';
import { IconWhiteboard } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { toggleDocument } from '../actions';

/**
 * The function simulate simulates different types of events like
 * a click event on a specific html element on the page
 * @param {*} element - html element
 * @param {*} eventName - event like 'click'
 */
function simulate(element, eventName)
{
    var options = extend(defaultOptions, arguments[2] || {});
    var oEvent, eventType = null;
    for (var name in eventMatchers)
    {
        if (eventMatchers[name].test(eventName)) { eventType = name; break; }
    }
    if (!eventType)
        throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');
    if (document.createEvent)
    {
        oEvent = document.createEvent(eventType);
        if (eventType == 'HTMLEvents')
        {
            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
        }
        else
        {
            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
            options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
        }
        element.dispatchEvent(oEvent);
    }
    else
    {
        options.clientX = options.pointerX;
        options.clientY = options.pointerY;
        var evt = document.createEventObject();
        oEvent = extend(evt, options);
        element.fireEvent('on' + eventName, oEvent);
    }
    return element;
}
function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
}
var eventMatchers = {
    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
    'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
}
var defaultOptions = {
    pointerX: 0,
    pointerY: 0,
    button: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true
}


type Props = AbstractButtonProps & {

    /**
     * Whether the shared document is being edited or not.
     */
    _editing: boolean,

    /**
     * Redux dispatch function.
     */
    dispatch: Dispatch<any>,
};

/**
 * Implements an {@link AbstractButton} to open the chat screen on mobile.
 */
class SharedDocumentButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.document';
    icon = IconWhiteboard;
    label = 'toolbar.documentOpen';
    toggledLabel = 'toolbar.documentClose';
    iconText = 'toolbar.whiteboard';
    tooltip = 'toolbar.whiteboard';

    /**
     * Handles clicking / pressing the button, and opens / closes the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        sendAnalytics(createToolbarEvent(
            'toggle.etherpad',
            {
                enable: !this.props._editing
            }));

        if (!document.getElementById('localVideoContainer').classList.contains('videoContainerFocused') && !this.props._editing) {
            simulate(document.getElementById("localVideo_container"), "click");
        } else if (document.getElementById('localVideoContainer').classList.contains('videoContainerFocused') && this.props._editing) {
            simulate(document.getElementById("localVideo_container"), "click");
        }
        
        this.props.dispatch(toggleDocument());
        
        if((!this.props._screensharing && !this.props._editing)){
            this.props.dispatch(toggleScreensharing());
        }else if(this.props._screensharing) {
            this.props.dispatch(toggleScreensharing());
        }
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._editing;
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @returns {Object}
 */
function _mapStateToProps(state: Object, ownProps: Object) {
    const { documentUrl, editing } = state['features/etherpad'];
    const { visible = Boolean(documentUrl) } = ownProps;
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);

    return {
        _editing: editing,
        _screensharing: localVideo && localVideo.videoType === 'desktop',
        visible
    };
}

export default translate(connect(_mapStateToProps)(SharedDocumentButton));
