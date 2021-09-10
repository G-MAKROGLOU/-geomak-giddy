const chalk = require('chalk')
const {azure_process} = require('../processes/azure.js')

const start_react = data => {
    console.log(chalk.blue('Starting React pipeline...'))
    let success_message = "Successfully logged in to Azure!"
    let args = ['login' , '-u', data.az_username, '-p', data.az_password];
    azure_process(data, args, success_message, 'resource_group')
}


module.exports = {
    start_react
}