export function extractMediaKeys(record) {
  const keys = [];
  for (const item of record?.media || []) {
    if (item?.key) keys.push(item.key);
  }
  return keys;
}
