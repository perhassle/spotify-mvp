## 🚨 Hotfix PR: <!-- issue description -->

### Severity
- [ ] 🔴 Critical (system down, data loss risk)
- [ ] 🟡 High (major feature broken)

### Target Branch Validation
- [ ] ✅ This PR targets `master` branch (required for hotfixes)
- [ ] 📋 Back-merge PR to `develop` will be created after master merge

### Issue Description
<!-- Describe the production issue being fixed -->

### Root Cause
<!-- Explain what caused the issue -->

### Fix Applied
<!-- Describe the fix -->

### Testing
- [ ] Fix verified locally
- [ ] Regression testing completed
- [ ] Fix tested in staging environment
- [ ] No new issues introduced

### Rollback Plan
<!-- How to rollback if this fix causes issues -->

### Post-deployment Verification
<!-- How to verify the fix in production -->
- [ ] 
- [ ] 

### Related Issues
Fixes #

---
**⚠️ Hotfix Process:**
1. Merge this PR to `master`
2. Deploy to production immediately
3. Create back-merge PR to `develop`
4. Ensure both branches stay in sync