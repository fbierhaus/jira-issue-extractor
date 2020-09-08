const Promise = require('bluebird');
const _ = require('lodash');
const chalk = require('chalk');
const { exec } = require("child_process");

const jiraService = require('./jira.service');
const codefreshApi = require('./codefresh.api');
const configuration = require('./configuration');

// Export link
async function _saveLink(url) {
    return new Promise((resolve) => {
        function handleResult(error, stdout, stderr) {
            if (error) {
                console.warn(`Cannot save Jira link. ${error.message}`);
                return resolve();
            }
            if (stderr) {
                console.warn(`Cannot save Jira link. ${stderr}`);
                return resolve();
            }

            console.log(`Exported Jira link: ${url}`);
            resolve();
        }

        const { CF_VOLUME_PATH, CF_STEP_VARIABLES_PATH, LINK_VAR_NAME } = process.env;
        exec(`${CF_VOLUME_PATH}/${CF_STEP_VARIABLES_PATH}/cf_export ${LINK_VAR_NAME}=${url}`, handleResult);
    })
}

async function execute() {

    console.log(`Looking for Issues from message ${configuration.message}`);

    const issues = jiraService.extract();

    if(!_.isArray(issues)) {
        console.log(chalk.yellow(`Issues werent found`));
        return;
    }

    _.compact(await Promise.all(issues.map(async issue => {
        let normalizedIssue;
        try {
            normalizedIssue = issue.toUpperCase();
            // just for validation atm
            await jiraService.getInfoAboutIssue(normalizedIssue);

            const url = `https://${configuration.jira.host}/browse/${normalizedIssue}`;
            await _saveLink(url);

            await codefreshApi.createIssue({
                number: normalizedIssue,
                url,
            });

            console.log(chalk.green(`Codefresh assign issue ${normalizedIssue} to your image ${configuration.image}`));
        } catch (e) {
            if(!e.statusCode && JSON.parse(e).statusCode === 404) {
                console.log(chalk.yellow(`Skip issue ${normalizedIssue}, didnt find in jira system or you dont have permissions for find it`));
            } else {
                try {
                    const error = JSON.parse(e);
                    if(error.statusCode === 401) {
                        console.log(chalk.red('Wrong username or password'));
                        return process.exit(1);
                    }
                    console.log(chalk.red(error.body));
                } catch(err) {
                    console.log(chalk.red(e.message));
                }
                process.exit(1);
            }

        }
    })));
}
execute();
