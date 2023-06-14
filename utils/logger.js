const fs = require("fs");
const stringify = require("safe-json-stringify");
const winston = require("winston");

const logDir = "logs";
const moment = require("moment-timezone");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logLevel = "debug";
const loglevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};
const logger = winston.createLogger({
  level: logLevel,
  levels: loglevels,
  format: winston.format.combine(
    winston.format.errors({
      stack: true,
    }),
    winston.format.prettyPrint(),
    winston.format.timestamp({
      format: "DD-MM-YYYY hh:mm:ss A",
    }),
    winston.format.json(),
    winston.format.printf((info) => {
      const { timestamp, level, message, ...args } = info;
      return `${timestamp} ${level}: ${message} ${
        Object.keys(args).length ? stringify(args, null, 2) : ""
      }`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: `${logDir}/api/${moment()
        .format("DDMMMYYYY")
        .toLocaleUpperCase()}.log`,
      handleExceptions: true,
      humanReadableUnhandledException: true,
      prettyPrint: true,
      json: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: `${logDir}/exceptions/${moment()
        .format("DDMMMYYYY")
        .toLocaleUpperCase()}.log`,
      prettyPrint: true,
      humanReadableUnhandledException: true,
      json: true,
    }),
  ],
});

module.exports = logger;