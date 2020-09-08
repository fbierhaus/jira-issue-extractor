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
                value: issue.url
            },
            headers: {
                'Authorization': `Bearer ${apiToken}`
            },
            json: true
        });
    }
}
module.exports = new CodefreshAPI();
