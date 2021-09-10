const {spawn} = require('child_process')
const chalk = require("chalk");
const {file_transfer_process} = require('./ftp')
const fs = require("fs");

const github_process = (config, arguments, success_message, chain, cwd) => {
    const gh_process = spawn('git', arguments, {cwd: cwd});
    let stdout_chunks = [];
    let stderr_chunks = [];
    let content;
    let err_content;

    gh_process.stdout.on('data', data => {
        stdout_chunks = stdout_chunks.concat(data)
    })
    gh_process.stdout.on('end', () => {
        content = Buffer.concat(stdout_chunks).toString()
        if(chain === 'git_push_source' && content.split('\n')[1] === 'nothing to commit, working tree clean'){
            console.log(chalk.red('No changes found in the source code repo. The build will be deleted to avoid redundancy!'))
            fs.rmdir(config.builds_path, {recursive: true}, err => {
                if(!err){
                    console.log(chalk.blue('Build deleted successfully!'))
                }
                process.exit(0)
            })
        }
    })

    gh_process.stderr.on('data', data => {
        stderr_chunks = stderr_chunks.concat(data)
    })
    gh_process.stderr.on('end', () => {
        err_content = Buffer.concat(stderr_chunks).toString()
    })

    gh_process.on("close", code => {
        if(code === 0){
            console.log(chalk.blue(success_message))

            if(chain === 'git_commit_source'){
                let args = ['commit', '-m', `${config.commit_message}`]
                let message = 'Source code committed successfully!';
                let chain = 'git_push_source'
                github_process(config, args, message, chain, config.source_code_path)
            }

            if(chain === 'git_push_source'){
                if(content === '' && code === 0){
                    console.log(chalk.red('No changes found to commit! A build is created but not published!'))
                    process.exit(code)
                }
                let args = ['push', config.source_remote_name, config.source_branch_name]
                let message = 'Source code pushed successfully!'
                let chain = 'git_add_build'
                github_process(config, args, message, chain, config.source_code_path)
            }

            if(chain === 'git_add_build'){
                let args = ['add', '.']
                let message = 'Build added for staging successfully!'
                let chain = 'git_commit_build'
                github_process(config, args, message, chain, config.builds_path)
            }

            if(chain === 'git_commit_build'){
                let args = ['commit', '-m', config.commit_message]
                let message = "Build committed successfully!"
                let chain = 'git_push_build'
                github_process(config, args, message, chain, config.builds_path)
            }

            if(chain === 'git_push_build'){
                let args = ['push', config.builds_remote_name, config.builds_branch_name]
                let message = "Build pushed successfully!"
                let chain = 'ftp_check_hostingstart'
                github_process(config, args, message, chain, config.builds_path)
            }

            if(chain === 'ftp_check_hostingstart'){
                let args = ['--head', '-u', `${config.ftp_username}:${config.ftp_password}`, `${config.ftp_host}/hostingstart.html`];
                let message = ''
                let chain = 'ftp_upload_or_delete_and_upload'
                file_transfer_process(config, args, message, chain, config.builds_path)
            }
        }
    })
}

module.exports = {
    github_process
}