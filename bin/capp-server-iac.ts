#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CappServerIacStack } from '../lib/capp-server-iac-stack';

const app = new cdk.App({
  context: {
    "app/ctx": "example",
  },
});

new CappServerIacStack(app, 'CAPPIaC');