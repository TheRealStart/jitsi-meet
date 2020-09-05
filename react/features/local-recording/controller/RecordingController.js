/* @flow */

import { i18next } from '../../base/i18n';
import logger from '../logger';
import {
    FlacAdapter,
    OggAdapter,
    WavAdapter,
    downloadBlob
} from '../recording';
import { sessionManager } from '../session';

import aws from 'aws-sdk';
import axios from 'axios';
import jwtDecode from "jwt-decode";
import {
    getParticipantDisplayName
} from '../../base/participants';
import { addMessage } from '../../chat/actions';
import { playSound } from '../../base/sounds';
import { INCOMING_MSG_SOUND_ID } from '../../chat/constants'
import { showNotification } from '../../notifications';


/**
 * XMPP command for signaling the start of local recording to all clients.
 * Should be sent by the moderator only.
 */
const COMMAND_START = 'localRecStart';

/**
 * XMPP command for signaling the stop of local recording to all clients.
 * Should be sent by the moderator only.
 */
const COMMAND_STOP = 'localRecStop';

/**
 * One-time command used to trigger the moderator to resend the commands.
 * This is a workaround for newly-joined clients to receive remote presence.
 */
const COMMAND_PING = 'localRecPing';

/**
 * One-time command sent upon receiving a {@code COMMAND_PING}.
 * Only the moderator sends this command.
 * This command does not carry any information itself, but rather forces the
 * XMPP server to resend the remote presence.
 */
const COMMAND_PONG = 'localRecPong';

/**
 * Participant property key for local recording stats.
 */
const PROPERTY_STATS = 'localRecStats';

/**
 * Supported recording formats.
 */
const RECORDING_FORMATS = new Set([ 'flac', 'wav', 'ogg' ]);

/**
 * Default recording format.
 */
const DEFAULT_RECORDING_FORMAT = 'flac';

/**
 * States of the {@code RecordingController}.
 */
const ControllerState = Object.freeze({
    /**
     * Idle (not recording).
     */
    IDLE: Symbol('IDLE'),

    /**
     * Starting.
     */
    STARTING: Symbol('STARTING'),

    /**
     * Engaged (recording).
     */
    RECORDING: Symbol('RECORDING'),

    /**
     * Stopping.
     */
    STOPPING: Symbol('STOPPING'),

    /**
     * Failed, due to error during starting / stopping process.
     */
    FAILED: Symbol('FAILED')
});

/**
 * Type of the stats reported by each participant (client).
 */
type RecordingStats = {

    /**
     * Current local recording session token used by the participant.
     */
    currentSessionToken: number,

    /**
     * Whether local recording is engaged on the participant's device.
     */
    isRecording: boolean,

    /**
     * Total recorded bytes. (Reserved for future use.)
     */
    recordedBytes: number,

    /**
     * Total recording duration. (Reserved for future use.)
     */
    recordedLength: number
}

/**
 * The component responsible for the coordination of local recording, across
 * multiple participants.
 * Current implementation requires that there is only one moderator in a room.
 */
class RecordingController {

    /**
     * For each recording session, there is a separate @{code RecordingAdapter}
     * instance so that encoded bits from the previous sessions can still be
     * retrieved after they ended.
     *
     * @private
     */
    _adapters = {};

    /**
     * The {@code JitsiConference} instance.
     *
     * @private
     */
    _conference: * = null;

    /**
     * Current recording session token.
     * Session token is a number generated by the moderator, to ensure every
     * client is in the same recording state.
     *
     * @private
     */
    _currentSessionToken: number = -1;

    /**
     * Current state of {@code RecordingController}.
     *
     * @private
     */
    _state = ControllerState.IDLE;

    /**
     * Whether or not the audio is muted in the UI. This is stored as internal
     * state of {@code RecordingController} because we might have recording
     * sessions that start muted.
     */
    _isMuted = false;

    /**
     * The ID of the active microphone.
     *
     * @private
     */
    _micDeviceId = 'default';

    /**
     * Current recording format. This will be in effect from the next
     * recording session, i.e., if this value is changed during an on-going
     * recording session, that on-going session will not use the new format.
     *
     * @private
     */
    _format = DEFAULT_RECORDING_FORMAT;

    /**
     * Whether or not the {@code RecordingController} has registered for
     * XMPP events. Prevents initialization from happening multiple times.
     *
     * @private
     */
    _registered = false;

    /**
     * FIXME: callback function for the {@code RecordingController} to notify
     * UI it wants to display a notice. Keeps {@code RecordingController}
     * decoupled from UI.
     */
    _onNotify: ?(messageKey: string, messageParams?: Object) => void;

    /**
     * FIXME: callback function for the {@code RecordingController} to notify
     * UI it wants to display a warning. Keeps {@code RecordingController}
     * decoupled from UI.
     */
    _onWarning: ?(messageKey: string, messageParams?: Object) => void;

    /**
     * FIXME: callback function for the {@code RecordingController} to notify
     * UI that the local recording state has changed.
     */
    _onStateChanged: ?(boolean) => void;

    /**
     * Constructor.
     *
     * @returns {void}
     */
    constructor() {
        this.registerEvents = this.registerEvents.bind(this);
        this.getParticipantsStats = this.getParticipantsStats.bind(this);
        this._onStartCommand = this._onStartCommand.bind(this);
        this._onStopCommand = this._onStopCommand.bind(this);
        this._onPingCommand = this._onPingCommand.bind(this);
        this._doStartRecording = this._doStartRecording.bind(this);
        this._doStopRecording = this._doStopRecording.bind(this);
        this._updateStats = this._updateStats.bind(this);
        this._switchToNewSession = this._switchToNewSession.bind(this);
    }

    registerEvents: () => void;

    /**
     * Registers listeners for XMPP events.
     *
     * @param {JitsiConference} conference - A {@code JitsiConference} instance.
     * @returns {void}
     */
    registerEvents(conference: Object) {
        if (!this._registered) {
            this._conference = conference;
            if (this._conference) {
                this._conference
                    .addCommandListener(COMMAND_STOP, this._onStopCommand);
                this._conference
                    .addCommandListener(COMMAND_START, this._onStartCommand);
                this._conference
                    .addCommandListener(COMMAND_PING, this._onPingCommand);
                this._registered = true;
            }
            if (!this._conference.isModerator()) {
                this._conference.sendCommandOnce(COMMAND_PING, {});
            }
        }
    }

    /**
     * Sets the event handler for {@code onStateChanged}.
     *
     * @param {Function} delegate - The event handler.
     * @returns {void}
     */
    set onStateChanged(delegate: Function) {
        this._onStateChanged = delegate;
    }

    /**
     * Sets the event handler for {@code onNotify}.
     *
     * @param {Function} delegate - The event handler.
     * @returns {void}
     */
    set onNotify(delegate: Function) {
        this._onNotify = delegate;
    }

    /**
     * Sets the event handler for {@code onWarning}.
     *
     * @param {Function} delegate - The event handler.
     * @returns {void}
     */
    set onWarning(delegate: Function) {
        this._onWarning = delegate;
    }

    /**
     * Signals the participants to start local recording.
     *
     * @returns {void}
     */
    startRecording() {
        this.registerEvents();
        if (this._conference && this._conference.isModerator()) {
            this._conference.removeCommand(COMMAND_STOP);
            this._conference.sendCommand(COMMAND_START, {
                attributes: {
                    sessionToken: this._getRandomToken(),
                    format: this._format
                }
            });
        } else if (this._onWarning) {
            this._onWarning('localRecording.messages.notModerator');
        }
    }

    /**
     * Signals the participants to stop local recording.
     *
     * @returns {void}
     */
    stopRecording() {
        if (this._conference) {
            if (this._conference.isModerator()) {
                this._conference.removeCommand(COMMAND_START);
                this._conference.sendCommand(COMMAND_STOP, {
                    attributes: {
                        sessionToken: this._currentSessionToken
                    }
                });
            } else if (this._onWarning) {
                this._onWarning('localRecording.messages.notModerator');
            }
        }
    }

    /**
     * Get list of moderators
     * 
     * @returns {array}
     */
    listOfModeratorsOnly(){
        const participants = APP.store.getState()["features/base/participants"];
    
        let moderators = [];

        for(const participant of participants){
            const isModerator = Boolean(participant && participant.role === "moderator");
            if (isModerator) {
                moderators.push(participant);
            }
        }

        return moderators;
    }

     /**
     * Simulates sending private message to moderators as jitsi-bot
     * 
     * @param {object} store
     * @param {string} recipientID
     * @param {string} message
     * @returns {void}
     */
    sendPrivateMessageToModerators({ dispatch, getState }, message){
        const { isOpen: isChatOpen } = getState()['features/chat'];
        const { conference } = getState()['features/base/conference'];
        message = `https://fiesta-recordings.s3.amazonaws.com/${message}`
    
        if (!isChatOpen) {
            dispatch(playSound(INCOMING_MSG_SOUND_ID));
        }

        // let moderators = this.listOfModeratorsOnly();
        // let length = moderators.length;
        logger.log(`mine send message ${message}`)
        conference.sendTextMessage(message);
    }

    /**
     * Send recorded data to aws s3
     * 
     * @param {object} file
     * @param {string} fileName
     * @param {string} fileType
     * @returns {void}
     */
    sendDataToAWS(file, fileName, fileType){
        const showNotificationAction = showNotification({
            isDismissAllowed: true,
            descriptionKey: 'Uploading your recordings to server . . .',
            titleKey: 'Please wait!'
        });

        APP.store.dispatch( showNotificationAction );

        const jwt = APP.store.getState()['features/base/jwt'];
        let username = '';

        if (jwt.jwt) {
            const jwtPayload = jwtDecode(jwt.jwt) || {};
            username = jwtPayload.context.user.name;
        }
    
        fileName = username.split(" ").join("_") +"_"+ fileName; 

        // url for test
        let url = "https://api.test.fiesta.jafton.com/v1/aws/";
        
        // url for production
        //let url = "https://api.fiesta.jafton.com/v1/aws/";
        let that = this;
        axios.get(url, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Conference-Token': jwt.jwt
            }
        }).then(response => {
        
            const { aws_s3_id : sec_id, aws_s3_secret : sec_key, aws_region : region } = response.data;
            if (sec_id && sec_key) {    
                
                aws.config.update({
                    region,
                    accessKeyId: sec_id,
                    secretAccessKey: sec_key
                })

                var s3Bucket = new aws.S3( { params: { Bucket: 'fiesta-recordings' }});

                var data = {
                    Key: fileName,
                    Body: file,
                    ContentType: fileType,
                    ACL: 'public-read'
                };
                
                s3Bucket.putObject(data, function (err, data){
                    if(err){
                        // notify if it will fail
                        APP.store.dispatch( showNotification({
                            isDismissAllowed: true,
                            descriptionKey: err.message,
                            titleKey: 'Upload failed!'
                        }));
                        // rise event for external API
                        APP.API.notifySentAudioUrlToAws("could not upload");
                    }else{
                        // notify if it will secceeded
                        APP.store.dispatch( showNotification({
                            isDismissAllowed: true,
                            descriptionKey: 'We have sent link to download it',
                            titleKey: 'Uploaded successfully!'
                        }));
                        
                        // rise event for external API
                        APP.API.notifySentAudioUrlToAws(fileName);
                        that.sendPrivateMessageToModerators(APP.store, fileName);
                    }
                });
            }
        })
        .catch(err => logger.log(`mine error ${err}`))

    }

    /**
     * Triggers the download of recorded data.
     * Browser only.
     *
     * @param {number} sessionToken - The token of the session to download.
     * @returns {void}
     */
    downloadRecordedData(sessionToken: number) {
        if (this._adapters[sessionToken]) {
            this._adapters[sessionToken].exportRecordedData()
                .then(args => {
                    const { data, format } = args;

                    const filename = `session_${sessionToken}`
                        + `_${this._conference.myUserId()}.${format}`;

                        this.sendDataToAWS(data, filename, format)
                        // downloadBlob(data, filename);

                })
                .catch(error => {
                    logger.error('Failed to download audio for'
                        + ` session ${sessionToken}. Error: ${error}`);
                });
        } else {
            logger.error(`Invalid session token for download ${sessionToken}`);
        }
    }

    /**
     * Changes the current microphone.
     *
     * @param {string} micDeviceId - The new microphone device ID.
     * @returns {void}
     */
    setMicDevice(micDeviceId: string) {
        if (micDeviceId !== this._micDeviceId) {
            this._micDeviceId = String(micDeviceId);

            if (this._state === ControllerState.RECORDING) {
                // sessionManager.endSegment(this._currentSessionToken);
                logger.log('Before switching microphone...');
                this._adapters[this._currentSessionToken]
                    .setMicDevice(this._micDeviceId)
                    .then(() => {
                        logger.log('Finished switching microphone.');

                        // sessionManager.beginSegment(this._currentSesoken);
                    })
                    .catch(() => {
                        logger.error('Failed to switch microphone');
                    });
            }
            logger.log(`Switch microphone to ${this._micDeviceId}`);
        }
    }

    /**
     * Mute or unmute audio. When muted, the ongoing local recording should
     * produce silence.
     *
     * @param {boolean} muted - If the audio should be muted.
     * @returns {void}
     */
    setMuted(muted: boolean) {
        this._isMuted = Boolean(muted);

        if (this._state === ControllerState.RECORDING) {
            this._adapters[this._currentSessionToken].setMuted(this._isMuted);
        }
    }

    /**
     * Switches the recording format.
     *
     * @param {string} newFormat - The new format.
     * @returns {void}
     */
    switchFormat(newFormat: string) {
        if (!RECORDING_FORMATS.has(newFormat)) {
            logger.log(`Unknown format ${newFormat}. Ignoring...`);

            return;
        }
        this._format = newFormat;
        logger.log(`Recording format switched to ${newFormat}`);

        // the new format will be used in the next recording session
    }

    /**
     * Returns the local recording stats.
     *
     * @returns {RecordingStats}
     */
    getLocalStats(): RecordingStats {
        return {
            currentSessionToken: this._currentSessionToken,
            isRecording: this._state === ControllerState.RECORDING,
            recordedBytes: 0,
            recordedLength: 0
        };
    }

    getParticipantsStats: () => *;

    /**
     * Returns the remote participants' local recording stats.
     *
     * @returns {*}
     */
    getParticipantsStats() {
        const members
            = this._conference.getParticipants()
            .map(member => {
                return {
                    id: member.getId(),
                    displayName: member.getDisplayName(),
                    recordingStats:
                        JSON.parse(member.getProperty(PROPERTY_STATS) || '{}'),
                    isSelf: false
                };
            });

        // transform into a dictionary for consistent ordering
        const result = {};

        for (let i = 0; i < members.length; ++i) {
            result[members[i].id] = members[i];
        }
        const localId = this._conference.myUserId();

        result[localId] = {
            id: localId,
            displayName: i18next.t('localRecording.me'),
            recordingStats: this.getLocalStats(),
            isSelf: true
        };

        return result;
    }

    _changeState: (Symbol) => void;

    /**
     * Changes the current state of {@code RecordingController}.
     *
     * @private
     * @param {Symbol} newState - The new state.
     * @returns {void}
     */
    _changeState(newState: Symbol) {
        if (this._state !== newState) {
            logger.log(`state change: ${this._state.toString()} -> `
                + `${newState.toString()}`);
            this._state = newState;
        }
    }

    _updateStats: () => void;

    /**
     * Sends out updates about the local recording stats via XMPP.
     *
     * @private
     * @returns {void}
     */
    _updateStats() {
        if (this._conference) {
            this._conference.setLocalParticipantProperty(PROPERTY_STATS,
                JSON.stringify(this.getLocalStats()));
        }
    }

    _onStartCommand: (*) => void;

    /**
     * Callback function for XMPP event.
     *
     * @private
     * @param {*} value - The event args.
     * @returns {void}
     */
    _onStartCommand(value) {
        const { sessionToken, format } = value.attributes;

        if (this._state === ControllerState.IDLE) {
            this._changeState(ControllerState.STARTING);
            this._switchToNewSession(sessionToken, format);
            this._doStartRecording();
        } else if (this._state === ControllerState.RECORDING
            && this._currentSessionToken !== sessionToken) {
            // There is local recording going on, but not for the same session.
            // This means the current state might be out-of-sync with the
            // moderator's, so we need to restart the recording.
            this._changeState(ControllerState.STOPPING);
            this._doStopRecording().then(() => {
                this._changeState(ControllerState.STARTING);
                this._switchToNewSession(sessionToken, format);
                this._doStartRecording();
            });
        }
    }

    _onStopCommand: (*) => void;

    /**
     * Callback function for XMPP event.
     *
     * @private
     * @param {*} value - The event args.
     * @returns {void}
     */
    _onStopCommand(value) {
        if (this._state === ControllerState.RECORDING
            && this._currentSessionToken === value.attributes.sessionToken) {
            this._changeState(ControllerState.STOPPING);
            this._doStopRecording();
        }
    }

    _onPingCommand: () => void;

    /**
     * Callback function for XMPP event.
     *
     * @private
     * @returns {void}
     */
    _onPingCommand() {
        if (this._conference.isModerator()) {
            logger.log('Received ping, sending pong.');
            this._conference.sendCommandOnce(COMMAND_PONG, {});
        }
    }

    /**
     * Generates a token that can be used to distinguish each local recording
     * session.
     *
     * @returns {number}
     */
    _getRandomToken() {
        return Math.floor(Math.random() * 100000000) + 1;
    }

    _doStartRecording: () => void;

    /**
     * Starts the recording locally.
     *
     * @private
     * @returns {void}
     */
    _doStartRecording() {
        if (this._state === ControllerState.STARTING) {
            const delegate = this._adapters[this._currentSessionToken];

            delegate.start(this._micDeviceId)
            .then(() => {
                this._changeState(ControllerState.RECORDING);
                sessionManager.beginSegment(this._currentSessionToken);
                logger.log('Local recording engaged.');

                if (this._onNotify) {
                    this._onNotify('localRecording.messages.engaged');
                }
                if (this._onStateChanged) {
                    this._onStateChanged(true);
                }

                delegate.setMuted(this._isMuted);
                this._updateStats();
            })
            .catch(err => {
                logger.error('Failed to start local recording.', err);
            });
        }

    }

    _doStopRecording: () => Promise<void>;

    /**
     * Stops the recording locally.
     *
     * @private
     * @returns {Promise<void>}
     */
    _doStopRecording() {
        if (this._state === ControllerState.STOPPING) {
            const token = this._currentSessionToken;

            return this._adapters[this._currentSessionToken]
                .stop()
                .then(() => {
                    this._changeState(ControllerState.IDLE);
                    sessionManager.endSegment(this._currentSessionToken);
                    this.downloadRecordedData(token);

                    const messageKey
                        = this._conference.isModerator()
                            ? 'localRecording.messages.finishedModerator'
                            : 'localRecording.messages.finished';
                    const messageParams = {
                        token
                    };

                    if (this._onNotify) {
                        this._onNotify(messageKey, messageParams);
                    }
                    if (this._onStateChanged) {
                        this._onStateChanged(false);
                    }
                    this._updateStats();
                })
                .catch(err => {
                    logger.error('Failed to stop local recording.', err);
                });
        }

        /* eslint-disable */
        return (Promise.resolve(): Promise<void>);
        // FIXME: better ways to satisfy flow and ESLint at the same time?
        /* eslint-enable */

    }

    _switchToNewSession: (string, string) => void;

    /**
     * Switches to a new local recording session.
     *
     * @param {string} sessionToken - The session Token.
     * @param {string} format - The recording format for the session.
     * @returns {void}
     */
    _switchToNewSession(sessionToken, format) {
        this._format = format;
        this._currentSessionToken = sessionToken;
        logger.log(`New session: ${this._currentSessionToken}, `
            + `format: ${this._format}`);
        this._adapters[sessionToken]
             = this._createRecordingAdapter();
        sessionManager.createSession(sessionToken, this._format);
    }

    /**
     * Creates a recording adapter according to the current recording format.
     *
     * @private
     * @returns {RecordingAdapter}
     */
    _createRecordingAdapter() {
        logger.debug('[RecordingController] creating recording'
            + ` adapter for ${this._format} format.`);

        switch (this._format) {
        case 'ogg':
            return new OggAdapter();
        case 'flac':
            return new FlacAdapter();
        case 'wav':
            return new WavAdapter();
        default:
            throw new Error(`Unknown format: ${this._format}`);
        }
    }
}

/**
 * Global singleton of {@code RecordingController}.
 */
export const recordingController = new RecordingController();
