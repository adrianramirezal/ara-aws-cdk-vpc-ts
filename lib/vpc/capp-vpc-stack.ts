import {Construct} from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {
  CfnNetworkAcl,
  CfnNetworkAclEntry,
  CfnSubnetNetworkAclAssociation,
  DefaultInstanceTenancy,
  IVpc,
  NatProvider
} from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import {Stack} from "aws-cdk-lib";

interface VpcStackProps extends cdk.StackProps {
  maxAzs: number;
  natGateways: number;
}

export class VpcStack extends Stack {
  
  public readonly vpc: IVpc;
  
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id);
    
    const tagResource = (resource: Construct, tagName: string, tagValue: string) => {
      cdk.Tags.of(resource).add(tagName, tagValue);
    };
    
    this.vpc = new ec2.Vpc(this, 'CAPP-VPC', {
      vpcName: 'CAPP-VPC',
      defaultInstanceTenancy: DefaultInstanceTenancy.DEFAULT,
      cidr: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: props.maxAzs,
      natGateways: props.natGateways,
      natGatewayProvider: NatProvider.gateway(),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'WEB',
          subnetType: ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true
        },
        {
          cidrMask: 24,
          name: 'APP',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        {
          cidrMask: 24,
          name: 'DB',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ]
    });
    
    // Public NACL
    const networkAcl = new CfnNetworkAcl(this.vpc, "CAPP-NACL-PubWeb", {
      vpcId: this.vpc.vpcId,
      tags: [{
        key: "Name",
        value: "CAPP-NACL-PubicTiers"
      }]
    });
  
    for (const sn of this.vpc.publicSubnets) {
      new CfnSubnetNetworkAclAssociation(sn, "CAPP-NACL-Assoc-PubWeb", {
        subnetId: sn.subnetId,
        networkAclId: networkAcl.attrId
      });
    }
    
    // NACL Inbound Rules
    new CfnNetworkAclEntry(networkAcl, "Allow-IN-All-TCP-Port80", {
      networkAclId: networkAcl.attrId,
      egress: false,
      ruleNumber: 100,
      portRange: {
        from: 80,
        to: 80
      },
      protocol: 6,
      cidrBlock: "0.0.0.0/0",
      ruleAction: "allow"
    });

    // NACL Outbound  Rules
    new CfnNetworkAclEntry(networkAcl, "Allow-OUT-All-TCP-Port80", {
      networkAclId: networkAcl.attrId,
      egress: true,
      ruleNumber: 100,
      portRange: {
        from: 80,
        to: 80
      },
      protocol: 6,
      cidrBlock: "0.0.0.0/0",
      ruleAction: "allow"
    });

    new cdk.CfnOutput(this, 'outputVpcId', {
      description: 'vpcId',
      value: this.vpc.vpcId
    });
  }
}