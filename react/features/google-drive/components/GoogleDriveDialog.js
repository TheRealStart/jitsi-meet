// @flow
import React, { Component } from 'react';
import { connect } from '../../base/redux';
import Spinner from '@atlaskit/spinner';
import { Dialog, openDialog, hideDialog } from '../../base/dialog';
import DisplayFileContentDialog from './DisplayFileContentDialog';
import  { SCOPES, CLIENT_ID, GPICKER_API_KEY } from '../constants';
import GooglePicker from 'google-picker-component';
import { setGoogleApiUser, setGoogleDriveFiles } from '../actions';
import Header from './Header';

class GoogleDriveDialog extends Component {
    state = {
        signedInUser: null,
        googleDriveApiStatus: null,
        loading: false,
        googleDriveFiles: null
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
                            <span className="youtube_ex_text" >Press "Share" button at your Google Drive file and paste it here</span>
                        </div>
                        <div className="separator">OR</div>
                        <div className={"button-wrapper " + (this.state.loading ? 'disabled' : null)} >
                            <GooglePicker clientId={ CLIENT_ID}
                                developerKey={GPICKER_API_KEY}
                                scope={SCOPES}
                                onChange={data => this.props.dispatch( openDialog( DisplayFileContentDialog, { embedUrl: data.docs[0].embedUrl } ) )}
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
    const { authRequired } = state['features/base/conference'];

    return {
        _room: authRequired && authRequired.getName()
    };
}

export default connect(_mapStateToProps)(GoogleDriveDialog);