// @flow
import React, { Component } from 'react';
import { connect } from '../../base/redux';
import Spinner from '@atlaskit/spinner';
import { Dialog } from '../../base/dialog';
import  { SCOPES, CLIENT_ID, GPICKER_API_KEY, APP_ID } from '../constants';
import GooglePicker from 'google-picker-component';
import { getRoomName } from '../../base/conference';
import Header from './Header';

class GoogleDriveDialog extends Component {
    state = {
        signedInUser: null,
        googleDriveApiStatus: null,
        loading: false,
        googleDriveFiles: null,
        shareLink: ""
    }
    
    handleGoogleDriveFileSelect = fileUrl => {
        const { _socket } = this.props;
        let gdriveUrlObject = {
            type: "gdrive",
            gdrive_share_link: fileUrl
        }
        let gdriveUrlJSON = JSON.stringify(gdriveUrlObject);
        _socket.send(gdriveUrlJSON);
    }

    handleEnterClick = e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            let urlRegEx = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm;
            if(this.state.shareLink && urlRegEx.test(this.state.shareLink)){
                const { _socket } = this.props;
                let link = this.state.shareLink.replace('view', 'preview')
                let gdriveUrlObject = {
                    type: "gdrive",
                    gdrive_share_link: link
                }
                let gdriveUrlJSON = JSON.stringify(gdriveUrlObject);
                _socket.send(gdriveUrlJSON);
            }
        }
    }

    hanldeChange = e =>{
        this.setState({ shareLink: e.target.value })
    }

    render() {
        return (
            <Dialog
                cancelKey = { 'dialog.close' }
                customHeader = { Header }
                hideCancelButton = { true }
                submitDisabled = { true }
                disableBlanketClickDismiss = { this.state.modalDismiss }
                titleKey = 'Google drive'>
                <div>
                    <div>
                        <input type='text'
                            className='input-control  gdirive-input'
                            placeholder='Paste Google Drive Link Here'
                            value = { this.state.shareLink }
                            onChange = { this.hanldeChange }
                            onKeyDown = { this.handleEnterClick }
                            autoFocus />
                        <div>
                            <span className="youtube_ex_text">Press "Share" button at your Google Drive file and paste it here</span>
                        </div>
                        <div className="separator">OR</div>
                        <div className={"button-wrapper " + (this.state.loading ? 'disabled' : null)} >
                            <GooglePicker clientId={ CLIENT_ID}
                                developerKey={GPICKER_API_KEY}
                                scope={SCOPES}
                                appId={APP_ID}
                                origin={'https://docs.google.com'}
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
    const { gdriveSocket } = state['features/google-drive'];

    return {
        _roomName: getRoomName(state),
        _jwt: jwt,
        _socket: gdriveSocket
    };
}

export default connect(_mapStateToProps)(GoogleDriveDialog);