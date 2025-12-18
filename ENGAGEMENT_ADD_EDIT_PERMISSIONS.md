# Who Can Add and Edit Engagements

## Summary

### ✅ **ADD/CREATE Engagements**

| Role | Can Create? | Endpoint | Frontend Access |
|------|-------------|----------|-----------------|
| **System Administrator (admin)** | ✅ YES | `POST /api/engagements` | `/engagements/new` |
| **Secretariat / Commissioner Assistant** | ✅ YES | `POST /api/engagements` | `/engagements/new` |
| **Department User (Internal)** | ✅ YES | `POST /api/engagements` | `/engagements/new` |
| **Commissioner** | ❌ NO | Blocked at route level | Route blocked |
| **Auditor** | ❌ NO | Blocked at route level | Route blocked |

**Backend Route Protection:**
```javascript
// backend/src/routes/engagementRoutes.js
router.post(
  '/',
  authorizeRoles(ROLES.ADMIN, ROLES.SECRETARIAT, ROLES.DEPARTMENT_USER),
  createEngagement
);
```

---

### ⚠️ **EDIT/UPDATE Engagements**

**Current Implementation:** The system currently only supports **status updates**, not full engagement editing.

#### **Status Updates Only** (`PATCH /api/engagements/:id/status`)

| Role | Can Update Status? | Restrictions |
|------|-------------------|--------------|
| **System Administrator (admin)** | ✅ YES | Can update status of **any** engagement |
| **Secretariat / Commissioner Assistant** | ✅ YES | Can update status of **any** engagement |
| **Commissioner** | ✅ YES | Can **only** update status of engagements **assigned to them** |
| **Department User** | ⚠️ LIMITED | Can **only** update status of **their own draft** engagements |
| **Auditor** | ❌ NO | No update permissions |

**Backend Route Protection:**
```javascript
// backend/src/routes/engagementRoutes.js
router.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN, ROLES.COMMISSIONER, ROLES.SECRETARIAT),
  updateStatus
);
```

**Service Layer Restrictions:**
```javascript
// backend/src/services/engagementService.js

// Commissioners: Only their own engagements
if (user.role === ROLES.COMMISSIONER) {
  if (engagement.commissionerId !== user.id) {
    throw new Error('You can only update engagements assigned to you');
  }
}

// Department Users: Only their draft engagements
else if (engagement.createdBy === user.id) {
  if (engagement.status !== 'draft') {
    throw new Error('You can only modify draft engagements');
  }
}
```

#### **Full Engagement Editing** (Date, Time, Purpose, etc.)

❌ **NOT CURRENTLY IMPLEMENTED**

There is **no endpoint** to edit engagement details such as:
- Date
- Time
- Purpose/Description
- Reference Number
- Commissioner Assignment

**This means:**
- Once an engagement is created, its details cannot be changed
- Only the status can be updated (draft → scheduled → completed/cancelled)
- To change details, you would need to cancel and create a new engagement

---

## Detailed Permissions by Role

### 1. **System Administrator (admin)**
- ✅ **Create engagements** - Full access
- ✅ **Update status** - Can update any engagement's status
- ❌ **Edit details** - Not implemented (would need new endpoint)

### 2. **Secretariat / Commissioner Assistant (secretariat)**
- ✅ **Create engagements** - Full access
- ✅ **Update status** - Can update any engagement's status
- ❌ **Edit details** - Not implemented (would need new endpoint)

### 3. **Department User (departmentUser)**
- ✅ **Create engagements** - Can create engagement requests
- ⚠️ **Update status** - Can only update status of their own **draft** engagements
- ❌ **Edit details** - Not implemented (would need new endpoint)

### 4. **Commissioner (commissioner)**
- ❌ **Create engagements** - Blocked (cannot create)
- ✅ **Update status** - Can only update status of engagements **assigned to them**
- ❌ **Edit details** - Not implemented (would need new endpoint)

### 5. **Auditor (auditor)**
- ❌ **Create engagements** - No access
- ❌ **Update status** - No access
- ❌ **Edit details** - No access

---

## Current Workflow

1. **Creation**: Admin, Secretariat, or Department User creates engagement
2. **Status Updates**:
   - Department User can change their draft to scheduled
   - Commissioner can accept/reject/reschedule (if assigned to them)
   - Secretariat/Admin can update any engagement status
3. **Detail Changes**: Not possible - would require canceling and recreating

---

## Recommendations

If full engagement editing is needed, consider implementing:

1. **New Endpoint**: `PATCH /api/engagements/:id` (not just status)
2. **Permissions**:
   - Admin/Secretariat: Edit any engagement
   - Department User: Edit their own engagements (maybe only if draft)
   - Commissioner: Edit engagements assigned to them (maybe only date/time)
3. **Frontend**: Add edit UI to Engagements page

---

## Code References

- **Create Route**: `backend/src/routes/engagementRoutes.js` (line 17-30)
- **Status Update Route**: `backend/src/routes/engagementRoutes.js` (line 32-43)
- **Service Logic**: `backend/src/services/engagementService.js`
- **Frontend Create**: `frontend/src/pages/EngagementRequest.tsx`
- **Frontend List**: `frontend/src/pages/Engagements.tsx` (no edit UI currently)

