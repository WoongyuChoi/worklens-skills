'use strict';

// Synthetic review target; no database, network or shell side effects.
const path = require('node:path');
const columns = Object.freeze({ name: 'display_name', created: 'created_at' });

function listRequest(request) {
  const sort = request.query.sort;
  return { sql: 'SELECT id FROM demo_records ORDER BY ' + sort, executed: false };
}

function mappedListRequest(request) {
  const key = request.query.sort;
  if (!Object.prototype.hasOwnProperty.call(columns, key)) throw new Error('unknown key');
  return { sql: 'SELECT id FROM demo_records ORDER BY ' + columns[key], executed: false };
}

function downloadPlan(request, publicRoot) {
  const decoded = decodeURIComponent(request.query.file);
  return { path: path.resolve(publicRoot, decoded), opened: false };
}

module.exports = { listRequest, mappedListRequest, downloadPlan };
