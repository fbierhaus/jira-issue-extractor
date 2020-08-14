const Promise = require('bluebird');
const _ = require('lodash');

const jiraService = require('./jira.service');
const codefreshApi = require('./codefresh.api');
const configuration = require('./configuration');

async function execute() {

    console.log(`Looking for Issues from message ${configuration.message}`);

    const issues = jiraService.extract();

    if(!_.isArray(issues)) {
        console.log(`Issues werent found`);
        return;
    }

    _.compact(await Promise.all(issues.map(async issue => {
        let normalizedIssue;
        try {
            normalizedIssue = issue.toUpperCase();
            // just for validation atm
            await jiraService.getInfoAboutIssue(normalizedIssue);
            return await codefreshApi.createIssue({
                number: normalizedIssue,
                url: `https://${configuration.jira.host}/browse/${normalizedIssue}`
            });
        } catch (e) {
            if(!e.statusCode && JSON.parse(e).statusCode === 404) {
                throw new Error(`Skip issue ${normalizedIssue}, didnt find in jira system`);
            } else {
                const error = JSON.parse(e);
                if(error.statusCode === 401) {
                    throw new Error('Wrong username or password');
                }
                throw new Error(error.body);
            }

        }
    })));
}
execute();
