import assert from 'assert';
import app from '../../src/app';
import {UserData} from '../../src/services/users/users.class';

describe('\'messages\' service', () => {
  it('registered the service', () => {
    const service = app.service('messages');

    assert.ok(service, 'Registered the service');
  });

  it('should create and process a message and add user information', async () => {
    const user = await app.service('users').create({
      email: 'messagetest@example.com',
      password: 'supersecret'
    }) as UserData;

    const message = await app.service('messages').create({
      text: 'a test',
      additional: 'should be removed'
    }, {user});

    assert.equal(message.text, 'a test');
    assert.equal(message.userId, user._id);
    assert.ok(!message.additional);
    assert.deepEqual(message.user, user);
  });
});
