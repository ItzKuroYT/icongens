const { MongoClient } = require("mongodb");

const globalStore = globalThis;

if (!globalStore.__icongensMongo) {
  globalStore.__icongensMongo = {
    clientPromise: null,
    uri: "",
    dbName: ""
  };
}

function getConfig() {
  const uri = String(process.env.MONGODB_URI || "").trim();
  const dbName = String(process.env.MONGODB_DB || "icongens_support").trim() || "icongens_support";
  return { uri, dbName };
}

async function getMongoClient(uri) {
  if (
    !globalStore.__icongensMongo.clientPromise ||
    globalStore.__icongensMongo.uri !== uri
  ) {
    globalStore.__icongensMongo.uri = uri;
    globalStore.__icongensMongo.clientPromise = new MongoClient(uri).connect();
  }

  return globalStore.__icongensMongo.clientPromise;
}

async function getUsersCollection() {
  const { uri, dbName } = getConfig();
  if (!uri) {
    return null;
  }

  const client = await getMongoClient(uri);

  if (globalStore.__icongensMongo.dbName !== dbName) {
    globalStore.__icongensMongo.dbName = dbName;
  }

  return client.db(dbName).collection("users");
}

module.exports = {
  getUsersCollection
};
