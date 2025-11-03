declare module 'pg' {
  import type { Client as PGClient } from 'pg';
  const Client: any;
  export { Client };
  export default Client;
}
