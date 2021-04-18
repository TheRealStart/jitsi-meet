import { SET_GOOGLE_API_USER_INFO, SET_GOOGLE_DRIVE_FILES } from './actionTypes'

const setGoogleApiUser = userInfo => {
    return {
        type: SET_GOOGLE_API_USER_INFO,
        payload: userInfo
    }
}

const setGoogleDriveFiles = filesArray => {
    return {
        type: SET_GOOGLE_DRIVE_FILES,
        payload: filesArray
    }
}

export {
    setGoogleApiUser,
    setGoogleDriveFiles
}