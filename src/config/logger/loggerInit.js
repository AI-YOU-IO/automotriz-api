const winston = require('winston');

const customTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  return `${day}-${month}-${year} / ${hour}:${minute}:${second}`;
};

const loggerInit = ({outputPath, show_logs_console = true} = {}) => {
  
  const transports = [
    new winston.transports.File({ filename: `${ outputPath?? 'app.log'}` })
  ];

  if(show_logs_console){
    transports.push(new winston.transports.Console({format: winston.format.simple()}));
  }

  const level = 'info'; 

  return winston.createLogger({
    level: level, 
    format: winston.format.combine(
      winston.format.timestamp({ format: customTimestamp }), 
      winston.format.json()
    ),
    transports: transports
  });
}


module.exports = { loggerInit };
