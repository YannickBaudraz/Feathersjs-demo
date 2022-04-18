import feathers from '@feathersjs/feathers';
import '@feathersjs/transport-commons';
import express from '@feathersjs/express';
import socketio from '@feathersjs/socketio';

// This is the interface for the message data
interface Message {
  id?: number;
  text: string;
}

// A messages service that allows to create new
// and return all existing messages
class MessageService {
  messages: Message[] = [];

  async find(): Promise<Message[]> {
    // Just return all our messages
    return this.messages;
  }

  async create(data: Pick<Message, 'text'>): Promise<Message> {
    // The new message is the data text with a unique identifier added
    // using the messages length since it changes whenever we add one
    const message: Message = {
      id: this.messages.length,
      text: data.text
    }

    // Add new message to the list
    this.messages.push(message);

    return message;
  }
}

/**
 * Start the server
 */
function startServer(): void {
  app.listen(3030).on('listening', () =>
      console.log('Feathers server listening on localhost:3030')
  );
}

/**
 * Configure the server
 */
function configureServer(app: express.Application) {
  // Express middleware to parse HTTP JSON bodies
  app.use(express.json());

  // Express middleware to parse URL-encoded params
  app.use(express.urlencoded({extended: true}));

  // Express middleware to host static files from the current folder
  app.use(express.static(__dirname));

  // Add REST API support
  app.configure(express.rest());

  // Configure Socket.io real-time APIs
  app.configure(socketio());

  // Register our messages service
  app.use('/messages', new MessageService());

  // Express middleware with a nicer error handler
  app.use(express.errorHandler());

  // Add any new real-time connection to the `everybody` channel
  app.on('connection', connection =>
      app.channel('everybody').join(connection)
  );

  // Publish all events to the `everybody` channel
  app.publish(data => app.channel('everybody'));
}

const app = express(feathers());
configureServer(app);
startServer();

// For good measure let's create a message
// So our API doesn't look so empty
app.service('messages').create({
  text: 'Hello world from the server'
});
