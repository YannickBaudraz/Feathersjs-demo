import assert from 'assert';
import app from '../../src/app';
import {UserData} from '../../src/services/users/users.class';

describe('\'users\' service', () => {
  it('registered the service', () => {
    const service = app.service('users');

    assert.ok(service, 'Registered the service');
  });

  it('creates a user, encrypts password and adds gravatar', async () => {
    const user = await app.service('users').create({
      email: 'test@example.com',
      password: 'secret'
    }) as UserData;

    assert.equal(user.avatar, 'https://s.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=60');
    assert.ok(user.password !== 'secret');
  });

  it('should remove password for external requests', async () => {
    const user = await app.service('users').create({
      email: 'test2@example.com',
      password: 'secret'
    }, {provider: 'rest'}) as UserData;

    assert.ok(!user.password);
  });
});
