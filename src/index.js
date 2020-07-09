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
        try {

            const normalizedIssue = issue.toUpperCase();
            // just for validation atm
            await jiraService.getInfoAboutIssue(normalizedIssue);
            return await codefreshApi.createIssue({
                number: normalizedIssue,
                url: `https://${configuration.jira.host}/browse/${normalizedIssue}`
            });
        } catch (e) {
            if(!e.statusCode && JSON.parse(e).statusCode === 404) {
                console.error(`Skip issue ${normalizedIssue}, didnt find in jira system`);
            } else {
                console.error(e.message);
            }

        }
    })));
}
execute();
