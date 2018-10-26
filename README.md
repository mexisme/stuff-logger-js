# Stuff Logger.js

## Intro

In an effort to help us standardise how we do logging,
this NPM was created.

It is mostly just a "configurator" for Bunyan, so that we get
good-quality output when in a Terminal or logging to ELK,
but it also attempts to "abstract" the implementation from the
usage, so that we can add features like Sentry or direct-to-ELK
without needing the app's to be updated for this new behaviour,
beyond some additional config settings.

One of the hopefully beneficial additional abilities in the initial
version is to allow the NPM Debug module's ability to "filter"
logging based on a pattern, to try to reduce any debugging noise
down to just what you need.

## Usage

It should be fairly simple:

At the "App" level:
```
const Logger = require('stuff-logger');
Logger.init({
  appName: "The Application",
  level: "The default Logging Level"
};
```

In a sub-package / file:
```
const Logger = require('stuff-logger');
const log = Logger.createLogger({
  name: "Package name",
  level: "Optional Package logging level"
};

log.info("something loggable");
```

## Log Levels 

We are using standard bunyan log levels which are numbers, please refer to :
https://github.com/trentm/node-bunyan#level-suggestions
 
## Future ideas

The plan is to make these features more pluggable:

- Capture Express.js logging in middleware
- Capture Express.js "x-stuff-debug: on" headers to dynamically enable debug mode
- Forward logs via an internal API from the Browser to the Express.js server (a la Angular2's log forwarder)
- Inject Sentry config for error-capturing, incl. capturing released version
- Friendly-format the output using `bunyan-format` (incl. colour)
- Send logs directly to ELK
