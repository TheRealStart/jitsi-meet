// @flow

import React from 'react';

import { CircularLabel } from '../../../base/label';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

import AbstractRecordingLabel, {
    _mapStateToProps
} from '../AbstractRecordingLabel';

/**
 * Implements a React {@link Component} which displays the current state of
 * conference recording.
 *
 * @extends {Component}
 */
class RecordingLabel extends AbstractRecordingLabel {
    /**
     * Renders the platform specific label component.
     *
     * @inheritdoc
     */
    _renderLabel() {
        if (this.props._status !== JitsiRecordingConstants.status.ON) {
            // Since there are no expanded labels on web, we only render this
            // label when the recording status is ON.
            return null;
        }

        if (this.props.mode === "file") {
            return (
                <div>
                    <CircularLabel
                       className = { this.props.mode }
                       label = { this.props.t(this._getLabelKey()) } />
                </div>
            )    
        }

        return (
            <>
                <div style={{ display : "inline-block"}} >
                    <CircularLabel
                        className = { this.props.mode }
                        label = { this.props.t(this._getLabelKey()) } />
            
                </div>
                
                <div style={{ display: "inline-block" }} >
                <CircularLabel
                        className = { "file" }
                        label = { this.props.t("recording.rec") } />
                </div>
            </>
        );
    }

    _getLabelKey: () => ?string
}

export default translate(connect(_mapStateToProps)(RecordingLabel));
