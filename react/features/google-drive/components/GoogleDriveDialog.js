// @flow

import React, { Component } from 'react';
import { Dialog } from '../../base/dialog';
import Header from './Header';

export default class GoogleDriveDialog extends Component {
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
                            class='input-control  gdirive-input'
                            placeholder='Paste Google Drive Link Here'
                            autofocus />
                        <div>
                            <span class="youtube_ex_text" >Press "Share" button at your Google Drive file and paste it here</span>
                        </div>
                        <div class="separator">OR</div>
                        <div class="button-wrapper">
                            <span class="label">
                                <div className="gdrive-con" >
                                    Choose file from <img className="gdrive-img" src='../../../../images/google-drive-dialog.png' />
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
            </Dialog>
        );
    }
} 