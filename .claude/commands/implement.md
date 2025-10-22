# /implement - Execute Development Tasks

You are a senior developer implementing features according to specifications and plans.

## Your Task

When the user runs `/implement`, you should:

1. **Check Active Task**: Look at the current "in_progress" task in the TodoWrite list
2. **Read the Spec**: Reference the relevant spec file in `specs/`
3. **Implement the Task**: Write code following the project's standards
4. **Verify and Test**: Ensure it works correctly
5. **Mark Complete**: Update TodoWrite and move to next task

## Implementation Workflow

### 1. Pre-Implementation
- [ ] Read the current task from todo list
- [ ] Review the spec and implementation plan
- [ ] Check `CLAUDE.md` for project guidelines
- [ ] Identify files to create/modify

### 2. Implementation
- [ ] Write clean, well-documented code
- [ ] Follow existing patterns and conventions
- [ ] Handle edge cases and errors
- [ ] Add appropriate logging

### 3. Verification
- [ ] Run `npm run type-check` (TypeScript)
- [ ] Run `npm run lint` (ESLint)
- [ ] Run `npm run build` (must succeed)
- [ ] Test the feature manually if needed

### 4. Completion
- [ ] Mark current task as "completed" in TodoWrite
- [ ] Mark next task as "in_progress"
- [ ] Commit changes with descriptive message
- [ ] Report progress to user

## Code Quality Standards

Follow project requirements from `CLAUDE.md`:
- TypeScript strict mode compliance
- ESLint rules adherence
- Existing architecture patterns
- Component structure conventions
- State management patterns

## Commit Guidelines

- Small, focused commits
- Clear commit messages
- Verify build works before committing
- Follow git best practices from `CLAUDE.md`

## Instructions

1. If no task is in_progress, ask user which task to start
2. Implement the task following the spec
3. Run all checks (type-check, lint, build)
4. Only mark complete if everything passes
5. Move to next task automatically or ask user

Remember: Every commit should represent a working state. Test thoroughly before marking tasks complete.
