const {spawn} = require('child_process')
const chalk = require("chalk");
const {filesystem_process} = require('./filesystem')
const {v4: uuidv4} = require('uuid')

const build_process = (config, arguments, success_message, chain) => {
    console.log(chalk.green('Starting build'))
    const npm_process = spawn('npm', arguments, {cwd: config.source_code_path});
    let stdout_chunks = [];
    let stderr_chunks = [];
    let content;
    let err_content;


    npm_process.stdout.on('data', data => {
        stdout_chunks = stdout_chunks.concat(data)
        process.stdout.write(chalk.cyan('# '))
    })
    npm_process.stdout.on('end', () => {
        content = Buffer.concat(stdout_chunks).toString()
    })

    npm_process.stderr.on('data', data => {
        stderr_chunks = stderr_chunks.concat(data)
    })
    npm_process.stderr.on('end', () => {
        err_content = Buffer.concat(stderr_chunks).toString()
    })

    npm_process.on("close", code => {
        if(code === 0){
            console.log(chalk.blue(success_message))
            if(chain === 'fs'){
                config.builds_path = `${config.builds_path}/${uuidv4()}`
                let args = [`${config.source_code_path}/build`, config.builds_path]
                filesystem_process(config, args, 'Build moved successfully', 'git_add_source')
            }
        }

        if(code >= 1){
            console.log(chalk.red(err_content))
            process.exit(code)
        }
    })
}

module.exports = {
    build_process
}