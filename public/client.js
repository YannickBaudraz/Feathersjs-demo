// Establish a Socket.io connection
const socket = io();

// Initialize our Feathers client application through Socket.io
const client = feathers().
configure(feathers.socketio(socket)).
configure(feathers.authentication({
  storage: window.localStorage,
}));

const login = async () => {
  try {
    return await client.reAuthenticate();
  } catch (error) {
    // Log in with email/password
    // Here we would normally show a login page
    // to get the login information
    return await client.authenticate({
      strategy: 'local',
      email: 'hello@feathersjs.com',
      password: 'supersecret',
    });
  }
};

const main = async () => {
  const auth = await login();

  console.log('User is authenticated', auth);

  // Log us out again
  await client.logout();
};

main();
