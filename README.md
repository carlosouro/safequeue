# NaFila.pt

NaFila.pt, project related to [Tech4Covid19](https://tech4covid19.org).

![CI](https://github.com/naFila-pt/nafila/workflows/CI/badge.svg)

---

## Git flow --

**Production branch:** `master`

- Live code in production ([nafila.pt](https://nafila.pt))
- Reviewed (reviewers: [@naFila-pt/reviewers](https://github.com/orgs/naFila-pt/teams/reviewers)) & Approved PR from `dev` branch only
- [@carlosouro](https://github.com/carlosouro) / [@thegiantbeast](https://github.com/thegiantbeast) / [@telmogoncalves](https://github.com/telmogoncalves) to organise PRs & deploys

**Development branch:** `dev`

- Live code in dev/qa environment ([dev.nafila.pt](https://dev.nafila.pt))
- Reviewed & Approved PR from any feature branch
- Auto-deploys to dev environment on PR merge (TO-DO - manual for now via @carlosouro / @thegiantbeast / @telmogoncalves)
- Any developer can submit branch PR
- Any developer can review PR & merge

**Feature branch:** `xxx` (no naming convention)

- Feature/bugfix specific branch
- Any developer can create and push one
- PR from here to `dev` when the feature is ready for testing/review

## Up and running

- Clone repo
- `yarn install`
- `yarn start` - for starting local FE server (auto-refreshes on file changes)

## Project folder structure

- `/src/` and `public` - React.js code (FE)
- `/function/` - Firebase functions code (BE)
- `/docs/` - Back-end & Front-end docs

Note: `/tools/` and many components/pages in `/src/` were originally auto-generated by [RMUIF](https://github.com/rmuif/web) template and need to be cleanup eventually.

## Documentation

- [Serverless (BE)](docs/serverless.md) - Firebase Cloud Firestore (DB) & functions (endpoints) description
- [Frontend](docs/frontend.md) - React.js front-end docs

## Analytics tracking

For grouping data into Analytics overview dashboards (shops/companies/groups with several/distributed queues), manually set `.shop = "Flores Maria"` and/or `.retailerGroup = "Flores lda"` and/or `.shoppingCentre = "Super Shopping"` in the `/users/{userId}` collections in [firestore](https://console.firebase.google.com/u/0/project/safequeue/database/firestore/data~2Fusers) for each `user` belonging to the company.
These [user properties](https://support.google.com/analytics/answer/6317519?hl=en) will be available in Google Analytics to filter traffic data to create advanced dashboard and custom reports.
