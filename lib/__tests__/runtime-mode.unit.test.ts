import assert from "node:assert/strict";

import {
  canReadLiveOperatorData,
  getServerDataMode,
  getLiveOperatorDataBlockReason,
  getServerRuntimeState,
  isDatabaseConfigured,
  shouldServeMockData,
} from "../server/runtime-mode";

assert.equal(getServerDataMode({} as NodeJS.ProcessEnv), "auto");
assert.equal(
  getServerDataMode({ APP_DATA_MODE: "demo" } as NodeJS.ProcessEnv),
  "demo"
);
assert.equal(
  getServerDataMode({ APP_DATA_MODE: "live" } as NodeJS.ProcessEnv),
  "live"
);

assert.equal(isDatabaseConfigured({ DATABASE_URL: "" } as NodeJS.ProcessEnv), false);
assert.equal(
  isDatabaseConfigured({ DATABASE_URL: "file:./dev.db" } as NodeJS.ProcessEnv),
  true
);
assert.equal(
  isDatabaseConfigured({ DATABASE_URL: "postgres://broken" } as NodeJS.ProcessEnv),
  false
);

assert.equal(shouldServeMockData({} as NodeJS.ProcessEnv), true);
assert.equal(
  shouldServeMockData({
    APP_DATA_MODE: "demo",
    DATABASE_URL: "file:./dev.db",
  } as NodeJS.ProcessEnv),
  true
);
assert.equal(
  shouldServeMockData({
    APP_DATA_MODE: "live",
    DATABASE_URL: "file:./dev.db",
  } as NodeJS.ProcessEnv),
  false
);
assert.equal(
  shouldServeMockData({
    APP_DATA_MODE: "live",
    DATABASE_URL: "postgres://broken",
  } as NodeJS.ProcessEnv),
  true
);

const degradedRuntime = getServerRuntimeState({
  APP_DATA_MODE: "live",
} as NodeJS.ProcessEnv);
assert.equal(degradedRuntime.healthStatus, "degraded");
assert.equal(degradedRuntime.databaseConfigured, false);
assert.equal(degradedRuntime.usingMockData, true);

const invalidDatabaseRuntime = getServerRuntimeState({
  APP_DATA_MODE: "live",
  DATABASE_URL: "postgres://broken",
} as NodeJS.ProcessEnv);
assert.equal(invalidDatabaseRuntime.healthStatus, "degraded");
assert.equal(invalidDatabaseRuntime.databaseConfigured, false);
assert.equal(invalidDatabaseRuntime.usingMockData, true);
assert.equal(canReadLiveOperatorData(invalidDatabaseRuntime), false);
assert.equal(getLiveOperatorDataBlockReason(invalidDatabaseRuntime), "database_unavailable");

const demoRuntime = getServerRuntimeState({
  APP_DATA_MODE: "demo",
  DATABASE_URL: "file:./dev.db",
} as NodeJS.ProcessEnv);
assert.equal(demoRuntime.healthStatus, "ok");
assert.equal(demoRuntime.usingMockData, true);
assert.equal(canReadLiveOperatorData(demoRuntime), false);
assert.equal(getLiveOperatorDataBlockReason(demoRuntime), "demo_mode");

const autoFallbackRuntime = getServerRuntimeState({} as NodeJS.ProcessEnv);
assert.equal(canReadLiveOperatorData(autoFallbackRuntime), false);
assert.equal(getLiveOperatorDataBlockReason(autoFallbackRuntime), "database_unavailable");

const liveRuntime = getServerRuntimeState({
  APP_DATA_MODE: "live",
  DATABASE_URL: "file:./dev.db",
} as NodeJS.ProcessEnv);
assert.equal(canReadLiveOperatorData(liveRuntime), true);
assert.equal(getLiveOperatorDataBlockReason(liveRuntime), null);

console.log("PASS runtime-mode.unit");
