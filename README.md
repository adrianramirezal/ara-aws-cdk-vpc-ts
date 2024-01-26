## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
* `cdk context`     to print cdk context

## Env DEV
 * `cdk deploy -c capp/env=dev --all --profile my-profile`        To deploy
 * `cdk destroy -c capp/env=dev --all --profile my-profile`    To destroy
