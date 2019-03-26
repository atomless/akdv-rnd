;((window) => {

    'use strict';
    
    const filterObjByKeyArray = (node, as) => as.reduce((obj, key) => (node.hasOwnProperty(key) && (obj[key] = node[key]) && obj) || obj, {});
    const extractChildren = (node, nest_key) => node && node[nest_key] || [];            
    const flatten_hierarchy = (node, nest_key, as) => {

        const children = extractChildren(node, nest_key);
        return children.length ? [].concat.apply(
            [], 
            children.map(node => flatten_hierarchy(node, nest_key, as))
        ) : [filterObjByKeyArray(node, as)];
    };

    const reverse = array => array.reverse();
    

    window.vega_expressions = {
        flatten_hierarchy,
        reverse
    };

})(window);