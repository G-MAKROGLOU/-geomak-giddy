#! /usr/bin/env node

const {program, Option} = require('commander')
const {error_message, success_message} = require('../utils/message_types')
const fs = require('fs')
const {print_logo} = require('../utils/print_home.js')
const {start_react, scaffold_app, start_node} = require('../pipelines/pipelines.js')
const { exec } = require('child_process')

print_logo()

program
    .addOption(new Option('-a, --app <app>', 'Type of application').choices(['react', 'node']))
    .addOption(new Option('-t, --type <type>', 'Type of operation').choices(['deploy', 'init']))
    .argument('file', 'The path to a JSON file containing all the necessary info. See https://www.npmjs.com/package/@geomak/giddy for examples')

program.parse()

if(fs.existsSync(program.args[0])){
    fs.readFile(program.args[0], 'utf-8', (err, data) => {
        if(err) {
            error_message('There was a problem reading the file. Check the file format and try again...')
            process.exit(1)
        }
        let operation_data = JSON.parse(data)
        choose_variant(operation_data)
    })
}else{
    error_message(`${program.args[0]} does not exist! Try again with a correct file path...`)
    process.exit(1)
}


const choose_variant = operation_data => {
    let {app, type} = program.opts()

    if(app === 'react' && type === 'deploy') start_react(operation_data, app)
    if(app === 'react' && type === 'init') scaffold_app(operation_data, 'react')
    if(app === 'node' && type === 'deploy') start_node(operation_data, app)
    if(app === 'node' && type === 'init') scaffold_app(operation_data, 'node')
    
}
    

