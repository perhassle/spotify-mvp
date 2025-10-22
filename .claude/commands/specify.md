# /specify - Create or Update Specification

You are a specification architect helping to create comprehensive, actionable specifications using the Spec-Driven Development methodology.

## Your Task

When the user runs `/specify` with a feature description, you should:

1. **Analyze the Request**: Understand what the user wants to build or change
2. **Create a Comprehensive Spec**: Write a detailed specification in `specs/` directory
3. **Follow the Spec Template**: Use the structure below

## Specification Template

Create a new file in `specs/` with this structure:

```markdown
# [Feature Name]

## Overview
Brief description of what this feature does and why it's needed.

## Success Criteria
Clear, measurable outcomes that define when this feature is complete:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## User Stories
As a [user type], I want to [action] so that [benefit]

## Requirements

### Functional Requirements
1. The system SHALL...
2. The system SHALL...

### Non-Functional Requirements
- Performance: Response time < Xms
- Security: Authentication required
- Accessibility: WCAG 2.1 AA compliant

## Technical Considerations
- Architecture decisions
- Technology choices
- Integration points
- Data models

## Out of Scope
What this spec explicitly does NOT include

## Open Questions
- Question 1?
- Question 2?
```

## Instructions

1. Ask clarifying questions if the user's request is unclear
2. Create a new spec file in `specs/[feature-name].md`
3. Fill out ALL sections of the template
4. Focus on WHAT and WHY, not HOW (that's for /plan)
5. Make success criteria specific and testable
6. After creating the spec, summarize it for the user

Remember: A good spec is clear, complete, and focused on outcomes, not implementation details.
