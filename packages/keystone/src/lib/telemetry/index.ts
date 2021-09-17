import fetch from 'node-fetch';
import { defaults } from '../config/defaults';
import { deviceInfo } from './deviceInfo';
import { projectInfo } from './projectInfo';

export function sendTelemetryEvent(
  eventType: string,
  cwd: string,
  dbProvider?: string,
  prismaSchema?: string
) {
  try {
    if (process.env.TELEMETRY_DISABLED === 'true') {
      return;
    }

    const eventData = {
      ...deviceInfo(),
      ...projectInfo(cwd, prismaSchema),
      dbProvider,
      eventType,
      // "fieldCounts": "{ count: 1} ",
    };

    const telemetryEndpoint = process.env.TELEMETRY_ENDPOINT || defaults.telemetryEndpoint;
    if (process.env.TELEMETRY_DEBUG === '1') {
      console.log(eventData);
    } else {
      // Do not `await` to keep non-blocking
      fetch(`${telemetryEndpoint}/v1/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })
        .then(
          () => {},
          () => {}
        )
        // Catch silently
        .catch(() => {});
    }
  } catch (err) {
    // Fail silently
    console.log(err);
  }
}
