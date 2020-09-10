import React, { Component } from  'react';
import styled from 'styled-components';
import Select from '@atlaskit/select'

/**
 * Main container for component [styled component]
 */
const MainContainer = styled.div`
    position : absolute;
    z-index: 10;
    top: 60px;
    left : 25px;
    width : 315px;
`
/**
 * Container of select components [styled component]
 */
const SelectContainer = styled.div`
    display : inline-block;
    width : 140px;
    margin-right : ${props => props.marginRight ? "10px" : "0px"};
`

export default class SelectLanguage extends Component<P, S> {

    state = {
        options : [
                { label: 'English', value: 'en-US' },
                { label: 'Spanish', value: 'es-ES' },
                { label: 'French', value: 'fr-FR' },
                { label: 'Hindi', value: 'hi-IN' },
                { label: 'Italian', value: 'it-IT' },
                { label: 'Russian', value: 'ru-RU' },
                { label: 'Uzbek', value: 'uz-UZ' },
            ]
    }
    /**
     * Handles select option changes
     *
     * @param {Object} option
     * @param {Boolean} source - Whether it is source or target language
     * @returns {void}
     */

    _handleSelect(option, source){
        // source true if it is source target otherwise target language
        if(source){
            APP.conference._room.setLocalParticipantProperty('transcription_language', option.value);
        }else {
            APP.conference._room.setLocalParticipantProperty('translation_language', option.value);
        }
    }

    /**
     * Renders select components
     *
     * @param {Boolean} which - Whether it is source or target language
     * @param {String} placeholder 
     * @returns {void}
     */
    _renderSelect(which, placeholder){
        return (
            <Select
                className="source-select"
                classNamePrefix="react-select"
                options={this.state.options}
                onChange={val => this._handleSelect(val, which)}
                placeholder={placeholder}
            />
        )
    }

    render(){
        return (
            <MainContainer>
                <SelectContainer marginRight >
                    {this._renderSelect(true, "Source language")}
                </SelectContainer>
                <SelectContainer>
                    {this._renderSelect(false, "Target language")}
                </SelectContainer>
            </MainContainer>

        )
    }
}