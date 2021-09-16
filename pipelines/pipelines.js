const {error_message, success_message, normal_message} = require('../utils/message_types')
const {extract_desktop_path, extract_scaffold_folder_name, extract_copy_command} = require('../utils/helpers')
const {
    rc_level1, rc_level2, rc_level3, rc_level4, rc_level5, 
    rc_level1_1, rc_level1_2, rc_level1_3, rc_level1_4,  
    nd_level1, nd_level2, nd_level3, nd_level4, nd_level5, 

} = require('../utils/pipeline_errors')

const {reset_repo, delete_folder} = require('../utils/error_promises')

const os = require('os')
const {exec} = require('child_process')
const pathMod = require('path')
const {v4: uuidv4} = require('uuid')
const ftp = require('basic-ftp')
const fs = require("fs");



/**
 * Starts the deployment of a newly scaffolded application. This functions does
 * a lot and so it will be broken down to smaller functions that can probably be
 * reused for node.js deployment as well (e.g ftp-function etc.). The main difference between this function
 * and the react version of it, it that node does need build and it is uploaded along with the node_modules folder
 * @param operation_data
 */
 const start_scaffolded_node = operation_data => {
    normal_message("Authorizing GitHub account...")
    authorizeGit(operation_data.git_username, operation_data.git_password).then(msg => {
        success_message(msg)
        normal_message("Setting up GitHub account credentials...")
        
        setupGit(operation_data.git_username).then(msg => {
            success_message(msg)
            normal_message("Logging in to Azure...")
            
            loginToAzure().then(msg => {
                success_message(msg)
                normal_message(`Checking if resource group ${operation_data.resource_group_name} exists...`)
                
                checkIfResourceGroupExists(operation_data.resource_group_name).then(exists => {
                    if(exists === 'true') {
                        success_message(`Resource group ${operation_data.resource_group_name} was found...`)
                        normal_message("Creating App Service...")
                        
                        createWebApp(operation_data.app_name, operation_data.resource_group_name).then(msg => {
                                success_message(msg)
                                normal_message("Creating remote...")
                                
                                createRemote(operation_data.git_username, operation_data.git_password, operation_data.app_name).then(res => {
                                    success_message("Remote created successfully...")
                                    normal_message("Updating remote...")
                                    let remoteUrl = res.remote_url
                                    let path = `${pathMod.normalize(`${extract_desktop_path()}/giddy_node`)}`  
                                    
                                    initRepo(path, remoteUrl, operation_data.commit_message).then(msg => {
                                        success_message(msg)
                                        normal_message("Installing node modules...")
                                        
                                        installModules(path).then(msg => {
                                            success_message(msg)
                                            normal_message("Retrieving deployment credentials...")

                                            getDeploymentCredentials(operation_data.app_name, operation_data.resource_group_name).then(async ftpCreds => {
                                                success_message("Deployment credentials retrieved successfully...")
                                                normal_message("Deploying app...This may take a while...")
                                                operation_data.ftp_host = ftpCreds.ftp_host;
                                                operation_data.ftp_username = ftpCreds.ftp_username;
                                                operation_data.ftp_password = ftpCreds.ftp_password;
                                                await universal_ftp_upload(operation_data, path, 'nd_level5')

                                            }).catch(err => error_handler(`ERR => APP SERVICE DEPLOYMENT CREDENTIALS: ${err}`, operation_data, 'nd_level5'))
                                            
                                        }).catch(err => error_handler(`ERR => NODE MODULES INSTALLATION: ${err}`, operation_data, 'nd_level5'))

                                    }).catch(err => error_handler(`ERR => NODE REMOTE UPDATE: ${err}`, operation_data, 'nd_level5'))

                                }).catch(err => error_handler(`ERR => CREATE NODE REMOTE: ${err}`, operation_data, 'nd_level4'))
                            
                        }).catch(err => error_handler(`ERR => WEB APP CREATION: ${err}`, operation_data, 'nd_level1'))

                    }else {
                        success_message(`Resource group ${operation_data.resource_group_name} was not found...`)
                        normal_message("Creating the resource group...")
                        
                        createResourceGroup(operation_data.resource_group_name, operation_data.location).then(msg => {
                            success_message(msg)
                            normal_message("Creating App Service")
                            
                            createWebApp(operation_data.app_name, operation_data.resource_group_name).then(msg => {
                                success_message(msg)
                                normal_message("Creating remote...")
                                
                                createRemote(operation_data.git_username, operation_data.git_password, operation_data.app_name).then(res => {
                                    success_message("Remote created successfully...")
                                    normal_message("Updating remote...")
                                    let remoteUrl = res.remote_url
                                    let path = `${pathMod.normalize(`${extract_desktop_path()}/giddy_node`)}` 
                                    
                                    initRepo(path, remoteUrl, operation_data.commit_message).then(msg => {
                                        success_message(msg)
                                        normal_message("Installing node modules...")
                                        
                                        installModules(path).then(msg => {
                                            success_message(msg)
                                            normal_message("Retrieving deployment credentials...")
                                            
                                            getDeploymentCredentials(operation_data.app_name, operation_data.resource_group_name).then(async ftpCreds => {
                                                success_message("Deployment credentials retrieved successfully...")
                                                normal_message("Deploying app...This may take a while...")
                                                operation_data.ftp_host = ftpCreds.ftp_host;
                                                operation_data.ftp_username = ftpCreds.ftp_username;
                                                operation_data.ftp_password = ftpCreds.ftp_password;
                                                await universal_ftp_upload(operation_data, path, 'nd_level3')
                                            
                                            }).catch(err => error_handler(`ERR => APP SERVICE DEPLOYMENT CREDENTIALS: ${err}`, operation_data, 'nd_level3'))
                                            
                                        }).catch(err => error_handler(`ERR => NODE MODULES INSTALLATION: ${err}`, operation_data, 'nd_level3'))

                                    }).catch(err => error_handler(`ERR => NODE REMOTE UPDATE: ${err}`, operation_data, 'nd_level3'))

                                }).catch(err => error_handler(`ERR => CREATE NODE REMOTE: ${err}`, operation_data, 'nd_level2'))
                            
                            }).catch(err => error_handler(`ERR => WEB APP CREATION AFTER RES-GROUP CREATION: ${err}`, operation_data, 'nd_level2'))

                        }).catch(err => error_handler(`ERR => RESOURCE GROUP CREATION: ${err}`, operation_data, 'nd_level1'))
                    }

                }).catch(err => error_handler(`ERR => RESOURCE GROUP CHECK: ${err}`, operation_data, 'nd_level1'))

            }).catch(err => error_handler(`ERR => AZURE LOGIN: ${err}`, operation_data, 'nd_level1'))

        }).catch(err => error_handler(`ERR => GIT ACCOUNT SETUP: ${err}`, operation_data, 'nd_level1'))

    }).catch(err => error_handler(`ERR => GIT AUTHORIZATION: ${err}`, operation_data, 'nd_level1'))
}




/**
 * Starts the deployment of a newly scaffolded application. This functions does
 * a lot and so it will be broken down to smaller functions that can probably be
 * reused for node.js deployment as well (e.g ftp-function etc.).
 * @param operation_data
 */
 const start_scaffolded_react = operation_data => {
   
    normal_message("Authorizing GitHub account...")
     authorizeGit(operation_data.git_username, operation_data.git_password).then(msg => {
         success_message(msg)
         normal_message("Setting up GitHub account credentials...")
         
         setupGit(operation_data.git_username).then(msg => {
             success_message(msg)
             normal_message("Logging in to Azure...")
             
             loginToAzure().then(msg => {
                 success_message(msg)
                 normal_message(`Checking if resource group ${operation_data.resource_group_name} exists...`)

                 checkIfResourceGroupExists(operation_data.resource_group_name).then(exists => {
                     if(exists === 'true'){
                        success_message(`Resource group ${operation_data.resource_group_name} was found...`)
                        normal_message("Creating App Service...")

                        createWebApp(operation_data.app_name, operation_data.resource_group_name).then(msg => {
                            success_message(msg)
                            normal_message("Creating source remote...")

                            createRemote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-source`).then(res => {
                                let sourceRemoteUrl = res.remote_url

                                success_message("Source remote created successfully...")
                                normal_message("Creating builds remote...")

                                createRemote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-builds`).then(res => {
                                    let buildsRemoteUrl = res.remote_url
                                    success_message("Builds remote created successfully...")
                                    normal_message("Creating build folder...")

                                    makeBuildFolder().then(res => {
                                        let destinationPath = res.newBuildFolderPath
                                        success_message(res.msg)
                                        normal_message("Creating build...")

                                        startReactBuild().then(msg => {
                                            success_message(msg)
                                            normal_message("Copying build to builds folder...")
                                            let sourcePath = pathMod.normalize(`${extract_desktop_path()}/giddy_react/build`)

                                            copyBuildToNewPath(sourcePath, destinationPath).then(msg => {
                                                success_message(msg)
                                                normal_message("Updating remotes...")
                                                let sourcePath = `${pathMod.normalize(`${extract_desktop_path()}/giddy_react`)}`
                                                    
                                                initRepo(sourcePath, sourceRemoteUrl,operation_data.commit_message).then(msg => {
                                                    success_message(msg)
                                                    let buildsPath = `${pathMod.normalize(`${extract_desktop_path()}/giddy_react_builds`)}`
                                                        
                                                    initRepo(buildsPath, buildsRemoteUrl, operation_data.commit_message).then(msg => {
                                                        success_message(msg)
                                                        normal_message("Retrieving deployment credentials...")
                                                        getDeploymentCredentials(operation_data.app_name, operation_data.resource_group_name).then(async ftpCreds => {
                                                            success_message("Deployment credentials retrieved successfully...")
                                                            let deployPath = `${pathMod.normalize(`${destinationPath}/build`)}`
                                                            operation_data.ftp_host = ftpCreds.ftp_host
                                                            operation_data.ftp_username = ftpCreds.ftp_username
                                                            operation_data.ftp_password = ftpCreds.ftp_password
                                                            normal_message("Deploying React app...")
                                                            await universal_ftp_upload(operation_data, deployPath, 'rc_level1_4')
                                                        }).catch(err => error_handler(`ERR => REACT APP DEPLOY: ${err}`, operation_data, 'rc_level1_4'))
                                                            
                                                    }).catch(err => error_handler(`ERR => BUILDS REMOTE UPDATE: ${err}`, operation_data, 'rc_level1_4'))

                                                }).catch(err => error_handler(`ERR => SOURCE REMOTE UPDATE: ${err}`, operation_data, 'rc_level1_4'))

                                            }).catch(err => error_handler(`ERR => COPY BUILD TO NEW FOLDER: ${err}`, operation_data, 'rc_level1_4'))

                                        }).catch(err => error_handler(`ERR => REACT BUILD: ${err}`, operation_data, 'rc_level1_4'))

                                    }).catch(err => error_handler(`ERR => MAKE FOLDER BUILD ${err}`, operation_data, 'rc_level1_3'))

                                }).catch(err => error_handler(`ERR => CREATE BUILDS REMOTE ${err}`, operation_data, 'rc_level1_2'))

                            }).catch(err => error_handler(`ERR => CREATE SOURCE REMOTE ${err}`, operation_data, 'rc_level1_1'))

                        }).catch(err => error_handler(`ERR => WEB APP CREATION WITHOUT RES-GROUP CREATION: ${err}`, operation_data, 'rc_level1'))

                     }else{
                        success_message(`Resource group ${operation_data.resource_group_name} was not found...`)
                        normal_message("Creating the resource group...")

                        createResourceGroup(operation_data.resource_group_name, operation_data.location).then(msg => {
                            success_message(msg)
                            normal_message("Creating App Service...")
                            
                            createWebApp(operation_data.app_name, operation_data.resource_group_name).then(msg => {
                                success_message(msg)
                                normal_message("Creating source remote...")

                                createRemote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-source`).then(res => {
                                    let sourceRemoteUrl = res.remote_url
                                    success_message("Source remote created successfully...")
                                    normal_message("Creating builds remote...")

                                    createRemote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-builds`).then(res => {
                                        let buildsRemoteUrl = res.remote_url
                                        success_message("Builds remote created successfully...")
                                        normal_message("Creating build folder...")

                                        makeBuildFolder().then(res => {
                                            let destinationPath = res.newBuildFolderPath
                                            success_message(res.msg)
                                            normal_message("Creating build...")

                                            startReactBuild().then(msg => {
                                                success_message(msg)
                                                normal_message("Copying build to builds folder...")
                                                let sourcePath = pathMod.normalize(`${extract_desktop_path()}/giddy_react/build`)

                                                copyBuildToNewPath(sourcePath, destinationPath).then(msg => {
                                                    success_message(msg)
                                                    normal_message("Updating remotes...")
                                                    let sourcePath = `${pathMod.normalize(`${extract_desktop_path()}/giddy_react`)}`
                                                    
                                                    initRepo(sourcePath, sourceRemoteUrl,operation_data.commit_message).then(msg => {
                                                        success_message(msg)
                                                        let buildsPath = `${pathMod.normalize(`${extract_desktop_path()}/giddy_react_builds`)}`
                                                        
                                                        initRepo(buildsPath, buildsRemoteUrl, operation_data.commit_message).then(msg => {
                                                            success_message(msg)
                                                            normal_message("Retrieving deployment credentials...")
                                                            
                                                            getDeploymentCredentials(operation_data.app_name, operation_data.resource_group_name).then(async ftpCreds => {
                                                                success_message("Deployment credentials retrieved successfully...")
                                                                let deployPath = `${pathMod.normalize(`${destinationPath}/build`)}`
                                                                operation_data.ftp_host = ftpCreds.ftp_host
                                                                operation_data.ftp_username = ftpCreds.ftp_username
                                                                operation_data.ftp_password = ftpCreds.ftp_password
                                                                normal_message("Deploying React app...")
                                                                await universal_ftp_upload(operation_data, deployPath, 'rc_level5')
                                                            }).catch(err => error_handler(`ERR => REACT DEPLOYMENT CREDS: ${err}`, operation_data, 'rc_level5'))
                                                            
                                                        }).catch(err => error_handler(`ERR => BUILDS REMOTE UPDATE: ${err}`, operation_data, 'rc_level5'))

                                                    }).catch(err => error_handler(`ERR => SOURCE REMOTE UPDATE: ${err}`, operation_data, 'rc_level5'))

                                                }).catch(err => error_handler(`ERR => COPY BUILD TO NEW FOLDER: ${err}`, operation_data, 'rc_level5'))

                                            }).catch(err => error_handler(`ERR => REACT BUILD: ${err}`, operation_data, 'rc_level4'))

                                        }).catch(err => error_handler(`ERR => MAKE BUILD FOLDER: ${err}`, operation_data, 'rc_level4'))

                                    }).catch(err => error_handler(`ERR => CREATE BUILDS REMOTE: ${err} `, operation_data, 'rc_level3'))

                                }).catch(err => error_handler(`ERR =>  CREATE SOURCE REMOTE: ${err}`, operation_data, 'rc_level2'))

                            }).catch(err => error_handler(`ERR => WEB APP CREATION AFTER RES-GROUP CREATION: ${err}`, operation_data, 'rc_level2'))

                        }).catch(err => error_handler(`ERR => RESOURCE GROUP CREATION: ${err}`, operation_data, 'rc_level1'))
                     }

                 }).catch(err => error_handler(`ERR => RESOURCE GROUP CHECK: ${err}`, operation_data, 'rc_level1'))

             }).catch(err => error_handler(`ERR => AZURE LOGIN: ${err}`, operation_data, 'rc_level1'))

         }).catch(err => error_handler(`ERR => GIT ACCOUNT SETUP: ${err}`, operation_data, 'rc_level1'))

     }).catch(err => error_handler(`ERR: GIT AUTHORIZATION: ${err}`, operation_data, 'rc_level1'))
}



/**
 * Starts the deployment of a react application that the user already had
 * (either from previous scaffolding or from their own). It works with a different
 * type of giddy-config.json than the deployment of a newly scaffolded app
 * @param data
 */
const start_react = data => {
    let copyCmd;
    let newBuildFolderName = uuidv4()
    let azLoginCmd = `az login`
    let azFtpCredentialsCmd = `az webapp deployment list-publishing-profiles --name ${data.app_name} --resource-group ${data.resource_group_name} --query "[?contains(publishMethod, 'FTP')].[publishUrl,userName,userPWD]" --output json`
    let gitCmd = `cd ${data.source_code_path} && git add . && git commit -m "${data.commit_message}" && git push ${data.source_remote_name} ${data.source_branch_name} && cd ${data.builds_path} && git add . && git commit -m "${data.commit_message}" && git push ${data.builds_remote_name} ${data.builds_branch_name}`
    if(os.platform() === 'linux') copyCmd = `cp -R ${data.source_code_path}/build ${data.builds_path}/${newBuildFolderName}`
    if(os.platform() === 'win32') copyCmd = `xcopy ${data.source_code_path}\\build ${data.builds_path}\\${newBuildFolderName}\\build /E/H`
    let buildCmd = `cd ${data.source_code_path} && npm run build && cd ${data.builds_path} && mkdir ${newBuildFolderName} && cd ${pathMod.normalize(`${data.builds_path}/${newBuildFolderName}`)} && mkdir build && ${copyCmd}`

    success_message("Starting React deploy pipeline...")
    normal_message("Authorizing GitHub account...")

    authorizeGit(data.git_username, data.git_password)
    .then(msg => {
        success_message(msg)
        normal_message("Logging in to Azure...")
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
                            console.log(err)
                            error_message("Could not update repositories...Check your git credentials and try again...")
                            
                            reset_repo(data.source_code_path).then(msg => {
                                success_message("Source code repository reset successfully...")
                                normal_message("Resetting builds repository...")
                                
                                reset_repo(data.builds_path).then(msg => {
                                    success_message("Builds repository reset successfully")
                                    //here probably the build folder needs to be deleted as well
                                    //but the current implementation does not fully support it.
                                    //FIX: break down the commands so the copy of the build happens
                                    //     later and commit/push errors can be caught  
    
                                }).catch(err => {
                                    error_message(err)
                                    normal_message("Check the documentation for resolution of conflicts tips...")   
                                }).finally(() => process.exit(1))
                            
                            }).catch(err => {
                                error_message(err)
                                normal_message("Check the documentation for resolution of conflicts tips...")   
                            }).finally(() => process.exit(1))
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

    }).catch(err => error_message(err))
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
    let azLoginCmd = `az login`
    let gitCmd = `cd ${data.source_code_path} && npm install && git add . && git commit -m "${data.commit_message}" && git push ${data.source_remote_name} ${data.source_branch_name}`

    normal_message("Authorizing GitHub account...")
    authorizeGit(data.git_username, data.git_password)
    .then(msg => {
        success_message(msg)
        normal_message("Logging in to Azure...")
        exec(azLoginCmd, (err) => {
            if(err){
                error_message("Failed to login to Azure...Check your credentials and try again...")
                process.exit(1)
                
            }
            success_message("Logged in to Azure successfully...")
            normal_message("Retrieving deployment details...")
            let azFtpCredCmd = `az webapp deployment list-publishing-profiles --name ${data.app_name} --resource-group ${data.resource_group_name} --query "[?contains(publishMethod, 'FTP')].[publishUrl,userName,userPWD]" --output json`
            exec(azFtpCredCmd, (err, stdout) => {
                if(err){
                    error_message("Failed to retrieve app service details...Check the app name and try again...")
                    process.exit(1)
                    
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
                        reset_repo(data.source_code_path).then(msg => {
                            success_message(msg)
                            process.exit(1)
                        })
                        .catch(err => {
                            error_message(err)
                             normal_message("Check the documentation for resolution of conflicts tips...")   
                        })
                        .finally(() => process.exit(1))
                        return
                    }
                    success_message("Repository updated successfully...")
                    normal_message("Deploying app...")
                    await universal_ftp_upload(data, data.source_code_path, 'err-ftp-upload-node')
                })
            })
        })
    })
    .catch(err => error_message(err))
}


/**
 * Starts the scaffolding of an application irregardless of what type it is (react | node)
 * @param data
 * @param appType
 */
const scaffold_app = (data, appType) => {
    
    createProjectFolder(appType).then(msg => {

        success_message(msg)
        normal_message("Adding source code...")
        
        copySourceCode(appType).then(msg => {
            success_message(msg)
            if(appType === 'react') start_scaffolded_react(data)
            if(appType === 'node') start_scaffolded_node(data)
        }).catch(err => error_handler(`ERR => ADD SOURCE CODE: ${err}`))

    }).catch(err =>  error_handler(`ERR => CREATE PROJECT FOLDER: ${err}`))
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
 * the necessary cleanup after errors. Each error is flagged with 
 * a severity level that represents the operations that need to be
 * performed. Below is the decoding of reasons.
 * REASONS:
 * -> REACT:
 * rc_level1: del-react-src (delete source code folder)
 * rc_level2: del-react-src-and-res-gr (level1 + delete resource group)
 * rc_level3: del-react-src-res-gr-and-src-rem (level1 + level2 + delete source remote)
 * rc_level4: del-react-src-res-gr-and-rems (level1 + level2 + delete source remote)
 * rc_level5: del-react-all (level1 + level2 + level3 + level4 + delete builds folder)
 * rc_level1_1: del-react-src-app (level1 + delete app service)
 * rc_level1_2: del-react-src-app-src-rem (level1 + level1_1 + delete source remote)
 * rc_level1_3: del-react-src-app-rems (level1 + level1_1 + level1_2 + delete builds remote)
 * rc_level1_4: del-react-src-app-rems-bui (level1 + level1_1 + level1_2 + level1_3 + level1_4 + delete builds folder)
 * 
 * -> NODE:
 * nd_level1: del-node-src (delete source code)
 * nd_level2: del-node-src-res-gr (level1 + delete resource group)
 * nd_level3: del-node-all (leve1 + level2 + delete remote)
 * nd_level4: del-node-src-app (level1 + delete app service)
 * nd_level5: del-node-src-app-rem (level1 + level4 + delete remote)
 * 
 * 
 * @param reason error severity to take the corresponding action
 * @param operation_data data from giddy-config.json
 */
const cleanup = (reason, operation_data) => {
    // REACT
    if(reason === 'rc_level1') rc_level1()

    if(reason === 'rc_level2') rc_level2(operation_data)

    if(reason === 'rc_level3') rc_level3(operation_data)

    if(reason === 'rc_level4') rc_level4(operation_data)

    if(reason === 'rc_level5') rc_level5(operation_data)

    if(reason === 'rc_level1_1') rc_level1_1()

    if(reason === 'rc_level1_2') rc_level1_2()

    if(reason === 'rc_level1_3') rc_level1_3()

    if(reason === 'rc_level1_4') rc_level1_4()


    // NODE
    if(reason === 'nd_level1') nd_level1(operation_data)
    
    if(reason === 'nd_level2') nd_level2()

    if(reason === 'nd_level3') nd_level3()

    if(reason === 'nd_level4') nd_level4()

    if(reason === 'nd_level5') nd_level5()
}


/**
 * The promise error handler
 * @param {*} err 
 * @param {*} config 
 * @param {*} cleanup_reason 
 */
const error_handler = (err, config, cleanup_reason) => {
    error_message(err)
    cleanup(cleanup_reason, config)
}


/**
 * Promise to create the new project folder
 * @param {*} appType 
 * @returns 
 */
const createProjectFolder = appType => {
    let folderName = extract_scaffold_folder_name(appType)
    let desktopPath = extract_desktop_path()
    let createDirCmd = `cd ${desktopPath} && mkdir ${folderName}`

    return new Promise((resolve, reject) => {
        exec(createDirCmd, (err) => {
            if(err) reject(`Could not start a new ${appType} project. Exiting...`)
            resolve(`New ${appType} project folder created on your desktop...`)
        })
    })
}

/**
 * Promise to copy the source code to a new scaffolded application
 * @param {*} appType 
 * @returns 
 */
const copySourceCode = (appType) => {
    let copyCommand = extract_copy_command(appType)
    return new Promise((resolve, reject) => {
        exec(copyCommand, (err) => {
            if(err) reject("'Could not copy source code...Removing folder and exiting...'")
            resolve("Source code added successfully. You can now open your project in your IDE...")
        })
    })
}

/**
 * Promise to authorize git
 * @param {*} username 
 * @param {*} password 
 * @returns 
 */
const authorizeGit = (username, password) => {
    let authorizeCmd = `curl -i -u ${username}:${password} https://api.github.com/users/${username}`
    return new Promise((resolve, reject) => {
       exec(authorizeCmd, (err) => {
        if(err) reject("Could not confirm GitHub authorization...Check your credentials and try again...")
        resolve("Sucessfully authorized GitHub account...")
       })
    })
}

/**
 * Promise to set up local git configuration
 * @param {*} name 
 * @returns 
 */
const setupGit = name => {
    let gitCmd = `git config --global user.name ${name}`
    return new Promise((resolve, reject) => {
        exec(gitCmd, (err) => {
            if(err) reject("Failed to setup your GitHub account...Check your GitHub credentials and try again...")
            resolve("Git account set successfully...")
        })
    })
} 

/**
 * Promise to login to Azure
 * @returns 
 */
const loginToAzure = () => {
    let loginCmd = 'az login'
    return new Promise((resolve, reject) => {
        exec(loginCmd, (err) => {
            if(err) reject("Failed to login to Azure...Check your Azure credentials and try again...")
            resolve("Successfully logged in to Azure...")
        })
    })
}

/**
 * Promise to check if a resource group exists
 * @param {*} resource_group_name 
 * @returns 
 */
const checkIfResourceGroupExists = resource_group_name => {
    let checkResGroupCmd = `az group exists --name ${resource_group_name}`
    return new Promise((resolve, reject) => {
        exec(checkResGroupCmd, (err, stdout) => {
            if(err) reject("Could not check if resource group exists or not...Check the resource group name in your giddy-config.json and try again...")
            resolve(stdout.trim())
        })
    })
}

/**
 * Promise to create a new Resource Group
 * @param {*} resource_group_name 
 * @param {*} location 
 * @returns 
 */
const createResourceGroup = (resource_group_name, location) => {
    let createResGroupCmd = `az group create --name ${resource_group_name} --location ${location}`
    return new Promise((resolve, reject) => {
        exec(createResGroupCmd, (err) => {
            if(err) reject("Could not create resource group...Check the resource group name you gave and try again...")
            resolve("Resource group created sucessfully...")
        })
    })
}

/**
 * Promise to create a new App Service
 * @param {*} app_name 
 * @param {*} resource_group_name 
 * @returns 
 */
const createWebApp = (app_name, resource_group_name) => {
    let createWebAppCmd = `az webapp up --name ${app_name} --resource-group ${resource_group_name} --os-type Windows --runtime "node|14-lts" --sku FREE`
    return new Promise((resolve, reject) => {
        exec(createWebAppCmd, (err) => {
            if(err) reject("Could not create App Service...Check details of your giddy-config.json and try again...")
            resolve("App Service created sucessfully...")
        })
    })
}

/**
 * Promise to create a remote
 * @param {*} username 
 * @param {*} password 
 * @param {*} remote_name 
 * @returns 
 */
const createRemote = (username, password, remote_name) => {
    let createRemoteCmd = `curl -i -H "Authorization: token ${password}" -d "{\\"name\\":\\"${remote_name}\\", \\"auto_init\\":true,\\"private\\":true}" https://api.github.com/user/repos`
    return new Promise((resolve, reject) => {
        exec(createRemoteCmd, (err) => {
            if(err) reject("Could not create remote...Maybe the repo already exists, or your GitHub password was incorrect. Check your giddy-config.json and try again...")
            resolve({
                "remote_url": `https://github.com/${username}/${remote_name}.git`
            })
        })
    })
}

/**
 * Promise to initialize the local repo, add a remote, and push to it
 * @param {*} repo_path 
 * @param {*} repo_remote_url 
 * @param {*} commit_message 
 * @returns 
 */
const initRepo = (repo_path, repo_remote_url, commit_message) => {
    let initRepoCmd = `cd ${repo_path} && git init && git branch -m master main && git remote add origin ${repo_remote_url} && git add . && git commit -m "${commit_message}" && git push -f origin main`
    return new Promise((resolve, reject) => {
        exec(initRepoCmd, (err) => {
            if(err) reject("Could not update remote...Avoid handling the project folder during giddy operations...")
            resolve("Remote updated successfully...")
        })
    })
}

/**
 * Promise to install the node_modules (Only for Node.js)
 * @param {*} path 
 * @returns 
 */
const installModules = path => {
    let installModulesCmd = `cd ${path} && npm install`
    return new Promise((resolve, reject) => {
        exec(installModulesCmd, (err) => {
            if(err) reject("Could not install modules...Avoid processing of package.json during giddy operations...")
            resolve("Modules installed successfully...")
        })
    })
}

/**
 * Promise to get the FTP credentials of an App Service
 * @param {*} app_name 
 * @param {*} resource_group_name 
 * @returns 
 */
const getDeploymentCredentials = (app_name, resource_group_name) => {
    let ftpCredentials = `az webapp deployment list-publishing-profiles --name ${app_name} --resource-group ${resource_group_name} --query "[?contains(publishMethod, 'FTP')].[publishUrl,userName,userPWD]" --output json`
    return new Promise((resolve, reject) => {
        exec(ftpCredentials, (err, stdout) => {
            if(err) reject("Could not retrieve app service deployment credentials...Check your giddy-config.json and try again...")
            let response = JSON.parse(stdout)
            resolve({
                ftp_host: response[0][0],
                ftp_username: response[0][1],
                ftp_password: response[0][2]
            })
        })
    })
}

/**
 * Promise to create the folder for the new build (Only for React)
 * @returns 
 */
const makeBuildFolder = () => {
    let newBuildFolderName = uuidv4()
    let buildsFolder = `${pathMod.normalize(`${extract_desktop_path()}/giddy_react_builds`)}`
    let createFolderCmd = `mkdir ${buildsFolder} && cd ${buildsFolder} && mkdir ${newBuildFolderName}`

    return new Promise((resolve, reject) => {
        exec(createFolderCmd, (err) => {
            if(err) reject("Could not create builds folder...Maybe a giddy_react_builds folder already exists from a previous project?")
            resolve({
                "msg": "Project folder created successfully...",
                "newBuildFolderPath": `${pathMod.normalize(`${extract_desktop_path()}/giddy_react_builds/${newBuildFolderName}`)}`
            })
        })
    })
}

/**
 * Promise to start the build (Only for React)
 * @returns 
 */
const startReactBuild = () => {
    let projectPath = pathMod.normalize(`${extract_desktop_path()}/giddy_react`)
    let buildCmd = `cd ${projectPath} && npm install && npm run build`
    return new Promise((resolve, reject) => {
        exec(buildCmd, (err) => {
            if(err) reject("Could not create build")
            resolve("Build created successfully...")
        })
    })
}

/**
 * Promise to copy the build to a new path (Only for React)
 * @param {*} source path of build
 * @param {*} destination destination path to be copies to
 * @returns 
 */
const copyBuildToNewPath = (source, destination) => {
    let copyCmd = `cp -R ${source} ${destination}`
    if(os.platform() === 'win32') copyCmd = `xcopy ${source} ${destination} /E /H`
    return new Promise((resolve, reject) => {
        exec(copyCmd, err => {
            if(err) reject("Could not copy build to builds folder...")
            resolve("Build moved successfully...")
        })
    })
}




module.exports = {
    start_react,
    scaffold_app,
    start_node,
    start_scaffolded_react
}
