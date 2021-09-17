const chalk = require('chalk')

const success_message = message => console.log(chalk.blue(message))

const error_message = message => console.log(chalk.red(message))

const warning_message = message => console.log(chalk.magenta(message))

const normal_message = message => console.log(chalk.yellow(message))


module.exports = {
    success_message,
    error_message,
    warning_message,
    normal_message
}