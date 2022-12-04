# Gitflow

We'll be using the gitflow organization for the repo. I'll describe a TLDR version, but provide links to documents that explain it in further detail.

### Organization

The branches listed below will be used for the project.

 * `master` - Contains "production ready" code. i.e. The code that gets pushed to NPM.
 * `develop` - Contains code that's currently in progress. This is the branch that should be targeted for PRs.
 * `feature/*` - Contains a `feature`. This should be the current work for a single feature/addition to the codebase. It should have a sensible name. Let's say I want to comment all of the code, the feature branch name would be something like `feature/comment-js-files`.
 * `release` - This is branched from `develop` when a release is ready and holds the code for a release. It will be used to test to make sure there are no bugs before it gets pushed to `master`.
 * `hotfix` - If there is a bug in `master`, a hotfix branch is created with the fix to be merged DIRECTLY into master and then will be merged back into `develop` so that the fix is present in future code.

### Resources
 * [GitKraken](https://www.gitkraken.com/learn/git/git-flow)
 * [Atlassian](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
