const {spawn} = require('child_process')
const chalk = require("chalk");
const {build_process} = require('./build')

const azure_process = (config, arguments, success_message, chain) => {
    const az_process = spawn('az', arguments);
    let stdout_chunks = [];
    let stderr_chunks = [];
    let content;
    let err_content;

    az_process.stdout.on('data', data => {
        stdout_chunks = stdout_chunks.concat(data)
    })
    az_process.stdout.on('end', () => {
        content = Buffer.concat(stdout_chunks).toString()
    })

    az_process.stderr.on('data', data => {
        stderr_chunks = stderr_chunks.concat(data)
    })
    az_process.stderr.on('end', () => {
        err_content = Buffer.concat(stderr_chunks).toString()
    })

    az_process.on("close", code => {

        if(code === 0){
            console.log(chalk.blue(success_message))

            if(chain === 'resource_group'){
                let args = ['webapp', 'list', '--query', `[?name=='${config.app_service_name}'].id`,  '--output', 'tsv']
                let message = "Resource group retrieved successfully!"
                azure_process(config, args, message, 'ftp')
            }

            if(chain === 'ftp'){
                config.resource_group = content.split('/')[4]

                let args = ['webapp', 'deployment', 'list-publishing-profiles', '--name',
                    `${config.app_service_name}`, '--resource-group', `${config.resource_group}`,
                    '--query', `[?contains(publishMethod, 'FTP')].[publishUrl,userName,userPWD]`,
                    '--output', 'json']
                let message = "FTP credentials retrieved successfully!"
                azure_process(config, args, message, 'build')
            }

            if(chain === 'build'){
                config.ftp_host = JSON.parse(content)[0][0]
                config.ftp_username = JSON.parse(content)[0][1]
                config.ftp_password = JSON.parse(content)[0][2]
                let args = [
                    'run',
                    'build',
                ]
                let message = "\nBuild created successfully!"
                build_process(config, args, message, 'fs')
            }
        }

        if(code >= 1){
            console.log(chalk.red(err_content))
            process.exit(code)
        }
    })
}

module.exports = {
  azure_process
}