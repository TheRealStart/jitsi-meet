/* @flow */

import React, { Component } from 'react';
import Tooltip from '@atlaskit/tooltip';
import styled from 'styled-components';

/**
 * Styled component for text of button
 */
const TextContainer = styled.div`
    font-size : ${props => props.circle  ? "9px !important" : "11px !important"} 
    background : ${props => props.bg ? props.bg : "white"} !important; 
    color : ${props => props.cl ? props.cl : "black"}  !important;
    font-weight: ${props => props.circle  ? "600" : "600"};
    width: ${props => props.circle  ? "40px !important" : "62px !important"} ;
    height: ${props => props.circle  ? "40px !important" : "45px !important"} ;
    border-color : ${props => props.bc ? props.bc : "white"} !important;
    border-radius: 50% !important;
    line-height : 10px;
`

/**
 * The type of the React {@code Component} props of
 * {@link Highlight button}.
 */
export type Props = {
    /**
     * On click handler.
     */
    onClick: Function,
    /**
     * Text of button
     */
    text: String
};

/**
 * Toolbar button class for a custom button withour icon in {@link Toolbar}.
 *
 * @abstract
 */
export default class ToolbarButtonWithoutIcon<P: Props> extends Component<P> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { circle, onClick, tooltip, text, toggled, customClass, background, color, borderColor } = this.props
        return (
            <div className = 'toolbox-button' onClick = { onClick } >
                <Tooltip
                    content = { tooltip }
                    position = { "top" }>
                    <TextContainer circle={circle} bg={background} cl={color} bc={borderColor} className={`toolbox-icon ${toggled ? 'toggled' : ''} ${customClass ? customClass : "" }`}>
                        { text }
                    </TextContainer>
                </Tooltip>
            </div>
        );
    }

}