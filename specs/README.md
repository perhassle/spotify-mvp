# Specifications Directory

This directory contains feature specifications following the Spec-Driven Development methodology using GitHub Spec Kit.

## Workflow

### 1. Create Specification (`/specify`)
Start with a high-level description of what you want to build. Use the `/specify` command to generate a comprehensive specification.

**Example:**
```
/specify Add user profile customization feature
```

This creates a spec file with:
- Overview and success criteria
- User stories
- Functional/non-functional requirements
- Technical considerations

### 2. Create Implementation Plan (`/plan`)
Once the spec is approved, create a detailed technical implementation plan.

**Example:**
```
/plan user-profile-customization.md
```

This adds to the spec:
- Architecture overview
- Components breakdown
- Database/API changes
- Testing strategy

### 3. Generate Tasks (`/tasks`)
Break down the implementation plan into actionable development tasks.

**Example:**
```
/tasks user-profile-customization.md
```

This creates a task list in Claude Code's todo tracker with:
- Specific, testable tasks
- Proper sequencing
- Time estimates

### 4. Implement (`/implement`)
Execute the tasks one by one, following the spec and plan.

**Example:**
```
/implement
```

This will:
- Execute current in-progress task
- Run tests and checks
- Commit when complete
- Move to next task

## Spec File Naming

Use kebab-case for spec files:
- ✅ `user-profile-customization.md`
- ✅ `playlist-sharing-improvements.md`
- ❌ `User Profile.md`
- ❌ `playlist_sharing.md`

## Spec Status

Add status badges to spec files:

- 🔵 **Draft** - Spec being written
- 🟡 **Review** - Awaiting approval
- 🟢 **Approved** - Ready for planning
- 🟣 **Planned** - Implementation plan complete
- ⚙️ **In Progress** - Being implemented
- ✅ **Complete** - Fully implemented

## Best Practices

1. **One Feature Per Spec**: Keep specs focused on a single feature or change
2. **Living Documents**: Update specs as requirements evolve
3. **Clear Success Criteria**: Make outcomes measurable
4. **Link to Issues**: Reference GitHub issues when applicable
5. **Archive Old Specs**: Move completed specs to `specs/archive/`

## Example Specs

Check out example specs to understand the format:
- [Example spec structure in each slash command documentation]

## Resources

- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [Spec-Driven Development Blog Post](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- Project Guidelines: `CLAUDE.md`
