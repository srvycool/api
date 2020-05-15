import Parser, { Context } from "appsync-template-tester";
import { request, response } from "./functionSurveyByID";

describe("templates:functionSurveyByID", () => {
  describe("request", () => {
    it("should match snapshot", () => {
      const parser = new Parser(request);
      const context = {
        stash: {
          surveyID: "aa-bb-cc",
        },
      } as Context;

      expect(parser.resolve(context)).toMatchSnapshot();
    });
  });

  describe("response", () => {
    describe("surveyType is multiple choice", () => {
      it("should match snapshot", () => {
        const parser = new Parser(response);
        const context = {
          result: {
            id: "aa-bb-cc",
            label: "Coffee?",
            surveyType: "MULTIPLE_CHOICE",
          },
        };

        expect(parser.resolve(context)).toMatchSnapshot();
      });
    });

    describe("surveyType is textarea", () => {
      it("should match snapshot", () => {
        const parser = new Parser(response);
        const context = {
          result: {
            id: "aa-bb-cc",
            label: "How are you?",
            surveyType: "TEXTAREA",
          },
        };

        expect(parser.resolve(context)).toMatchSnapshot();
      });
    });
  });
});
