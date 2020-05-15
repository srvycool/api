import Parser, { Context } from "appsync-template-tester";
import { request, response } from "./function.surveyByID";

describe("function:surveyByID", () => {
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
        } as Context;

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
        } as Context;

        expect(parser.resolve(context)).toMatchSnapshot();
      });
    });
  });
});
