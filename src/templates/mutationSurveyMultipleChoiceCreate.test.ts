jest.mock('uuid', () => ({ v4: () => 'gg-hh-ii' }));

import Parser, { Context } from 'appsync-template-tester';
import { request, response } from './mutationSurveyMultipleChoiceCreate';

const TABLE_NAME = 'myFancyTable';

describe('templates:mutationSurveyMultipleChoiceCreate', () => {
  describe('request', () => {
    it('should match snapshot', () => {
      const parser = new Parser(request(TABLE_NAME));
      const context = {
        arguments: {
          question: 'Coffee?',
          answers: ['Yes', 'No'],
        },
      } as Context;

      expect(parser.resolve(context)).toMatchSnapshot();
    });
  });

  describe('response', () => {
    it('should match snapshot', () => {
      const parser = new Parser(response);
      const context = {
        stash: {
          node: 'aa-bb-cc',
        },
        arguments: {
          question: 'Coffee?',
        },
      } as Context;

      expect(parser.resolve(context)).toMatchSnapshot();
    });
  });
});
