import * as cdk from 'aws-cdk-lib';
import {Stack} from 'aws-cdk-lib';
import {Construct} from "constructs";
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {IVpc} from "aws-cdk-lib/aws-ec2";
import * as ssm from 'aws-cdk-lib/aws-ssm';

interface RdsStackProps extends cdk.StackProps {
  vpc: IVpc;
}

export class RdsStack extends Stack {
  
  public readonly dbSg: ec2.SecurityGroup;
  
  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);
    
    this.dbSg = new ec2.SecurityGroup(this, 'CAPP-SG-DB', {
      securityGroupName: 'CAPP-SG-DB',
      vpc: props.vpc,
      allowAllOutbound: true
    })
    this.dbSg.connections.allowFromAnyIpv4(ec2.Port.tcpRange(5432, 5432), 'Open to PgAdmin');
    
    const snapshot = ssm.StringParameter.valueForStringParameter(
      this, '/dev/db/snapshot');
    
    if (snapshot !== null && snapshot !== '') {
  
      console.log('Restore from snapshot ->', snapshot);
      
      const dbInstance = new rds.DatabaseClusterFromSnapshot(this, 'CAPP-AuroraPostgresDb', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({version: rds.AuroraPostgresEngineVersion.VER_11_13}),
        iamAuthentication: true,
        instanceProps: {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
          vpc: props.vpc,
          vpcSubnets: {
            subnets: props.vpc.publicSubnets,
          },
          securityGroups: [this.dbSg],
          allowMajorVersionUpgrade: false,
          autoMinorVersionUpgrade: true,
          deleteAutomatedBackups: true
        },
        snapshotIdentifier: snapshot,
        clusterIdentifier: 'CAPP-DEV-AuroraPostgresDb',
        instances: 1,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        deletionProtection: false,
      });
    } else {
      
      // When VPC have only one AZ this constructor fail, because it (AWS::RDS::DBSubnetGroup) will need more than one AZ
      const dbInstance = new rds.DatabaseInstance(this, 'CAPP-PostgresDb', {
        databaseName: 'CAPPPostgresDb',
        instanceIdentifier: 'CAPPPostgresDb',
        multiAz: false,
        engine: rds.DatabaseInstanceEngine.postgres({version: rds.PostgresEngineVersion.VER_11_13}),
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        credentials: rds.Credentials.fromGeneratedSecret('postgres'),
        vpc: props.vpc,
        vpcSubnets: {
          onePerAz: false,
          subnets: props.vpc.isolatedSubnets,
        },
        storageType: rds.StorageType.GP2,
        allocatedStorage: 100,
        publiclyAccessible: false,
        securityGroups: [this.dbSg],
        // timezone: 'America/Fortaleza' // Invalid Property for Postgres
        allowMajorVersionUpgrade: false,
        autoMinorVersionUpgrade: true,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        deletionProtection: false
      });
    }
  }
}