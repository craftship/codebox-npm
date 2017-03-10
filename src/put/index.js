import lib from './lib';
import contextFactory from '../contextFactory';

export default async (event, _, callback) => lib(
  event,
  contextFactory(
    'package:put',
    event.requestContext,
  ),
  callback,
);
