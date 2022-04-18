import NeDB from '@seald-io/nedb';
import path from 'path';
import {Application} from '../declarations';

export default function (app: Application): NeDB<any> {
  const dbPath = app.get('nedb');

  return new NeDB({
    filename: path.join(dbPath, 'messages.db'),
    autoload: true
  });
}
