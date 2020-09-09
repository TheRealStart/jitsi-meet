// @flow

import React, { Component } from 'react';
import { Dialog } from '../../../base/dialog';
import TranaslateButtons from './TranslateButtons'
export default class TranslateButtonsDialog extends Component {
   
    render() {
        return (
            <Dialog
                hideCancelButton = { true }
                okKey = 'dialog.done'
                titleKey = 'Translation Settings'>
                <div>
                    <TranaslateButtons />
                </div>
            </Dialog>
        );
    }
}