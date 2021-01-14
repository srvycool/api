import Parser from 'appsync-template-tester';
import { request, response } from './mutationSurveyMultipleChoiceSubmit';

describe('templates:mutationSurveyMultipleChoiceSubmit', () => {
  describe('request', () => {
    it('should match snapshot', () => {
      const parser = new Parser(request);
      const context = {
        arguments: {
          surveyID: 'aa-bb-cc?',
          answerID: 'dd-ee-ff',
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
