// @flow

import moment from 'moment';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import {
    PARTICIPANT_ROLE,
    getLocalParticipant
} from '../../base/participants';
import { connect } from '../../base/redux';

import { statsUpdate } from '../actions';
import { recordingController } from '../controller';
import styled from 'styled-components';
import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet'
import { getActiveSession } from '../../recording/functions'
import logger from '../logger';

const RecordButtonContainer = styled.div`
    text-align: center;
    margin-bottom: 12px;
    border-bottom: 1px solid;
    padding-bottom: 12px;
`
const RecordButton = styled.a`
    color: red;
    padding: 6px;
    border: 1px solid lightgreen;
    border-radius: 3px;
    background: lightyellow;
    text-decoration: none !important;

    &:hover {
        color: white;
        background: transparent;
      }
`


/**
 * The type of the React {@code Component} props of
 * {@link LocalRecordingInfoDialog}.
 */
type Props = {

    /**
     * Redux store dispatch function.
     */
    dispatch: Dispatch<any>,

    /**
     * Current encoding format.
     */
    encodingFormat: string,

    /**
     * Whether the local user is the moderator.
     */
    isModerator: boolean,

    /**
     * Whether local recording is engaged.
     */
    isEngaged: boolean,

    /**
     * The start time of the current local recording session.
     * Used to calculate the duration of recording.
     */
    recordingEngagedAt: Date,

    /**
     * Stats of all the participant.
     */
    stats: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * The type of the React {@code Component} state of
 * {@link LocalRecordingInfoDialog}.
 */
type State = {

    /**
     * The recording duration string to be displayed on the UI.
     */
    durationString: string
}

/**
 * A React Component with the contents for a dialog that shows information about
 * local recording. For users with moderator rights, this is also the "control
 * panel" for starting/stopping local recording on all clients.
 *
 * @extends Component
 */
class LocalRecordingInfoDialog extends Component<Props, State> {

    /**
     * Saves a handle to the timer for UI updates,
     * so that it can be cancelled when the component unmounts.
     */
    _timer: ?IntervalID;

    /**
     * Initializes a new {@code LocalRecordingInfoDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code LocalRecordingInfoDialog} instance with.
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            durationString: ''
        };

        this._onStart = this._onStart.bind(this)
        this._onStop = this._onStop.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @returns {void}
     */
    componentDidMount() {
        this._timer = setInterval(
            () => {
                this.setState((_prevState, props) => {
                    const nowTime = new Date();

                    return {
                        durationString: this._getDuration(nowTime,
                            props.recordingEngagedAt)
                    };
                });
                try {
                    this.props.dispatch(
                        statsUpdate(recordingController
                            .getParticipantsStats()));
                } catch (e) {
                    // do nothing
                }
            },
            1000
        );
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}.
     *
     * @returns {void}
     */
    componentWillUnmount() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { isModerator, t, isEngaged } = this.props;

        return (
            <Dialog
                cancelKey = { 'dialog.close' }
                submitDisabled = { true }
                titleKey = 'localRecording.dialogTitle'>

                { this._renderModeratorControls() }
                { this._renderDurationAndFormat() }
            </Dialog>
        );
    }

    /**
     * Renders the recording duration and encoding format. Only shown if local
     * recording is engaged.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderDurationAndFormat() {
        const { encodingFormat, isEngaged, t } = this.props;
        const { durationString } = this.state;

        if (!isEngaged) {
            return null;
        }

        return (
            <div>
                <div>
                    <span className = 'localrec-control-info-label'>
                        {`${t('localRecording.duration')}:`}
                    </span>
                    <span className = 'info-value'>
                        { durationString === ''
                            ? t('localRecording.durationNA')
                            : durationString }
                    </span>
                </div>
                <div>
                    <span className = 'localrec-control-info-label'>
                        {`${t('localRecording.encoding')}:`}
                    </span>
                    <span className = 'info-value'>
                        { encodingFormat }
                    </span>
                </div>
            </div>
        );
    }

    /**
     * Returns React elements for displaying the local recording stats of
     * each participant.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderStats() {
        const { stats } = this.props;

        if (stats === undefined) {
            return null;
        }
        const ids = Object.keys(stats);

        return (
            <div className = 'localrec-participant-stats' >
                { this._renderStatsHeader() }
                { ids.map((id, i) => this._renderStatsLine(i, id)) }
            </div>
        );
    }

    /**
     * Renders the stats for one participant.
     *
     * @private
     * @param {*} lineKey - The key required by React for elements in lists.
     * @param {*} id - The ID of the participant.
     * @returns {ReactElement}
     */
    _renderStatsLine(lineKey, id) {
        const { stats } = this.props;
        let statusClass = 'localrec-participant-stats-item__status-dot ';

        statusClass += stats[id].recordingStats
            ? stats[id].recordingStats.isRecording
                ? 'status-on'
                : 'status-off'
            : 'status-unknown';

        return (
            <div
                className = 'localrec-participant-stats-item'
                key = { lineKey } >
                <div className = 'localrec-participant-stats-item__status'>
                    <span className = { statusClass } />
                </div>
                <div className = 'localrec-participant-stats-item__name'>
                    { stats[id].displayName || id }
                </div>
                <div className = 'localrec-participant-stats-item__sessionid'>
                    { stats[id].recordingStats.currentSessionToken }
                </div>
            </div>
        );
    }

    /**
     * Renders the participant stats header line.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderStatsHeader() {
        const { t } = this.props;

        return (
            <div className = 'localrec-participant-stats-item'>
                <div className = 'localrec-participant-stats-item__status' />
                <div className = 'localrec-participant-stats-item__name'>
                    { t('localRecording.participant') }
                </div>
                <div className = 'localrec-participant-stats-item__sessionid'>
                    { t('localRecording.sessionToken') }
                </div>
            </div>
        );
    }

    /**
     * Renders the moderator-only controls: The stats of all users and the
     * action links.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderModeratorControls() {
        const { isModerator, isEngaged, t } = this.props;

        if (!isModerator) {
            return null;
        }

        return (
            <div>
                <RecordButtonContainer className = 'localrec-control-action-links'>
                    <div className = 'localrec-control-action-link'>
                        { isEngaged ? <RecordButton
                            onClick = { this._onStop }>
                            { t('localRecording.stop') }
                        </RecordButton>
                            : <RecordButton
                                onClick = { this._onStart }>
                                { t('localRecording.start') }
                            </RecordButton>
                        }
                    </div>
                </RecordButtonContainer>
                <div>
                    <span className = 'localrec-control-info-label'>
                        {`${t('localRecording.participantStats')}:`}
                    </span>
                </div>
                { this._renderStats() }
            </div>
        );
    }

    /**
     * Creates a duration string "HH:MM:SS" from two Date objects.
     *
     * @param {Date} now - Current time.
     * @param {Date} prev - Previous time, the time to be subtracted.
     * @returns {string}
     */
    _getDuration(now, prev) {
        if (prev === null || prev === undefined) {
            return '';
        }

        // Still a hack, as moment.js does not support formatting of duration
        // (i.e. TimeDelta). Only works if total duration < 24 hours.
        // But who is going to have a 24-hour long conference?
        return moment(now - prev).utc()
            .format('HH:mm:ss');
    }

    /**
     * Callback function for the Start UI action.
     * It will turn on full recording too
     * 
     * @private
     * @returns {void}
     */
    _onStart() {
        const { _conference, _isRecordingRunning, _isLiveStreamRunning } = this.props;
        // do not run recording if live stream or itself is turned on
        if (!_isRecordingRunning  && !_isLiveStreamRunning) {
            let appData = JSON.stringify({
                'file_recording_metadata': {
                    'share': true
                }
            });
        
            _conference.startRecording({
                mode: JitsiRecordingConstants.mode.FILE,
                appData
            });
        }
        
        recordingController.startRecording();
    }

    /**
     * Callback function for the Stop UI action.
     *
     * @private
     * @returns {void}
     */
    _onStop() {
        const { _fileRecordingSession, _conference } = this.props;

        if (_fileRecordingSession) {
            _conference.stopRecording(_fileRecordingSession.id);
        }
        recordingController.stopRecording();
    }

}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code LocalRecordingInfoDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     encodingFormat: string,
 *     isModerator: boolean,
 *     isEngaged: boolean,
 *     recordingEngagedAt: Date,
 *     stats: Object
 * }}
 */
function _mapStateToProps(state) {
    const {
        encodingFormat,
        isEngaged,
        recordingEngagedAt,
        stats
    } = state['features/local-recording'];

    const isModerator
        = getLocalParticipant(state).role === PARTICIPANT_ROLE.MODERATOR;
        

    return {
        encodingFormat,
        isModerator,
        isEngaged,
        recordingEngagedAt,
        stats,
        _conference: state['features/base/conference'].conference,
        _fileRecordingSession:
            getActiveSession(state, JitsiRecordingConstants.mode.FILE),
        _isRecordingRunning:
            Boolean(getActiveSession(state, JitsiRecordingConstants.mode.FILE)),
        _isLiveStreamRunning : 
            Boolean(getActiveSession(state, JitsiRecordingConstants.mode.STREAM))
    };
}

export default translate(connect(_mapStateToProps)(LocalRecordingInfoDialog));
