import * as cdk from 'aws-cdk-lib';
import {Capture, Template} from 'aws-cdk-lib/assertions';
import {VpcStack} from "../lib/vpc/capp-vpc-stack";

test('VPC + IGW + 3SN + NatGW', () => {
  const app = new cdk.App();
  
  // WHEN
  const stack = new VpcStack(app, 'VpcStack', {maxAzs: 1, natGateways: 1});
  
  // THEN
  const template = Template.fromStack(stack);
  
  template.resourceCountIs("AWS::EC2::VPC", 1);
  template.resourceCountIs("AWS::EC2::InternetGateway", 1);
  template.resourceCountIs("AWS::EC2::VPCGatewayAttachment", 1);
  template.resourceCountIs("AWS::EC2::Subnet", 3);
  template.resourceCountIs("AWS::EC2::EIP", 1);
  template.resourceCountIs("AWS::EC2::NatGateway", 1);
});

test('Test Route Resources', () => {
  const app = new cdk.App();
  
  // WHEN
  const stack = new VpcStack(app, 'VpcStack', {maxAzs: 1, natGateways: 1});
  
  // THEN
  const template = Template.fromStack(stack);
  
  template.resourceCountIs("AWS::EC2::RouteTable", 3);
  template.resourceCountIs("AWS::EC2::SubnetRouteTableAssociation", 3);
  template.resourceCountIs("AWS::EC2::Route", 2);
  
  const natRefCapture = new Capture();
  template.hasResourceProperties("AWS::EC2::Route", {
    "DestinationCidrBlock": "0.0.0.0/0",
    "NatGatewayId": {
      "Ref": natRefCapture
    }
  });
  
  const igwRefCapture = new Capture();
  template.hasResourceProperties("AWS::EC2::Route", {
    "DestinationCidrBlock": "0.0.0.0/0",
    "GatewayId": {
      "Ref": igwRefCapture
    }
  });
  
  expect(natRefCapture.asString()).toEqual(expect.stringMatching(/^CAPPVPCWEBSubnet1NATGateway.+/));
  expect(igwRefCapture.asString()).toEqual(expect.stringMatching(/^CAPPVPCIGW/));
});

test('Test NACLs Resources', () => {
  const app = new cdk.App();
  
  // WHEN
  const stack = new VpcStack(app, 'VpcStack', {maxAzs: 1, natGateways: 1});
  
  // THEN
  const template = Template.fromStack(stack);
  
  template.resourceCountIs("AWS::EC2::NetworkAcl", 1);
  template.resourceCountIs("AWS::EC2::SubnetNetworkAclAssociation", 1);
  template.resourceCountIs("AWS::EC2::NetworkAclEntry", 2);
  
  template.hasResourceProperties("AWS::EC2::NetworkAclEntry", {
    "Protocol": 6,
    "RuleAction": "allow",
    "RuleNumber": 100,
    "CidrBlock": "0.0.0.0/0",
    "Egress": false,
    "PortRange": {
      "From": 80,
      "To": 80
    }
  });
  template.hasResourceProperties("AWS::EC2::NetworkAclEntry", {
    "Protocol": 6,
    "RuleAction": "allow",
    "RuleNumber": 100,
    "CidrBlock": "0.0.0.0/0",
    "Egress": true,
    "PortRange": {
      "From": 80,
      "To": 80
    }
  });
});