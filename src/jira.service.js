const configuration = require('./configuration');

const JiraClient = require("jira-connector");

const jira = new JiraClient({
    ... configuration.jira
});

class JiraService {

    extract() {
        return new RegExp(`${configuration.projectName}-\\d*`, 'i').exec(configuration.message);
    }

    getInfoAboutIssue(issue) {
        return jira.issue.getIssue({
                issueKey: issue
            });
    }

}

module.exports = new JiraService();
