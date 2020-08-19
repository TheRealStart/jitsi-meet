/* @flow */

import React, { Component } from 'react';
import Tooltip from '@atlaskit/tooltip';
import styled from 'styled-components';

/**
 * Styled component for text of button
 */
const TextContainer = styled.div`
    font-size : 11px !important;
    background : white !important;
    color : black;
    font-weight: 600;
    width: 62px !important;
    height: 45px !important;
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
        return (
            <div className = 'toolbox-button' onClick = { this.props.onClick } >
                <Tooltip
                    content = { this.props.tooltip }
                    position = { this.props.tooltipPosition }>
                    <TextContainer className="toolbox-icon">
                        { this.props.text }
                    </TextContainer>
                </Tooltip>
            </div>
        );
    }

}