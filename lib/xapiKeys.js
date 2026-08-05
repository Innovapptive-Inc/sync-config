import { ENVIRONMENTS } from './environments';

function envKey(domain) {
  return domain.toUpperCase().replace(/-/g, '_');
}

export const XAPI_KEY_MAP = ENVIRONMENTS.reduce((map, domain) => {
  const suffix = envKey(domain);
  map[domain] = {
    baseMasterKey: process.env[`BASE_MASTER_XAPI_KEY_${suffix}`],
    snapshotKey: process.env[`SNAPSHOT_XAPI_KEY_${suffix}`],
  };
  return map;
}, {});

export function getXApiKeys(domain) {
  return XAPI_KEY_MAP[domain];
}
