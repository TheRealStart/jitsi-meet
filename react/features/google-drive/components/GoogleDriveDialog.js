// @flow
import React, { Component } from 'react';
import { connect } from '../../base/redux';
import Spinner from '@atlaskit/spinner';
import { Dialog, openDialog, hideDialog } from '../../base/dialog';
import DisplayFileContentDialog from './DisplayFileContentDialog';
import  { SCOPES, CLIENT_ID, GPICKER_API_KEY } from '../constants';
import GooglePicker from 'google-picker-component';
import { getRoomName } from '../../base/conference';
import { setGoogleApiUser, setGoogleDriveFiles } from '../actions';
import Header from './Header';

class GoogleDriveDialog extends Component {
    state = {
        signedInUser: null,
        googleDriveApiStatus: null,
        loading: false,
        googleDriveFiles: null
    }
    
    handleGoogleDriveFileSelect = fileUrl => {
        const { _roomName, _jwt } = this.props;
        console.log(`mine ${_roomName} jwt is ${_jwt}`)
        let fullUrl = `wss://jingo.edugenux.com/ws/conference/${_roomName}/?token=${_jwt}`;
        this.props.dispatch( openDialog(DisplayFileContentDialog, { embedUrl: fileUrl}))
        let gdriveUrlObject = {
            type: "gdrive",
            url: fileUrl
        }
        let gdriveUrlJSON = JSON.stringify(gdriveUrlObject);
        const socket = new WebSocket(fullUrl);

        socket.send(gdriveUrlJSON);
    }

    render() {
        return (
            <Dialog
                cancelKey = { 'dialog.close' }
                customHeader = { Header }
                hideCancelButton = { true }
                submitDisabled = { true }
                titleKey = 'Google drive'>
                <div>
                    <div>
                        <input type='text'
                            className='input-control  gdirive-input'
                            placeholder='Paste Google Drive Link Here'
                            autoFocus />
                        <div>
                            <span className="youtube_ex_text">Press "Share" button at your Google Drive file and paste it here</span>
                        </div>
                        <div className="separator">OR</div>
                        <div className={"button-wrapper " + (this.state.loading ? 'disabled' : null)} >
                            <GooglePicker clientId={ CLIENT_ID}
                                developerKey={GPICKER_API_KEY}
                                scope={SCOPES}
                                onChange={data => this.handleGoogleDriveFileSelect(data.docs[0].embedUrl)}
                                onAuthFailed={data => console.log('on auth failed:', data)}
                                multiselect={false}
                                authImmediate={false}
                                viewId={'DOCS'}>
                                    <span className="label">
                                        <div className="gdrive-con" >
                                            Choose file from <img className="gdrive-img" src='../../../../images/google-drive-dialog.png' />
                                        </div>
                                    </span>
                                    <span className="gdrive-con spinner-con" style={ this.state.loading ? { display: "inline-block" } : {display: "none"} }>
                                        <Spinner appearance="inherit" />
                                    </span>
                            </GooglePicker>
                        </div>
                    </div>
                </div>
            </Dialog>
        );
    }
} 

function _mapStateToProps(state){
    const { jwt } = state['features/base/jwt'];

    return {
        _roomName: getRoomName(state),
        _jwt: jwt
    };
}

export default connect(_mapStateToProps)(GoogleDriveDialog);