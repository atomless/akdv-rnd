;((window) => {

    'use strict';

    window.required = (_arg, _type) => { throw new Error(`${_arg || 'Param'}${(_type)? ' of type ' + _type : ''} is required.`) };

})(window);