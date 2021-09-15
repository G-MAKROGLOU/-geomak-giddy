const {error_message, success_message} = require('../utils/message_types')
const os = require('os')
const {exec} = require('child_process')
const pathMod = require('path')
const {normal_message} = require("../utils/message_types");
const {v4: uuidv4} = require('uuid')
const ftp = require('basic-ftp')
const fs = require("fs");


/**
 * Starts the deployment of a react application that the user already had
 * (either from previous scaffolding or from their own). It works with a different
 * type of giddy-config.json than the deployment of a newly scaffolded app
 * @param data
 */
const start_react = data => {
    let copyCmd;
    let newBuildFolderName = uuidv4()
    let azLoginCmd = `az login -u ${data.az_username} -p ${data.az_password}`
    let azFtpCredentialsCmd = `az webapp deployment list-publishing-profiles --name ${data.app_name} --resource-group ${data.resource_group_name} --query "[?contains(publishMethod, 'FTP')].[publishUrl,userName,userPWD]" --output json`
    let gitCmd = `cd ${data.source_code_path} && git add . && git commit -m ${data.commit_message} && git push ${data.source_remote_name} ${data.source_branch_name} && cd ${data.builds_path} && git add . && git commit -m ${data.commit_message} && git push ${data.builds_remote_name} ${data.builds_branch_name}`
    if(os.platform() === 'linux') copyCmd = `cp -R ${data.source_code_path}/build ${data.builds_path}/${newBuildFolderName}/build`
    if(os.platform() === 'win32') copyCmd = `xcopy ${data.source_code_path}\\build ${data.builds_path}\\${newBuildFolderName}\\build /E/H`
    let buildCmd = `cd ${data.source_code_path} && npm run build && cd ${data.builds_path} && mkdir ${newBuildFolderName} && cd ${pathMod.normalize(`${data.builds_path}/${newBuildFolderName}`)} && mkdir build && ${copyCmd}`

    success_message("Starting React deploy pipeline...")
    exec(azLoginCmd, (err) => {
        if(err){
            error_message("Could not login to Azure...Check your Azure credentials and try again...")
            process.exit(1)
            return
        }
        success_message("Successfully logged in to Azure...")
        normal_message("Retrieving deployment credentials...")
        exec(azFtpCredentialsCmd, (err, stdout) => {
            if(err){
                error_message("Could not retrieve deployment credentials...Check your app name details and try again...")
                process.exit(1)
                return
            }
            success_message("Successfully retrieved deployment credentials...")
            normal_message("Creating new build...")
            let json = JSON.parse(stdout)
            data.ftp_host = json[0][0]
            data.ftp_username = json[0][1]
            data.ftp_password = json[0][2]
            exec(buildCmd, (err) => {
                if(err){
                    error_message("Could not create build...Check your folder paths and try again...")
                    process.exit(1)
                    return
                }
                success_message("Successfully created new build...")
                normal_message("Updating repositories...")
                exec(gitCmd,async  (err) => {
                    if(err){
                        error_message("Could not update repositories...Check your git credentials and try again...")
                        cleanup('react-deploy-repos', data)
                        return
                    }
                    success_message("Successfully updated repositories...")
                    normal_message("Deploying app...")
                    let path = pathMod.normalize(`${data.builds_path}/${newBuildFolderName}/build`)
                    await universal_ftp_upload(data, path, 'none')
                })
            })
        })
    })
}


/**
 * Starts the deployment of a node application that the user already had
 * (either from previous scaffolding or from their own). It works with a different
 * type of giddy-config.json than the deployment of a newly scaffolded app.  The main difference between this function
 * and the react version of it, it that node does need build and it is uploaded along with the node_modules folder
 * @param data
 * @param appType
 */
const start_node = data => {
    success_message('Starting Node.js deploy pipeline...')
    let azLoginCmd = `az login -u ${data.az_username} -p ${data.az_password}`
    let azResGroupCmd = `az webapp list --query [?name=='${data.app_name}'].id --output tsv`
    let gitCmd = `cd ${data.source_code_path} && git add . && git commit -m "${data.commit_message}" && git push ${data.source_remote_name} ${data.source_branch_name}`

    exec(azLoginCmd, (err) => {
        if(err){
            error_message("Failed to login to Azure...Check your credentials and try again...")
            process.exit(1)
            return
        }
        success_message("Logged in to Azure successfully...")
        normal_message("Retrieving resource group...")
        exec(azResGroupCmd, (err, stdout) => {
            if(err){
                error_message("Failed to retrieve resource group name...Check the app name and try again...")
                process.exit(1)
                return
            }
            success_message("Resource group retrieved successfully...")
            normal_message("Retrieving deployment details...")
            data.resource_group = stdout.split('/')[4]
            let azFtpCredCmd = `az webapp deployment list-publishing-profiles --name ${data.app_name} --resource-group ${data.resource_group} --query "[?contains(publishMethod, 'FTP')].[publishUrl,userName,userPWD]" --output json`
            exec(azFtpCredCmd, (err, stdout) => {
                if(err){
                    error_message("Failed to retrieve app service details...Check the app name and try again...")
                    process.exit(1)
                    return
                }
                success_message("Deployment details retrieved successfully...")
                normal_message("Updating repository...")
                let json = JSON.parse(stdout)
                data.ftp_host = json[0][0]
                data.ftp_username = json[0][1]
                data.ftp_password = json[0][2]
                exec(gitCmd, async (err) => {
                    if(err){
                        error_message("Failed to update GIT repository...Check your GIT credentials and try again...")
                        cleanup('node-deploy-repo', data)
                        return
                    }
                    success_message("Repository updated successfully...")
                    normal_message("Deploying app...")
                    await universal_ftp_upload(data, data.source_code_path, 'err-ftp-upload-node')
                })
            })
        })
    })
}



/**
 * Starts the deployment of a newly scaffolded application. This functions does
 * a lot and so it will be broken down to smaller functions that can probably be
 * reused for node.js deployment as well (e.g ftp-function etc.).
 * @param operation_data
 */
const start_scaffolded_react = operation_data => {
    const { mkdirCommand, makeReleaseFolderCommand, runBuildCommand,
            createSourceRemoteCommand, createBuildsRemoteCommand,
            configGitCommand, gitSourceCommand, gitBuildsCommand,
            createAppCommand, getWebAppFTPCommand, moveToBuildsFolderCommand, buildFolderName
    } = extract_process_commands(operation_data)


    exec(`${createSourceRemoteCommand} && ${createBuildsRemoteCommand}`, (err, stdout, stdin) => {
        if(err) {
            error_message("Could not create remotes...Check the git credentials in your giddy_config.json and try again!")
            cleanup('err-remotes-react', operation_data)
            return
        }
        success_message("Source and builds remotes created successfully!")
        normal_message("Starting build...")
        exec(`${mkdirCommand} && ${makeReleaseFolderCommand} && ${runBuildCommand} && ${moveToBuildsFolderCommand}`, (err, stdout, stdin) => {
            if(err){
                error_message("A build stage failed...Giddy cannot finish its' processes if you interfere with the created files before finishing...")
                error_message("Cleaning up...")
                cleanup('err-react-build', operation_data)
                return
            }
            success_message("Build created and moved successfully!")
            normal_message("Pushing to repos....")
            exec(`${configGitCommand} && ${gitSourceCommand} && ${gitBuildsCommand}`, (err, stdout, stdin) => {
                if(err){
                    error_message("Failed to push to remotes...")
                    normal_message("Deleting remotes...")
                    cleanup('err-push-remotes-react', operation_data)
                    return
                }
                success_message("Source code and build pushed to their remotes successfully...")
                normal_message('Creating Azure App Service...')
                exec(createAppCommand, (err, stdout, stdin) => {
                    if(err) {
                        error_message('Failed to create Azure App Service. Are you using service details that already exist?')
                        cleanup('err-app-service-create-react', operation_data)
                        return
                    }
                    success_message(`App service created successfully!`)
                    normal_message('Retrieving deployment credentials...')
                    exec(getWebAppFTPCommand, async (err, stdout, stdin) => {
                        if(err){
                            error_message('Failed to retrieve app service credentials...')
                            cleanup('err-ftp-credentials-react', operation_data)
                            return
                        }
                        success_message(`App Service credentials retrieved successfully!`)
                        normal_message("Deploying build to Azure App Service...")
                        let data = JSON.parse(stdout)
                        operation_data.ftp_host = data[0][0]
                        operation_data.ftp_username = data[0][1]
                        operation_data.ftp_password = data[0][2]

                        let desktopPath = extract_desktop_path()
                        let path = pathMod.normalize(`${desktopPath}/giddy_react_builds/${buildFolderName}/build`)
                        await universal_ftp_upload(operation_data, path, 'err-ftp-upload-react')
                    })
                })
            })
        })
    })
}


/**
 * Starts the deployment of a newly scaffolded application. This functions does
 * a lot and so it will be broken down to smaller functions that can probably be
 * reused for node.js deployment as well (e.g ftp-function etc.). The main difference between this function
 * and the react version of it, it that node does need build and it is uploaded along with the node_modules folder
 * @param operation_data
 */
const start_scaffolded_node = operation_data => {
    const {createSourceRemoteCommand, sourceRemoteUrl, createAppCommand, getWebAppFTPCommand} = extract_process_commands(operation_data)
    let desktopPath = extract_desktop_path()
    let scaffoldedNodePath =  pathMod.normalize(`${desktopPath}/giddy_node` )
    let npmInstallCommand = `cd ${scaffoldedNodePath} && npm install`
    let initGitCommand = `cd ${scaffoldedNodePath} && git init && git branch -m master main && git remote add origin ${sourceRemoteUrl} && git add . && git commit -m "${operation_data.commit_message}" && git push -f origin main`

    normal_message("Creating remote...")
    exec(createSourceRemoteCommand, (err, stdout, stdin) => {
        if(err){
            error_message("Could not create remote...Cleaning up resources...")
            cleanup('err-remote-node', operation_data)
            return;
        }
        success_message("Remote created successfully...")
        normal_message("Initializing repository...")
        exec(initGitCommand, (err, stdout, stdin) => {
            if(err){
                error_message("Could not initialize repository...Cleaning up resources...")
                cleanup('err-remote-init-node', operation_data)
                return
            }
            success_message("Repository initialized successfully...")
            normal_message("Installing node_modules...")
            exec(npmInstallCommand, (err, stdout, stdin) => {
                if(err){
                    error_message("Failed to install node_modules...Cleaning up resources...")
                    cleanup('err-node-modules-node', operation_data)
                    return
                }
                success_message("Node modules installed successfully...")
                normal_message("Creating Azure App Service...")
                exec(createAppCommand, (err, stdout, stdin) => {
                    if(err){
                        error_message("Failed to create Azure App Service...Cleaning up resources...")
                        cleanup('err-app-service-node', operation_data)
                        return
                    }
                    success_message("Azure App Service created successfully...")
                    normal_message("Retrieving deployment credentials...")
                    exec(getWebAppFTPCommand, async (err, stdout, stdin) => {
                        if(err){
                            error_message("Failed to retrieve deployment credentials...Cleaning up resources...")
                            cleanup('err-ftp-credentials-node', operation_data)
                            return
                        }
                        success_message("Deployment credentials retrieved successfully...")
                        normal_message("Deploying Node app to Azure App Service...")
                        let data = JSON.parse(stdout)
                        operation_data.ftp_host = data[0][0]
                        operation_data.ftp_username = data[0][1]
                        operation_data.ftp_password = data[0][2]
                        await universal_ftp_upload(operation_data, scaffoldedNodePath, 'none')
                    })
                })
            })
        })
    })
}


/**
 * Starts the scaffolding of an application irregardless of what type it is (react | node)
 * @param data
 * @param appType
 */
const scaffold_app = (data, appType) => {
    let folderName = extract_scaffold_folder_name(appType)
    let copyCommand = extract_copy_command(appType)
    let desktopPath = extract_desktop_path()

    exec(`cd ${desktopPath} && mkdir ${folderName}`, (err, stdout, stdin) => {
        if(err) {
            error_message(`Could not start a new ${appType} project. Exiting...`)
            process.exit(1)
        }

        success_message(`New ${appType} project folder created on your desktop...`)
        normal_message("Adding source code...")

        exec(copyCommand, (err, stdout, stdin) => {
            if(err){
                error_message('Could not copy source code...Removing folder and exiting...')
                exec(`cd ${desktopPath} && rmdir ${folderName}`, (err, stdout, stdin) => {
                    if(err) error_message('Could not delete folder...You can delete it manually from your Desktop')
                    process.exit(1)
                })
                return
            }
            success_message(`Source code added successfully. You can now open your project in your IDE...`)

            if(appType === 'react') start_scaffolded_react(data)
            if(appType === 'node') start_scaffolded_node(data)
        })
    })
}

/**
 * Async FTP client to upload the project on Azure. With minimal modification on the "host" property
 * it can upload to any ftp server
 * @param operation_data The data from config.json file provided by the user
 * @param sourceCodePath The path to the folder containing the code to be uploaded
 * @param cleanupReason
 * @returns {Promise<void>} Instead of chaining a promise resolution, the errors are handled by a try-catch block
 */
const universal_ftp_upload = async (operation_data, sourceCodePath, cleanupReason) => {
    const client = new ftp.Client()
    try{
        await client.access({
            "host": operation_data.ftp_host.replace('ftp://', '').replace('/site/wwwroot', ''),
            "user": `${operation_data.ftp_username}`,
            "password": `${operation_data.ftp_password}`
        })
        await client.ensureDir('/site/wwwroot')
        await client.clearWorkingDir()
        await client.uploadFromDir(`${sourceCodePath}`);
        success_message('Web app deployed successfully...!')
        success_message(`You can check the app at https://${operation_data.app_name}.azurewebsites.net`)
        client.close()
    }catch(err){
        console.log(err.message)
        error_message("Deployment failed. Cleaning up resources....")
        client.close()
        cleanup(cleanupReason)
    }
}

/**
 * Cleanup function that receives the reason for cleanup and performs
 * the necessary cleanup after errors
 * @param reason
 * @param operation_data
 */
const cleanup = (reason, operation_data) => {
    let desktopPath = extract_desktop_path()
    let reactSourceFolderName = pathMod.normalize(`${desktopPath}/giddy_react`)
    let nodeSourceFolderName = pathMod.normalize(`${desktopPath}/giddy_node`)

    //REACT
    if(reason === 'err-remotes-react'){
        let delSourceCmd = extract_delete_command(reactSourceFolderName)
        exec(delSourceCmd, (err) => {
            if(err) error_message("Couldn't delete source code folder...It is probably open in another program..Delete it manually or rename it to allow @Giddy start a new project...")
            process.exit(1)
        })
    }
    if(reason === 'err-react-build') delete_react_remotes_and_folders(operation_data)
    if(reason === 'err-push-remotes-react') delete_react_remotes_and_folders(operation_data)
    if(reason === 'err-app-service-create-react') delete_react_remotes_and_folders(operation_data)
    if(reason === 'err-ftp-credentials-react') delete_react_remotes_folders_and_az(operation_data)
    if(reason === 'err-ftp-upload-react') delete_react_remotes_folders_and_az(operation_data)
    if(reason === 'react-deploy-repos') reset_react_repos(operation_data)
    //NODE
    if(reason === 'err-remote-node'){
        fs.rmdir(nodeSourceFolderName, {recursive: true}, (err) => {
            if(err){
                error_message("Failed to delete project folder...Delete it manually and try again...")
            }
            process.exit(1)
        })
    }
    if(reason === 'err-remote-init-node') delete_node_remote_and_folder(operation_data)
    if(reason === 'err-node-modules-node') delete_node_remote_and_folder(operation_data)
    if(reason === 'err-app-service-node') delete_node_remote_and_folder(operation_data)
    if(reason === 'err-ftp-credentials-node') delete_node_remote_folder_and_az(operation_data)
    if(reason === 'err-ftp-upload-node') delete_node_remote_folder_and_az(operation_data)
    if(reason === 'node-deploy-repo') reset_node_repo(operation_data)
}

/**
 * Helper function to delete the remotes and all folders created for a scaffolded Giddy-React App
 * @param operation_data
 */
const delete_react_remotes_and_folders = operation_data => {
    const {deleteSourceRemoteCommand, deleteBuildsRemoteCommand} = extract_process_commands(operation_data)
    let desktopPath = extract_desktop_path()
    let buildsFolderName = pathMod.normalize(`${desktopPath}/giddy_react_builds`)
    let sourceFolderName = pathMod.normalize(`${desktopPath}/giddy_react`)

    exec(`${deleteSourceRemoteCommand} && ${deleteBuildsRemoteCommand}`, (err) => {
        if(err) error_message("Deletion of remotes and folders failed...This is probably a problem with GIT or a folder is open with another program...Cleanup the resources manually and try again...")
        fs.rmdir(sourceFolderName, {recursive: true}, (err) => {
            if(err){
                error_message('Failed to delete source code folder...Delete both folders manually and try again...')
                process.exit(1)
            }
            fs.rmdir(buildsFolderName, {recursive: true}, (err) => {
                if(err) error_message('Failed to delete builds folder...Delete it manually and try again...')
                process.exit(1)
            })
        })
    })
}

/**
 * Helper function to delete the remotes, all folders, and all Azure resources created for a scaffolded Giddy-React App
 * @param operation_data
 */
const delete_react_remotes_folders_and_az = operation_data => {
    const {deleteSourceRemoteCommand, deleteBuildsRemoteCommand} = extract_process_commands(operation_data)
    let desktopPath = extract_desktop_path()
    let buildsFolderName = pathMod.normalize(`${desktopPath}/giddy_react_builds`)
    let reactSourceFolderName = pathMod.normalize(`${desktopPath}/giddy_react`)
    let deleteResGroupCmd = `az group delete -n ${operation_data.resource_group_name}`

    exec(`${deleteSourceRemoteCommand} && ${deleteBuildsRemoteCommand} && ${deleteResGroupCmd}`, (err) => {
        if(err) error_message("Deletion of remotes, folders and Azure Resources failed...This is probably a problem with GIT, Azure, or a folder is open with another program...Cleanup the resources manually and try again...")
        fs.rmdir(reactSourceFolderName, {recursive: true}, (err) => {
            if(err){
                error_message('Failed to delete source code folder...Delete both folders manually and try again...')
                process.exit(1)
            }
            fs.rmdir(buildsFolderName, {recursive: true}, (err) => {
                if(err) error_message('Failed to delete builds folder...Delete it manually and try again...')
                process.exit(1)
            })
        })
    })
}

/**
 * Helper function to delete the remote and folder of a scaffolded Giddy-Node.js App
 * @param operation_data
 */
const delete_node_remote_folder_and_az = operation_data => {
    const {deleteSourceRemoteCommand} = extract_process_commands(operation_data)
    let desktopPath = extract_desktop_path()
    let nodeFolderName = pathMod.normalize(`${desktopPath}/giddy_node`)
    let deleteResGroupCmd = `az group delete -n ${operation_data.resource_group_name}`

    exec(`${deleteSourceRemoteCommand} && ${deleteResGroupCmd}`, (err, stdout, stderr) => {
        if(err) {
            error_message("Deletion of remote, and Azure Resources failed...This is probably a problem with GIT, Azure...Cleanup the resources manually and try again...")
            process.exit(1)
        }
        fs.rmdir(nodeFolderName, {recursive: true}, (err) => {
            if(err){
                error_message("Failed to delete source code folder...Delete it manually and try again...")
                process.exit(1)
            }
            success_message("Resources cleaned up successfully...")
            process.exit(1)
        })
    })
}

/**
 * Helper function to delete the remote, folder, and Azure Resources of a scaffolded Giddy-Node.js App
 * @param operation_data
 */
const delete_node_remote_and_folder = operation_data => {
    const {deleteSourceRemoteCommand} = extract_process_commands(operation_data)
    let desktopPath = extract_desktop_path()
    let nodeSourceFolderName = pathMod.normalize(`${desktopPath}/giddy_node`)

    exec(`${deleteSourceRemoteCommand}`, (err) => {
        if(err) error_message("Deletion of remote failed...This is probably a problem with GIT...Cleanup the resources manually and try again...")
        fs.rmdir(nodeSourceFolderName, {recursive: true}, (err) => {
            if(err){
                error_message("Failed to delete source code folder...Delete it manually and try again...")
                process.exit(1)
            }
            success_message("Resources cleaned up successfully...")
            process.exit(1)
        })
    })
}

/**
 * Reset of all react repositories
 * @param data
 */
const reset_react_repos = data => {
    let resetHeadCmd = 'git reset --soft HEAD~1'
    let resetRepos = `cd ${data.source_code_path} && ${resetHeadCmd} && cd ${data.builds_path} && ${resetHeadCmd}`
    normal_message("Resetting repositories...")
    exec(resetRepos, (err) => {
        if(err) error_message("Failed to reset repos...Restore repos manually and rerun @Giddy. Check npm documentation for conflict resolution tips...")
        process.exit(1)
    })
}

/**
 * Reset of node repository
 * @param data
 */
const reset_node_repo = data => {
    let resetHeadCmd = 'git reset --soft HEAD~1'
    let resetRepos = `cd ${data.source_code_path} && ${resetHeadCmd}`
    normal_message("Resetting repository...")
    exec(resetRepos, (err) => {
        if(err) error_message("Failed to reset repo...Restore repo manually and rerun @Giddy. Check npm documentation for conflict resolution tips...")
        process.exit(1)
    })
}

/**
 * Helper function that extracts the path to the user Desktop depending the OS
 * @returns {string}
 */
const extract_desktop_path = () => {
    const hostname = os.userInfo().username
    let path;

    if(os.platform() === 'win32') path = `C:\\Users\\${hostname}\\Desktop`
    if(os.platform() === 'linux') path = `/home/${hostname}/Desktop`

    return path;
}


/**
 * Helper function the decides the scaffolded project folder name depending the app type
 * @param appType
 * @returns {string}
 */
const extract_scaffold_folder_name = appType => {
    let folderName;
    if(appType === 'react') folderName = 'giddy_react'
    if(appType === 'node') folderName = 'giddy_node'
    return folderName
}



/**
 * Helper function to extract the copy command depending the OS
 * @param appType
 * @returns copyCommand: string
 */
const extract_copy_command = appType => {
    let scaffoldsPath = pathMod.join(__dirname, `../scaffolds/${appType}`)
    let folderName = extract_scaffold_folder_name(appType)
    let desktopPath = extract_desktop_path()
    let copyCommand;

    if(os.platform() === 'win32') copyCommand = `xcopy ${scaffoldsPath} ${desktopPath}\\${folderName} /E/H`
    if(os.platform() === 'linux') copyCommand = `cp -R ${scaffoldsPath} ${desktopPath}/${folderName}`
    return copyCommand
}


const extract_delete_command = path => {
    if(os.platform() === 'linux')
        return `rm -r ${path}`
    if(os.platform() === 'win32')
        return `rmdir ${path} /s /q`
}

/**
 * Extracts the paths for certain directories needed for the commands according to the underlying operating system
 * @returns {{buildFolderName: (*|string), currentBuildPath: string, moveToBuildsFolderCommand: string, fullBuildsPath: string, folderName: string, giddyReactPath: string}}
 */
const extract_command_path_info = () => {
    let desktopPath = extract_desktop_path()
    let folderName = 'giddy_react_builds'
    let buildFolderName = uuidv4()

    let fullBuildsPath;
    let giddyReactPath;
    let releasePath;
    let moveToBuildsFolderCommand;
    let currentBuildPath;

    if(os.platform() === 'win32') {
        fullBuildsPath = `${desktopPath}\\${folderName}`
        giddyReactPath = `${desktopPath}\\giddy_react`
        releasePath = `${giddyReactPath}\\build`
        currentBuildPath = `${fullBuildsPath}\\${buildFolderName}`
        moveToBuildsFolderCommand = `move ${releasePath} ${currentBuildPath}`
    }

    if(os.platform() === 'linux') {
        fullBuildsPath = `${desktopPath}/${folderName}`
        giddyReactPath = `${desktopPath}/giddy_react`
        releasePath = `${giddyReactPath}/build`
        currentBuildPath = `${fullBuildsPath}/${buildFolderName}`
        moveToBuildsFolderCommand = `mv ${releasePath} ${currentBuildPath}`
    }

    return {
        fullBuildsPath,
        giddyReactPath,
        currentBuildPath,
        moveToBuildsFolderCommand,
        folderName,
        buildFolderName
    }
}

/**
 * Extracts all the process commands except from the command that retrieves the FTP credentials of the App Service
 * because it first needs to be created
 * @param operation_data
 * @returns {{deleteBuildsRemoteCommand: string, getWebAppFTPCommand: string, gitBuildsCommand: string, moveToBuildsFolderCommand: string, sourceRemoteUrl: string, gitSourceCommand: string, runBuildCommand: string, createBuildsRemoteCommand: string, buildFolderName: *, createAppCommand: string, makeReleaseFolderCommand: string, mkdirCommand: string, createSourceRemoteCommand: string, deleteSourceRemoteCommand: string, configGitCommand: string}}
 */
const extract_process_commands = operation_data => {
    const desktopPath = extract_desktop_path()
    const { fullBuildsPath, giddyReactPath,
            moveToBuildsFolderCommand,
            folderName, buildFolderName} = extract_command_path_info()

    let mkdirCommand = `cd ${desktopPath} && mkdir ${folderName} && cd ${desktopPath}/${folderName} && git init && git branch -m master main`
    let makeReleaseFolderCommand = `cd ${fullBuildsPath} && mkdir ${buildFolderName}`
    let runBuildCommand = `cd ${giddyReactPath} && npm install && npm run build`
    let createSourceRemoteCommand = `curl -i -H "Authorization: token ${operation_data.git_password}" -d "{\\"name\\":\\"${operation_data.app_name}-source\\", \\"auto_init\\":true,\\"private\\":true}" https://api.github.com/user/repos`
    let createBuildsRemoteCommand = `curl -i -H "Authorization: token ${operation_data.git_password}" -d "{\\"name\\":\\"${operation_data.app_name}-builds\\", \\"auto_init\\":true,\\"private\\":true}" https://api.github.com/user/repos`
    let sourceRemoteUrl = `https://github.com/${operation_data.git_username}/${operation_data.app_name}-source.git`
    let buildsRemoteUrl = `https://github.com/${operation_data.git_username}/${operation_data.app_name}-builds.git`
    let configGitCommand = `git config --global user.email "${operation_data.git_email}"`
    let gitSourceCommand = `cd ${giddyReactPath} && git init && git branch -m master main && git remote add origin ${sourceRemoteUrl} && git add . && git commit -m "${operation_data.commit_message}" && git push -f origin main`
    let gitBuildsCommand = `cd ${fullBuildsPath} && git remote add origin ${buildsRemoteUrl} && git add . && git commit -m "${operation_data.commit_message}" && git push -f origin main`
    let deleteSourceRemoteCommand = `curl -X DELETE -H \"Authorization: token ${operation_data.git_password}\" https://api.github.com/repos/${operation_data.git_username}/${operation_data.app_name}-source`
    let deleteBuildsRemoteCommand = `curl -X DELETE -H \"Authorization: token ${operation_data.git_password}\" https://api.github.com/repos/${operation_data.git_username}/${operation_data.app_name}-builds`
    let createAppCommand = `az login -u ${operation_data.az_username} -p ${operation_data.az_password} && az account set --subscription ${operation_data.az_subscription_id} && az group create --name ${operation_data.resource_group_name} --location ${operation_data.location} && az webapp up --name ${operation_data.app_name} --resource-group ${operation_data.resource_group_name} --os-type Windows --runtime "node|14-lts" --sku FREE`
    let getWebAppFTPCommand = `az webapp deployment list-publishing-profiles --name ${operation_data.app_name} --resource-group ${operation_data.resource_group_name} --query "[?contains(publishMethod, 'FTP')].[publishUrl,userName,userPWD]" --output json`

    return {
        mkdirCommand,
        makeReleaseFolderCommand,
        runBuildCommand,
        createSourceRemoteCommand,
        createBuildsRemoteCommand,
        configGitCommand,
        gitSourceCommand,
        gitBuildsCommand,
        deleteSourceRemoteCommand,
        deleteBuildsRemoteCommand,
        createAppCommand,
        getWebAppFTPCommand,
        moveToBuildsFolderCommand,
        sourceRemoteUrl,
        buildFolderName
    }
}


module.exports = {
    start_react,
    scaffold_app,
    start_node,
    start_scaffolded_react,
    universal_ftp_upload
}
