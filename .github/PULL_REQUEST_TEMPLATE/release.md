## 🚀 Release PR: <!-- version -->

### Release Information
- **Version:** <!-- e.g., v1.0.0 -->
- **Release Date:** <!-- target date -->
- **Release Manager:** <!-- @username -->

### Target Branch Validation
- [ ] ✅ This PR targets `master` branch (required for releases)
- [ ] 📋 Back-merge PR to `develop` will be created after master merge

### Features Included
<!-- List all features in this release -->
- [ ] Feature A (#PR)
- [ ] Feature B (#PR)
- [ ] Bug fixes (#PR)

### Pre-release Checklist
- [ ] All planned features merged to develop
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] Security audit passed (`npm audit`)
- [ ] Performance benchmarks acceptable
- [ ] Full regression testing completed
- [ ] Staging deployment successful

### Breaking Changes
<!-- List any breaking changes -->
- None
<!-- OR -->
- [ ] <!-- describe breaking change -->

### Migration Guide
<!-- If breaking changes, provide migration steps -->

### Deployment Checklist
- [ ] Database migrations prepared (if needed)
- [ ] Environment variables updated
- [ ] Third-party services configured
- [ ] CDN cache invalidation planned
- [ ] Monitoring alerts configured

### Post-deployment
- [ ] Production smoke tests
- [ ] Performance monitoring
- [ ] Error rate monitoring
- [ ] User feedback channels monitored

### Rollback Plan
<!-- Describe rollback procedure if needed -->

---
**📌 Release Process:**
1. Merge this PR to `master`
2. Tag the release: `git tag -a v1.0.0 -m "Release v1.0.0"`
3. Deploy to production
4. Create GitHub release with notes
5. Back-merge to `develop`