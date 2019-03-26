;((window, document, string_utils, dom_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'annotation-bubble';

    window.annotationBubbleFactory = ({
            container_el = window.required(),
            uuid = string_utils.generateUUID(),
            class_list = []
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);


        const populate = ({ title_obj, name_value_unit_obj_list, description_text } = {}) => {

            let el, title, title_el, title_el_value, ul_el, li_el, span_el, span_el_r, title_name = '', p_el;

            el = document.createElement('div');
            el.setAttribute('id', `${DEFAULT_CLASS}-${uuid}`);
            el.classList.add(...[DEFAULT_CLASS, ...class_list]);

            if (title_obj && (title_obj.value || title_obj.name)) {
                title = string_utils.capitalizeAcronyms(title_obj.value || '');
                title_el = document.createElement('h6');
                title_el.classList.add('title');
                title_el_value = document.createElement('strong');
                title_el_value.innerHTML = title;
                title_name = title_obj.name || '';
                title_el.innerHTML = title_name? `${title_name}: ` : '';
                title_el.appendChild(title_el_value);
                el.appendChild(title_el);
            }

            if (name_value_unit_obj_list) {
                ul_el = document.createElement('ul');
                name_value_unit_obj_list.forEach((d, i) => {
                    if (d.name === title_name) { return; }// omit repeat of the title
                    li_el = document.createElement('li');
                    span_el = document.createElement('span');
                    span_el.innerHTML = d.label || d.name;
                    span_el_r = document.createElement('span');
                    span_el_r.innerHTML = `${d.value}${d.unit || ''}`;
                    li_el.appendChild(span_el);
                    li_el.appendChild(span_el_r);
                    ul_el.appendChild(li_el);
                });
                el.appendChild(ul_el);
            }

            if (description_text) {
                p_el = document.createElement('p');
                p_el.innerHTML = description_text;
                el.appendChild(p_el);
            }

            container_el.appendChild(el);

            return el;
        };


        return { populate };
    };


})(window, document, 
   window.akdv.utils_string, window.akdv.utils_dom);