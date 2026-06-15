import { createRequire } from "module";

const require = createRequire(import.meta.url);
const adminPkg = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

const { initializeApp, cert } = adminPkg;

initializeApp({
  credential: cert(serviceAccount)
});

export default adminPkg;