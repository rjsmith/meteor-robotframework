(function() {

  'use strict';

  Package.describe({
    name: 'rsbatech:robotframework',
    summary: 'Robot Framework for Meteor Velocity',
    version: '0.5.0',
    git: 'https://github.com/rjsmith/meteor-robotframework',
    documentation: 'README.md',
    debugOnly: true
  });

  Npm.depends({
    // https://github.com/assistunion/xml-stream
    'xml-stream': '0.4.5',
    // https://github.com/isaacs/rimraf
    'rimraf': '2.3.2',
    'phantomjs': '1.9.16',
    'chromedriver': '2.15.0',
    'connect': '2.9.0'
  })

  Package.onUse(function(api) {
    api.versionsFrom('METEOR@1.2.0.1')

    api.use([
      'velocity:core@0.10.0',
      'velocity:shim@0.1.0',
      'underscore@1.0.2', 
      'momentjs:moment@2.10.0'
      ], ['server' , 'client']);

    api.use([
      'velocity:html-reporter@0.9.0',
      ], 'client');

    api.use([
      'webapp',
      ], ['server']);

    api.addAssets([
      'sample-tests/suites/resources.txt', 
      'sample-tests/suites/test-txt.txt',
      'sample-tests/suites/test-tsv.tsv',
      'sample-tests/suites/test-html.xhtml',
      'sample-tests/arguments.txt'
      ], 'server');

    api.addFiles(['server.js'], 'server');

    api.export('robotframework', 'server');
    
  });


})();
