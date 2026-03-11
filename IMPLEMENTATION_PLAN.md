# Implementation Plan for Remaining Features

## Priority 1: Critical Fixes (Complete these first)

### 5. ✅ FIXED - Compilation Errors
- Status: No errors found in bookings/inventory pages after audit fixes

### 6. Auto-Deduct Inventory When Service is Performed
**Backend Changes:**
- [ ] Create `InventoryUsageRepository` methods
- [ ] Add `deductInventory()` method to InventoryService
- [ ] Update Car service inspection flow to deduct inventory
- [ ] Add endpoint: `POST /inventory/deduct`

**Frontend Changes:**
- [ ] Modify inspection form to track parts used
- [ ] Auto-deduct on service completion

**Files to Modify:**
- `backend/src/application/services/Inventory.service.ts`
- `backend/src/infrastructure/repositories/Inventory.repository.ts`
- `frontend/src/app/(dashboard)/cars/page.tsx` (inspection section)

---

## Priority 2: Tracking & Recording

### 7. Record User Who Does Inspection
**Backend Changes:**
- [ ] Add `inspectorId` and `inspectorName` fields to Car model
- [ ] Update inspection endpoint to capture user info from auth token

**Frontend Changes:**
- [ ] Pass user info when submitting inspection
- [ ] Display inspector name in car details

**Files to Modify:**
- `backend/src/domain/entities/Car.ts` - add fields
- `backend/src/infrastructure/models/Car.model.ts` - update schema
- `backend/src/application/services/Car.service.ts` - capture user in inspection
- `frontend/src/app/(dashboard)/cars/page.tsx` - pass user info

---

### 10. Show Workers & Time in Completed Tab
**Backend Changes:**
- [ ] Add `workLog` array to Car model:
  ```typescript
  workLog: [{
    mechanicId: string;
    mechanicName: string;
    startTime: Date;
    endTime: Date;
    taskDescription: string;
  }]
  ```
- [ ] Track when mechanic starts/completes work

**Frontend Changes:**
- [ ] Display work log in completed tab
- [ ] Show total time calculation

**Files to Modify:**
- `backend/src/domain/entities/Car.ts`
- `backend/src/infrastructure/models/Car.model.ts`
- `frontend/src/app/(dashboard)/cars/page.tsx` (completed tab)

---

## Priority 3: Notifications System

### 8. Low Inventory Notifications
**Implementation:**
- [ ] Create `Notification` model with types: `low_inventory`, `late_service`
- [ ] Add cron job to check inventory levels daily
- [ ] Send notifications when `quantity <= minStockLevel`
- [ ] Settings page: Add notification preferences (email, in-app, sms)

**Files to Create:**
- `backend/src/domain/entities/Notification.ts`
- `backend/src/infrastructure/models/Notification.model.ts`
- `backend/src/application/services/Notification.service.ts`
- `backend/src/infrastructure/jobs/inventory-checker.ts`

### 9. Late Service Notifications
**Implementation:**
- [ ] Cron job to check `expectedCompletionDate` vs current date
- [ ] Notify admin when car service is overdue
- [ ] Mark cars as "overdue" in UI

**Files to Create:**
- `backend/src/infrastructure/jobs/service-checker.ts`

---

## Priority 4: UI/UX Improvements

### 11. Redesign Check-in Form (Major Change)
**Current:** Text field + separate service selection  
**New:** Service type checkboxes with amounts from settings

**Changes Required:**
1. [ ] Change service type from radio to checkboxes (multi-select)
2. [ ] Remove "Check In" text label
3. [ ] Fetch service prices from settings automatically
4. [ ] Add "Other" checkbox with custom description + manual price input
5. [ ] Calculate total from selected services
6. [ ] Show payment breakdown

**Frontend File:**
- `frontend/src/app/(dashboard)/cars/page.tsx` - Complete rewrite of add dialog

**Design:**
```
Service Selection:
☑ Paint Correction - Ksh 25,000
☑ Ceramic Coating - Ksh 35,000
☐ PPF Installation - Ksh 50,000
☑ Other: [Enter description] - Ksh [Manual input]

Total Estimated Cost: Ksh 60,000
```

---

### 12. Make Service Payments Editable
**Change:** Even if price is set in settings, allow manual override during check-in

**Implementation:**
- [ ] Add edit icon next to each service amount
- [ ] Allow inline editing of prices
- [ ] Recalculate total when prices change

**Frontend File:**
- `frontend/src/app/(dashboard)/cars/page.tsx` - Add edit functionality to service selection

---

### 13. Remove Efficiency from Teams
**Simple Change:**
- [ ] Find and remove efficiency-related display
- [ ] Remove from mechanic performance metrics

**Files to Check:**
- `frontend/src/app/(dashboard)/dashboard/page.tsx`
- `frontend/src/app/(dashboard)/mechanics/page.tsx`

---

## Implementation Order (Recommended)

**Week 1:**
1. Fix #13 (Remove efficiency) - 15 mins
2. Fix #7 (Record inspector) - 1 hour
3. Fix #12 (Editable payments) - 2 hours
4. Fix #10 (Show workers) - 2 hours

**Week 2:**
5. Fix #11 (Redesign check-in) - 4-6 hours
6. Fix #6 (Auto-deduct inventory) - 3-4 hours

**Week 3:**
7. Fix #8 & #9 (Notifications) - 6-8 hours (complex, needs infrastructure)

---

## Immediate Next Steps

Would you like me to:
1. **Continue with quick wins** (13, 7, 12) - Complete in this session
2. **Start on check-in redesign** (11) - Major UI overhaul
3. **Build notifications infrastructure** (8, 9) - Backend-heavy work
4. **Create detailed specs** for each feature before implementing

Let me know which path you prefer!
