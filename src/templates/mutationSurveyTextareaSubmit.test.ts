import Parser from 'appsync-template-tester';
import { request, response } from './mutationSurveyTextareaSubmit';

describe('templates:mutationSurveyTextareaSubmit', () => {
  describe('request', () => {
    it('should match snapshot', () => {
      const parser = new Parser(request);
      const context = {
        arguments: {
          surveyID: 'aa-bb-cc?',
          text: 'Awesome!',
        },
      };

      expect(parser.resolve(context)).toMatchSnapshot();
    });
  });

  describe('response', () => {
    it('should match snapshot', () => {
      const parser = new Parser(response);
      const context = {
        result: {
          id: 'hh-ii-kk',
        },
      };

      expect(parser.resolve(context)).toMatchSnapshot();
    });
  });
});
