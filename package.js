(function() {

  'use strict';

  Package.describe({
    name: 'rsbatech:robotframework',
    summary: 'Robot Framework for Meteor Velocity',
    version: '0.0.1',
    git: ' /* Fill me in! */ ',
    debugOnly: true
  });

  Npm.depends({
    // https://github.com/assistunion/xml-stream
    'xml-stream': '0.4.5'
  })

  Package.onUse(function(api) {
    api.use([
      'velocity:core@0.4.5',
      'velocity:node-soft-mirror@0.2.5',
      'velocity:shim@0.0.3',
      //'xolvio:webdriver@0.1.3',
      'underscore', 
      'momentjs:moment'
      ], ['server' , 'client']);

    api.use([
        'velocity:html-reporter@0.3.2'
      ], 'client');

    api.addFiles([
      'sample-tests/suites/resources.txt', 
      'sample-tests/suites/test-txt.txt',
      'sample-tests/suites/test-tsv.tsv',
      'sample-tests/suites/test-html.html',
      'sample-tests/arguments.txt'
      ], 'server', {isAsset: true});

    api.addFiles(['server.js'], 'server');

    api.export('robotframework', 'server');
    
  });


})();