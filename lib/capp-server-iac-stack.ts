import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {VpcStack} from "./vpc/capp-vpc-stack";
import {RdsStack} from "./rds/capp-rds-stack";

export class CappServerIacStack extends Stack {
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  
    const env = scope.node.tryGetContext('capp/env');
    console.log('capp/env ->', env);
  
    if ('dev' === env) {
      const vpc = new VpcStack(this, "VpcStack", {
        stackName: 'CAPP-VPC-Stack',
        maxAzs: 2,
        natGateways: 1
      });
      const rds = new RdsStack(vpc, "RdsStack", {
        stackName: 'CAPP-RDS-Stack',
        vpc: vpc.vpc
      })
    } else {
      console.log("NO ENV DEFINED!!!")
    }
  }
}
