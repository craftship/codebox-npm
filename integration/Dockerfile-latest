FROM node:7.5.0

ARG sls_version

ADD . /codebox

WORKDIR /codebox

RUN npm install --silent

RUN npm install serverless@$sls_version -g --silent

CMD ./integration/bin/test
