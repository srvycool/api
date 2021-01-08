jest.mock("uuid", () => ({ v4: () => "gg-hh-ii" }));

import Parser, { Context } from "appsync-template-tester";
import { request, response } from "./functionSurveyTextareaSubmit";

describe("templates:functionSurveyTextareaSubmit", () => {
  describe("request", () => {
    it("should match snapshot", () => {
      const parser = new Parser(request);
      const context = {
        stash: {
          surveyID: "aa-bb-cc",
          text: "Awesome!",
        },
      } as Context;

      expect(parser.resolve(context)).toMatchSnapshot();
    });
  });

  describe("response", () => {
    it("should match snapshot", () => {
      const parser = new Parser(response);
      const context = {};

      expect(parser.resolve(context)).toMatchSnapshot();
    });
  });
});
