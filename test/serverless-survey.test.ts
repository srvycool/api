import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import { ServerlessSurveyStack } from "../lib/serverless-survey-stack";

test("Empty Stack", () => {
  const app = new cdk.App();
  const stack = new ServerlessSurveyStack(app, "MyTestStack");

  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  );
});
