const { extract_desktop_path } = require('./helpers')
const { success_message, error_message } = require('./message_types')
const pathMod = require('path')

const { delete_folder, delete_app_service,
        delete_resource_group, delete_remote
    } = require('./error_promises')

/**
 * 
 */
const rc_level1 = () => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_react`))
    .then(msg => success_message(msg))
    .catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 * @param {*} operation_data 
 */
const rc_level2 = operation_data => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_react`))
    .then(msg => {
        success_message(msg)
        
        delete_resource_group(operation_data.resource_group_name)
        .then(msg => success_message(msg))
        .catch(err => error_message(err))
        .finally(() => process.exit(0))
    })
    .catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 * @param {*} operation_data 
 */
const rc_level3 = operation_data => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_react`))
    .then(msg => {
        success_message(msg)
        
        delete_resource_group(operation_data.resource_group_name)
        .then(msg => {
            success_message(msg)

            delete_remote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-source`)
            .then(msg => success_message(msg))
            .catch(err => error_message(err))
            .finally(() => process.exit(0))
        
        }).catch(err => error_message(err))
        .finally(() => process.exit(0))
    
    }).catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 * @param {*} operation_data 
 */
const rc_level4 = operation_data => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_react`))
    .then(msg => {
        success_message(msg)
        
        delete_resource_group(operation_data.resource_group_name)
        .then(msg => {
            success_message(msg)

            delete_remote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-source`)
            .then(msg => {
                success_message(msg)
                
                delete_remote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-builds`)
                .then(msg => success_message(msg))
                .catch(err => error_message(err))
                .finally(() => process.exit(0))

            }).catch(err => error_message(err))
            .finally(() => process.exit(0))
        
        }).catch(err => error_message(err))
        .finally(() => process.exit(0))
    
    }).catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 * @param {*} operation_data 
 */
const rc_level5 = operation_data => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_react`))
    .then(msg => {
        success_message(msg)
        
        delete_resource_group(operation_data.resource_group_name)
        .then(msg => {
            success_message(msg)

            delete_remote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-source`)
            .then(msg => {
                success_message(msg)
                
                delete_remote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-builds`)
                .then(msg => {
                    success_message(msg)

                    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_react_builds`))
                    .then(msg => success_message(msg))
                    .catch(err => error_message(err))
                    .finally(() => process.exit(0))

                }).catch(err => error_message(err))
                .finally(() => process.exit(0))

            }).catch(err => error_message(err))
            .finally(() => process.exit(0))
        
        }).catch(err => error_message(err))
        .finally(() => process.exit(0))
    
    }).catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 * @param {*} operation_data 
 */
const rc_level1_1 = operation_data => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_react`))
    .then(msg => {
        success_message(msg)
        
        delete_app_service(operation_data.app_name, operation_data.resource_group_name)
        .then(msg => success_message(msg))
        .catch(err => error_message(err))
        .finally(() => process.exit(0))
    })
    .catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 * @param {*} operation_data 
 */
const rc_level1_2 = operation_data => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_react`))
    .then(msg => {
        success_message(msg)
        
        delete_app_service(operation_data.app_name, operation_data.resource_group_name)
        .then(msg => {
            success_message(msg)
            delete_remote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-source`)
            .then(msg => success_message(msg))
            .catch(err => error_message(err))
            .finally(() => process.exit(0))

        }).catch(err => error_message(err))
        .finally(() => process.exit(0))
    })
    .catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 * @param {*} operation_data 
 */
const rc_level1_3 = operation_data => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_react`))
    .then(msg => {
        success_message(msg)
        
        delete_app_service(operation_data.app_name, operation_data.resource_group_name)
        .then(msg => {
            success_message(msg)

            delete_remote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-source`)
            .then(msg => {
                success_message(msg)
                
                delete_remote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-builds`)
                .then(msg => success_message(msg))
                .catch(err => error_message(err))
                .finally(() => process.exit(0))

            }).catch(err => error_message(err))
            .finally(() => process.exit(0))
        
        }).catch(err => error_message(err))
        .finally(() => process.exit(0))
    
    }).catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 */
const rc_level1_4 = () => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_react`))
    .then(msg => {
        success_message(msg)
        
        delete_app_service(operation_data.app_name, operation_data.resource_group_name)
        .then(msg => {
            success_message(msg)

            delete_remote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-source`)
            .then(msg => {
                success_message(msg)
                
                delete_remote(operation_data.git_username, operation_data.git_password, `${operation_data.app_name}-builds`)
                .then(msg => {
                    success_message(msg)
                    
                    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_react_builds`))
                    .then(msg => success_message(msg))
                    .catch(err => error_message(err))
                    .finally(() => process.exit(0))
                
                }).catch(err => error_message(err))
                .finally(() => process.exit(0))

            }).catch(err => error_message(err))
            .finally(() => process.exit(0))
        
        }).catch(err => error_message(err))
        .finally(() => process.exit(0))
    
    }).catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 */
const nd_level1 = () => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_node`))
    .then(msg => success_message(msg))
    .catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 * @param {*} operation_data 
 */
const nd_level2 = operation_data => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_node`))
    .then(msg => {
        success_message(msg)
        
        delete_resource_group(operation_data.resource_group_name)
        .then(msg => success_message(msg))
        .catch(err => error_message(err))
        .finally(() => process.exit(0))

    }).catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 * @param {*} operation_data 
 */
const nd_level3 = operation_data => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_node`))
    .then(msg => {
        success_message(msg)
        
        delete_resource_group(operation_data.resource_group_name)
        .then(msg => {
            success_message(msg)
            
            delete_remote(operation_data.git_username, operation_data.git_password, operation_data.app_name)
            .then(msg => success_message(msg))
            .catch(err => error_message(err))
            .finally(() => process.exit(0))
        
        }).catch(err => error_message(err))
        .finally(() => process.exit(0))

    }).catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 * @param {*} operation_data 
 */
const nd_level4 = operation_data => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_node`))
    .then(msg => {
        success_message(msg)
        
        delete_app_service(operation_data.app_name, operation_data.resource_group_name)
        .then(msg => success_message(msg))
        .catch(err => error_message(err))
        .finally(() => process.exit(0))

    }).catch(err => error_message(err))
    .finally(() => process.exit(0))
}

/**
 * 
 * @param {*} operation_data 
 */
const nd_level5 = operation_data => {
    delete_folder(pathMod.normalize(`${extract_desktop_path()}/giddy_node`))
    .then(msg => {
        success_message(msg)
        
        delete_app_service(operation_data.app_name, operation_data.resource_group_name)
        .then(msg => {
            success_message(msg)
            
            delete_remote(operation_data.git_username, operation_data.git_password, operation_data.app_name)
            .then(msg => success_message(msg))
            .catch(err => error_message(err))
            .finally(() => process.exit(0))

        }).catch(err => error_message(err))
        .finally(() => process.exit(0))

    }).catch(err => error_message(err))
    .finally(() => process.exit(0))
}


module.exports = {
    rc_level1, rc_level2, rc_level3, rc_level4, rc_level5,
    rc_level1_1, rc_level1_2, rc_level1_3, rc_level1_4,
    nd_level1, nd_level2, nd_level3, nd_level4, nd_level5
}