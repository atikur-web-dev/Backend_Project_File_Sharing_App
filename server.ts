import {log} from 'console';
import app from './App.js';
import {config} from './src/config/config.js';

app.listen(3000, () => {
  log('Server is running on http://localhost:3000');
});