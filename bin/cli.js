#!/usr/bin/env node

/**
 * Copyright (c) 2019 Mirco Sanguineti
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

"use strict";function _interopDefault(e){return e&&"object"==typeof e&&"default"in e?e.default:e}var yargs=_interopDefault(require("yargs")),sh=_interopDefault(require("shelljs")),inquirer=_interopDefault(require("inquirer")),findUp=_interopDefault(require("find-up")),path=require("path"),chalk=_interopDefault(require("chalk")),simplegit=_interopDefault(require("simple-git/promise")),child_process=require("child_process");function getDefaultConfigValues(){return{...defaultConfigValues,...loadConfigValues()}}function loadConfigFile(e){if(!e||!sh.test("-f",e))return defaultConfigValues;const a=".js"===getFileExt(e)?require(e):JSON.parse(sh.sed(/(\/\*[\w\W]+\*\/|(\/\/.*))/g,"",e));return sanityCheck(a)?{...defaultConfigValues,...a}:{...defaultConfigValues}}function loadConfigValues(){return loadConfigFile(findUp.sync(defaultConfigFileNames)||void 0)}function writeConfigFile({file:e=defaultConfigFileName,data:a=defaultConfigValues}){let t;if(!sanityCheck(a))return!1;switch(getFileExt(e)){case".js":t=["module.exports = {",...generateCommentedValues(a),"}"].join("\n");break;case".json":t=JSON.stringify(a,null,2);break;default:return!1}return sh.ShellString(t).to(e),!0}function isValidBranchName(e){return checkGitRefFormat(`refs/heads/${e}`)}function sanityCheck(e){for(const a in e){const t=e[a];switch(a){case"main":case"development":case"hotfix":case"release":case"feature":if(!isValidBranchName(t))return!1;break;case"usedev":if("boolean"!=typeof t)return!1;break;case"integration":if("number"!=typeof t||t<1||t>3)return!1;break;case"interactive":case"push":case"delete":if("string"!=typeof t||!t.match(/(ask|always|never)/))return!1}}return!0}function checkGitRefFormat(e){return 0===sh.exec(`git check-ref-format "${e}"`,{silent:!0}).code}const defaultConfigValues={main:"master",usedev:!1,development:"develop",feature:"feature",release:"release",hotfix:"hotfix",integration:1,interactive:"always",push:"always",delete:"always"},defaultConfigFileName="gof.config.js",defaultConfigFileNames=[defaultConfigFileName,".gofrc.js",".gofrc.json"];function getCommentFor(e){switch(e){case"main":return"Main (production) branch name. Default `master`";case"usedev":return"Use development branch? Default `false`";case"development":return"Development branch name. Default `develop`";case"release":return"Release branch name. Default: `release`";case"hotfix":return"Hotfix branch name. Default: `hotfix`";case"feature":return"Feature branch name. Default: `feature`";case"integration":return"Integration method to use (see https://www.endoflineblog.com/oneflow-a-git-branching-model-and-workflow#feature-branches). Options: [`1`, `2`, `3`]. Default: `1`.";case"interactive":return"Use interactve rebase (`git rebase -i` only valid for integration === 1 || 3)? Options: [`always`, `never`, `ask`]. Default: `always`.";case"push":return"Push to origin after finishing feature/hotfix/release? Options: [`always`, `never`, `ask`]. Default: `always`.";case"delete":return"Delete the working branch (feature/hotfix/release) after merging with main/development? Options: [`always`, `never`, `ask`]. Default: `always`.";default:return""}}function getFileExt(e){return path.extname(e)}function generateCommentedValues(e){const a=[];for(const t in e){const n="string"==typeof e[t]?`"${e[t]}"`:e[t];a.push(`\t/** ${getCommentFor(t)} */\n\t${t}: ${n},`)}return a}const success=e=>chalk.black.bgGreen(e),error=e=>chalk.black.bgRed(e),info=e=>chalk.black.bgCyan(e);var init={command:"init [options]",desc:"Generate a config file",builder:e=>e.option("y",{alias:"default-values",describe:"Auto-generate config file using default values. These values WILL NOT overwrite existing values!"}),handler:async function(e){try{const a=e.defaultValues?getDefaultConfigValues():await inquirer.prompt(generateQuestions(e));console.log(JSON.stringify(a,null,2)),(e.defaultValues||await askConfirmationBeforeWrite())&&(writeConfigFile({data:a})?console.log(success("Initialisation done!")):console.error(error("Cannot write config file!")))}catch(e){console.error(error(e))}}};function generateQuestions(e){return[{name:"main",type:"input",message:"Main (production) branch:",default:e.main||"master",validate:e=>isValidBranchName(e)||"Please, choose a valid name for the branch"},{name:"usedev",type:"confirm",default:e.usedev||!1,message:"Do you use a development branch?"},{name:"development",type:"input",message:"Development branch:",default:e.development||"develop",when:function(e){return e.usedev},validate:e=>isValidBranchName(e)||"Please, choose a valid name for the branch"},{name:"feature",type:"input",message:"Feature branch:",default:e.feature||"feature",validate:e=>isValidBranchName(e)||"Please, choose a valid name for the branch"},{name:"release",type:"input",message:"Release branch:",default:e.release||"release",validate:e=>isValidBranchName(e)||"Please, choose a valid name for the branch"},{name:"hotfix",type:"input",message:"Hotfix branch:",default:e.hotfix||"hotfix",validate:e=>isValidBranchName(e)||"Please, choose a valid name for the branch"},{type:"list",name:"integration",message:"Which feature branch integration method do you want to use?",default:e.integration-1||1,choices:[{name:"Integrate feature branch with main/development using rebase (rebase -> merge --ff-only).",value:1,short:"rebase"},{name:"Feature is merged in main/development à la GitFlow (merge --no-ff).",value:2,short:"merge --no-ff"},{name:"Mix the previous two: rebase and merge (rebase -> merge --no-ff).",value:3,short:"rebase + merge --no-ff"}]},{name:"interactive",type:"expand",message:"Do you want to use rebase interactively (rebase -i)?",default:e.interactive||"always",choices:[{key:"y",name:"Always",value:"always"},{key:"n",name:"Never",value:"never"},{key:"a",name:"Ask me every time",value:"ask"}],when:function(e){return 2!==e.integration}},{name:"push",type:"expand",message:"Do you want to push to origin after merging?",default:e.push||"always",choices:[{key:"y",name:"Always",value:"always"},{key:"n",name:"Never",value:"never"},{key:"a",name:"Ask me every time",value:"ask"}]},{name:"delete",type:"expand",message:"Do you want to delete working branch after merging?",default:e.push||"always",choices:[{key:"y",name:"Always",value:"always"},{key:"n",name:"Never",value:"never"},{key:"a",name:"Ask me every time",value:"ask"}]}]}async function askConfirmationBeforeWrite(){return(await inquirer.prompt([{type:"confirm",name:"write",message:"Write to config file?"}])).write}const git=simplegit();var start={command:"start <featureBranch>",desc:"Start a new feature",builder:e=>{},handler:async e=>{const a=e.usedev?e.development:e.main;if(isValidBranchName(e.featureBranch))try{return git.checkoutBranch(`${e.feature}/${e.featureBranch}`,`${a}`)}catch(e){throw e}}};const git$1=simplegit();var finish={command:"finish <featureBranch> [options]",desc:"Finish a feature",builder:e=>e.option("i",{alias:"interactive",describe:"Rebase using `rebase -i`. It applies only if `integration` option is set to 1 or 3"}),handler:e=>{const a=e.usedev?e.development:e.main;try{return handleFinish(e,a)}catch(e){throw e}}};async function handleFinish(e,a){2!==e.integration&&await rebaseStep(e,a),await git$1.checkout(`${a}`);let t="--no-ff";switch(2===e.integration&&(t="--ff-only"),await git$1.merge([t,`${e.feature}/${e.featureBranch}`]),e.push){case"always":await git$1.push("origin",`${a}`);break;case"never":break;case"ask":await ask(`Do you want to push to ${a}?`)&&await git$1.push("origin",`${a}`)}switch(e.deleteBranch){case"always":await git$1.deleteLocalBranch(`${e.feature}/${e.featureBranch}`);break;case"never":break;case"ask":await ask(`Do you want to delete branch ${e.feature}/${e.featureBranch}?`)&&await git$1.deleteLocalBranch(`${e.feature}/${e.featureBranch}`)}}async function rebaseStep(e,a){switch(await git$1.checkout(`${e.feature}/${e.featureBranch}`),e.interactive){case"always":child_process.spawnSync("git",["rebase","-i",`${a}`],{stdio:"inherit"});break;case"never":await git$1.rebase([`${a}`]);break;case"ask":await ask("Do you want to use rebase interactively?")?child_process.spawnSync("git",["rebase","-i",`${a}`],{stdio:"inherit"}):await git$1.rebase([`${a}`])}}async function ask(e){return(await inquirer.prompt([{type:"confirm",name:"accept",message:e}])).accept}var feature={command:"feature <command>",desc:"Manage starting and finishing features",builder:function(e){return e.command(start).command(finish)},handler:function(e){}};const git$2=simplegit();var start$1={command:"start <releaseName> <from>",desc:"Start a new release.\n<releaseName> should be something like `2.3.0`.\n<from> should be a branch (e.g. develop) or a commit (e.g. 9af345)",builder:e=>{},handler:async e=>{if(isValidBranchName(e.releaseName))try{return git$2.checkoutBranch(`${e.release}/${e.releaseName}`,`${e.from}`)}catch(e){throw e}}};const git$3=simplegit();var finish$1={command:"finish <releaseName>",desc:"Finishes a release.",builder:e=>{},handler:async e=>{try{return handleFinish$1(e)}catch(e){throw e}}};async function handleFinish$1(e){const a=e.usedev?e.development:e.main;switch(await git$3.checkout(`${e.release}/${e.releaseName}`),await git$3.addTag(`${e.releaseName}`),await git$3.checkout(`${a}`),await git$3.merge([`${e.release}/${e.releaseName}`]),e.push){case"always":await git$3.push("origin",`${a}`,{"--tags":null});break;case"never":console.log(`Remember to ${info(`git push --tags origin ${a}`)} when you're done.`);break;case"ask":await ask$1(`Do you want to push to ${a}?`)&&await git$3.push("origin",`${a}`,{"--tags":null})}switch(e.usedev&&(await git$3.checkout("master"),await git$3.merge(["--ff-only",`${e.releaseName}`])),e.deleteBranch){case"always":await deleteBranch(e);break;case"never":break;case"ask":await ask$1(`Do you want to delete branch ${e.release}/${e.releaseName}?`)&&await deleteBranch(e)}}async function deleteBranch(e){await git$3.deleteLocalBranch(`${e.release}/${e.releaseName}`),await ask$1(`Do you want to delete on origin branch ${e.release}/${e.releaseName}?`)&&await git$3.push("origin",`:${e.release}/${e.releaseName}`)}async function ask$1(e){return(await inquirer.prompt([{type:"confirm",name:"accept",message:e}])).accept}var release={command:"release <command>",desc:"Manage starting and finishing releases.",builder:function(e){return e.command(start$1).command(finish$1)},handler:function(e){}};const git$4=simplegit();var start$2={command:"start <hotfixName> <from>",desc:"Start a new hotfix.\n<hotfixName> should be something like `2.3.1`.\n<from> should be a branch (e.g. develop) or a commit (e.g. 9af345)",builder:e=>{},handler:async e=>{if(isValidBranchName(e.hotfixName))try{return git$4.checkoutBranch(`${e.hotfix}/${e.hotfixName}`,`${e.from}`)}catch(e){throw e}}};const git$5=simplegit();var finish$2={command:"finish <hotfixName>",desc:"Finishes a hotfix.",builder:e=>{},handler:async e=>{try{return handleFinish$2(e)}catch(e){throw e}}};async function handleFinish$2(e){const a=e.usedev?e.development:e.main;switch(await git$5.checkout(`${e.hotfix}/${e.hotfixName}`),await git$5.addTag(`${e.hotfixName}`),await git$5.checkout(`${a}`),await git$5.merge([`${e.hotfix}/${e.hotfixName}`]),e.push){case"always":await git$5.push("origin",`${a}`,{"--tags":null});break;case"never":console.log(`Remember to ${info(`git push --tags origin ${a}`)} when you're done.`);break;case"ask":await ask$2(`Do you want to push to ${a}?`)&&await git$5.push("origin",`${a}`,{"--tags":null})}switch(e.usedev&&(await git$5.checkout("master"),await git$5.merge(["--ff-only",`${e.hotfixName}`])),e.deleteBranch){case"always":await deleteBranch$1(e);break;case"never":break;case"ask":await ask$2(`Do you want to delete branch ${e.hotfix}/${e.hotfixName}?`)&&await deleteBranch$1(e)}}async function deleteBranch$1(e){await git$5.deleteLocalBranch(`${e.hotfix}/${e.hotfixName}`),await ask$2(`Do you want to delete on origin branch ${e.hotfix}/${e.hotfixName}?`)&&await git$5.push("origin",`:${e.hotfix}/${e.hotfixName}`)}async function ask$2(e){return(await inquirer.prompt([{type:"confirm",name:"accept",message:e}])).accept}var hotfix={command:"hotfix <command>",desc:"Manage starting and finishing hotfixes.",builder:function(e){return e.command(start$2).command(finish$2)},handler:function(e){}},name="git-oneflow",version="0.5.2",description="CLI tooling implementing GIT OneFlow branching model",bin={gof:"bin/cli.js","git-oneflow":"bin/cli.js"},files=["bin/**/*"],scripts={pretest:"run-s typecheck format lint",test:"jest",clean:"rimraf bin",prebuild:"run-s test clean",build:"rollup -c",format:"prettier --write **/*.ts",lint:"standard **/*.ts --fix",watch:"rollup -c --watch",typecheck:"tsc",release:"standard-version -t"},repository={type:"git",url:"git+https://github.com/msanguineti/git-oneflow.git"},keywords=["git","oneflow","branching","model","Adam","Ruka"],author="Mirco Sanguineti",license="MIT",bugs={url:"https://github.com/msanguineti/git-oneflow/issues"},homepage="https://github.com/msanguineti/git-oneflow#readme",devDependencies={"@babel/core":"^7.4.5","@babel/plugin-proposal-class-properties":"^7.4.4","@babel/preset-env":"^7.4.5","@babel/preset-typescript":"^7.3.3","@commitlint/cli":"^8.0.0","@commitlint/config-conventional":"^8.0.0","@types/find-up":"^2.1.1","@types/inquirer":"^6.0.3","@types/jest":"^24.0.14","@types/shelljs":"^0.8.5","@typescript-eslint/eslint-plugin":"^1.10.2","@typescript-eslint/parser":"^1.10.2",husky:"^2.4.1",jest:"^24.8.0","lint-staged":"^8.2.0","npm-run-all":"^4.1.5",prettier:"^1.18.2",rollup:"^1.15.2","rollup-plugin-babel":"^4.3.2","rollup-plugin-commonjs":"^10.0.0","rollup-plugin-json":"^4.0.0","rollup-plugin-node-resolve":"^5.0.2","rollup-plugin-terser":"^5.0.0",standard:"^12.0.1","standard-version":"^6.0.1",typescript:"^3.5.1"},dependencies={chalk:"^2.4.2","find-up":"^4.0.0",inquirer:"^6.3.1",shelljs:"^0.8.3","simple-git":"^1.113.0",yargs:"^13.2.4"},standard={parser:"@typescript-eslint/parser",plugins:["@typescript-eslint"],env:["jest"]},prettier={semi:!1,singleQuote:!0},husky={hooks:{"pre-commit":"lint-staged"}},pkg={name:name,version:version,description:description,bin:bin,files:files,scripts:scripts,repository:repository,keywords:keywords,author:author,license:license,bugs:bugs,homepage:homepage,devDependencies:devDependencies,dependencies:dependencies,standard:standard,prettier:prettier,husky:husky,"lint-staged":{"*.ts":["prettier --write","standard *.ts --fix","git add"],"*.js":["git add"]}};sh.which("git")||(console.error("Sorry, git-OneFlow requires git... it's in the name"),process.exit(1));var argv=yargs.scriptName(pkg.name).version().alias("v","version").config(loadConfigValues()).pkgConf("git-oneflow").command(init).command(feature).command(release).command(hotfix).help().alias("h","help").argv;argv._.length<=0&&console.log(`Try ${path.basename(process.argv[1])} --help`);
