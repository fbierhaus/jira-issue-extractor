const Promise = require('bluebird');
const _ = require('lodash');

const jiraService = require('./jira.service');
const codefreshApi = require('./codefresh.api');
const configuration = require('./configuration');

async function execute() {

    console.log(`Looking for Issues from message ${configuration.message}`);

    const issues = jiraService.extract();

    _.compact(await Promise.all(issues.map(async issue => {
        try {

            // just for validation atm
            await jiraService.getInfoAboutIssue(issue);
            return await codefreshApi.createIssue({
                number: issue,
                url: `https://${configuration.jira.host}/browse/${issue}`
            });
        } catch (e) {
            if(!e.statusCode && JSON.parse(e).statusCode === 404) {
                console.error(`Skip issue ${issue}, didnt find in jira system`);
            } else {
                console.error(e.message);
            }

        }
    })));
}
execute();
