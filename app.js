#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { StaticSiteStack } = require('./static-site-stack');

const app = new cdk.App();
new StaticSiteStack(app, 'AjsContentStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
