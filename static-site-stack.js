const { Stack, RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const route53 = require('aws-cdk-lib/aws-route53');
const targets = require('aws-cdk-lib/aws-route53-targets');
const acm = require('aws-cdk-lib/aws-certificatemanager');

class StaticSiteStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // S3 bucket for static site
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: 'ajs-content-site-bucket',
      websiteIndexDocument: 'job_search_presentation.html',
      websiteErrorDocument: 'job_search_presentation.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Get existing hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'rdtechnical.com',
    });

    // Use existing SSL certificate
    const certificate = acm.Certificate.fromCertificateArn(this, 'SiteCertificate', 
      'arn:aws:acm:us-east-1:762778437347:certificate/fa8341d4-e28f-44f1-9479-7adfd0d62d3b'
    );

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(siteBucket.bucketWebsiteDomainName, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: ['ajs.rdtechnical.com'],
      certificate: certificate,
      defaultRootObject: 'job_search_presentation.html',
    });

    // Route53 record
    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: 'ajs',
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    // Deploy site content
    new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3deploy.Source.asset('.', {
        exclude: ['node_modules/**', 'cdk.out/**', '*.js', 'package*.json', 'cdk.json']
      })],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}

module.exports = { StaticSiteStack };
