// @flow

import { ReducerRegistry } from '../base/redux';
import {
    SET_GOOGLE_API_USER_INFO,
    SET_GOOGLE_DRIVE_FILES,
    SET_WEBSOCKET
} from './actionTypes';
import { CONFERENCE_JOINED } from '../base/conference';
import logger from './logger';

/**
 * Reduces the Redux actions of the feature features/google-drive.
 */
ReducerRegistry.register('features/google-drive',
    (state = { }, action) => {
        switch (action.type) {
            case CONFERENCE_JOINED:
            case SET_GOOGLE_API_USER_INFO:
                return {
                    ...state,
                    gdriveProfile: action.payload
                };
            case SET_GOOGLE_DRIVE_FILES:
                return {
                    ...state,
                    gdriveFiles: action.payload
                };
            case SET_WEBSOCKET:         
                return {
                    ...state,
                    gdriveSocket: action.payload
                }
        }

        return state;
    });
