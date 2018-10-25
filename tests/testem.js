'use strict';

module.exports = {
  framework: 'mocha',
  src_files: [
    'impl.js',
    'tests.js'
  ],
  browser_args: {
    Chrome: [
      // --no-sandbox is needed when running Chrome inside a container
      process.env.TRAVIS ? '--no-sandbox' : null,
      '--disable-gpu',
      '--headless',
      '--remote-debugging-port=9222',
      '--window-size=1440,900'
    ].filter(Boolean)
  }
};
