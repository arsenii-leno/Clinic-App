# Clinic Appointment App - Data Fetching Debug Guide

## Summary of Changes Made

### 1. **Enhanced Google Sheets Repository** ✓
File: `repository/GoogleSheetsRepository.ts`

Added comprehensive logging to track:
- Request payload (action, data, URL, timestamp)
- Response status and raw JSON
- Error details with full context
- Success/failure at each step

**Methods updated:**
- `request()` - Logs all network requests and responses
- `getPatients()` - Logs fetch start, response received, and returned data
- `getAppointments()` - Logs fetch start, response received, and returned data

### 2. **Connected Repositories to Google Sheets** ✓
Files: `repository/PatientRepository.ts`, `repository/AppointmentRepository.ts`

Now attempting to fetch from Google Sheets first with fallback to local storage:
- `getAllPatients()` - Tries Google Sheets → Falls back to local storage
- `getAllAppointments()` - Tries Google Sheets → Falls back to local storage

**Request flow:**
```
getAllPatients() 
  → GoogleSheetsRepository.getPatients() 
  → request('getAllData') 
  → Cache to local storage if successful
  → Fall back to local storage on error
```

### 3. **Added Data Loading Logging** ✓
File: `context/DataContext.tsx`

Added console logs to track the complete data loading lifecycle:
- `useEffect` mount trigger
- `load()` function execution
- Repository calls
- Data received (count and contents)
- Errors encountered

### 4. **Storage Layer Debugging** ✓
File: `repository/storage.ts`

Added detailed logging for all storage operations:
- `readCollection()` - Logs key reads, validation, item counts
- `mutateCollection()` - Logs mutations, saves, item counts

---

## What to Check in Console

When you run the app and check the browser console or React Native debugger, you should see:

### Initial Load Sequence:
```
[DataContext] useEffect triggered - mounting DataProvider
[DataContext] Starting data load...
[DataContext] Fetching patients and appointments in parallel...
[PatientRepository.getAllPatients] Starting fetch...
[AppointmentRepository.getAllAppointments] Starting fetch...
[PatientRepository.getAllPatients] Attempting to fetch from Google Sheets...
[AppointmentRepository.getAllAppointments] Attempting to fetch from Google Sheets...
[GoogleSheetsRepository.getPatients] Starting fetch...
[GoogleSheetsRepository.getAppointments] Starting fetch...
[GoogleSheetsRepository] Sending request: { url: "...", payload: { action: 'getAllData' }, timestamp: "..." }
[GoogleSheetsRepository] Response status for getAllData: 200 true
[GoogleSheetsRepository] Raw JSON response for getAllData: { status: "success", patients: [...], appointments: [...] }
[GoogleSheetsRepository.getPatients] Response received: { hasPatients: true, patientCount: X, patients: [...] }
[DataContext] Load complete: { patientCount: X, appointmentCount: Y, patients: [...], appointments: [...] }
```

### If There's an Error:
```
[GoogleSheetsRepository] Error executing getAllData: { action: "getAllData", error: "...", fullError: {...}, timestamp: "..." }
[PatientRepository.getAllPatients] Google Sheets fetch failed, falling back to local storage: {...}
[storage.readCollection] Reading from key: @clinic:patients:v2
[storage.readCollection] No data found for @clinic:patients:v2, returning empty array
[DataContext] Load complete: { patientCount: 0, appointmentCount: 0, ... }
```

---

## Potential Issues and Solutions

### Issue 1: Empty Data on Load
**Problem:** `patientCount: 0, appointmentCount: 0`

**Check:**
1. Is Google Forms submitting data to Google Sheets?
2. Is the Google Apps Script returning data in correct format?
3. Check the response format - should have:
   ```json
   {
     "status": "success",
     "patients": [...],
     "appointments": [...]
   }
   ```

**Solution:**
- Verify Google Sheets has data
- Verify Google Apps Script `getAllData` function returns `{ status: 'success', patients: [...], appointments: [...] }`

---

### Issue 2: Network Error from Google Sheets
**Problem:** Fetch fails, falls back to empty local storage

**Check Console for:**
```
[GoogleSheetsRepository] Error executing getAllData
```

**Possible Causes:**
1. Google Apps Script URL is incorrect or the deployment is deleted
2. CORS issue (Google usually handles this for fetch)
3. Network timeout
4. Google Apps Script returned error status

**Solution:**
- Verify the URL in `GoogleSheetsRepository.ts` line 3
- Check that Google Apps Script is deployed and web accessible
- Verify the deployment settings allow "Execute as: Anyone"

---

### Issue 3: Field Name Mismatch
**Problem:** Data fetches but fields don't match interfaces

**Check Console for:**
```
[storage.readCollection] Some items failed validation for @clinic:patients:v2
```

**Expected Patient Fields:**
- `id`, `firstName`, `lastName`, `childName`, `phone`, `notes`, `createdAt`, `updatedAt`
- All must be strings

**Expected Appointment Fields:**
- `id`, `patientId`, `date`, `time`, `notes`, `createdAt`, `updatedAt`
- `status` must be one of: `'scheduled'`, `'completed'`, `'cancelled'`, `'rescheduled'`
- Others must be strings

**Solution:**
- Ensure Google Apps Script returns exactly these field names
- Verify all fields are present (no missing fields)
- Check that dates are ISO format (YYYY-MM-DD)
- Check that times are HH:MM format

---

### Issue 4: CORS or Fetch Error
**Problem:** Network error with no response

**Check Console for:**
```
[GoogleSheetsRepository] Error executing getAllData: { error: "Failed to fetch" | "Network error" }
```

**Causes:**
- CORS headers missing (Google Scripts should handle this)
- Google Apps Script URL is wrong
- Network connectivity issue

**Solution:**
- Test the URL directly in browser: `curl -X POST https://script.google.com/macros/s/.../exec -H "Content-Type: application/json" -d '{"action":"getAllData"}'`
- Verify deployment is still active in Google Apps Script

---

## Testing the Flow Manually

1. **Check if load() is called:**
   - App should log `[DataContext] useEffect triggered - mounting DataProvider`
   
2. **Check if Google Sheets request is being made:**
   - Look for `[GoogleSheetsRepository] Sending request:`
   - Should show the POST request to Google Apps Script URL

3. **Check if response is received:**
   - Look for `[GoogleSheetsRepository] Response status for getAllData:`
   - Should show status 200 (success)

4. **Check if data is being parsed:**
   - Look for `[GoogleSheetsRepository] Raw JSON response for getAllData:`
   - Should show `{ status: "success", patients: [...], appointments: [...] }`

5. **Check if data reaches context:**
   - Look for `[DataContext] Load complete:`
   - Should show patient and appointment counts

---

## Google Apps Script Expected Response Format

Your Google Apps Script's `getAllData` function should return:

```javascript
{
  status: "success",
  patients: [
    {
      id: "patient-123",
      firstName: "John",
      lastName: "Doe",
      childName: "Jane",
      phone: "+1234567890",
      notes: "Allergic to penicillin",
      createdAt: "2024-07-25T10:30:00.000Z",
      updatedAt: "2024-07-25T10:30:00.000Z"
    },
    // ... more patients
  ],
  appointments: [
    {
      id: "appt-456",
      patientId: "patient-123",
      date: "2024-07-25",
      time: "14:30",
      status: "scheduled",
      notes: "Follow-up visit",
      createdAt: "2024-07-24T15:00:00.000Z",
      updatedAt: "2024-07-24T15:00:00.000Z"
    },
    // ... more appointments
  ]
}
```

⚠️ **Critical:** All fields must be present and match expected types, or validation will fail.

---

## Data Flow Diagram

```
App Mount
  ↓
DataProvider useEffect → load()
  ↓
PatientRepository.getAllPatients()
AppointmentRepository.getAllAppointments() (parallel)
  ↓
GoogleSheetsRepository.getPatients()
GoogleSheetsRepository.getAppointments()
  ↓
fetch POST to Google Apps Script
  ↓
Parse response → { status, patients, appointments }
  ↓
Fall back to local storage on error
  ↓
setPatients() / setAppointments()
  ↓
Components re-render with data
```

---

## Quick Debugging Checklist

- [ ] Google Sheets has patient/appointment data
- [ ] Google Apps Script `getAllData` returns correct format
- [ ] Google Apps Script is deployed with "Execute as: Anyone"
- [ ] Console logs show fetch request being sent
- [ ] Console shows response status 200
- [ ] Response JSON is valid and has correct structure
- [ ] Field names match exactly (id, firstName, etc.)
- [ ] All expected fields are present
- [ ] Data reaches DataContext (check load complete log)
- [ ] Components are consuming data from useData() hook

