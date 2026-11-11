# Dynatrace Labs

**https://labs.dynatrace.com**

Dynatrace Labs is a searchable catalog of ready-to-use Dynatrace solutions built
by the community: dashboards, notebooks, workflows, apps, agent integrations,
configuration as code and blueprints. Each solution comes with screenshots, an
overview, prerequisites and setup steps, and a clear next step to get started.

## What this repository is

This repository holds the published website and nothing else. It is served by
GitHub Pages at labs.dynatrace.com.

- **The files here are generated.** They are maintained elsewhere and copied
  here by a reviewed pull request. Please don't edit them directly; changes
  made here are overwritten by the next update.
- **The solutions are not here.** Every solution lives in its source
  repository, today [Dynatrace/community-examples](https://github.com/Dynatrace/community-examples).
  The catalog (`data/catalog-repo.js`) is built from those repositories' README
  files.

## How content gets in

1. A solution is added or changed by a pull request in its source repository.
2. The catalog is rebuilt from the source repositories and checked automatically.
3. The updated site arrives here as a pull request and goes live after one approval.

## Contributing

- **Share a solution:** follow the
  [contribution guide](https://github.com/Dynatrace/community-examples/blob/main/CONTRIBUTING.md)
  in community-examples.
- **Problem with a solution:** use "Report issue" on the solution in Labs. It
  opens an issue in the solution's own repository.
- **Problem with the website itself:** open an issue in this repository.

## Files

| File | What it is |
|---|---|
| `index.html` | the page |
| `assets/` | styles and scripts (when present) |
| `data/catalog-repo.js` | the generated catalog of solutions |
| `version-history.html` | release notes |
| `CNAME` | custom domain for GitHub Pages |
| `.nojekyll` | tells GitHub Pages to serve the files as they are |

The site uses Dynatrace Real User Monitoring to count anonymous usage (page views,
searches, opened solutions). It records no names or e-mail addresses and no
session replay.
