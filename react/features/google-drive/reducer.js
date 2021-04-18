// @flow

import { ReducerRegistry } from '../base/redux';
import {
    SET_GOOGLE_API_USER_INFO,
    SET_GOOGLE_DRIVE_FILES
} from './actionTypes';
import logger from './logger';

/**
 * Reduces the Redux actions of the feature features/google-drive.
 */
ReducerRegistry.register('features/google-drive',
    (state = { }, action) => {
        switch (action.type) {
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
        }

        return state;
    });
