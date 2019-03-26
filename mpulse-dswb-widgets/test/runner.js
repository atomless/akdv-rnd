/* jshint ignore:start */

const isPortReachable = require('is-port-reachable');
const { spawn } = require('child_process');
const isProductionRunning = async () => isPortReachable(3001, { host: 'localhost' });
const sleep = period_milliseconds => new Promise((resolve, reject) => setTimeout(e => resolve(), period_milliseconds));

const COLOR_YELLOW = '\x1b[33m';
const COLOR_GREEN = '\x1b[32m';
const COLOR_RESET = '\x1b[0m';
const tests = ['test/unit/*.js', 'test/func/*.js', 'test/perf/*.js'];
const re = /\d*\stests\sfailed/;

let production_was_running = false;
let test_fail = false;
let server = false;


console.log(`\n    ${COLOR_YELLOW}==================================================================`);
console.log(`    AKDV : AUTOMATED TEST RUNNER`);
console.log(`    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^${COLOR_RESET}\n`);

console.log(`  ${COLOR_GREEN}*${COLOR_RESET} SETUP START`);


const runAllTests = async () => {

    let production_is_running = false;

    while (!production_is_running) {
        production_is_running = await isProductionRunning();
        if (!production_is_running) { await sleep(100); }
    };

    console.log(`  ${COLOR_GREEN}✔${COLOR_RESET} SETUP COMPLETE`);

    const test = spawn('ava', ['-s -v -c 1', ...tests], { stdio: 'inherit' });

    test.on('exit', fail => {
        if (!production_was_running) { server.kill(); }
        console.log(`  ${COLOR_GREEN}✔${COLOR_RESET} ALL TESTS DONE`);
        process.exit(fail)
    });
};


isProductionRunning().then(reachable => {

    if (!reachable) {
        console.log(`  ${COLOR_GREEN}*${COLOR_RESET} STARTING PRODUCTION SERVER.`);
        server = spawn('npm', ['run', 'devpro']);
    } else {
        console.log(`  ${COLOR_GREEN}✔${COLOR_RESET} PRODUCTION SERVER ALREADY RUNNING.`);
        production_was_running = true;
    }

    runAllTests();
});






