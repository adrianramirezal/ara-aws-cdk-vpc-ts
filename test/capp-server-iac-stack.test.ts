import * as cdk from "aws-cdk-lib";
import {Template} from "aws-cdk-lib/assertions";
import {CappServerIacStack} from "../lib/capp-server-iac-stack";

test('Test IaC', () => {
  const app = new cdk.App();
  
  // WHEN
  const stack = new CappServerIacStack(app, 'CappServerIacStack', {});
  
  // THEN
  const template = Template.fromStack(stack);
});