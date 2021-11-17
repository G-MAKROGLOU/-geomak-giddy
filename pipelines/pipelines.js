const {error_message, success_message, normal_message} = require('../utils/message_types')
const {extract_desktop_path, extract_scaffold_folder_name, extract_copy_command} = require('../utils/helpers')
const {se_level1, se_level2, se_level3, se_level4, se_level5} = require('../utils/pipeline_errors')

const {reset_repo} = require('../utils/error_promises')

const {exec} = require('child_process')
const pathMod = require('path')
const ftp = require('basic-ftp')

/**
 * This subroutine is common among node and react scaffolding pipelines.
 * It performs basic authorization checks, app service checks and resource
 * group checks
 * @param operation_data
 * @param appType
 * @returns {Promise<unknown>}
 */
const common_initial_subroutine_for_scaffolds = async (operation_data, appType) => {
    try{
        normal_message("Authorizing GitHub account...")
        let success_msg = await authorizeGit(operation_data.git_username, operation_data.git_password)
        success_message(success_msg)
        normal_message("Setting up GitHub account credentials...")
        success_msg = await setupGit(operation_data.git_username)
        success_message(success_msg)
        normal_message("Logging in to Azure...")
        success_msg = await loginToAzure()
        success_message(success_msg)
        normal_message(`Checking if resource group ${operation_data.resource_group_name} exists...`)
        return await checkIfResourceGroupExists(operation_data.resource_group_name)
    }catch(err){
        await error_handler(err.message, operation_data, err.code, appType)
    }
}

/**
 * This subroutine was common between the branching if-else
 * statement after the resource group check and so it was
 * isolated in a separate reusable function
 * @param operation_data
 * @param exists
 * @returns {Promise<void>}
 */
const node_subroutine_for_web_app = async (operation_data, exists) => {
   try {
       normal_message("Creating App Service...")
       let success_msg = await createWebApp(operation_data.app_name, operation_data.resource_group_name, exists, operation_data.app_service_plan)
       success_message(success_msg)
       normal_message("Creating remote...")
       let response = await createRemote(operation_data.git_username, operation_data.git_password, operation_data.app_name, exists)
       let path = `${pathMod.normalize(`${extract_desktop_path()}/giddy_node`)}`
       success_message("Remote created successfully...")
       normal_message("Updating remote...")
       success_msg = await initRepo(path, response.remote_url, operation_data.commit_message, exists)
       success_message(success_msg)
       normal_message("Installing node modules...")
       success_msg = await installModules(path, exists)
       success_message(success_msg)
       normal_message("Retrieving deployment credentials...")
       let deployment_credentials = await getDeploymentCredentials(operation_data.app_name, operation_data.resource_group_name, exists)
       success_message("Deployment credentials retrieved successfully...")
       normal_message("Deploying app...This may take a while...")
       operation_data.ftp_host = deployment_credentials.ftp_host;
       operation_data.ftp_username = deployment_credentials.ftp_username;
       operation_data.ftp_password = deployment_credentials.ftp_password;
       await universal_ftp_upload(operation_data, path, exists ? 'se_level4' : 'se_level5')
   }catch(err){
       await error_handler(err.message, operation_data, err.code, 'node')
   }
}

/**
 * This subroutine was common between the branching if-else
 * statement after the resource group check and so it was
 * isolated in a separate reusable function
 * @param operation_data
 * @param exists
 * @returns {Promise<void>}
 */
const react_subroutine_for_webapp = async (operation_data, exists) => {
    try{
        normal_message("Creating App Service...")
        let success_msg = await createWebApp(operation_data.app_name, operation_data.resource_group_name, exists, operation_data.app_service_plan)
        success_message(success_msg)
        normal_message("Creating source code remote...")
        let remote_url = await createRemote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}`, exists)
        success_message("Remote created successfully...")
        normal_message("Starting build script...")
        success_msg = await startReactBuild(exists)
        success_message(success_msg)
        normal_message("Updating remote...")
        let sourcePath = pathMod.normalize(`${extract_desktop_path()}/giddy_react`)
        success_msg = await initRepo(sourcePath, remote_url.remote_url, operation_data.commit_message, exists)
        success_message(success_msg)
        normal_message("Retrieving deployment credentials...")
        let ftp_credentials = await getDeploymentCredentials(operation_data.app_name, operation_data.resource_group_name, exists)
        success_message("Deployment credentials retrieved successfully...")
        let deployPath = `${pathMod.normalize(`${extract_desktop_path()}/giddy_react/build`)}`
        operation_data.ftp_host = ftp_credentials.ftp_host
        operation_data.ftp_username = ftp_credentials.ftp_username
        operation_data.ftp_password = ftp_credentials.ftp_password
        normal_message("Deploying React app...")
        await universal_ftp_upload(operation_data, deployPath, exists ? 'se_level4' : 'se_level5')
    }catch(err){
        await error_handler(err.message, operation_data, err.code, 'react')
    }
}


/**
 * Starts the deployment of a newly scaffolded application. This functions does
 * a lot and so it will be broken down to smaller functions that can probably be
 * reused for node.js deployment as well (e.g ftp-function etc.). The main difference between this function
 * and the react version of it, it that node does need build and it is uploaded along with the node_modules folder
 * @param operation_data
 */
 const start_scaffolded_node = async operation_data => {
     try {
         let exists = await common_initial_subroutine_for_scaffolds(operation_data, 'node')
         if(exists){
             success_message(`Resource group ${operation_data.resource_group_name} was found...`)
             normal_message("Checking if App Service Plan exists...")
             let aspListLength = await checkIfAppServicePlanExists(operation_data.app_service_plan)
             if(aspListLength === 0){
                 normal_message("The app service plan was not found...Creating app service plan")
                 let aspMsg = await createAppServicePlan(operation_data)
                 success_message(aspMsg)
             }else{
                 normal_message("App Service plan was found...")
             }
             await node_subroutine_for_web_app(operation_data, true,  'node')
             return
         }
         success_message(`Resource group ${operation_data.resource_group_name} was not found...`)
         normal_message("Creating the resource group...")
         let success_msg = await createResourceGroup(operation_data.resource_group_name, operation_data.location)
         success_message(success_msg)
         normal_message("Checking if App Service Plan exists...")
         let aspListLength = await checkIfAppServicePlanExists(operation_data.app_service_plan)
         if(aspListLength === 0){
             normal_message("The app service plan was not found...Creating app service plan")
             let aspMsg = await createAppServicePlan(operation_data)
             success_message(aspMsg)
         }else{
             normal_message("App Service plan was found...")
         }
         await node_subroutine_for_web_app(operation_data, false)

     }catch(err){
         await error_handler(err.message, operation_data, err.code, 'node')
     }
}


/**
 * Starts the deployment of a newly scaffolded application. This functions does
 * a lot and so it will be broken down to smaller functions that can probably be
 * reused for node.js deployment as well (e.g ftp-function etc.).
 * @param operation_data
 */
 const start_scaffolded_react = async operation_data => {
     let exists = true;
     try{
         exists = await common_initial_subroutine_for_scaffolds(operation_data, 'react')
         if(exists){
             success_message(`Resource group ${operation_data.resource_group_name} was found...`)
             normal_message("Checking if App Service Plan exists...")
             let aspListLength = await checkIfAppServicePlanExists(operation_data.app_service_plan)
             if(aspListLength === 0){
                 normal_message("The app service plan was not found...Creating app service plan")
                 let aspMsg = await createAppServicePlan(operation_data)
                 success_message(aspMsg)
             }else{
                 normal_message("App Service plan was found...")
             }
             await react_subroutine_for_webapp(operation_data, 'react')
             return
         }
         success_message(`Resource group ${operation_data.resource_group_name} was not found...`)
         normal_message("Creating the resource group...")
         let success_msg = await createResourceGroup(operation_data.resource_group_name, operation_data.location)
         success_message(success_msg)
         normal_message("Checking if App Service Plan exists...")
         let aspListLength = await checkIfAppServicePlanExists(operation_data.app_service_plan)
         if(aspListLength === 0){
             normal_message("The app service plan was not found...Creating app service plan")
             let aspMsg = await createAppServicePlan(operation_data)
             success_message(aspMsg)
         }else{
             normal_message("App Service plan was found...")
         }
         await react_subroutine_for_webapp(operation_data, 'react')
     }catch(err){
         await error_handler(err.message, operation_data, exists ? 'se_level4' : 'se_level3', 'react')
     }
}



/**
 * Starts the deployment of a react application that the user already had
 * (either from previous scaffolding or from their own). It works with a different
 * type of giddy-config.json than the deployment of a newly scaffolded app
 * @param data
 */
const start_react = data => {
    let azLoginCmd = `az login`
    let azFtpCredentialsCmd = `az webapp deployment list-publishing-profiles --name ${data.app_name} --resource-group ${data.resource_group_name} --query "[?contains(publishMethod, 'FTP')].[publishUrl,userName,userPWD]" --output json`
    let gitCmd = `cd ${data.source_code_path} && git add . && git commit -m "${data.commit_message}" && git push ${data.remote_name} ${data.branch_name}`
    let buildCmd = `cd ${data.source_code_path} && npm run build`

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
                    exec(gitCmd, async (err) => {
                        if(err){
                            error_message("Could not update repositories...Check your git credentials and try again...")
                            try{
                                let reset_msg = await reset_repo(data.source_code_path);
                                success_message(reset_msg)
                            }catch(err){
                                error_message(err)
                                normal_message("Check the documentation for resolution of conflicts tips...")
                            }
                            finally {
                                process.exit(1)
                            }
                            return
                        }
                        success_message("Successfully updated repository...")
                        normal_message("Deploying app...")
                        let path = pathMod.normalize(`${data.source_code_path}/build`)
                        await universal_ftp_upload(data, path, 'none', 'react')
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
 */
const start_node = data => {
    success_message('Starting Node.js deploy pipeline...')
    let azLoginCmd = `az login`
    let gitCmd = `cd ${data.source_code_path} && npm install && git add . && git commit -m "${data.commit_message}" && git push ${data.remote_name} ${data.branch_name}`

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
                    await universal_ftp_upload(data, data.source_code_path, 'none', 'node')
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
const scaffold_app = async (data, appType) => {
    try {
        let create_project_msg = await createProjectFolder(appType)
        success_message(create_project_msg)
        normal_message("Adding source code...")
        let copy_source_code_msg = await copySourceCode(appType)
        success_message(copy_source_code_msg)
        if(appType === 'react') await start_scaffolded_react(data)
        if(appType === 'node') await start_scaffolded_node(data)

    }catch(err){
       await error_handler(`ERR => APP SCAFFOLDING: `, data, err, appType)
    }
}


/**
 * Async FTP client to upload the project on Azure. With minimal modification on the "host" property
 * it can upload to any ftp server
 * @param operation_data The data from config.json file provided by the user
 * @param sourceCodePath The path to the folder containing the code to be uploaded
 * @param cleanupReason
 * @param appType
 * @returns {Promise<void>} Instead of chaining a promise resolution, the errors are handled by a try-catch block
 */
const universal_ftp_upload = async (operation_data, sourceCodePath, cleanupReason, appType) => {
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
    }catch(err){
        let errorMessage = "Deployment failed. Cleaning up resources...."
        await error_handler(errorMessage, operation_data, cleanupReason, appType);
    }
    finally {
        client.close()
    }
}

/**
 * Cleanup function that receives the reason for cleanup and performs
 * the necessary cleanup after errors. Each error is flagged with 
 * a severity level that represents the operations that need to be
 * performed. Below is the decoding of reasons.
 *
 * se_level1 => delete folder
 * se_level2 => delete folder & app
 * se_level3 => delete folder & resource group
 * se_level4 => delete folder, app & remote
 * se_level5 => delete folder, resource group and remote
 * none => process.exit(1)
 *
 * @param reason error severity to take the corresponding action
 * @param operation_data data from giddy-config.json
 * @param appType
 */
const cleanup = async (reason, operation_data, appType) => {
   try{
       let path = pathMod.normalize(`${extract_desktop_path()}/giddy_${appType}`)

       if(reason === 'none') process.exit(0)

       if(reason === 'se_level1') await se_level1(path)

       if(reason === 'se_level2') await se_level2(path, operation_data.app_name, operation_data.resource_group_name)

       if(reason === 'se_level3') await se_level3(path, operation_data.app_name, operation_data.resource_group_name)

       if(reason === 'se_level4') await se_level4('',  operation_data.app_name, operation_data.resource_group_name, operation_data.git_username, operation_data.git_password)

       if(reason === 'se_level5') await se_level5(path,  operation_data.app_name, operation_data.resource_group_name, operation_data.git_username, operation_data.git_password)

   }catch(err){
       error_message(err)
       process.exit(1)
   }

}


/**
 * The promise error handler
 * @param {*} err 
 * @param {*} config 
 * @param {*} cleanup_reason
 * @param {*} appType
 */
const error_handler = async (err, config, cleanup_reason, appType) => {
    error_message(err)
    await cleanup(cleanup_reason, config, appType)
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
            if(err) reject("pr_level1")
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
        if(err)
            reject({
                message: "ERR => GIT AUTHORIZATION: Could not confirm GitHub authorization...Check your credentials and try again...",
                code: 'se_level1'
            })
        resolve("Successfully authorized GitHub account...")
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
            if(err) reject({
                message: "ERR => GIT ACCOUNT SETUP: Failed to setup your GitHub account...Check your GitHub credentials and try again...",
                code: 'se_level1'
            })
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
            if(err) reject({
                message: "ERR => AZURE LOGIN: Failed to login to Azure...Check your Azure credentials and try again...",
                code: 'se_level1'
            })
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
            if(err) reject({
                message: "ERR => RESOURCE GROUP CHECK: Could not check if resource group exists or not...Check the resource group name in your giddy-config.json and try again...",
                code: 'se_level1'
            })
            if(stdout.trim() === 'true') resolve(true)
            if(stdout.trim() === 'false') resolve(false)
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
            if(err) reject({
                message: "ERR => RESOURCE GROUP CREATION: Could not create resource group...Check the resource group name you gave and try again...",
                code: 'se_level2'
            })
            resolve("Resource group created successfully...")
        })
    })
}

/**
 * Promise to check if an app service plan exists
 * @param app_service_plan
 * @returns {Promise<unknown>}
 */
const checkIfAppServicePlanExists = app_service_plan => {
    let aspExistsCmd = `az appservice plan list --query "[?name=='${app_service_plan}']"`
    return new Promise((resolve, reject) => {
        exec(aspExistsCmd, (err, stdout) => {
            if(err) reject({
                "message": "ERR => APP SERVICE PLAN EXISTS: Could not check if App Service Plan exists...",
                "code": ""
            })
            let response = JSON.parse(stdout);
            resolve(response.length)
        })
    })
}

/**
 * Promise to create an App Service Plan
 * @param config
 * @returns {Promise<unknown>}
 */
const createAppServicePlan = config => {
    let createAspCmd = `az appservice plan create --name ${config.app_service_plan} --resource-group ${config.resource_group_name} --location ${config.location} --sku FREE`
    return new Promise((resolve, reject) => {
        exec(createAspCmd, (err, stdout) => {
            if(err) reject({
                "message": "",
                "code": ""
            })
            resolve("App Service Plan created successfully...")
        })
    })
}

/**
 * Promise to create a new App Service
 * @param {*} app_name 
 * @param {*} resource_group_name
 * @param {*} exists
 * @returns 
 */
const createWebApp = (app_name, resource_group_name, exists, asp_name) => {
    let createWebAppCmd = `az webapp create --name ${app_name} --resource-group ${resource_group_name} --plan ${asp_name} --runtime "node|14-lts"`
    return new Promise((resolve, reject) => {
        exec(createWebAppCmd, (err) => {
            if(err) reject({
                message: "ERR => WEB APP CREATION: Could not create App Service...Check details of your giddy-config.json and try again...",
                code: exists ? 'se_level2' : 'se_leve3'
            })
            resolve("App Service created successfully...")
        })
    })
}

/**
 * Promise to create a remote
 * @param {*} username 
 * @param {*} password 
 * @param {*} remote_name
 * @param {*} exists
 * @returns 
 */
const createRemote = (username, password, remote_name, exists) => {
    let createRemoteCmd = `curl -i -H "Authorization: token ${password}" -d "{\\"name\\":\\"${remote_name}\\", \\"auto_init\\":true,\\"private\\":true}" https://api.github.com/user/repos`
    return new Promise((resolve, reject) => {
        exec(createRemoteCmd, (err) => {
            if(err) reject({
                message: "ERR => CREATE NODE REMOTE: Could not create remote...Maybe the repo already exists, or your GitHub password was incorrect. Check your giddy-config.json and try again...",
                code: exists ? 'se_level2' : 'se_level3'
            })
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
 * @param {*} exists
 * @returns 
 */
const initRepo = (repo_path, repo_remote_url, commit_message, exists) => {
    let initRepoCmd = `cd ${repo_path} && git init && git branch -m master main && git remote add origin ${repo_remote_url} && git add . && git commit -m "${commit_message}" && git push -f origin main`
    return new Promise((resolve, reject) => {
        exec(initRepoCmd, (err) => {
            if(err) reject({
                message: "ERR => REMOTE UPDATE: Could not update remote...Avoid handling the project folder during giddy operations...",
                code: exists ? 'se_level4' : 'se_leve5'
            })
            resolve("Remote updated successfully...")
        })
    })
}

/**
 * Promise to install the node_modules (Only for Node.js)
 * @param {*} path
 * @param {*} exists
 * @returns 
 */
const installModules = (path, exists) => {
    let installModulesCmd = `cd ${path} && npm install`
    return new Promise((resolve, reject) => {
        exec(installModulesCmd, (err) => {
            if(err) reject({
                message: "ERR => NODE MODULES INSTALLATION: Could not install modules...Avoid processing of package.json during giddy operations...",
                code: exists ? 'se_level4' : 'se_level5'
            })
            resolve("Modules installed successfully...")
        })
    })
}

/**
 * Promise to get the FTP credentials of an App Service
 * @param {*} app_name 
 * @param {*} resource_group_name
 * @param {*} exists
 * @returns 
 */
const getDeploymentCredentials = (app_name, resource_group_name, exists) => {
    let ftpCredentials = `az webapp deployment list-publishing-profiles --name ${app_name} --resource-group ${resource_group_name} --query "[?contains(publishMethod, 'FTP')].[publishUrl,userName,userPWD]" --output json`
    return new Promise((resolve, reject) => {
        exec(ftpCredentials, (err, stdout) => {
            if(err) reject({
                message: "ERR => APP SERVICE DEPLOYMENT CREDENTIALS: Could not retrieve app service deployment credentials...Check your giddy-config.json and try again...",
                code: exists ? 'se_level4' : 'se_level5'
            })
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
 * Promise to start the build (Only for React)
 * @param {*} exists
 * @returns 
 */
const startReactBuild = exists => {
    let projectPath = pathMod.normalize(`${extract_desktop_path()}/giddy_react`)
    let buildCmd = `cd ${projectPath} && npm install && npm run build`
    return new Promise((resolve, reject) => {
        exec(buildCmd, (err) => {
            if(err) reject({
                message: "ERR => REACT BUILD: Could not create build",
                code: exists ? 'se_level2' : 'se_level3'
            })
            resolve("Build created successfully...")
        })
    })
}


module.exports = {
    start_react,
    scaffold_app,
    start_node,
    start_scaffolded_react
}
