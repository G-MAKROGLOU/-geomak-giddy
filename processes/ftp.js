const {spawn} = require('child_process')
const chalk = require("chalk");
const {upload_process} = require('./upload')

const file_transfer_process = (config, arguments, success_message, chain) => {
    const ftp_process = spawn('curl', arguments, {cwd: config.builds_path});
    let stdout_chunks = [];
    let stderr_chunks = [];
    let content;
    let err_content;

    ftp_process.stdout.on('data', data => {
        stdout_chunks = stdout_chunks.concat(data)
    })
    ftp_process.stdout.on('end', () => {
        content = Buffer.concat(stdout_chunks).toString()
    })

    ftp_process.stderr.on('data', data => {
        stderr_chunks = stderr_chunks.concat(data)
    })
    ftp_process.stderr.on('end', () => {
        err_content = Buffer.concat(stderr_chunks).toString()
    })

    ftp_process.on("close", code => {
        console.log(chalk.blue(success_message))

        if(chain === 'ftp_upload_or_delete_and_upload' && code === 19){
            upload_process(config)
        }

        if(chain === 'ftp_upload_or_delete_and_upload' && code === 0){
            let args = ['-v', '-u', `${config.ftp_username}:${config.ftp_password}`, config.ftp_host,  '-Q',  'DELE /site/wwwroot/hostingstart.html', '-Q', 'QUIT'];
            let message = 'Found hostingstart.html file and deleted it successfully!'
            let chain = 'upload'
            file_transfer_process(config, args, message, chain)
        }

        if(chain === 'upload' && code === 56){
            upload_process(config)
        }

    })
}

module.exports = {
    file_transfer_process
}