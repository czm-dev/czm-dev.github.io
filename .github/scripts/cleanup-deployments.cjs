module.exports = async function cleanupDeployments({ github, context, core }) {
  const environment = 'github-pages';
  const repo = context.repo;
  const deployments = await github.paginate(github.rest.repos.listDeployments, {
    ...repo,
    environment,
    per_page: 100,
  });

  async function latestStatus(id) {
    const { data } = await github.rest.repos.listDeploymentStatuses({
      ...repo,
      deployment_id: id,
      per_page: 1,
    });
    return data[0];
  }

  const snapshots = [];
  for (const deployment of deployments) {
    if (deployment.environment !== environment) continue;
    snapshots.push({ deployment, status: await latestStatus(deployment.id) });
  }

  const keeper = snapshots
    .filter(item => item.status?.state === 'success')
    .sort((a, b) => b.deployment.id - a.deployment.id)[0];
  if (!keeper || keeper.deployment.sha !== context.sha) {
    core.warning('No current successful github-pages deployment found; keeping all records.');
    return 0;
  }

  const obsolete = snapshots.filter(({ deployment, status }) =>
    status?.state === 'inactive' ||
    (status?.state === 'success' && deployment.id < keeper.deployment.id)
  );

  let deleted = 0;
  for (const { deployment, status } of obsolete) {
    const id = deployment.id;
    try {
      // Stop if the deployment we are preserving ceased to be active.
      if ((await latestStatus(keeper.deployment.id))?.state !== 'success') {
        core.warning('The current deployment changed state; stopping cleanup.');
        break;
      }
      const current = await latestStatus(id);
      if (status.state === 'success') {
        // Production records may remain successful after being superseded.
        // Preserve records whose status changed since our initial snapshot.
        if (current?.state !== 'success' || current.id !== status.id) continue;
        await github.rest.repos.createDeploymentStatus({
          ...repo, deployment_id: id, state: 'inactive', auto_inactive: false,
        });
        core.info(`Marked superseded github-pages deployment ${id} inactive.`);
        if ((await latestStatus(id))?.state !== 'inactive') continue;
      } else if (current?.state !== 'inactive') {
        continue;
      }
      await github.rest.repos.deleteDeployment({ ...repo, deployment_id: id });
      deleted += 1;
      core.info(`Deleted inactive github-pages deployment ${id}.`);
    } catch (error) {
      // GitHub also refuses to delete active records if the state changes again.
      if (error.status !== 404 && error.status !== 422) throw error;
      core.warning(`Kept deployment ${id}: GitHub returned HTTP ${error.status}.`);
    }
  }
  core.info(`Removed ${deleted} inactive github-pages deployment records.`);
  return deleted;
};
