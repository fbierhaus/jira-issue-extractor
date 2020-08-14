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
                console.log(`Skip issue ${normalizedIssue}, didnt find in jira system`);
            } else {
                try {
                    const error = JSON.parse(e);
                    if(error.statusCode === 401) {
                        console.error('Wrong username or password');
                        process.exit(1);

                    }
                    console.error(error.body);
                } catch(err) {
                    console.error(e.message);
                }
                process.exit(1);
            }

        }
    })));
}
execute();
