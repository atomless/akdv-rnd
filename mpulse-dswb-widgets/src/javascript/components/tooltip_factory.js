;((window, document, annotationBubbleFactory, string_utils, dom_utils, event_utils, lang_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'tooltip';
    const DEBOUNCE_TOOLTIP_UPDATE = 200;
    const DEBOUNCE_TOOLTIP_CLICK_HIDE = 1300;

    window.tooltipFactory = ({
            container_el = window.required(),
            uuid = string_utils.generateUUID(),
            class_list = [],
            event_namespace = DEFAULT_CLASS
        } = {}) => {

        const state = {
            observer: false
        };

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        const bubble = annotationBubbleFactory({ container_el, uuid, class_list: [DEFAULT_CLASS, ...class_list] });

        const show = e => {
            let event_type = e.currentTarget.getAttribute('data-tooltip-event') || 'mouseenter';
            if (e.type !== event_type) {
                return;
            }

            let title = e.currentTarget.getAttribute('data-tooltip-title');
            let description = e.currentTarget.getAttribute('data-tooltip-description');

            if (!title && e.currentTarget.getAttribute('data-tooltip-title-localization-path')) {
                title = lang_utils.getLocalizedHTMLString(...string_utils.getKeyAndNamespace(e.currentTarget.getAttribute('data-tooltip-title-localization-path')));
            }

            if (!description && e.currentTarget.getAttribute('data-tooltip-description-localization-path')) {
                description = lang_utils.getLocalizedHTMLString(...string_utils.getKeyAndNamespace(e.currentTarget.getAttribute('data-tooltip-description-localization-path')));
            }

            event_utils.dispatchCustomEvent(window, 'show-component', event_namespace, [e.originalEvent, {
                title_obj: { value: title },
                description_text: description
                }
            ]);

            if (event_type === 'click') {
                event_utils.delay(DEBOUNCE_TOOLTIP_CLICK_HIDE, 'hide-tooltips').then(e => event_utils.dispatchCustomEvent(window, 'hide-component', event_namespace));
            }
        };

        const onScroll = e => event_utils.dispatchCustomEvent(window, 'hide-component', event_namespace);

        const removeEventListeners = () => {

            $('.add-tooltip').off('click mouseenter mousemove mouseleave');
            $(document.body).off('scroll', onScroll);
        };

        const addEventListeners = () => {

            $('.add-tooltip').on('click mouseenter', show);

            $('.add-tooltip').on('mousemove', e => event_utils.dispatchCustomEvent(window, 'position-component', event_namespace, [e.originalEvent]));

            $('.add-tooltip').on('mouseleave', e => event_utils.dispatchCustomEvent(window, 'hide-component', event_namespace));

            $(document.body).on('scroll', onScroll);
        };

        const updateTooltips = () => {

            removeEventListeners();
            addEventListeners();
        };

        const destroy = () => {

            removeEventListeners();
            state.observer.disconnect();
            state.observer = false;
        };

        state.observer = new MutationObserver((mutationsList, observer) => {
            for(let mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    for (let node of mutation.addedNodes) {
                        if (node instanceof HTMLElement && node.querySelector('.add-tooltip')) {               
                            event_utils.delay(DEBOUNCE_TOOLTIP_UPDATE, 'update-tooltips').then(updateTooltips);
                            return;
                        }
                    }
                }
            }
        });

        state.observer.observe(document.body, { childList: true, subtree: true });

        updateTooltips();

        return {
            destroy,
            populate: bubble.populate 
        };
    };


})(window, document, window.annotationBubbleFactory,
   window.akdv.utils_string, window.akdv.utils_dom, window.akdv.utils_event, window.akdv.utils_lang);