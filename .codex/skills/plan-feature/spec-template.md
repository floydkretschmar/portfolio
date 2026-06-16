# Spec template

<spec-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The [deep modules](../../../docs/EXECUTION.md#deep-modules) that will be built/modified. 
- Clearly describe the public interfaces of the [deep modules](../../../docs/EXECUTION.md#deep-modules) that will be modified or build
- Technical clarifications for the developer
- Architectural decisions
- Schema or database changes
- API contracts: When integrating external APIs make the functions/endpoints/contracts to be used explicit based on authoritative sources such as API docs\
- Dependencies: When adding/modifying dependencies, make the EXACT version to be used explicit by adding one or more version matrix

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.
DO include diagrams, abstract data flows, module dependencies and public interface abstractions.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)
- Explicit list of black-box tests that verify expected behaviour end-to-end without specifying implementation details

## Out of Scope

A description of the things that are out of scope for this spec.

## Further Notes

Any further notes about the feature.

</spec-template>