const chalk = require('chalk')
const figlet = require('figlet')

const print_logo = () => {
    figlet.text('Giddy', {
        font: 'Isometric1',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 500,
        whiteSpaceBreak: true,
    }, (err, data) => {
        print_description()
        console.log(chalk.yellow(data))
    })
}


const print_description  = () => {
    console.log(chalk.yellow(`@Giddy
Author: George Makroglou
Version: 1.0.7
Description: Scaffolding & Build/Push/Deploy pipelines for React & Node.js Azure App Services
GitHub: https://github.com/G-MAKROGLOU/-geomak-giddy`))
    }

module.exports = {print_logo, print_description}