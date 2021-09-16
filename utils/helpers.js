const os = require('os')
const pathMod = require('path')
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
    if(os.platform() === 'linux') copyCommand = `cd ${scaffoldsPath} && cp -R . ${desktopPath}/${folderName}`
    return copyCommand
}


module.exports = {
    extract_desktop_path,
    extract_scaffold_folder_name,
    extract_copy_command
}