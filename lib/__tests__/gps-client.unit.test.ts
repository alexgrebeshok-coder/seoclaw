import assert from "node:assert/strict";

import {
  buildGpsSampleUrl,
  fetchGpsTelemetrySample,
  getGpsTelemetrySampleSnapshot,
  getGpsTelemetryTruthSnapshot,
} from "@/lib/connectors/gps-client";

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function testBuildGpsSampleUrlUsesSessionsPath() {
  assert.equal(
    buildGpsSampleUrl("https://gps.example.com/api/v1"),
    "https://gps.example.com/api/v1/sessions?page_size=3"
  );
  assert.equal(
    buildGpsSampleUrl("https://gps.example.com/api/v1/session-stats"),
    "https://gps.example.com/api/v1/sessions?page_size=3"
  );
}

async function testTelemetrySampleNormalization() {
  let observedUrl = "";

  const result = await fetchGpsTelemetrySample(
    {
      baseUrl: "https://gps.example.com/api/v1",
      apiKey: "gps-api-key",
    },
    (async (input: string | URL | Request) => {
      observedUrl = String(input);
      return createJsonResponse({
        equipment_id: "EXC-KOM-01",
        sessions: [
          {
            session_id: "sess-20260207-EXC-KOM-01-003",
            session_type: "work",
            started_at: "2026-02-07T08:00:00Z",
            ended_at: "2026-02-07T10:30:00Z",
            duration_seconds: 9000,
            geofence_id: "GF-SITE-YANAO-SL01",
            geofence_name: "Salekhard-Labytnangi Earthwork Zone",
          },
        ],
      });
    }) as typeof fetch
  );

  assert.equal(observedUrl, "https://gps.example.com/api/v1/sessions?page_size=3");
  assert.equal(result.ok, true);

  if (!result.ok) {
    throw new Error("Expected telemetry sample to parse successfully.");
  }

  assert.equal(result.samples.length, 1);
  assert.deepEqual(result.samples[0], {
    source: "gps",
    sessionId: "sess-20260207-EXC-KOM-01-003",
    equipmentId: "EXC-KOM-01",
    equipmentType: null,
    status: "work",
    startedAt: "2026-02-07T08:00:00Z",
    endedAt: "2026-02-07T10:30:00Z",
    durationSeconds: 9000,
    geofenceId: "GF-SITE-YANAO-SL01",
    geofenceName: "Salekhard-Labytnangi Earthwork Zone",
  });
}

async function testEmptyTelemetryPayloadReturnsFailure() {
  const result = await fetchGpsTelemetrySample(
    {
      baseUrl: "https://gps.example.com/api/v1",
      apiKey: "gps-api-key",
    },
    (async () => createJsonResponse({ sessions: [] })) as typeof fetch
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected telemetry sample to fail on empty sessions.");
  }

  assert.match(result.message, /no session-like records/i);
}

async function testSnapshotStaysPendingWithoutSecrets() {
  const snapshot = await getGpsTelemetrySampleSnapshot({} as NodeJS.ProcessEnv);

  assert.equal(snapshot.status, "pending");
  assert.equal(snapshot.configured, false);
  assert.deepEqual(snapshot.missingSecrets, ["GPS_API_URL", "GPS_API_KEY"]);
  assert.equal(snapshot.samples.length, 0);
}

async function testTruthSnapshotBuildsNormalizedEntities() {
  let observedUrl = "";

  const snapshot = await getGpsTelemetryTruthSnapshot(
    {
      env: {
        GPS_API_URL: "https://gps.example.com/api/v1",
        GPS_API_KEY: "gps-api-key",
      } as NodeJS.ProcessEnv,
      fetchImpl: (async (input: string | URL | Request) => {
        observedUrl = String(input);
        return createJsonResponse([
          {
            session_id: "sess-20260207-EXC-KOM-01-003",
            equipment_id: "EXC-KOM-01",
            equipment_type: "excavator",
            session_type: "work",
            started_at: "2026-02-07T08:00:00Z",
            ended_at: "2026-02-07T10:30:00Z",
            duration_seconds: 9000,
            geofence_id: "GF-SITE-YANAO-SL01",
            geofence_name: "Salekhard-Labytnangi Earthwork Zone",
          },
          {
            session_id: "sess-20260207-TRK-KOM-02-001",
            equipment_id: "TRK-KOM-02",
            equipment_type: "haul-truck",
            status: "transit",
            started_at: "2026-02-07T09:15:00Z",
            ended_at: "2026-02-07T10:00:00Z",
            geofence_name: "Winter access corridor",
          },
          {
            session_id: "sess-20260207-EXC-KOM-01-004",
            equipment_id: "EXC-KOM-01",
            equipment_type: "excavator",
            session_type: "idle",
            started_at: "2026-02-07T11:00:00Z",
            geofence_id: "GF-YARD-YANAO-02",
            geofence_name: "Yard staging zone",
          },
        ]);
      }) as typeof fetch,
    }
  );

  assert.equal(observedUrl, "https://gps.example.com/api/v1/sessions?page_size=12");
  assert.equal(snapshot.status, "ok");
  assert.equal(snapshot.summary.sessionCount, 3);
  assert.equal(snapshot.summary.equipmentCount, 2);
  assert.equal(snapshot.summary.geofenceCount, 3);
  assert.equal(snapshot.summary.totalDurationSeconds, 11700);
  assert.equal(snapshot.summary.openEndedSessionCount, 1);
  assert.equal(snapshot.summary.equipmentLinkedSessions, 3);
  assert.equal(snapshot.summary.geofenceLinkedSessions, 3);
  assert.equal(snapshot.sessions[0]?.sessionId, "sess-20260207-EXC-KOM-01-004");
  assert.equal(snapshot.sessions[0]?.hasOpenEndedRange, true);
  assert.equal(snapshot.sessions[1]?.sessionId, "sess-20260207-EXC-KOM-01-003");
  assert.equal(snapshot.equipment[0]?.equipmentId, "EXC-KOM-01");
  assert.equal(snapshot.equipment[0]?.sessionCount, 2);
  assert.equal(snapshot.equipment[0]?.latestStatus, "idle");
  assert.equal(snapshot.equipment[0]?.latestGeofenceName, "Yard staging zone");
  assert.equal(snapshot.geofences[0]?.geofenceName, "Yard staging zone");
  assert.equal(snapshot.geofences[1]?.geofenceName, "Salekhard-Labytnangi Earthwork Zone");
  assert.equal(snapshot.geofences[2]?.equipmentIds[0], "TRK-KOM-02");
}

async function main() {
  await testBuildGpsSampleUrlUsesSessionsPath();
  await testTelemetrySampleNormalization();
  await testEmptyTelemetryPayloadReturnsFailure();
  await testSnapshotStaysPendingWithoutSecrets();
  await testTruthSnapshotBuildsNormalizedEntities();
  console.log("PASS gps-client.unit");
}

void main();
