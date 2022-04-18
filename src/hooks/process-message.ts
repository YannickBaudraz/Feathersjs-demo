// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import {Hook, HookContext} from '@feathersjs/feathers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const {data} = context;

    // Throw an error if we didn't get a text
    if (!data.text) {
      throw new Error('A message must have a text');
    }

    const user = context.params.user;
    const text = data.text.substring(0, 400);

    context.data = {
      text,
      userId: user?._id,
      createdAt: new Date().getTime(),
    };

    return context;
  };
};
