const { host, apiToken, image } = require('./configuration');
const rp = require('request-promise');

class CodefreshAPI {

    async createIssue(issue) {

        console.log(`Create issue request ${issue.number}=${issue.url}, image: ${image}`);

        return rp({
            method: 'POST',
            uri: `${host}/api/annotations`,
            body: {
                entityId: image,
                entityType: 'image-issues',
                key: `${issue.number}`,
                value: {
                    url : issue.url,
                    title : issue.title
                }
            },
            headers: {
                'Authorization': `Bearer ${apiToken}`
            },
            json: true
        });
    }

    async getJiraContext(name) {
        return rp({
            method: 'GET',
            uri: `${host}/api/contexts/${name}?regex=true&type=atlassian&decrypt=true`,
            headers: {
                'Authorization': `Bearer ${apiToken}`
            },
            json: true
        });
    }

    async getJiraIssue(context, issueKey) {
        return rp({
            method: 'GET',
            uri: `${host}/api/atlassian/issues/${issueKey}?jira-context=${context}`,
            headers: {
                'Authorization': `Bearer ${apiToken}`
            },
            json: true
        });
    }
}
module.exports = new CodefreshAPI();
