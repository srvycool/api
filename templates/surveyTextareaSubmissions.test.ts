import Parser from "appsync-template-tester";
import { request, response } from "./surveyTextareaSubmissions";

describe("templates:surveyTextareaSubmissions", () => {
  describe("request", () => {
    it("should match snapshot", () => {
      const parser = new Parser(request);
      const context = {
        source: {
          id: "aa-bb-cc",
        },
      };

      expect(parser.resolve(context)).toMatchSnapshot();
    });
  });

  describe("response", () => {
    it("should match snapshot", () => {
      const parser = new Parser(response);
      const context = {
        result: {
          items: [
            {
              id: "hh-ii-kk",
            },
          ],
        },
      };

      expect(parser.resolve(context)).toMatchSnapshot();
    });
  });
});
