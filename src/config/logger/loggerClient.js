const { loggerInit } = require('./loggerInit');
const path = require('path');

const outputPath = path.join(process.env.PATH_LOG_DIR, 'app.log');

const logger = loggerInit({
    outputPath: outputPath, 
    show_logs_console: true
});

module.exports = logger;
