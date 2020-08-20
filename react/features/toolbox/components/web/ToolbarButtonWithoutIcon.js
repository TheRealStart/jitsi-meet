/* @flow */

import React, { Component } from 'react';
import Tooltip from '@atlaskit/tooltip';
import styled from 'styled-components';

/**
 * Styled component for text of button
 */
const TextContainer = styled.div`
    font-size : ${props => props.circle  ? "9px !important" : "11px !important"} 
    background : white !important;
    color : black;
    font-weight: ${props => props.circle  ? "600" : "600"};
    width: ${props => props.circle  ? "40px !important" : "62px !important"} ;
    height: ${props => props.circle  ? "40px !important" : "45px !important"} ;
    border-radius: 50% !important;
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
        const { circle } = this.props
        return (
            <div className = 'toolbox-button' onClick = { this.props.onClick } >
                <Tooltip
                    content = { this.props.tooltip }
                    position = { "top" }>
                    <TextContainer circle={circle} className={`toolbox-icon ${this.props.toggled ? 'toggled' : ''} ${this.props.customClass}`}>
                        { this.props.text }
                    </TextContainer>
                </Tooltip>
            </div>
        );
    }

}