import Parser, { Context } from "appsync-template-tester";
import { request, response } from "./functionSurveyMultipleChoiceSubmit";

describe("templates:functionSurveyMultipleChoiceSubmit", () => {
  describe("request", () => {
    it("should match snapshot", () => {
      const parser = new Parser(request);
      const context = {
        stash: {
          surveyID: "aa-bb-cc",
          answerID: "dd-ee-ff",
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
