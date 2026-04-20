import mongoose from "mongoose";
import { appEnv, assertRequiredConfig } from "./env";

const globalStore = globalThis;

if (!globalStore.__mongo) {
  globalStore.__mongo = {
    conn: null,
    promise: null
  };
}

export async function connectDb() {
  assertRequiredConfig();
  if (globalStore.__mongo.conn) {
    return globalStore.__mongo.conn;
  }

  if (!globalStore.__mongo.promise) {
    globalStore.__mongo.promise = mongoose
      .connect(appEnv.mongoUri, {
        dbName: "icongens_support"
      })
      .then((m) => m);
  }

  globalStore.__mongo.conn = await globalStore.__mongo.promise;
  return globalStore.__mongo.conn;
}
