// @flow

import React from 'react';
import { translate } from '../../base/i18n';
import { Icon, IconClose } from '../../base/icons';

type Props = {

    /**
     * The {@link ModalDialog} closing function.
     */
    onClose: Function,
};

function Header({ onClose }: Props) {
    return (
        <div className = 'invite-more-dialog header'>
            <div>
                <img src='../../../../images/google-drive-dialog.png' />
            </div>
            <Icon
                onClick = { onClose }
                src = { IconClose } />
        </div>
    );
}

export default translate(Header);