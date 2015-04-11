/**
 * Executes python - based Robot Framework executable and
 * parses generated output.xml file into a Velocity test results.
 *
 * The main code blocks and velocity - specific code were taken from:
 * https://github.com/xolvio/meteor-cucumber
 */
/* jshint -W030 */

/* jshint -W020 */
robotframework = {};
RF_DEBUG = !!process.env.RF_DEBUG;
/* jshint +W020 */

(function () {

  'use strict';

  if (process.env.NODE_ENV !== 'development' ||
    process.env.IS_MIRROR || process.env.VELOCITY==='0') {
    return;
  }

  // Initialise execution variables
  var path = Npm.require('path'),
      fs = Npm.require('fs'),
      XmlStream = Npm.require('xml-stream'),
      Rimraf = Npm.require('rimraf'),
      PhantomJS = Npm.require('phantomjs'),
      phantomJSBinPath = PhantomJS.path,
      ChromeDriver = Npm.require('chromedriver'),
      chromeDriverBinPath = ChromeDriver.path,
      FRAMEWORK_NAME = 'robotframework',
      FRAMEWORK_REGEX = FRAMEWORK_NAME + '/.+\\.(txt|robot|xhtml|htm|html|tsv)$',
      testSuitesRelativePath = path.join(FRAMEWORK_NAME, 'suites'),
      outputDirRelativePath = path.join(FRAMEWORK_NAME, '.logs'),
      argumentsFileRelativePath = path.join(FRAMEWORK_NAME, 'arguments.txt'),
      testsSuitesPath = path.join(Velocity.getTestsPath(), testSuitesRelativePath),
      outputDirPath = path.join(Velocity.getTestsPath(), outputDirRelativePath),
      outputXMLPath = path.join(outputDirPath, 'output.xml'),
      reportHTMLPath = path.join(outputDirPath, 'report.html'),
      argumentsFilePath = path.join(Velocity.getTestsPath(), argumentsFileRelativePath),
      argumentsFileExists = fs.existsSync(argumentsFilePath);

  // Register with Velocity Framework
  if (Velocity && Velocity.registerTestingFramework) {
    Velocity.registerTestingFramework(FRAMEWORK_NAME, {
      regex: FRAMEWORK_REGEX,
      sampleTestGenerator: _getSampleTestFiles
    });
  }

  // Give up if no tests folder
  if (!fs.existsSync(testsSuitesPath)) {
    return;
  }
    
  /**
   * Obtains Velocity sample-test files
   */
  function _getSampleTestFiles () {
    return [{
      path: path.join(testSuitesRelativePath, 'test-txt.txt'),
      contents: Assets.getText(path.join('sample-tests', 'suites', 'test-txt.txt'))
    }, {
      path: path.join(testSuitesRelativePath, 'test-tsv.tsv'),
      contents: Assets.getText(path.join('sample-tests', 'suites', 'test-tsv.tsv'))
    }, {
      path: path.join(testSuitesRelativePath, 'test-html.xhtml'),
      contents: Assets.getText(path.join('sample-tests', 'suites', 'test-html.xhtml'))
    }, {
      path: path.join(testSuitesRelativePath, 'resources.txt'),
      contents: Assets.getText(path.join('sample-tests', 'suites', 'resources.txt'))
    }, {
      path: path.join(FRAMEWORK_NAME, 'arguments.txt'),
      contents: Assets.getText(path.join('sample-tests', 'arguments.txt'))      
    }];
  }

  // Set up Meteor Velocity reactive callbacks
  Meteor.startup(function () {
    Meteor.call('velocity/mirrors/request', {
      framework: FRAMEWORK_NAME,
      testsPath: path.join(FRAMEWORK_NAME, 'fixtures'),
    });
    var init = function (mirror) {
      robotframework.mirror = mirror;
      VelocityTestFiles.find({targetFramework: FRAMEWORK_NAME}).observe({
        added: _.debounce(Meteor.bindEnvironment(_rerunRobotFramework), 300),
        removed: _.debounce(Meteor.bindEnvironment(_rerunRobotFramework), 300),
        changed: _.debounce(Meteor.bindEnvironment(_rerunRobotFramework), 300)
      });
    };
    VelocityMirrors.find({framework: FRAMEWORK_NAME, state: 'ready'}).observe({
      added: init,
      changed: init
    });
  });
 
  function _rerunRobotFramework () {

    console.log('[rsbatech:robotframework] Robot Framework is running');

    if (RF_DEBUG) {
      console.log('[rsbatech:robotframework] PhantomJS BinPath:' + phantomJSBinPath);
      console.log('[rsbatech:robotframework] ChromeDriver BinPath:' + chromeDriverBinPath); 
    }

    // Run External robot framework command
    // From: http://stackoverflow.com/a/16099450
    var spawn = Npm.require('child_process').spawn;
 
    // Delete .logs folder from previous test run
    Rimraf.sync(outputDirPath);

    // Spawn child process to execute pybot robot framework command line
    var prc = spawn('pybot',  _getExecOptions());

    // Print Robot Framework stdout console output
    if (RF_DEBUG) {
      prc.stdout.setEncoding('utf8');
      prc.stdout.on('data', function (data) {
          var str = data.toString();
          var lines = str.split(/(\r?\n)/g);
          RF_DEBUG && console.log(lines.join(''));
      });      
    }

    prc.on('close', Meteor.bindEnvironment(function robotframeworkFinished(code) {
        RF_DEBUG && console.log('process exit code ' + code);

        // Now process generated output.xml file if process completed OK
        if (code >= 0) {

          console.log('[rsbatech:robotframework] ' + _reportReturnStatus(code));

          // Reset Velocity test execution report
          Meteor.call('velocity/reports/reset', {framework: FRAMEWORK_NAME}, function () {
            // Generate new Velocity report entries
            _processOutputXMLFile();

            if (fs.existsSync(reportHTMLPath)) {
              console.log('[rsbatech:robotframework] Test report: ' + reportHTMLPath);
            }

            // Inform Velocity that Robot Framework is done.
            Meteor.call('velocity/reports/completed', {framework: FRAMEWORK_NAME}, function () {
              console.log('[rsbatech:robotframework] Completed');
            });
          });
        }

    }));

  }

  /**
   * Gives nice summary of robot framework test execution result code.
   *
   * See:
   * http://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#return-codes
   */
  function _reportReturnStatus(code) {
    var resultInfo;
    if (code === 0) {
      // NB: This may not be true if --NoStatusRC command line option is set
      resultInfo = 'All critical tests passed';
    } else if (code <= 249) {
      resultInfo = code + ' failed critical tests';
    } else if (code === 250) {
      resultInfo = 'At least 250 failed critical tests';
    } else if (code === 251) {
      resultInfo = 'Help or version information printed';
    } else if (code === 252) {
      resultInfo = 'Invalid test data or command line options';
    } else if (code === 253) {
      resultInfo = 'Test execution stopped by user';
    } else if (code === 255) {
      resultInfo = 'Unexpected internal error';
    } else {
      resultInfo = 'Unknown result code:' + code;
    }
    return resultInfo;
  }

  function _getExecOptions() {
    var execOptions = [];
    // Include any default parameters which can be overridden in argument file
    // execOptions.push('--variable');
    // execOptions.push('BROWSER:PhantomJS');  // Use PhantomJS webdriver

    // Include argument file, if present at: tests/robotframework/arguments.txt
    if (argumentsFileExists) {
      execOptions.push('--argumentfile');
      execOptions.push(argumentsFilePath);
    }

    // Include any parameters that must override any set in the arguments file
    execOptions.push('--outputdir');
    execOptions.push(outputDirPath);
    execOptions.push('--variable');
    execOptions.push('MIRROR_URL:'+robotframework.mirror.rootUrl);
    execOptions.push('--variable');
    execOptions.push('PHANTOMJS_BINPATH:'+phantomJSBinPath);
    execOptions.push('--variable');
    execOptions.push('CHROMEDRIVER_BINPATH:'+chromeDriverBinPath);

    // Specify test suites root directory
    execOptions.push(testsSuitesPath);

    RF_DEBUG && console.log(execOptions);

    return execOptions;
  }

  /**
   * Processes RF output.xml into series of calls to Velocity submit method
   */
  function _processOutputXMLFile() {

    // Check if output.xml file exists
    if (fs.existsSync(outputXMLPath)) {
      // Process contents
      RF_DEBUG && console.log('[rsbatech:robotframework] Starting to parse output.xml file located at:'+outputXMLPath);

      var stream = fs.createReadStream(outputXMLPath),
          xml    = new XmlStream(stream),
          suites = {};

      xml.on('startElement: suite', Meteor.bindEnvironment( function processSuite(suiteNode) {
        if (suiteNode.$.id) { // Exclude <suite> node in <statistics> sections
          suites[suiteNode.$.id] = suiteNode.$.name;
        }
      }));

      xml.collect('kw'); // Store individual keywords in an array
      xml.collect('arg'); // Store individual keyword arguments in an array
      xml.on('updateElement: test', Meteor.bindEnvironment( function processTestElement(testNode) {

        var report = {
          id: testNode.$.id,
          name: testNode.$.name,
          framework: FRAMEWORK_NAME,
          result: (testNode.status && testNode.status.$.status === 'PASS') ? 'passed' : 'failed',
          duration: _calculateTestDuration(testNode.status.$.starttime, testNode.status.$.endtime),
          timestamp: moment(testNode.status.$.starttime, 'YYYYMMDD HH:mm:ss.SSS').toDate()
        };

        report.ancestors = _calculateTestAncestors(testNode.$.id, suites);

        // If test failed, provide more information on what went wrong
        if (report.result === 'failed') {
          report.failureType = 'AssertionError';

          // Find keyword that failed
          _.each(testNode.kw, Meteor.bindEnvironment(function(element) {
            var args = '';
            if (element.status && element.status.$.status === 'FAIL') {

              // List keyword arguments, if any
              if (element.arguments && element.arguments.arg) {
                for (var i = 0; i < element.arguments.arg.length; i++ ) {
                  args = args.concat('  ', element.arguments.arg[i]);
                }
              }

              report.failureMessage = 'Keyword: ' + element.$.name + args + '\n ';
            }
          }));

          report.failureMessage = report.failureMessage || '';
          report.failureMessage = report.failureMessage.concat('>>>', testNode.status.$text);
        }

        // Submit test results report to Velocity
        Meteor.call('velocity/reports/submit', report);

      }));

      // report test ERRORs
      xml.on('updateElement: errors msg', Meteor.bindEnvironment(function processErrors(msgNode) {
        RF_DEBUG && console.log('ERROR msg text:' + msgNode.$text);
        var options = {
          framework: FRAMEWORK_NAME,
          message: msgNode.$text
        };
        if (msgNode.$.level) {
          options.level = msgNode.$.level;
        }
        if (msgNode.$.timestamp) {
          options.timestamp = moment(msgNode.$.timestamp, 'YYYYMMDD HH:mm:ss.SSS').toDate();
        }

        Meteor.call('velocity/logs/submit', options);
      }));

      xml.on('end', Meteor.bindEnvironment(function end() {
        RF_DEBUG && console.log('[rsbatech:robotframework] Completed parsing output.xml file');
      }));
 
    } else {
     console.log('[rsbatech:robotframework] ERROR: output.xml file missing at:'+outputXMLPath);
 
    }
  }

  /**
   * Determines ancestor array value for a given test
   */
  function _calculateTestAncestors(testId, suites) {
    var ancestorNames = [];

    // Test ids are on form similar to 's1-s1-t1' (highest level to lowest - level)
    // Where 's' = suite, 't' = test
    // and number is index of suite/text relative to its parent suite.
    
    // Split test id into list of ancestor suite ids
    var _ancestorIds = testId.split('-');
    _ancestorIds.pop(); // Remove last id, which will be the id of the current suite or test
    _.each(_ancestorIds, Meteor.bindEnvironment( function (id, index) {
      // get full id of suite by collecting all ids up to this one
      var _ancestorId = _.reduce(
        _ancestorIds.slice(0, index + 1), 
        Meteor.bindEnvironment(function reducing(_ancestorId, id, index) {
          if (index === 0) {
             return id;
          } else {
            return _ancestorId + '-' + id;
          }
        }),
        '');
     var _ancestorName = suites[_ancestorId];
      if (_ancestorName) {
        ancestorNames.push(_ancestorName);      
      }
    }));
    return ancestorNames.reverse(); // Velocity ancestor array is sorted by lowest level to highest level

  }

  /**
   * Calculates test duration
   * @param  {String} starttime Format: YYYYMMDD hh:mm:ss.mmm
   * @param  {String} endtime   Format: YYYYMMDD hh:mm:ss.mmm
   * @return {String}           milliseconds between starttime and endtime
   */
  function _calculateTestDuration(starttime, endtime) {
    if (starttime && endtime) {
      var start = moment(starttime, 'YYYYMMDD HH:mm:ss.SSS');
      var end   = moment(endtime,   'YYYYMMDD HH:mm:ss.SSS');
      return (start.isValid() && end.isValid()) ? end.diff(start) : null;
    }
  }

})();