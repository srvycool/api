#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { ServerlessSurveyStack } from "../lib/serverless-survey-stack";

const environment = process.env.ENVIRONMENT;

if (!environment) {
  throw new Error("Environment is missing!");
}

const app = new cdk.App();
new ServerlessSurveyStack(app, `ServerlessSurveyStack${environment}`, {
  env: {
    region: "eu-west-1",
  },
});
