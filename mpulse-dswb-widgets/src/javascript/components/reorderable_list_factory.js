;((window, document, reorderableListItemFactory, event_utils, string_utils, lang_utils, dom_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'reorderable-list';

    window.reorderableListFactory = ({
            container_el = window.required(),
            uuid = string_utils.generateUUID(),
            item_names_array = window.required(),
            item_labels_array = window.required(),
            immovable_item_names = [],
            event_namespace_for_order_change = false,
            class_list = [], // supports string or array
            title = false,
            // defaults - optional for list items
            item_class_list = [],
            index_min = 1,
            index_max = false,
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        let list, dt, immovable_indices = item_names_array.reduce((arr, d, i) => { if (immovable_item_names.includes(d)) { arr.push(i); } return arr; }, []);


        const getCurrentListPropertyOrderArray = () => Array.from(list.querySelectorAll('dd'))
            .sort((a, b) => window.getComputedStyle(a).order - window.getComputedStyle(b).order)
            .map((item) => item.getAttribute('data-name'));


        const updateImmovableIndices = () => {

            let item_names = getCurrentListPropertyOrderArray();

            return item_names.reduce((arr, d, i) => { if (immovable_item_names.includes(d)) { arr.push(i); } return arr; }, []);
        };


        const updateImmovableItems = () => {

            updateImmovableIndices();

            Array.from(list.querySelectorAll('dd[data-name]'))
                .sort((a, b) => window.getComputedStyle(a).order - window.getComputedStyle(b).order)
                .forEach((item, i) => {

                let name = item.getAttribute('data-name');
                let step_up_button = item.querySelector('.step-up');
                let step_down_button = item.querySelector('.step-down');
                let immovable = immovable_indices.includes(i);
                let up_disabled = immovable_indices.includes(i + 1);
                let down_disabled = immovable_indices.includes(i - 1);

                item.setAttribute('data-disabled', immovable);
                item.setAttribute('data-up-disabled', up_disabled);
                item.setAttribute('data-down-disabled', down_disabled);

                step_up_button.innerHTML = immovable || up_disabled? '·' : '>';
                step_down_button.innerHTML = immovable || down_disabled? '·' : '<';
            });
        };


        const getValidOrderNumber = (num, default_num) => Math.max(index_min, Math.min(index_max, isNaN(num)? default_num : num));


        const setCurrentItemTo = (index = index_min) => {

            Array.from(list.querySelectorAll('[data-current="true"]')).forEach(el => el.setAttribute('data-current', false));
            
            let current_item = list.querySelector(`[style="order:${getValidOrderNumber(index, index_min)}"]`);

            if (current_item) {
                current_item.setAttribute('data-current', true);
            }
        };


        const getCurrentItemIndex = () => {

            let index = 0;

            Array.from(list.querySelectorAll('dd'))
                .sort((a, b) => window.getComputedStyle(a).order - window.getComputedStyle(b).order)
                .forEach((el, i) => { 
                    if (el.getAttribute('data-current') === 'true') {
                        index = i;
                    }
                });

            return index;
        };


        const getCurrentItemName = () => list.querySelector('dd[data-current="true"]').getAttribute('data-name');


        const setItemOrderTo = (item_el, input_el, number) => {

            item_el.setAttribute('style', `order:${number}`);
            item_el.setAttribute('data-first', number === index_min);
            item_el.setAttribute('data-last', number === index_max);
            input_el.value = number;
            input_el.defaultValue = number;
        };

        
        const onOrderNumberChangeHandler = (e, n) => {

            let input_el = e.target;
            let item_changed = input_el.parentElement.parentElement;
            let old_order_number = Number(input_el.defaultValue);
            let new_order_number = getValidOrderNumber(input_el.valueAsNumber, old_order_number);
            let item_at_matching_order = e.currentTarget.querySelector(`[style="order:${new_order_number}"]`);
            let input_el_at_matching_order = item_at_matching_order.querySelector('input');

            // setting the changed input also covers the situation where it's necessary to reset invalid input
            setItemOrderTo(item_changed, input_el, new_order_number);
            if (new_order_number === old_order_number) { return false; }
            setItemOrderTo(item_at_matching_order, input_el_at_matching_order, old_order_number);
            setCurrentItemTo(index_min);
            updateImmovableItems();
            input_el.blur();

            window.setTimeout(e => {
                event_utils.dispatchCustomEvent(window, 'order-change', event_namespace_for_order_change, [getCurrentListPropertyOrderArray()]);
            }, 20);
        };


        const clear = () => {

            if (list) {
                event_utils.off(list, 'change', 'akdv', onOrderNumberChangeHandler);
                container_el.removeChild(list);
            }
        };


        const populate = () => {

            clear();
            list = document.createElement('dl');
            dt = document.createElement('dt');
            index_max = index_max || item_names_array.length;
            dt.textContent = title + ' :';
            list.setAttribute('id', `${DEFAULT_CLASS}-${uuid}`);
            list.appendChild(dt).classList.add((title)? 'reorderable-list-title' : 'hidden');
            list.classList.add(...[DEFAULT_CLASS, ...class_list]);
            list.setAttribute('style', 'display:flex');
            item_names_array.forEach((item_name, i) => {
                list.appendChild(reorderableListItemFactory({
                    index_min,
                    item_name,
                    index_max,
                    item_class_list,
                    item_label: item_labels_array[i],
                    up_disabled: immovable_indices.includes(i + 1),
                    down_disabled: immovable_indices.includes(i - 1),
                    immovable: immovable_indices.includes(i),
                    index: i + 1
                }));
            });
            container_el.appendChild(list);
            event_utils.on(list, 'change', 'akdv', onOrderNumberChangeHandler);
        };


        populate();


        event_utils.on(window, 'order-item-focus', event_namespace_for_order_change, (e, index) => { setCurrentItemTo(index) });


        return {
            clear,

            getCurrentItemName,

            getCurrentItemIndex,

            update({ items_array = item_names_array } = {}) {

                item_names_array = items_array;
                this.populate();
            },

            get el() { return list; },

            get uuid() { return uuid; }
        };
    };

})(window, document, window.reorderableListItemFactory, 
   window.akdv.utils_event, window.akdv.utils_string, window.akdv.utils_lang, window.akdv.utils_dom);