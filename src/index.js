const Promise = require('bluebird');
const _ = require('lodash');
const chalk = require('chalk');
const fs = require('fs');

const jiraService = require('./jira.service');
const codefreshApi = require('./codefresh.api');
const configuration = require('./configuration');

// Export link
function _saveLink(url) {
    function handleError(err) {
        console.warn(`Cannot save Jira link. ${err.message}`);
    }

    const updateValue = (data, url) => {
        return data
            .split('\n')
            .filter(val => val.search(new RegExp(`^${configuration.variableNameLink}=`,'i')) === -1)
            .concat([`${configuration.variableNameLink}=${url}`])
            .join('\n');
    }

    fs.readFile(configuration.variablesFile, 'utf8', (err, data) => {
        if (err) return handleError(err);

        fs.writeFile(configuration.variablesFile, updateValue(data, url), 'utf8', (err) => {
            if (err) return handleError(err);
        });
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
            _saveLink(url);

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
