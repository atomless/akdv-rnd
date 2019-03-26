;((window, document, $, string_utils, css_utils, dom_utils, data_utils, obj_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'component';

    window.componentFactory = ({
            container_el = window.required(),
            component = window.required(),
            uuid = string_utils.generateUUID(),
            event_list = ['show-component', 'hide-component', 'position-component', 'cancel-show-component'],
            event_namespace = DEFAULT_CLASS,
            class_list = [],
            offset_x_rems = 0,
            offset_y_rems = 0,
            show_timeout_period_ms = 0,
            function_to_format_data = d => d
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        let el, show_timeout;

        let component_base = {

            clear() {
                if (el) {
                    try {
                        container_el.removeChild(el);
                    } catch(e) {}
                    el = false;
                }
            },


            destroy() {

                $(window).off(event_list.map(d => `${d}.${event_namespace}`).join(' '));
                component_base.clear();
            },


            position({ x, y } = {}) {

                if (el && x && y && Number(x) && Number(y)) {

                    let offset_x, offset_y, align_x, align_y, 
                        override_x = (class_list.includes('align-override-left') || class_list.includes('align-override-right'));

                    align_x = (x < document.documentElement.clientWidth * 0.25 || class_list.includes('align-override-left'))
                        ? 'left' : (x < document.documentElement.clientWidth * 0.75 && !class_list.includes('align-override-right'))? 'middle' : 'right';

                    align_y = override_x
                        ? 'middle' : (y > document.documentElement.clientHeight * 0.5)? 'top' : 'bottom';

                    if (override_x) {
                        offset_x = class_list.includes('align-override-left')
                            ? -el.offsetWidth - css_utils.remsToPixels(offset_x_rems) : css_utils.remsToPixels(offset_x_rems);
                    } else {
                        switch(align_x) {
                            case 'left':
                                offset_x = -css_utils.remsToPixels(offset_x_rems);
                            break;
                            case 'right':
                                offset_x = -el.offsetWidth + css_utils.remsToPixels(offset_x_rems);
                            break;
                            default:
                                offset_x = el.offsetWidth * -0.5;
                        }
                    }

                    switch(align_y) {
                        case 'top':
                            offset_y = -el.offsetHeight - css_utils.remsToPixels(offset_y_rems);
                        break;
                        case 'bottom':
                            offset_y = css_utils.remsToPixels(offset_y_rems);
                        break;
                        default:
                            offset_y = (el.offsetHeight * -0.5) + css_utils.remsToPixels(offset_y_rems);
                    }

                    el.setAttribute('data-align-x', align_x);
                    el.setAttribute('data-align-y', align_y);
                    el.style.cssText = `left:${x + offset_x}px; top:${y + offset_y}px;`;
                }
            },


            onEvent(e, orig_e, data) {

                switch(e.type) {
                    case 'show-component':
                        window.clearTimeout(show_timeout);
                        this.clear();

                        data = function_to_format_data(data);                            
                        el = (this.populate)? this.populate(data) : el;
                        this.position({ x: orig_e.pageX, y: orig_e.pageY, ...data });
                        el.classList.add('invisible');
                        show_timeout = window.setTimeout(e => el.classList.remove('invisible'), show_timeout_period_ms);
                    break;
                    case 'position-component': 
                        this.position({ x: orig_e.pageX, y: orig_e.pageY, ...data });
                    break;
                    case 'hide-component':
                        window.clearTimeout(show_timeout);
                        this.clear();
                    break;
                }
            },


            get el() { return el; },

            get uuid() { return uuid; }
        };


        let extension_component = component({ container_el, uuid, class_list: [DEFAULT_CLASS, ...class_list] });


        const c = obj_utils.extend(
            {},
            component_base, 
            extension_component,
            { 
                destroy() {

                    component_base.destroy();
                    if (typeof extension_component.destroy === 'function') {
                        extension_component.destroy();
                    }
                }
            }
        );

            
        $(window).on(event_list.map(d => `${d}.${event_namespace}`).join(' '), 
            (e, orig_e, data) => c.onEvent(e, orig_e, data)
        );


        return c;
    };


})(window, document, window.jQuery,
   window.akdv.utils_string, window.akdv.utils_css, window.akdv.utils_dom, 
   window.akdv.utils_data, window.akdv.utils_obj);