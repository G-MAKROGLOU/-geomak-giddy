const {exec} = require('child_process')
const chalk = require('chalk')
const os = require("os");

const upload_process = (config) => {
    let cmd = `cd ${config.builds_path} && find -type  f -exec curl -v -u '${config.ftp_username}':${config.ftp_password} --ftp-create-dirs -T {} ${config.ftp_host}/{} \\;`
    if(os.platform() === 'wind32'){
        cmd = `forfiles /p '${config.builds_path}' /p "curl.exe -C -# -T @path ftp://${config.ftp_host}/@folder --user '${config.ftp_username}':${config.ftp_password}"`
    }
    let message = 'Project deployed successfully!';

    const up_process = exec(cmd)

    up_process.stdout.on('data', data => {
        process.stdout.write(chalk.blue('#'))
    })

    up_process.on('close', code => {
        console.log(chalk.blue(message))
    })
}


module.exports = {
    upload_process
}