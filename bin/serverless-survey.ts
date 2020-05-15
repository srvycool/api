#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { ServerlessSurveyStack } from "../lib/serverless-survey-stack";

const app = new cdk.App();
new ServerlessSurveyStack(app, "ServerlessSurveyStack", {
  env: {
    region: "eu-west-1",
  },
});
