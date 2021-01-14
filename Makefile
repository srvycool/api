$(shell touch .env)
include .env

export AWS_REGION=eu-west-1
export ENVIRONMENT

deploy:
	yarn cdk deploy

run-e2e:
	ENDPOINT=$(shell make get-graphql-endpoint) yarn ts-node e2e

get-graphql-endpoint:
	@aws cloudformation describe-stacks \
		--stack-name "ProxyStack${ENVIRONMENT}" \
		--query 'Stacks[].Outputs[?OutputKey==`GraphQLEndpoint`].OutputValue' \
		--output text