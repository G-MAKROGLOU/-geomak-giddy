#! /usr/bin/env node

const {program} = require('commander')
const chalk = require('chalk')
const fs = require('fs')
const {print_logo} = require('../utils/print_home.js')
const {start_react} = require('../pipelines/pipelines.js')

print_logo()

console.log(program.args)

program
    .argument('file', 'The path to a JSON file containing all the necessary info. See https://www.npmjs.com/package/@geomak/giddy for examples')

program.parse()


if(fs.existsSync(program.args[0])){
    fs.readFile(program.args[0], 'utf-8', (err, data) => {
        if(err) {
            console.log(chalk.red(err))
            process.exit(1)
        }
        start_react(JSON.parse(data))
    })
}else{
    console.log(chalk.red(`${program.args[0]} does not exist! Try again with a correct file path..`))
    process.exit(1)
}

