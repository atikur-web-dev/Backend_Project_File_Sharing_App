import { log } from 'console';
import app from './App.ts';
import { config } from './src/config/config.ts'; // path check

app.listen(config.port, () => {
  log(`Server is running on http://localhost:${config.port}`);
});
