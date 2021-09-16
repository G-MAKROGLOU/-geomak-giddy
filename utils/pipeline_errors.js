const { success_message, error_message } = require('./message_types')

const { delete_folder, delete_app_service,
        delete_resource_group, delete_remote
    } = require('./error_promises')

const se_level1 = async path => {
    try{
        let success_msg = await delete_folder(path)
        success_msg(success_msg)
        process.exit(0)
    }catch(err){
        error_message(err)
    }
}


const se_level2 = async (path, app_name, resource_group_name) => {
    try{
        let success_msg = await delete_folder(path)
        success_message(success_msg)
        success_msg = await delete_app_service(app_name, resource_group_name)
        success_message(success_msg)
        process.exit(0)
    }catch(err){
        error_message(err)
    }
}


const se_level3 = async (path, app_name, resource_group_name) => {
    try{
        let success_msg = await delete_folder(path)
        success_message(success_msg)
        success_msg = await delete_resource_group(resource_group_name)
        success_message(success_msg)
        process.exit(0)
    }catch(err){
        error_message(err)
    }
}


const se_level4 = async (path, app_name, resource_group_name, username, password) => {
    try{
        let success_msg = await delete_folder(path)
        success_message(success_msg)
        success_msg = await delete_app_service(app_name, resource_group_name)
        success_message(success_msg)
        success_msg = await delete_remote(username, password, app_name)
        success_message(success_msg)
        process.exit(0)
    }catch(err){
        error_message(err)
    }
}


const se_level5 = async (path, app_name, resource_group_name, username, password) => {
    try{
        let success_msg = await delete_folder(path)
        success_message(success_msg)
        success_msg = await delete_resource_group(app_name, resource_group_name)
        success_message(success_msg)
        success_msg = await delete_remote(username, password, app_name)
        success_message(success_msg)
        process.exit(0)
    }catch(err){
        error_message(err)
    }
}

module.exports = {
    se_level1,
    se_level2,
    se_level3,
    se_level4,
    se_level5
}