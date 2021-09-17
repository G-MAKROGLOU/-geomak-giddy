const {normal_message} = require('./message_types')
const {exec} = require('child_process')
const fs = require('fs')

/**
 *Promise to reset the last commit of a repository
 * @param path_to_repo
 */
 const reset_repo = path_to_repo => {
    let resetCmd = `cd ${path_to_repo} && git reset --soft HEAD~1`
    normal_message("Resetting repository...")
    return new Promise((resolve, reject) => {
        exec(resetCmd, (err) => {
            if(err) reject("Failed to reset repo...Restore repo manually and rerun @Giddy. Check npm documentation for conflict resolution tips...")
            resolve("Successfully unstaged last commit...")
        })
    })
}

/**
 * Promise to delete a folder
 * @param {*} path_to_folder 
 * @returns 
 */
const delete_folder = path_to_folder => {
    return new Promise((resolve, reject) => {
        fs.rm(path_to_folder, {recursive: true}, (err) => {
            if(err) reject("Failed to delete folder...Perform the cleanup manually and try again")
            resolve("Folder deleted successfully...")
        })
    })
}

const delete_app_service = (app_name, res_group_name) => {
    let deleteAScmd = `az webapp delete --name ${app_name} --resource-group ${res_group_name}`
    return new Promise((resolve, reject) => {
        exec(deleteAScmd, (err) => {
            if(err) reject("Failed to delete App Service...Perform the cleanup manually and try again...")
            resolve("App Service deleted successfully...")
        })
    })
}

const delete_resource_group = resource_group => {
    let deleteAScmd = `az group delete --name ${resource_group}`
    return new Promise((resolve, reject) => {
        exec(deleteAScmd, (err) => {
            if(err) reject("Failed to delete Resource Group...Perform the cleanup manually and try again...")
            resolve("Resource Group deleted successfully...")
        })
    })
}


const delete_remote = (username, password, repo_name) => {
    let delRemoteCmd = `curl -X DELETE -H \"Authorization: token ${password}\" https://api.github.com/repos/${username}/${repo_name}`
    return new Promise((resolve, reject) => {
        exec(delRemoteCmd, (err) => {
            if(err) reject("Failed to delete remote...Perform the cleanup manually and try again...")
            resolve("Remote deleted successfully...")
        })
    })
}


module.exports = {
    reset_repo,
    delete_folder,
    delete_app_service,
    delete_resource_group,
    delete_remote
}