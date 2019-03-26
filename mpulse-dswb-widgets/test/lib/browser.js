'use strict';

import Nightmare from 'nightmare';

const config = require('../../package.json').nightmare;

module.exports = new Nightmare(config).viewport(1624, 1020).on('console', (type, message, errorStack) => {
    if (config.show_console_logging && message && typeof message === 'string') {
        console[type](`    - ${type} - ${message.replace('%c', '')}`, errorStack || '');
    }
});