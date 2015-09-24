## 0.5.0 - 2015-09-24
- [fix] Compatibility with Meteor 1.2 (see https://github.com/rjsmith/meteor-robotframework/issues/16)

## 0.4.1 - 2015-05-25
- [fix] Serve screenshot images in robot framework output files (see https://github.com/rjsmith/meteor-robotframework/issues/11)

## 0.4.0 - 2015-04-27
- [feature] Provide direct link to RF report.html at http://localhost:3000/robotframework/report.html
- [fix] Prevent RF tests runing twice on Meteor startup (see: https://github.com/rjsmith/meteor-robotframework/issues/10)

## 0.3.0 - 2015-04-14
- [feature] Compatible with Velocity Core 0.6.0
- [README] Added info on use of RF test file extensions

## 0.2.0 - 2015-01-30

- [fix] Removed internal call to Module._cache
- [fix] Use rimraf to delete contents of `.log` working folder prior to executing tests
- [README] Added link to initial Youtube screencast
- [README] Added revised guidance on using Selenium web drivers with meteor-robotframework
- [feature] Added automatic npm dependency on phantomjs
- [feature] Update dependency on latest html-reporter package to ensure velocity button is hidden if app is running in a mirror

## 0.1.0 - 2015-01-14

- [release] First commit
