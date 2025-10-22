# Claude Code Commands for Spotify MVP

This directory contains slash commands for Claude Code, enhanced with GitHub Spec Kit methodology.

## Available Commands

### Spec-Driven Development Workflow

1. **`/specify`** - Create or update a feature specification
   - Use when: Starting a new feature or change
   - Output: Creates spec file in `specs/` directory
   - Example: `/specify Add dark mode toggle to settings`

2. **`/plan`** - Create implementation plan from spec
   - Use when: Spec is approved and ready for technical planning
   - Output: Adds implementation plan section to spec file
   - Example: `/plan dark-mode-toggle.md`

3. **`/tasks`** - Generate actionable task breakdown
   - Use when: Implementation plan is complete
   - Output: Adds tasks to Claude Code todo tracker
   - Example: `/tasks dark-mode-toggle.md`

4. **`/implement`** - Execute development tasks
   - Use when: Ready to start coding
   - Output: Implements current task, runs tests, commits code
   - Example: `/implement`

## Workflow Diagram

```
User Idea
    ↓
/specify → Create spec file with requirements
    ↓
/plan → Add technical implementation plan
    ↓
/tasks → Generate task breakdown in todo list
    ↓
/implement → Execute tasks one by one
    ↓
Feature Complete!
```

## Tips

- **Start with `/specify`**: Always begin with a clear specification
- **Review before `/plan`**: Make sure the spec captures what you want
- **Sequential workflow**: Follow the order: specify → plan → tasks → implement
- **Iterate**: Update specs as you learn more during implementation
- **Reference CLAUDE.md**: All commands follow project guidelines

## Customization

To add more commands:
1. Create a new `.md` file in `.claude/commands/`
2. Write command documentation and instructions
3. Command becomes available as `/filename`

## Resources

- Project Guidelines: `/CLAUDE.md`
- Specs Directory: `/specs/README.md`
- GitHub Spec Kit: https://github.com/github/spec-kit
