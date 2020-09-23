import { translateToHTML } from '../base/i18n';
import { isSuboptimalBrowser } from '../base/environment';
import { toState } from '../base/redux';

import {
    areThereNotifications,
    showWarningNotification,
    showNotification
} from '../notifications';
import { getOverlayToRender } from '../overlay';

/**
 * Shows the suboptimal experience notification if needed.
 *
 * @param {Function} dispatch - The dispatch method.
 * @param {Function} t - The translation function.
 * @returns {void}
 */
export function maybeShowSuboptimalExperienceNotification(dispatch, t) {
    if (isSuboptimalBrowser()) {
        dispatch(
            showWarningNotification(
                {
                    titleKey: 'notify.suboptimalExperienceTitle',
                    description: translateToHTML(
                        t,
                        'notify.suboptimalBrowserWarning',
                        {
                            recommendedBrowserPageLink: `${window.location.origin}/static/recommendedBrowsers.html`
                        }
                    )
                }
            )
        );
    }
}

export function notify(dispatch, t, state){
    const jwt = state['features/base/jwt'];
    if(jwt.jwt){
        dispatch(
            showNotification(
                {
                    titleKey: "Recommendation ;)",
                    description: translateToHTML(
                        t,
                        'Running internet sharing and streaming services (YouTube, Netflix, google photos, apple cloud, other video conferencing software) in parallel can degrade performance. <br/> <br/> We recommend closing these during your recording for the best experience.'
                    )
                }
            )
        );
    }
}

/**
 * Tells whether or not the notifications should be displayed within
 * the conference feature based on the current Redux state.
 *
 * @param {Object|Function} stateful - The redux store state.
 * @returns {boolean}
 */
export function shouldDisplayNotifications(stateful) {
    const state = toState(stateful);
    const isAnyOverlayVisible = Boolean(getOverlayToRender(state));
    const { calleeInfoVisible } = state['features/invite'];

    return areThereNotifications(state)
            && !isAnyOverlayVisible
            && !calleeInfoVisible;
}
