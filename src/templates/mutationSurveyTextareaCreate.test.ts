jest.mock('uuid', () => ({ v4: () => 'gg-hh-ii' }));

import Parser from 'appsync-template-tester';
import { request, response } from './mutationSurveyTextareaCreate';

describe('templates:mutationSurveyTextareaCreate', () => {
  describe('request', () => {
    it('should match snapshot', () => {
      const parser = new Parser(request);
      const context = {
        arguments: {
          question: 'How are you?',
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
