;((window) => {

    'use strict';

    // Usage : window.compose(fnc1, fn2)(arg1, arg2 ...) will execute fn1, fn2 in order
    // passing the result from each function on to the subsequently listed function.
    window.pipe = (fn, ...fns) => (...args) => fns.reduce((acc, f) => f(acc), fn(...args));

    // Usage : window.compose(fnc1, fn2)(arg1, arg2 ...) will execute ... fn2, fn1 in reverse order 
    // passing the result from each function on to the previously listed function.
    window.compose = (...fns) => window.pipe(...fns.reverse());

    // Usage : window.series(fnc1, fn2)(arg1, arg2 ...) will execute each function in order
    // passing the original args to each function.
    window.series = (...fns) => (...args) => fns.map(f => f(...args));


    // window.iterableState = (state_aray) => ({
    //     [Symbol.asyncIterator]: function() {
    //       const iterator = state_aray[Symbol.asyncIterator]()
    //       return {
    //         next: () => iterator.next()
    //       }
    //     }
    //   });

})(window);