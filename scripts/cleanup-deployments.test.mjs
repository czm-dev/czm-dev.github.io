import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
let cleanup;
try {
  cleanup = require('../.github/scripts/cleanup-deployments.cjs');
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

function fixture(records, statuses, { deleteError } = {}) {
  const deleted = [];
  const deactivated = [];
  const queried = [];
  const warnings = [];
  const reads = new Map();
  const repo = { owner: 'example', repo: 'example.github.io' };
  const github = {
    paginate: async (endpoint, params) => {
      assert.equal(endpoint, github.rest.repos.listDeployments);
      assert.deepEqual(params, { ...repo, environment: 'github-pages', per_page: 100 });
      return records;
    },
    rest: { repos: {
      listDeployments() {},
      async listDeploymentStatuses(params) {
        assert.deepEqual(params, { ...repo, deployment_id: params.deployment_id, per_page: 1 });
        queried.push(params.deployment_id);
        const count = reads.get(params.deployment_id) ?? 0;
        reads.set(params.deployment_id, count + 1);
        const sequence = statuses[params.deployment_id] ?? [[]];
        return { data: sequence[Math.min(count, sequence.length - 1)] };
      },
      async deleteDeployment(params) {
        assert.deepEqual(params, { ...repo, deployment_id: params.deployment_id });
        if (deleteError) throw deleteError;
        deleted.push(params.deployment_id);
      },
      async createDeploymentStatus(params) {
        assert.deepEqual(params, {
          ...repo, deployment_id: params.deployment_id, state: 'inactive',
          auto_inactive: false,
        });
        deactivated.push(params.deployment_id);
        statuses[params.deployment_id] = [state('inactive')];
      },
    } },
  };
  return {
    deleted, deactivated, queried, warnings,
    args: { github, context: { repo, sha: 'current' }, core: { info() {}, warning: message => warnings.push(message) } },
  };
}

const record = (id, environment = 'github-pages', sha = 'current') => ({ id, environment, sha });
const state = name => [{ state: name, id: 1 }];

async function run(f) {
  assert.equal(typeof cleanup, 'function', 'Deployment cleanup must be implemented');
  return cleanup(f.args);
}

test('removes obsolete Pages records and preserves the current deployment and unfinished states', async () => {
  const f = fixture([1, 2, 3, 4, 5, 6, 7, 8].map(id => record(id)).concat(record(9, 'preview')), {
    1: [state('success')],
    2: [[{ state: 'inactive' }, { state: 'success' }]],
    3: [[{ state: 'success' }, { state: 'inactive' }]],
    4: [state('in_progress')], 5: [state('queued')],
    6: [state('failure')], 7: [[]], 8: [state('pending')],
    9: [state('inactive')],
  });
  assert.equal(await run(f), 2);
  assert.deepEqual(f.deleted, [1, 2]);
  assert.deepEqual(f.deactivated, [1]);
  assert.ok(!f.queried.includes(9));
});

test('keeps all records if no successful deployment is found', async () => {
  const f = fixture([record(1), record(2)], { 1: [state('inactive')], 2: [state('in_progress')] });
  assert.equal(await run(f), 0);
  assert.deepEqual(f.deleted, []);
  assert.equal(f.warnings.length, 1);
});

test('rechecks inactive status and preserves a record that becomes active', async () => {
  const f = fixture([record(1), record(2)], {
    1: [state('success')], 2: [state('inactive'), state('success')],
  });
  assert.equal(await run(f), 0);
  assert.deepEqual(f.deleted, []);
  assert.equal(f.queried.filter(id => id === 2).length, 2);
});

test('reports permission failures without changing deployment statuses', async () => {
  const error = Object.assign(new Error('Forbidden'), { status: 403 });
  const f = fixture([record(1), record(2)], {
    1: [state('success')], 2: [state('inactive')],
  }, { deleteError: error });
  await assert.rejects(run(f), error);
  assert.deepEqual(f.deleted, []);
});

test('warns if GitHub refuses deletion after the status check', async () => {
  const f = fixture([record(1), record(2)], {
    1: [state('success')], 2: [state('inactive')],
  }, { deleteError: Object.assign(new Error('Cannot delete an active deployment'), { status: 422 }) });
  assert.equal(await run(f), 0);
  assert.deepEqual(f.deleted, []);
  assert.equal(f.warnings.length, 1);
});

test('keeps the newest successful deployment when older production records still say success', async () => {
  const f = fixture([record(5), record(4), record(3)], {
    5: [state('success')], 4: [state('success')], 3: [state('success')],
  });
  assert.equal(await run(f), 2);
  assert.deepEqual(f.deactivated, [4, 3]);
  assert.deepEqual(f.deleted, [4, 3]);
});

test('skips cleanup if a different revision became the latest successful deployment', async () => {
  const f = fixture([record(5, 'github-pages', 'newer'), record(4)], {
    5: [state('success')], 4: [state('inactive')],
  });
  assert.equal(await run(f), 0);
  assert.deepEqual(f.deleted, []);
  assert.deepEqual(f.deactivated, []);
});

test('does not deactivate a successful record whose latest status changed during cleanup', async () => {
  const f = fixture([record(5), record(4)], {
    5: [state('success')],
    4: [state('success'), [{ state: 'success', id: 2 }]],
  });
  assert.equal(await run(f), 0);
  assert.deepEqual(f.deactivated, []);
});
