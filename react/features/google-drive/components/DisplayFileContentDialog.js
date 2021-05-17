import React, { Component } from 'react';
import { connect } from '../../base/redux';
import { Dialog, hideDialog, openDialog } from '../../base/dialog';
import '../style/main.css';

let Iframe = props => {
    return (
        <div>          
            <iframe src={props.src} height={props.height} width={props.width}/>         
        </div>
    )
}

class DisplayFileContentDialog extends Component {
    state = {
        dismissDialog: true
    }

    toggleDismiss = e => {
        e.preventDefault();
        let stopGdrive = {
            type: "gdrive_stop" 
        }
        this.setState({ dismissDialog: false })
        this.props._socket.send(JSON.stringify(stopGdrive));
        this.props.dispatch(hideDialog())
    }

    render(){
        return (
            <Dialog
                cancelKey = { 'dialog.close' }
                width = "100%"
                hideCancelButton = { true }
                disableBlanketClickDismiss = { this.state.dismissDialog }
                submitDisabled = { true }
                customHeader = { () => {
                    return (
                        <div className="contentContainer"> 
                            <div className="margin20px">Google Drive</div>
                            <div className="margin20px">
                                <button className="dialogCloseButton" onClick={this.toggleDismiss} >Close modal</button>
                            </div>
                        </div>
                    )
                } }
                onCancelClick = { this.toggleDismiss }>
                <div>
                    <Iframe src={ this.props.embedUrl } height="700px" width="100%" />
                </div>
            </Dialog>
        )
    }
}

function _mapStateToProps(state){
    const { gdriveSocket } = state['features/google-drive'];

    return {
        _socket: gdriveSocket
    };
}

export default connect(_mapStateToProps)(DisplayFileContentDialog);