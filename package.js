(function() {

  'use strict';

  Package.describe({
    name: 'rsbatech:robotframework',
    summary: 'Robot Framework for Meteor Velocity',
    version: '0.3.0-rc.1',
    git: 'https://github.com/rjsmith/meteor-robotframework',
    debugOnly: true
  });

  Npm.depends({
    // https://github.com/assistunion/xml-stream
    'xml-stream': '0.4.5',
    // https://github.com/isaacs/rimraf
    'rimraf': '2.2.8',
    'phantomjs': '1.9.13',
    'chromedriver': '2.13.0'
  })

  Package.onUse(function(api) {
    api.use([
      'velocity:core@0.6.0-rc.5',
      'velocity:shim@0.0.3',
      'underscore@1.0.2', 
      'momentjs:moment@2.10.0'
      ], ['server' , 'client']);

    api.use([
        'velocity:html-reporter@0.4.2'
      ], 'client');

    api.addFiles([
      'sample-tests/suites/resources.txt', 
      'sample-tests/suites/test-txt.txt',
      'sample-tests/suites/test-tsv.tsv',
      'sample-tests/suites/test-html.xhtml',
      'sample-tests/arguments.txt'
      ], 'server', {isAsset: true});

    api.addFiles(['server.js'], 'server');

    api.export('robotframework', 'server');
    
  });


})();
