# PDF 401 Error Fix - Deployment Checklist

## ✅ Pre-Deployment Verification

### Code Quality
- [x] TypeScript compilation passes (no errors in our files)
- [x] No import errors
- [x] All functions properly typed
- [x] All endpoints properly exported as `GET`/`POST`
- [x] Error handling in place
- [x] Database queries valid

### Files Verified
- [x] `src/app/api/pdf/proxy/route.ts` - 101 lines, complete
- [x] `src/app/api/migrate/fix-document-urls/route.ts` - 147 lines, complete
- [x] `src/app/(dashboard)/customers/[id]/page.tsx` - 6 strategic changes
- [x] Files exist in filesystem and are readable

### Backward Compatibility
- [x] Old component props still work (documentId is optional)
- [x] Fallback logic implemented for documents without ID
- [x] No breaking changes to existing APIs
- [x] Database schema unchanged
- [x] No new migrations required

### Dependencies
- [x] No new npm packages required
- [x] All imports already available
- [x] Using existing database connection
- [x] Using existing Cloudinary config

---

## 📋 Deployment Steps

### Step 1: Code Deployment ✅ READY
```bash
# Push the 3 modified files to production
git add src/app/api/pdf/proxy/route.ts
git add src/app/api/migrate/fix-document-urls/route.ts
git add src/app/(dashboard)/customers/[id]/page.tsx
git commit -m "fix: implement PDF proxy and migration for 401 error fix"
git push origin main
```

### Step 2: Build & Deploy ✅ READY
```bash
# Next.js will automatically detect new route files
npm run build
# Deploy to Vercel/production
```

### Step 3: Verify Deployment
```bash
# Check that proxy route is accessible
curl https://your-domain.com/api/pdf/proxy?type=customer&id=test

# Should respond with 404 (document not found) or 400 (invalid params)
# NOT with "route not found"
```

### Step 4: Run Migration ⏳ TODO AFTER DEPLOYMENT
```bash
# First, check current status
curl https://your-domain.com/api/migrate/fix-document-urls

# Then execute the migration
curl -X POST https://your-domain.com/api/migrate/fix-document-urls

# Expected success response:
# {
#   "success": true,
#   "summary": {
#     "customerDocumentsFixed": X,
#     "policyDocumentsFixed": Y,
#     "totalFixed": X+Y,
#     "errors": null
#   }
# }
```

### Step 5: Test Preview Functionality ⏳ TODO AFTER MIGRATION
1. Navigate to `/customers/[id]` (any customer)
2. Find "Identity & Documents" section
3. Click "Preview" on National ID document
4. Verify:
   - [ ] PDF displays in modal
   - [ ] No 401 error in browser console
   - [ ] PDF scrolls smoothly
   - [ ] Download button works
5. Test with other document types (KRA, Passport)

### Step 6: Monitor for Issues ⏳ TODO AFTER TEST
```bash
# Check server logs
tail -f logs/production.log | grep "api/pdf"
tail -f logs/production.log | grep "api/migrate"

# Monitor error rates
# Look for 401, 404, 500 errors on PDF proxy
```

---

## 🚀 Quick Deployment Commands

### All-in-One Deployment (after code push)
```bash
# 1. Check status
echo "=== Migration Status ==="
curl https://your-domain.com/api/migrate/fix-document-urls

# 2. Run migration
echo "=== Running Migration ==="
curl -X POST https://your-domain.com/api/migrate/fix-document-urls

# 3. Test a customer document
echo "=== Testing Proxy Route ==="
curl -I https://your-domain.com/api/pdf/proxy?type=customer&id=test
```

---

## 📊 Deployment Milestones

### Pre-Deployment ✅
- [x] Code changes implemented
- [x] No TypeScript errors
- [x] Files created/modified correctly
- [x] Backward compatible

### Deployment Phase ⏳
- [ ] Push code to repository
- [ ] Build and deploy to production
- [ ] Verify routes are accessible

### Post-Deployment ⏳
- [ ] Run migration: `POST /api/migrate/fix-document-urls`
- [ ] Test PDF preview on customer profiles
- [ ] Monitor logs for errors
- [ ] Verify no 401 errors
- [ ] Check browser console

### Completion ✅
- [ ] All documents working
- [ ] No 401 errors
- [ ] Performance acceptable
- [ ] Ready for production sign-off

---

## 🔍 Verification Tests

### Route Accessibility
```bash
# Test proxy route with invalid params (should return 400)
curl https://your-domain.com/api/pdf/proxy

# Expected: {"error":"Missing type or id parameter","status":400}
```

### Migration Status
```bash
# Check how many docs need fixing
curl https://your-domain.com/api/migrate/fix-document-urls

# Expected: Documents count with status "ready"
```

### Database Verification
```sql
-- After migration, check no authenticated URLs remain
SELECT COUNT(*) as authenticated_urls FROM customer_documents 
WHERE file_url LIKE '%authenticated%';

-- Should return 0
```

### Browser Testing
1. Open customer profile
2. Open DevTools → Network tab
3. Click "Preview" on a document
4. Check network request:
   ```
   Request URL: /api/pdf/proxy?type=customer&id=...
   Status: 200
   Content-Type: application/pdf
   ```

---

## ⚠️ Rollback Plan

If critical issues arise:

### Immediate Rollback (Keep New Code)
```bash
# Disable proxy temporarily in customer page
# Comment out this section:
if (documentId) {
  url = `/api/pdf/proxy?type=customer&id=${documentId}`;
  // ...
}
```

### Full Code Rollback
```bash
# Revert the three files
git revert [commit-hash]
git push origin main
```

### Note
- Old documents will fail with 401 again
- But system remains stable
- Can redeploy fix after investigation

---

## 📝 Documentation

Before deploying, ensure team knows:

1. **What Changed:** 2 new API routes + 1 updated page component
2. **Why:** Fixes 401 errors when previewing old PDFs
3. **What to Do:** Run migration after deployment
4. **How to Test:** Click preview on customer documents
5. **If Issues:** Check logs for `/api/pdf/proxy` errors

---

## 🎯 Success Criteria

Deployment is successful when:

- [ ] Code deployed to production
- [ ] `/api/pdf/proxy` route is accessible
- [ ] `/api/migrate/fix-document-urls` migration runs
- [ ] Old documents show 401 count = 0 after migration
- [ ] Customer document preview works without 401 errors
- [ ] No new errors in server logs
- [ ] Performance metrics normal
- [ ] All document types work (ID, KRA, Passport, etc.)

---

## 📞 Troubleshooting Reference

| Problem | Solution |
|---------|----------|
| Route not found | Ensure build completed successfully |
| 401 errors persist | Run migration: `POST /api/migrate/fix-document-urls` |
| Migration fails | Check database connection, verify Cloudinary config |
| PDF shows blank | Verify document exists in Cloudinary, check console |
| Proxy returns 404 | Verify document ID is valid, check database |

---

## 🎉 Post-Deployment

After successful deployment:

1. ✅ Document the migration was completed
2. ✅ Update deployment logs with timestamp
3. ✅ Monitor for 24 hours for issues
4. ✅ Collect user feedback
5. ✅ Update status in tickets/issues

---

**Status:** ✅ **READY FOR DEPLOYMENT**

**Next Action:** Deploy code to production, then run migration
