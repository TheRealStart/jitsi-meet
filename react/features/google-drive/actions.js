import { SET_GOOGLE_API_USER_INFO, 
         SET_GOOGLE_DRIVE_FILES,
         SET_WEBSOCKET } from './actionTypes'

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

const setWebsocketForGooglDrive = socketInstance => {
    return {
        type: SET_WEBSOCKET,
        payload: socketInstance
    }
}

export {
    setGoogleApiUser,
    setGoogleDriveFiles,
    setWebsocketForGooglDrive
}