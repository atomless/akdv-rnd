;((window, document, string_utils, dom_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'contextmenu';

    window.contextmenuFactory = ({
            container_el = window.required(),
            uuid = string_utils.generateUUID(),
            class_list = [],
            current_sections = []
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        let state = Object.seal({
            current_sections
        });

        const populate = ({ 
            sections = state.current_sections/* = [{ //EXAMPLE
                title: 'Context Menu',
                items: [
                    { label: 'My Item Label', onclick_fn : (e) => alert('You need to override this function When instantiating a contextmenu!') }
                ]
            }, ... ]*/
        } = {}) => {

            let el, dl_el, dt_el, dd_el;

            el = document.createElement('div');
            el.setAttribute('id', `${DEFAULT_CLASS}-${uuid}`);
            el.classList.add(...[DEFAULT_CLASS, ...class_list]);

            dl_el = document.createElement('dl');
            el.appendChild(dl_el);

            if (sections && sections.length) {
                
                sections.forEach((section, i) => {
                    if (section.title) {
                        dt_el = document.createElement('dt');
                        dt_el.textContent = section.title;
                        dt_el.classList.add('title');
                        dl_el.appendChild(dt_el);
                    }
                    if (section.items) {
                        section.items.forEach((item, j) => {
                            dd_el = document.createElement('dd');
                            dd_el.classList.add(...[`${DEFAULT_CLASS}-item`, ...(item.class_list || [])])
                            dd_el.onclick = item.onclick_fn;
                            dd_el.textContent = item.label;
                            dl_el.appendChild(dd_el);
                        });
                    }
                });
                
            }

            container_el.appendChild(el);

            return el;
        };


        return Object.seal({ 

            populate,

            get sections() {
                return state.current_sections;
            },

            set sections(s) {
                state.current_sections = s;
            }
        });
    };


})(window, document, 
   window.akdv.utils_string, window.akdv.utils_dom);