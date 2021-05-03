import React, { Component } from 'react';
import { connect } from '../../base/redux';
import { Dialog, hideDialog } from '../../base/dialog';

let Iframe = props => {
    return (
        <div>          
            <iframe src={props.src} height={props.height} width={props.width}/>         
        </div>
    )
}

class DisplayFileContentDialog extends Component {
    render(){
        return (
            <Dialog
                cancelKey = { 'dialog.close' }
                width = "100%"
                hideCancelButton = { true }
                submitDisabled = { true }
                titleKey = 'Google drive'>
                <div>
                    <Iframe src={ this.props.embedUrl } height="700px" width="100%" />
                </div>
            </Dialog>
        )
    }
}

function _mapStateToProps(state){
    const gdrive_data = state['features/google-drive'];
    return {
        _dgdrive: gdrive_data
    };
}

export default connect(_mapStateToProps)(DisplayFileContentDialog);