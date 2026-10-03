const serverless = require('serverless-http');
const app = require('../../backend/server');

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
    // Normalize path if Netlify functions prefix is present
    if (event.path && event.path.startsWith('/.netlify/functions/api')) {
        event.path = event.path.replace('/.netlify/functions/api', '');
        if (!event.path.startsWith('/')) {
            event.path = '/' + event.path;
        }
    }
    return await serverlessHandler(event, context);
};
