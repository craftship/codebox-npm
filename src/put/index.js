import deprecate from './deprecate';
import publish from './publish';
import contextFactory from '../contextFactory';

export default async (event, _, callback) => {
  const context = contextFactory(
    'package:put',
    event,
  );

  if (context.command.name === 'deprecate') {
    return deprecate(
      event,
      context,
      callback,
    );
  }

  return publish(
    event,
    context,
    callback,
  );
};
