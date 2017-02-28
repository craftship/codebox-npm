FROM node:6.9.5

ARG sls_version

ADD . /codebox

WORKDIR /codebox

RUN npm install --silent

RUN npm install serverless@$sls_version -g --silent

CMD ./integration/bin/test
