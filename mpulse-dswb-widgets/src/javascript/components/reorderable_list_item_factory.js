;((window, document, customNumberInputFactory) => {

    'use strict';

    const DEFAULT_CLASS = 'reorderable-list-item';

    window.reorderableListItemFactory = ({
            // options - required
            item_name = window.required(),
            item_label = window.required(),
            index = window.required(),
            index_max = window.required(),
            immovable = false,
            up_disabled = false,
            down_disabled = false,
            // options - with defaults
            index_min = 0,
            // item_class_list supports a single string or an array of one or more strings.
            // No type checking required!
            item_class_list = [] 
        } = {}) => {

        const reorderable_dd = document.createElement('dd');

        reorderable_dd.classList.add(...[DEFAULT_CLASS, ...item_class_list]);
        reorderable_dd.setAttribute('data-name', item_name);
        reorderable_dd.setAttribute('data-current', index === index_min);
        reorderable_dd.setAttribute('data-first', index === index_min);
        reorderable_dd.setAttribute('data-last', index === index_max);
        reorderable_dd.setAttribute('data-up-disabled', up_disabled);
        reorderable_dd.setAttribute('data-down-disabled', down_disabled);
        reorderable_dd.setAttribute('data-disabled', immovable);
        reorderable_dd.setAttribute('style', `order:${index}`);
        customNumberInputFactory({ 
            container_el: reorderable_dd,
            label_text: item_label, 
            default_value: index, 
            max: index_max, 
            min: index_min,
            down_button_text: immovable || down_disabled? '·' : '<',
            up_button_text: immovable || up_disabled? '·' : '>'
        });

        return reorderable_dd;
    };

})(window, document, window.customNumberInputFactory);