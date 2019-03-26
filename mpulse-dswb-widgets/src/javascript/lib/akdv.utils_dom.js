;((window, document, $, SimpleScrollbar, event_utils, string_utils) => {

    'use strict';
  

    const dom_utils = window.akdv.utils_dom = {


        get supports_templates() { return ('content' in document.createElement('template')); },
        get supports_prepend() { return typeof document.body.prepend === 'function'; },

        throwExceptionIfNotDOMNodeElement(el) {

            if (!window.akdv.validate.isDOMNodeElement(el)) {
                throw new TypeError('Expected a Web API Node element.');
            }
        },


        throwExceptionIfNotIterableListOfDOMNodeElements(el_array) {

            if (!window.akdv.validate.isIterableListOfDOMNodeElements(el_array)) {
                throw new TypeError('Expected a NodeList resulting from a querySelectorAll call, or a standard array.');
            }
        },


        throwExceptionIfNotTextElement(el) {

            if (!window.akdv.validate.isSVGTextElement(el)) {
                throw new TypeError('Expected an SVG Text Element.');
            }
        },


        appendResponsiveSVGToElement(
            el, 
            uuid = el.id || string_utils.generateUUID(),
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')) {

            svg.setAttributeNS(null, 'id', `${uuid}-svg`);
            svg.setAttributeNS(null, 'width', '100%');
            svg.setAttributeNS(null, 'preserveAspectRatio', 'xMinYMin meet');

            return el.appendChild(svg);
        },


        appendFromHTMLString(to_el, html_string) {

            to_el.appendChild(this.createElementFromHTMLString(html_string));
        },


        append(to_el, el_array) {

            el_array = window.akdv.validate.isIterableListOfDOMNodeElements(el_array)? el_array : [el_array];
            for (const el of el_array) {
                to_el.appendChild(el);
            }
        },


        prepend(to_el, el) { 

            this.throwExceptionIfNotDOMNodeElement(to_el);
            this.throwExceptionIfNotDOMNodeElement(el);

            return (this.supports_prepend)? to_el.prepend(el) : to_el.insertBefore(el, to_el.children[0]);
        },


        removeChildren(el) {
            
            let child;
            while ((child = el.lastChild)) {
                el.removeChild(child);
            }
        },


        moveChildren(old_parent, new_parent) {

            while (old_parent.childNodes.length) { 
                new_parent.appendChild(old_parent.firstChild); 
            }
        },


        remove(el) {

            let removed = false;
            if (window.akdv.validate.isDOMNodeElement(el)) {
                event_utils.off(el);
                el.outerHTML = '';
                removed = true;
            }

            return removed;
        },


        removeAll(selector) {

            let removed = false;
            try {
                document.querySelectorAll(selector).forEach(el => dom_utils.remove(el));
                removed = true;
            } catch(e) {}

            return removed;
        },


        createElementFromHTMLString(html_string) {

            let ts = this.supports_templates;
            let template = document.createElement(ts? 'template' : 'div');

            template.innerHTML = html_string.trim();
            return ts? template.content.firstChild : template.firstChild;
        },


        getTextContentFromHTMLString(html_string) {

            const el = dom_utils.createElementFromHTMLString(html_string);

            return el? el.textContent || false : false;
        },


        getLocalizationKeyFromHTMLString(html_string) {

            const el = dom_utils.createElementFromHTMLString(html_string);

            return el && el.getAttribute? el.getAttribute('data-localization-key') || false : false;
        },


        getHTMLStringFromElement(element) {
            
            return document.createElement('div').appendChild(element).outerHTML;
        },


        getPercentileMarkup(kth) {

            return `(<i class="percentile-element">P<sub>${kth}</sub></i>)`;
        },


        // Traverse up the DOM until an el with matching class is found or return false
        getNearestParentElementWithClass(el, class_string) {

            this.throwExceptionIfNotDOMNodeElement(el);

            while (el !== document && el && !el.classList.contains(class_string)) {
                el = el.parentElement; 
            }
            return (el === null)? false : el;
        },


        // Traverse up the DOM until an el with matching class is found or return false
        getNearestParentElementOfType(el, type_string = 'div') {

            this.throwExceptionIfNotDOMNodeElement(el);

            while (el !== document && el && el.nodeName.toLowerCase() !== type_string.toLowerCase()) {
                el = el.parentElement; 
            }
            return (el === null)? false : el;
        },


        // Traverse up the DOM until an el with matching id is found or return false
        getNearestParentElementWithId(el, id) {

            this.throwExceptionIfNotDOMNodeElement(el);

            while (el !== document && el && el.id !== id) {
                el = el.parentElement;
            }
            return (el === null)? false : el;
        },


        addClassToElementAndRemoveAfterDuration(el, class_string = '', duration = 2000) {

            this.throwExceptionIfNotDOMNodeElement(el);

            el.classList.add(class_string);

            window.setTimeout(() => {

                el.classList.remove(class_string);
            }, duration);
        },


        addClassToListOfDOMNodeElementsAndRemoveAfterDuration(el_array, class_string, duration) {

            this.throwExceptionIfNotIterableListOfDOMNodeElements(el_array);

            el_array.forEach((el) => {

                this.addClassToElementAndRemoveAfterDuration(el, class_string, duration);
            });
        },


        isScrolledIntoView(el, _container_el) {

            this.throwExceptionIfNotDOMNodeElement(el);

            let container = _container_el || window;
            let containerHeight = container.getBoundingClientRect().height;
            const elTop = $(el).offset().top;
            const containerTop = $(container).offset().top;
            const elementOffsetFromTop = elTop - containerTop;

            return ( (elementOffsetFromTop >= 0) && (elementOffsetFromTop <= containerHeight) );
        },


        addSimpleScrollbar(chart_container_id, opts) {

            if ($(chart_container_id).parents('.simple-scrollbar-enabled').length > 0) {

                let $outer_container = $(chart_container_id).parents('.chart-grid');

                $(chart_container_id).parents('.simple-scrollbar-enabled').toggleClass('auto-hide-scrollbar', opts.autoHide);

                if ($outer_container.find('.ss-content').length < 1) { // limit to a single scrolling panel per chart grid

                    SimpleScrollbar.initEl($outer_container.find('.simple-scrollbar-enabled').get(0));

                    return true;
                }
            }
            return false;
        },


        ellipsizeDOMNodeTextElement(
            text_el = window.required(),
            START_MIDDLE_OR_END = 'MIDDLE',
            ELLIPSIS = '...',
            default_max_width = false,
            padding = 30,
            char_tolerance = 2,
            pixel_precision = 15) {

            this.throwExceptionIfNotTextElement(text_el);

            window.requestAnimationFrame(e => {

                const width = default_max_width || text_el.getAttribute('data-width');
                const full_text_string = text_el.textContent;
                if (width && (pixel_precision > width || padding + pixel_precision > width)) {
                    text_el.textContent = '';
                    text_el.setAttribute('data-fulltext', full_text_string);
                    return;
                }
                const svg_parent_el = this.getNearestParentElementOfType(text_el, 'SVG');
                const svg_parent_width = svg_parent_el
                    ? Number((svg_parent_el.getAttribute('viewBox') || '').split(' ')[2]) - padding
                    : padding * 3;
                const max_width = Math.max(0, width || svg_parent_width);
                let edited_text = full_text_string,
                    text_computed_width = text_el.getComputedTextLength(),
                    chars_count_middle = Math.floor(edited_text.length * 0.5),
                    chars_chopped = 0,
                    chars_to_chop = Math.min(
                        Math.round(chars_count_middle * 0.75), 
                        Math.max(1, Math.round((text_computed_width + padding - max_width) / pixel_precision))
                    ),
                    max_iterations = Math.floor((text_computed_width - max_width) / pixel_precision);

                while (max_iterations > 0 
                    && edited_text.length > 0
                    && (text_computed_width + padding - max_width) > pixel_precision) {

                    edited_text = window.akdv.utils_string.ellipsizeText(edited_text, START_MIDDLE_OR_END, '', undefined, chars_count_middle, chars_to_chop);
                    text_el.textContent = edited_text;
                    text_computed_width = text_el.getComputedTextLength();
                    chars_chopped += chars_to_chop;
                    max_iterations--;

                    if (max_iterations <= 0 || text_computed_width <= max_width) {
                        max_iterations = 0;
                        if (chars_chopped > char_tolerance) {
                            edited_text = window.akdv.utils_string.ellipsizeText(edited_text, START_MIDDLE_OR_END, ELLIPSIS);
                            text_el.textContent = edited_text;
                            text_el.setAttribute('data-fulltext', full_text_string);
                        } else {
                            text_el.textContent = full_text_string;
                        }
                    } else {
                        chars_count_middle = Math.floor(edited_text.length * 0.5);
                        chars_to_chop = Math.min(Math.round(chars_count_middle * 0.75), Math.max(1, Math.round((text_computed_width + padding - max_width) / pixel_precision)));
                    }
                }
                
            });
        },


        ellipsizeListOfDOMNodeTextElements(
            dom_nodes_list = window.required(),
            START_MIDDLE_OR_END = false,
            ELLIPSIS = '...',
            default_max_width = false,
            padding = false,
            char_tolerance = false,
            pixel_precision = false) {

            const args = Array.from(arguments).slice(1);

            for (const el of dom_nodes_list) {

                this.ellipsizeDOMNodeTextElement(el, ...args);
            }
        },


        moveToFrontListOfDOMNodeElements(el_array = window.required()) {

            this.throwExceptionIfNotIterableListOfDOMNodeElements(el_array);

            Array.from(el_array).forEach(el => el.parentNode.appendChild(el));
        }

    };


})(window, document, window.jQuery, window.SimpleScrollbar, window.akdv.utils_event, window.akdv.utils_string);