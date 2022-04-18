/* global io, feathers, moment */
const socket = io();
const client = feathers();

client.configure(feathers.socketio(socket));
client.configure(feathers.authentication());

const loginHTML = `
<main class="login container">
  <div class="row">
    <div class="col-12 col-6-tablet push-3-tablet text-center heading">
      <h1 class="font-100">Log in or signup</h1>
     </div>
  </div>
  <div class="row">
    <div class="col-12 col-6-tablet push-3-tablet col-4-desktop push-4-desktop">
      <form class="form">
        <fieldset>
          <input class="block" type="email" name="email" placeholder="email">
        </fieldset>

        <fieldset>
          <input class="block" type="password" name="password" placeholder="password">
        </fieldset>

        <button type="button" id="login" class="button button-primary block signup">
          Log in
        </button>

        <button type="button" id="signup" class="button button-primary block signup">
          Sign up and log in
        </button>

        <a class="button button-primary block" href="/oauth/github">
          Login with GitHub
        </a>
      </form>
    </div>
  </div>
</main>
`;

const chatHTML = `
<main class="flex flex-column">
  <header class="title-bar flex flex-row flex-center">
    <div class="title-wrapper block center-element">
      <img class="logo" src="https://feathersjs.com/img/feathers-logo-wide.png"
        alt="Feathers Logo">
      <span class="title">Chat</span>
    </div>
  </header>

  <div class="flex flex-row flex-1 clear">
    <aside class="sidebar col col-3 flex flex-column flex-space-between">
      <header class="flex flex-row flex-center">
        <h4 class="font-300 text-center">
          <span class="font-600 online-count">0</span> users
        </h4>
      </header>

      <ul class="flex flex-column flex-1 list-unstyled user-list"></ul>
      <footer class="flex flex-row flex-center">
        <a href="#" id="logout" class="button button-primary">
          Sign Out
        </a>
      </footer>
    </aside>

    <div class="flex flex-column col col-9">
      <main class="chat flex flex-column flex-1 clear"></main>

      <form class="flex flex-row flex-space-between" id="send-message">
        <input type="text" name="text" class="flex flex-1">
        <button class="button-primary" type="submit">Send</button>
      </form>
    </div>
  </div>
</main>
`;

/**
 * Helper to safely escape HTML.
 *
 * @param str
 * @returns {*}
 */
const escape = str => str.replace(/&/g, '&amp;').
                          replace(/</g, '&lt;').
                          replace(/>/g, '&gt;');

/**
 * Add a new user to the user list on the left.
 *
 * @param user
 */
const addUser = (user) => {
  const userList = document.querySelector('.user-list');

  if (userList) {
    userList.innerHTML += `
      <li>
        <a class="block relative" href="#">
          <img src="${user.avatar}" alt="" class="avatar">
          <span class="absolute username">${escape(user.name || user.email)}</span>
        </a>
      </li>
    `;
  }

  // Update the number of users
  const onlineCountEl = document.querySelector('.online-count');
  const userEls = document.querySelectorAll('.user-list li');
  onlineCountEl.innerText = userEls.length;
};

/**
 * Add a new message to the list. It will also make sure that we always scroll
 * to the bottom of the message list as messages get added.
 *
 * @param message
 */
const addMessage = message => {
  // The user that sent this message (added by the populate-user hook)
  const {user = {}} = message;
  const chat = document.querySelector('.chat');
  const text = escape(message.text);

  if (chat) {
    chat.innerHTML += `
      <div class="message flex flex-row">
        <img src="${user.avatar}" alt="${user.name || user.email}" class="avatar">
        <div class="message-wrapper">
          <p class="message-header">
            <span class="username font-600">${escape(user.name || user.email)}</span>
            <span class="sent-date font-300">
              ${moment(message.createdAt).format('MMM Do, hh:mm:ss')}
            </span>
          </p>
          <p class="message-content font-300">${text}</p>
        </div>
      </div>
    `;

    // Scroll to the bottom of our message list
    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
  }
};

/**
 * Show the content of loginHTML or, if the login page is already showing, add
 * an error message. This will happen when you try to log in with invalid
 * credentials or sign up with a user that already exists.
 *
 * @param error
 */
const showLogin = (error) => {
  if (document.querySelectorAll('.login').length && error) {
    document.querySelector('.heading').
             insertAdjacentHTML(
               'beforeend',
               `<p>There was an error: ${error.message}</p>`,
             );
  } else {
    document.getElementById('app').innerHTML = loginHTML;
  }
};

/**
 * First, we add the static chatHTML to the page.<br>
 * Then we get the latest 25 messages from the messages Feathers service
 * (this is the same as the /messages endpoint of our chat API) using the
 * Feathers query syntax. Since the list will come back with the newest message
 * first, we need to reverse the data.<br>
 * Then we add each message by calling our addMessage function so that it looks
 * like a chat app should — with old messages getting older as you scroll up.<br>
 * After that we get a list of all registered users to show them in the sidebar
 * by calling addUser.
 *
 * @returns {Promise<void>}
 */
const showChat = async () => {
  document.getElementById('app').innerHTML = chatHTML;

  // Find the latest 25 messages. They will come with the newest first
  const messages = await client.service('messages').find({
    query: {
      $sort: {createdAt: -1},
      $limit: 25,
    },
  });

  // Show the newest message last
  messages.data.reverse().forEach(addMessage);

  // Find all users
  const users = await client.service('users').find();

  // Add each user to the list
  users.data.forEach(addUser);
};

/**
 * Retrieve email/password object from the login/signup page.
 *
 * @returns {{password, email}}
 */
const getCredentials = () => {
  return {
    email: document.querySelector('[name="email"]').value,
    password: document.querySelector('[name="password"]').value,
  };
};

/**
 * Log in either using the given email/password or the token from storage
 *
 * @param credentials
 * @returns {Promise<void>}
 */
const login = async credentials => {
  try {
    if (!credentials) {
      // Try to authenticate using an existing token
      await client.reAuthenticate();
    } else {
      // Log in with the `local` strategy using the credentials we got
      await client.authenticate({strategy: 'local', ...credentials});
    }

    showChat().catch(error => console.error(error));
  } catch (error) {
    showLogin(error);
  }
};

//region events
const addEventListener = (selector, event, handler) => {
  document.addEventListener(event, async ev => {
    if (ev.target.closest(selector)) {
      handler(ev);
    }
  });
};

// "Signup and login" button click handler
addEventListener('#signup', 'click', async () => {
  // For signup, create a new user and then log them in
  const credentials = getCredentials();

  // First create the user
  await client.service('users').create(credentials);
  // If successful log them in
  await login(credentials);
});

// "Login" button click handler
addEventListener('#login', 'click', async () => {
  const user = getCredentials();

  await login(user);
});

// "Logout" button click handler
addEventListener('#logout', 'click', async () => {
  await client.logout();

  document.getElementById('app').innerHTML = loginHTML;
});

// "Send" message form submission handler
addEventListener('#send-message', 'submit', async ev => {
  // This is the message text input field
  const input = document.querySelector('[name="text"]');

  ev.preventDefault();

  // Create a new message and then clear the input field
  await client.service('messages').create({
    text: input.value,
  });

  input.value = '';
});

// Listen to created events and add the new message in real-time
client.service('messages').on('created', addMessage);

// We will also see when new users get created in real-time
client.service('users').on('created', addUser);
//endregion

// Call login right away, so we can show the chat window
// If the user can already be authenticated
login().catch(error => console.error(error));
