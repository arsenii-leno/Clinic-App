# Field Validation Checklist

## Patient Interface Requirements

Each patient object returned by Google Apps Script must have ALL of these fields:

| Field | Type | Format | Example | Validation |
|-------|------|--------|---------|-----------|
| `id` | string | UUID or ID | `patient-123abc` | Non-empty string |
| `firstName` | string | Text | `John` | Non-empty |
| `lastName` | string | Text | `Doe` | Non-empty |
| `childName` | string | Text | `Jane` | Can be empty string, but must be string type |
| `phone` | string | Phone | `+1-555-0123` | Non-empty, any format |
| `notes` | string | Text | `Allergic to penicillin` | Can be empty string, but must be string type |
| `createdAt` | string | ISO 8601 | `2024-07-25T10:30:00.000Z` | ISO format |
| `updatedAt` | string | ISO 8601 | `2024-07-25T10:30:00.000Z` | ISO format |

**Validation Code (from types.ts):**
```typescript
export function isPatient(value: unknown): value is Patient {
  if (!isRecord(value)) return false;
  return [
    value.id,
    value.firstName,
    value.lastName,
    value.childName,
    value.phone,
    value.notes,
    value.createdAt,
    value.updatedAt,
  ].every((field) => typeof field === 'string');
}
```

❌ **Will be rejected if:**
- Any field is missing
- Any field is not a string
- Any field is null/undefined
- Fields have extra properties (they're ignored, not rejected)

---

## Appointment Interface Requirements

Each appointment object returned by Google Apps Script must have ALL of these fields:

| Field | Type | Format | Example | Validation |
|-------|------|--------|---------|-----------|
| `id` | string | UUID or ID | `appt-456def` | Non-empty string |
| `patientId` | string | UUID or ID | `patient-123abc` | Must match a patient ID |
| `date` | string | YYYY-MM-DD | `2024-07-25` | ISO date format |
| `time` | string | HH:MM (24h) | `14:30` | 24-hour format |
| `status` | string | Enum | `scheduled` | One of: `scheduled`, `completed`, `cancelled`, `rescheduled` |
| `notes` | string | Text | `Follow-up visit` | Can be empty, but must be string |
| `createdAt` | string | ISO 8601 | `2024-07-24T15:00:00.000Z` | ISO format |
| `updatedAt` | string | ISO 8601 | `2024-07-24T15:00:00.000Z` | ISO format |

**Validation Code (from types.ts):**
```typescript
export function isAppointment(value: unknown): value is Appointment {
  if (!isRecord(value)) return false;
  return (
    [
      value.id,
      value.patientId,
      value.date,
      value.time,
      value.notes,
      value.createdAt,
      value.updatedAt,
    ].every((field) => typeof field === 'string') &&
    typeof value.status === 'string' &&
    APPOINTMENT_STATUSES.includes(value.status as AppointmentStatus)
  );
}
```

❌ **Will be rejected if:**
- Any field is missing
- Any required field is not a string
- `status` is not one of: `scheduled`, `completed`, `cancelled`, `rescheduled`
- Any field is null/undefined

---

## Common Mistakes and Fixes

### ❌ Date Format Issues
| Wrong | Correct | Why |
|-------|---------|-----|
| `7/25/2024` | `2024-07-25` | Must be ISO format YYYY-MM-DD |
| `Jul 25, 2024` | `2024-07-25` | Must be YYYY-MM-DD |
| `25-07-2024` | `2024-07-25` | Wrong order, must be YYYY-MM-DD |
| `2024-7-25` | `2024-07-25` | Month and day must be zero-padded |

### ❌ Time Format Issues
| Wrong | Correct | Why |
|-------|---------|-----|
| `2:30 PM` | `14:30` | Must be 24-hour HH:MM format |
| `14:30:00` | `14:30` | No seconds, only HH:MM |
| `2:30` | `14:30` | Must be zero-padded HH format |
| `1430` | `14:30` | Must include colon |

### ❌ Timestamp Issues
| Wrong | Correct | Why |
|-------|---------|-----|
| `2024-07-25T10:30:00` | `2024-07-25T10:30:00.000Z` | Must include Z for UTC |
| `2024-07-25 10:30:00` | `2024-07-25T10:30:00.000Z` | Must use T, not space; include Z |
| `1721901000` | `2024-07-25T10:30:00.000Z` | Must be ISO string, not Unix timestamp |

### ❌ Status Issues
| Wrong | Correct | Reason |
|-------|---------|--------|
| `Scheduled` | `scheduled` | Must be lowercase |
| `schedule` | `scheduled` | Typo - must be exact |
| `active` | `scheduled` | Invalid status - use one of: scheduled, completed, cancelled, rescheduled |
| Empty string | `scheduled` | Required field |

### ❌ Null/Undefined Issues
| Wrong | Correct | Why |
|-------|---------|-----|
| `{ ...patient, notes: null }` | `{ ...patient, notes: "" }` | Fields must be strings, not null |
| `{ ...patient, childName: undefined }` | `{ ...patient, childName: "" }` | Fields must be strings, not undefined |
| `{ id: null, ... }` | `{ id: "patient-123", ... }` | All fields required, none can be null |

---

## Debugging Field Mismatches

When you see this in the console:
```
[storage.readCollection] Some items failed validation for @clinic:patients:v2
```

The console will also show "Invalid items" - inspect those to see what's wrong.

**Check these things in that order:**
1. Are all required fields present?
2. Are all fields strings (except status which must be a valid enum)?
3. Are dates in YYYY-MM-DD format?
4. Are times in HH:MM format?
5. Are timestamps in ISO 8601 format?
6. Is status one of the valid values?

---

## Google Sheets Column Mapping Example

If you're using Google Forms → Google Sheets, your sheet should have columns like:

**Patients Sheet:**
| id | firstName | lastName | childName | phone | notes | createdAt | updatedAt |
|----|-----------|----------|-----------|-------|-------|-----------|-----------|
| patient-1 | John | Doe | Jane | +1-555-0100 | Allergic to penicillin | 2024-07-25T10:30:00.000Z | 2024-07-25T10:30:00.000Z |
| patient-2 | Jane | Smith | Tommy | +1-555-0101 | | 2024-07-25T11:00:00.000Z | 2024-07-25T11:00:00.000Z |

**Appointments Sheet:**
| id | patientId | date | time | status | notes | createdAt | updatedAt |
|----|-----------|------|------|--------|-------|-----------|-----------|
| appt-1 | patient-1 | 2024-07-25 | 14:30 | scheduled | Follow-up visit | 2024-07-24T15:00:00.000Z | 2024-07-24T15:00:00.000Z |
| appt-2 | patient-2 | 2024-07-26 | 09:00 | completed | Regular checkup | 2024-07-24T15:30:00.000Z | 2024-07-26T09:30:00.000Z |

---

## Quick Validation Test

To validate your Google Apps Script response, copy this into your browser console while running the app and checking the log output:

```javascript
// Get the logged response from console
const testPatient = {
  id: "patient-1",
  firstName: "John",
  lastName: "Doe",
  childName: "Jane",
  phone: "+1-555-0123",
  notes: "Test",
  createdAt: "2024-07-25T10:30:00.000Z",
  updatedAt: "2024-07-25T10:30:00.000Z"
};

// Run validation from types.ts
const isPatient = (value) => {
  if (typeof value !== 'object' || value === null) return false;
  return [
    value.id, value.firstName, value.lastName, value.childName,
    value.phone, value.notes, value.createdAt, value.updatedAt
  ].every(field => typeof field === 'string');
};

console.log('Patient valid?', isPatient(testPatient)); // Should be true
```

