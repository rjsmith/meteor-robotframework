## meteor-robotframework

This [Meteor Framework](https://www.meteor.com/) package enables you to use the [Robot Framework](http://robotframework.org) acceptance testing platform to write end-to-end tests for your Meteor applications, using the Velocity framework.

Key features:
* Write application-level end-to-end UI tests (see "Test Mode #1" on Sam Hatoum's [THE 7 TESTING MODES OF METEOR](http://www.meteortesting.com/blog/e72fe/the-7-testing-modes-of-meteor) blog post)
* Write your tests using any combination of [data-driven](http://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#data-driven-style), tabular, [keyword-driven](http://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#keyword-driven-style), or [Behaviour Driven Development](http://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#behavior-driven-style) ("Gherkin", Given-When-Then) styles.
* Report Robot Framework test execution results using Velocity, including any logged test execution errors (as Velocity 'Logs' entries)
* Auto-trigger test execution when application or test files change
* This package includes some sample tests that be added to your application.
* Use Robot Framework's [Selenium2Library](https://github.com/rtomac/robotframework-selenium2library) to write complex UI tests of Meteor applications without a line of javascript!
* Extend the reach of your Meteor tests by harnessing the power of [Robot Framework test libraries](http://robotframework.org/#test-libraries), or [write your own](http://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#creating-test-libraries) (in Python)

This package works by spawning a child process which executes Robot Framework's `pybot` script, acting on the tests contained in the `tests\robotframework\suites` folder in your Meteor application.  The generated `output.xml` file is then parsed by this package and reported back to Velocity framework.

### Installation

To run your tests using this package on a given machine, you must first install [Python](https://github.com/robotframework/robotframework/blob/master/INSTALL.rst#python-installation), [Robot Framework](https://github.com/robotframework/robotframework/blob/master/INSTALL.rst#installing-robot-framework) and additional test libraries (such as [Selenium2Library](https://github.com/rtomac/robotframework-selenium2library#installation) or [PhantomRobot](https://github.com/datakurre/phantomrobot)). 

You must also ensure you have installed the [appropriate browser driver software](http://docs.seleniumhq.org/docs/03_webdriver.jsp#selenium-webdriver-s-drivers) that Selenium2Library uses to automate the UI of your application.

You can install this package using Meteor's package management system:

```bash
meteor add rsbatech:robotframework
```

### Basic Usage

Add Robot Framework test and resource files under the `tests/robotframework/suites' folder in your Meteor application.

#### arguments.txt

Robot Framework supports a [long list of command line options](http://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#using-command-line-options).  For example, the `--include` option ensures that only tests with given tag strings will be executed.The rsbatech:robotframework package will use any command line options specified in the `tests\robotframework\arguments.txt` file, if it exists.

#### Using Selenium2Library

Import Robot Framework's Selenium2Library into your test files to provide a [comprehensive set of keywords](http://rtomac.github.io/robotframework-selenium2library/doc/Selenium2Library.html) to drive the UI of your Meteor application.

Example `test.txt` file:

```RobotFramework
*** Settings ***
Documentation  Example Robot Framework plain text format test file using Selenium2Library
Resource       resources.txt

*** Variables ***
${TITLE}  test

*** Test Cases ***
Test Home Page Can Open (Plain Text)
  Open Browser To Home Page
  Home Page Should Be Open  ${TITLE}
  [Teardown]  Close Browser
```

Example `resources.txt` file:

```RobotFramework
*** Settings ***
Documentation  Common Web - testing resource user keywords
Library        Selenium2Library

*** Variables ***
# ${MIRROR_URL} is set by rsbatech:robotframework and should not
# be overidden in your tests!

${BROWSER}       PhantomJS
${DELAY}         0
${HOME URL}      ${MIRROR_URL}

*** Keywords ***
Open Browser To Home Page
    Open Browser    ${HOME URL}    ${BROWSER}
    Maximize Browser Window
    Set Selenium Speed    ${DELAY}

Home Page Should Be Open
    [Arguments]  ${_title}
    Title Should Be    ${_title}

```

#### ${MIRROR_URL}

You must use the provided `${MIRROR_URL}` variable as the root URL for instances of the `Open Browser` keyword in your tests.  This ensures your test executes against a [separate mirror instance](https://github.com/meteor-velocity/node-soft-mirror) of your application and database.

#### Report.html

Everytime the Robot Framework tests run against your application, you will see this in the Meteor console log:

```bash
[rsbatech:robotframework] Robot Framework is running
[rsbatech:robotframework] 3 failed critical tests
[rsbatech:robotframework] Test report: /Users/frodo/Projects/meteor-test/rftest/tests/robotframework/.logs/report.html
[rsbatech:robotframework] Completed
```

You can paste the test report path into a browser session to view the full Robot Framework - generated test report file.

#### RF_DEBUG

Run your meteor application with the RF_DEBUG environment variable to view Robot Framework console log output during test execution:

```bash
RF_DEBUG=1 meteor
```

### Advanced

You could try adding [this Robot Framework library](https://github.com/iPlantCollaborativeOpenSource/Robotframework-MongoDB-Library) for working with MongoDB databases.  This would let you write tests that interacted with the UI of your Meteor application, but could also access the application's MongoDB database at the same time.  Use cases for this could include setting up and tearing down test data, and asserting that expected inserts and updates have been made to specific collections.

It should also be possible to wrap one of the [Python-based DDP clients](http://meteorpedia.com/read/DDP_Clients#Python) in a Robot Framework library, which would also let you write Robot Framework tests against the DDP API of your application(e.g. Meteor methods).

You can execute the Robot Framework test suites contained in your application repository yourself, by using one of [Robot Framework's start scripts](http://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#starting-test-execution).  Or use them as part of a Continuous Integration workflow.

### Acknowledgements

This package is based on the implementation of the [meteor-cucumber](https://github.com/xolvio/meteor-cucumber) package.

This package uses the NPM module [xml-stream](https://github.com/assistunion/xml-stream) to efficiently parse the `output.xml` file generated by Robot Framework.

### License

This package is (c) RSBATechnology Ltd 2015, and is released under the MIT License (see LICENSE).