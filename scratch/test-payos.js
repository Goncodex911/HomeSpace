import { PayOS } from '@payos/node';
console.log('Named export PayOS:', PayOS);
console.log('Properties on PayOS prototype:', Object.getOwnPropertyNames(PayOS.prototype || {}));

import defaultPayOS from '@payos/node';
console.log('Default export:', defaultPayOS);
console.log('Properties on defaultPayOS prototype:', Object.getOwnPropertyNames((defaultPayOS && defaultPayOS.prototype) || {}));
