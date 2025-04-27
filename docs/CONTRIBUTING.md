# Contributing Guide

Thank you for considering contributing to our project! This document outlines our commit message conventions and other guidelines for contributing.

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages. This leads to more readable messages that are easy to follow when looking through the project history.

### Commit Message Format

Each commit message consists of a **header**, a **body** and a **footer**. The header has a special format that includes a **type**, a **scope** and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory, while the **scope**, **body** and **footer** are optional.

### Types

Must be one of the following:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries
- `ci`: Changes to our CI configuration files and scripts

### Subject

The subject contains a succinct description of the change:

- use the imperative, present tense: "change" not "changed" nor "changes"
- don't capitalize the first letter
- no dot (.) at the end

### Examples

```
feat(auth): add user authentication endpoint

fix(redis): resolve connection timeout issue

docs(api): update API documentation with new endpoints

style(lint): apply prettier formatting

refactor(cache): improve redis implementation

test(user): add unit tests for user creation

chore(deps): update dependencies

ci(github): add github actions workflow
```

### Breaking Changes

Breaking changes should be indicated by adding `!` after the type/scope and including `BREAKING CHANGE:` in the footer:

```
feat(api)!: remove deprecated user endpoints

BREAKING CHANGE: The /v1/users endpoint has been removed in favor of /v2/users
```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the CHANGELOG.md following the same commit message conventions
3. The PR will be merged once you have the sign-off of at least one maintainer

## Development Setup

Please refer to our [README.md](README.md) for detailed instructions on setting up your development environment.

## Questions or Problems?

If you have any questions or problems, please check our [issue tracker](../../issues) to see if your issue has already been reported. If not, feel free to open a new issue.
