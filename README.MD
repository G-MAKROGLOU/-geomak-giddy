# What is Giddy
Giddy is an automated pipeline tool built with Node.js that makes the deployment
of React applications on Azure feel like a breeze. You simply provide Giddy with
a <code>.json</code> config file and the rest are done for you automatically (except from Git credentials
insertion). However, forget about build, logging in, retrieving details,
pushing to repositories etc.

### Full project source code can be found [here]

# Installation

In order to run Giddy from anywhere on your computer you need to install
it globally. 

```npm
npm i -g @geomak/giddy
```

# How to use it

Once installed, you can run:
```npm
giddy /absolute/path/to/json/config
```

# What you will need

1) Node.js
2) Git
3) azure-cli-tools ^2.0
4) An already created App Service
5) A React project with an initialized Git repository
6) A folder for your builds with an initialized repository

# Why two repositories?

In order to do provide easier versioning and be able to revert to previous deployments,
Giddy does two things:
1) It builds the project, and then moves the build folder to a separate 
folder with all the previous builds.

2) It commits both the source code and the build with the same comment,
so it is easier to revert to a previous build by doing a proper versioning.

That way you always have your source code separate from your builds,
and you can perform operations on both repositories. 
E.g. Retrieve an older build to redeploy, 
     retrieve an older source to work with etc.


# JSON config template

```json
{
  "az_username": "<the email you use to login to Azure>",
  "az_password": "<the password you use to login to Azure>",
  "app_service_name": "<the name of the App Service>",
  "source_code_path": "/full/path/to/source/code",
  "builds_path": "/full/path/to/builds/folder",
  "source_remote_name": "<the name of your source code remote>",
  "source_branch_name": "<the name of the branch of your source code repository>",
  "builds_remote_name": "<the name of your builds remote>",
  "builds_branch_name": "<the name of the branch of your builds repository>",
  "commit_message": "<a commit message e.g. v1.0.0>" 
}
```
The above template is the standard template that Giddy recognizes in order to start the
automated build/push/deploy pipeline. The values are pretty self-explanatory, and you can find 
a full usage guide lower in this README file

# Usage guide from scratch

## Step 1: Create an Azure App Service

In Azure Portal click on App Services and then <code>+Create</code> to create a new App Service.

![Create App Service](./readme_images/create_app_service.png)

The name you will give to your app is what needs to be put in the 
<code>"app_service_name"</code> property of your <code>giddy-config.json</code>  

## Step 2: Create a React project
    
This applies to any React project, but for the sake of the tutorial let's go with a new empty project
with <code>create-react-app</code>. Once scaffolding is finished, make sure that a local repository is initialized.
If it isn't, initialize a local repository with <code>git init</code> and add <code>/node_modules</code> to it. The path to your project
is what goes in the <code>"source_code_path"</code> property of your <code>giddy-config.json</code>
    
## Step 3: Create a folder for your builds and initialize it as a git repository

Create a folder anywhere on your computer, navigate inside it, and initialize it as local repository.
The path to this folder is what goes in the <code>"builds_path"</code> property of your <code>giddy-config.json</code>

## Step 4: Create the remotes
    
Login to your GitHub account and create two repositories, one for the source code and one for the builds.
Then create an authorization token to use as your password. From Aug 13, 2021 and onwards, GitHub uses 
authentication tokens instead of account passwords. 
Go to:
1) Your account settings
2) Developer settings
3) Personal access tokens
4) Generate new token
5) Follow the process
6) Save your token somewhere safe because you won't be able to see it again.
Finally, link each remote with each local repository by doing: 
```git
git remote add <a remote name you want> <link to remote from your repo> 
```

## Step 5: Create your giddy-config.json

It's not the name giddy-config.json that matters most but the format and so, you can 
name it however you want as long as it has a <code>.json</code> extension and the format is correct.
Copy the template from above and replace the values of the properties with your matching ones.
You can retrieve the remote and branch name by doing <code>git remote</code> and <code>git branch</code> 
respectively inside a repository. The current branch will be marked with a <code>*</code>

## Step 6: Run giddy

Finally, open a terminal window and type
```npm
giddy /path/to/giddy-config.json
```
For example, if you are on Ubuntu and your <code>giddy-config.json</code> is on your
Desktop type: 

```npm
giddy /home/<your username>/Desktop/giddy-config.json
```

That's it! Save your <code>giddy-config.json</code> and continue developing your app.
From now on all you need to do whenever you want to build, push and deploy your application, 
is to change the commit message in your <code>giddy-config.json</code> and run <code>giddy</code>


# Limitations and future plans

For now, Giddy is not fully compatible with Windows operating systems
but this is something that will soon change.
Also, future plans include the automated deployment of more types of
applications on Azure with the same repository and .json config pattern.In future releases,
automatic unstaging of committed changes will be added as well in case of commit errors, but without automatic resolution.
Resolution of conflicts is performed manually to avoid unwanted changes in the repository. 
However, once unstaged, you can fix the conflicts by doing:

    git add . 
####
    git commit -m "your commit message"
####
    git pull <remote> <branch>

```git
Fix conflicts manually and accept or abort changes
```

    giddy /path/to/json/config


Finally, support for the option to re-deploy a past build will be added to make easier a possible revert.


### Full project source code can be found [here]

[here]: https://github.com/G-MAKROGLOU/-geomak-giddy