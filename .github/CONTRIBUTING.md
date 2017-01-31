# Contributing Guidelines

Welcome, and thanks in advance for your help!

## When you want to propose a new feature or bug fix
* Please make sure there is an open issue discussing your
contribution.
* If there isn't, please open an issue so we can talk about it before you invest
time into the implementation.
* When creating an issue follow the guide that Github shows so we have enough
information about your proposal.

## Pull Requests
Please follow these Pull Request guidelines when creating pull requests:
* If an issue exists, leave a comment there that you are working on a solution
so nobody else jumps on it.
* If an issue does not exist, create a new Issue, detail your changes.  We
recommend waiting until we accept it, so you don't waste your precious time.
* Follow our **Testing** and **Code Style** guidelines below.
* Start commit messages with a uppercase verb such as "Add", "Fix", "Refactor",
"Remove".

## Issues
Please follow these issue guidelines for opening issues:
* Make sure your issue is not a duplicate.
* Make sure your issue is for a *feature*, *bug*, or *discussion*, use the
labels provided in Github where applicable.

## Code Style
We aim for clean, consistent code style.  We're using ESlint to check for
codestyle issues. If ESlint issues are found our build will fail and we can't
merge the PR.

Please follow these Code Style guidelines when writing your unit tests:
* In the root of our repo, use this command to check for styling issues: `npm
run lint`

## Testing
We strive for 100% test coverage, so make sure your tests cover as much of your
code as possible.
