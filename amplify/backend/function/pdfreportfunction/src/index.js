const awsServerlessExpress = require("aws-serverless-express");
const app = require("./app");

const binaryMimeTypes = [
    "application/octet-stream",
    "font/eot",
    "font/opentype",
    "font/otf",
    "font/ttf",
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "application/pdf",
];
const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes);

exports.handler = (event, context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    return awsServerlessExpress.proxy(server, event, context, "PROMISE")
        .promise;
};
