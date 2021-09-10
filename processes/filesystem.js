const {spawn} = require('child_process')
const chalk = require("chalk");
const os = require('os')
const {github_process} = require("./github");


const filesystem_process = (config, arguments, success_message, chain) => {
    let command = 'mv'
    if(os.platform() === 'win32') command = 'move'
    const fs_process = spawn(command, arguments, {cwd: config.source_code_path});
    let stdout_chunks = [];
    let stderr_chunks = [];
    let content;
    let err_content;

    fs_process.stdout.on('data', data => {
        stdout_chunks = stdout_chunks.concat(data)
    })
    fs_process.stdout.on('end', () => {
        content = Buffer.concat(stdout_chunks).toString()
    })

    fs_process.stderr.on('data', data => {
        stderr_chunks = stderr_chunks.concat(data)
    })
    fs_process.stderr.on('end', () => {
        err_content = Buffer.concat(stderr_chunks).toString()
    })

    fs_process.on("close", code => {

        if(code === 0){
            console.log(chalk.blue(success_message))
            if(chain === 'git_add_source'){
                let args = ['add', '.']
                let message = 'Source code added for staging successfully!';
                let chain = 'git_commit_source'
                github_process(config, args, message, chain, config.source_code_path)
            }
        }

        if(code >= 1){
            console.log(chalk.red(err_content))
            process.exit(code)
        }
    })
}

module.exports = {
    filesystem_process
}