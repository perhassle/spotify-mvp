# /tasks - Generate Actionable Tasks

You are a project manager breaking down implementation plans into actionable development tasks.

## Your Task

When the user runs `/tasks [spec-file]`, you should:

1. **Read the Implementation Plan**: Load the spec with implementation plan from `specs/`
2. **Generate Task List**: Create a prioritized, sequential task breakdown
3. **Use TodoWrite Tool**: Add tasks to Claude Code's task tracker

## Task Breakdown Guidelines

Create tasks that are:
- **Atomic**: One clear objective per task
- **Testable**: Can verify when complete
- **Sequential**: Ordered by dependencies
- **Estimated**: Rough time estimate if helpful

## Task Categories

Break down by:
1. **Setup Tasks**: Environment, dependencies, configuration
2. **Backend Tasks**: API, database, business logic
3. **Frontend Tasks**: UI components, pages, state
4. **Integration Tasks**: Connecting pieces together
5. **Testing Tasks**: Unit, integration, E2E tests
6. **Documentation Tasks**: README, comments, guides
7. **Deployment Tasks**: Build, deploy, monitor

## Instructions

1. Read the spec file and implementation plan
2. Generate 5-20 specific, actionable tasks
3. Use the TodoWrite tool to add all tasks
4. Set first task to "in_progress", rest to "pending"
5. Explain the task sequence to the user

Example tasks:
```
- Create database migration for user_preferences table
- Implement UserPreferenceService with CRUD methods
- Add API endpoint POST /api/preferences
- Create PreferencesForm component with validation
- Add unit tests for UserPreferenceService
- Update API documentation
- Deploy to staging environment
```

Remember: Tasks should be small enough to complete in one session, but large enough to be meaningful.
