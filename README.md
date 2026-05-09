# YogiTrack

Yoga studio management app built with Node.js, Express, MongoDB, and a React frontend served by the same app.

## Run

```bash
npm install
npm start
```

## Environment Variables

- `MONGODB_URI`
- `DB_NAME`

## API Notes

- All API actions use `POST`.
- API responses use a consistent JSON envelope.

```javascript
{
  "success": true,
  "resultsType": "array", // or "error" or "confirmation"
  "results": []
}
```
## API Reference

All routes are POST to `/api/{endpoint}/{method}`.

---

### `attendance`

#### `recordAttendance`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instanceId | string | CI00001 | Yes |
| customerId | string | C00001 | Yes |
| attendanceDate | string | YYYY-MM-DD | Yes |
| attendanceTime | string | HH:MM | |
| saleId | string | S00001 | |
| negativeBalanceOverride | boolean | | |
| notes | string | | |

#### `getAttendance`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| attendanceId | string | A00001 | Yes |

#### `getByClass`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instanceId | string | CI00001 | Yes |

#### `getByCustomer`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |

#### `getAllAttendance`
No parameters.

#### `deleteAttendance`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| attendanceId | string | A00001 | Yes |

---

### `class`

#### `addClassSeries`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| className | string | | Yes |
| classType | enum | General, Special | Yes |
| startDate | string | YYYY-MM-DD | Yes |
| endDate | string | YYYY-MM-DD | Yes |
| daysOfWeek | array | Monday–Sunday | Yes |
| startTime | string | HH:MM | Yes |
| duration | enum | Short, Standard, Long | Yes |
| payRate | number | float, min 0 | Yes |
| defaultInstructorId | string | I00001 | |
| maxCapacity | integer | min 1 | |

#### `getClassSeries`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| classId | string | CL00001 | Yes |

#### `getAllClassSeries`
No parameters.

#### `updateClassSeries`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| classId | string | CL00001 | Yes |
| className | string | | |
| classType | enum | General, Special | |
| endDate | string | YYYY-MM-DD | |
| maxCapacity | integer | min 1 | |
| payRate | number | float, min 0 | |
| defaultInstructorId | string | I00001 | |

#### `deleteClassSeries`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| classId | string | CL00001 | Yes |

#### `getClassInstances`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| classId | string | CL00001 | Yes |
| startDate | string | YYYY-MM-DD | |
| endDate | string | YYYY-MM-DD | |

#### `updateClassInstance`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instanceId | string | CI00001 | Yes |
| instructorId | string | I00001 | |
| startTime | string | HH:MM | |
| duration | enum | Short, Standard, Long | |
| status | enum | scheduled, cancelled | |
| notes | string | | |

#### `cancelClassInstance`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instanceId | string | CI00001 | Yes |

---

### `customer`

#### `addCustomer`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| firstName | string | | |
| lastName | string | | |
| email | string | email | |
| phone | string | | |
| address | string | | |
| dateOfBirth | string | YYYY-MM-DD | |
| preferredContactMethod | enum | email, phone | |
| confirmDuplicate | boolean | | |

#### `getCustomerById`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |

#### `getCustomerByName`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| firstName | string | | |
| lastName | string | | |
| partialMatch | boolean | | |

> At least one of `firstName` or `lastName` must be provided.

#### `getAllCustomers`
No parameters.

#### `updateCustomer`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |
| firstName | string | | |
| lastName | string | | |
| email | string | email | |
| phone | string | | |
| address | string | | |
| dateOfBirth | string | YYYY-MM-DD | |
| preferredContactMethod | enum | email, phone | |
| confirmDuplicate | boolean | | |

#### `deleteCustomer`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |

---

### `instructor`

#### `addInstructor`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| firstName | string | | Yes |
| lastName | string | | Yes |
| email | string | email | Yes |
| phone | string | | |
| preferredContactMethod | enum | email, phone | |
| username | string | | |
| confirmDuplicate | boolean | | |

> If no User account exists for the given email, one is auto-created with a temporary password returned in the response.

#### `getInstructor`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instructorId | string | I00001 | Yes |

#### `getAllInstructors`
No parameters.

#### `updateInstructor`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instructorId | string | I00001 | Yes |
| firstName | string | | |
| lastName | string | | |
| email | string | email | |
| phone | string | | |
| preferredContactMethod | enum | email, phone | |
| confirmDuplicate | boolean | | |

#### `deleteInstructor`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instructorId | string | I00001 | Yes |

---

### `package`

#### `addPackage`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| packageName | string | | Yes |
| category | enum | General, Senior, Beginner | Yes |
| numberOfClasses | string | positive integer or "unlimited" | Yes |
| startDate | string | YYYY-MM-DD | Yes |
| endDate | string | YYYY-MM-DD | Yes |
| price | number | float, min 0 | Yes |

#### `getPackage`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| packageId | string | P00001 | Yes |

#### `getAllPackages`
No parameters.

#### `updatePackage`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| packageId | string | P00001 | Yes |
| packageName | string | | |
| category | enum | General, Senior, Beginner | |
| numberOfClasses | string | positive integer or "unlimited" | |
| startDate | string | YYYY-MM-DD | |
| endDate | string | YYYY-MM-DD | |
| price | number | float, min 0 | |

#### `deletePackage`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| packageId | string | P00001 | Yes |

---

### `sale` ⚠️ *Not yet implemented*

#### `addSale`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |
| packageId | string | P00001 | Yes |
| amountPaid | number | float, min 0 | Yes |
| paymentMode | enum | cash, credit_card, debit_card, check | Yes |
| paymentDateTime | string | ISO 8601 datetime | |
| validityStartDate | string | YYYY-MM-DD | |
| validityEndDate | string | YYYY-MM-DD | |
| notes | string | | |

#### `getSale`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| saleId | string | S00001 | Yes |

#### `getByCustomer`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |

#### `getAllSales`
No parameters.

#### `deleteSale`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| saleId | string | S00001 | Yes |

---

### `user`

#### `register`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| username | string | | Yes |
| password | string | min 6 characters | Yes |
| role | enum | manager, instructor, customer | Yes |
| email | string | email | |

#### `login`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| username | string | username or email | Yes |
| password | string | | Yes |

#### `getCurrentUser`
No parameters.

#### `getAllUsers`
No parameters.

#### `changePassword`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| newPassword | string | min 6 characters | Yes |
| confirmPassword | string | must match newPassword | |

#### `logout`
No parameters.

## API Reference

All routes are POST to `/api/{endpoint}/{method}`.

---

### `attendance`

#### `recordAttendance`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instanceId | string | CI00001 | Yes |
| customerId | string | C00001 | Yes |
| attendanceDate | string | YYYY-MM-DD | Yes |
| attendanceTime | string | HH:MM | |
| saleId | string | S00001 | |
| negativeBalanceOverride | boolean | | |
| notes | string | | |

#### `getAttendance`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| attendanceId | string | A00001 | Yes |

#### `getByClass`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instanceId | string | CI00001 | Yes |

#### `getByCustomer`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |

#### `getAllAttendance`
No parameters.

#### `deleteAttendance`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| attendanceId | string | A00001 | Yes |

---

### `class`

#### `addClassSeries`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| className | string | | Yes |
| classType | enum | General, Special | Yes |
| startDate | string | YYYY-MM-DD | Yes |
| endDate | string | YYYY-MM-DD | Yes |
| daysOfWeek | array | Monday–Sunday | Yes |
| startTime | string | HH:MM | Yes |
| duration | enum | Short, Standard, Long | Yes |
| payRate | number | float, min 0 | Yes |
| defaultInstructorId | string | I00001 | |
| maxCapacity | integer | min 1 | |

#### `getClassSeries`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| classId | string | CL00001 | Yes |

#### `getAllClassSeries`
No parameters.

#### `updateClassSeries`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| classId | string | CL00001 | Yes |
| className | string | | |
| classType | enum | General, Special | |
| endDate | string | YYYY-MM-DD | |
| maxCapacity | integer | min 1 | |
| payRate | number | float, min 0 | |
| defaultInstructorId | string | I00001 | |

#### `deleteClassSeries`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| classId | string | CL00001 | Yes |

#### `getClassInstances`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| classId | string | CL00001 | Yes |
| startDate | string | YYYY-MM-DD | |
| endDate | string | YYYY-MM-DD | |

#### `updateClassInstance`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instanceId | string | CI00001 | Yes |
| instructorId | string | I00001 | |
| startTime | string | HH:MM | |
| duration | enum | Short, Standard, Long | |
| status | enum | scheduled, cancelled | |
| notes | string | | |

#### `cancelClassInstance`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instanceId | string | CI00001 | Yes |

---

### `customer`

#### `addCustomer`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| firstName | string | | |
| lastName | string | | |
| email | string | email | |
| phone | string | | |
| address | string | | |
| dateOfBirth | string | YYYY-MM-DD | |
| preferredContactMethod | enum | email, phone | |
| confirmDuplicate | boolean | | |

#### `getCustomerById`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |

#### `getCustomerByName`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| firstName | string | | |
| lastName | string | | |
| partialMatch | boolean | | |

> At least one of `firstName` or `lastName` must be provided.

#### `getAllCustomers`
No parameters.

#### `updateCustomer`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |
| firstName | string | | |
| lastName | string | | |
| email | string | email | |
| phone | string | | |
| address | string | | |
| dateOfBirth | string | YYYY-MM-DD | |
| preferredContactMethod | enum | email, phone | |
| confirmDuplicate | boolean | | |

#### `deleteCustomer`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |

---

### `instructor`

#### `addInstructor`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| firstName | string | | Yes |
| lastName | string | | Yes |
| email | string | email | Yes |
| phone | string | | |
| preferredContactMethod | enum | email, phone | |
| username | string | | |
| confirmDuplicate | boolean | | |

> If no User account exists for the given email, one is auto-created with a temporary password returned in the response.

#### `getInstructor`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instructorId | string | I00001 | Yes |

#### `getAllInstructors`
No parameters.

#### `updateInstructor`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instructorId | string | I00001 | Yes |
| firstName | string | | |
| lastName | string | | |
| email | string | email | |
| phone | string | | |
| preferredContactMethod | enum | email, phone | |
| confirmDuplicate | boolean | | |

#### `deleteInstructor`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| instructorId | string | I00001 | Yes |

---

### `package`

#### `addPackage`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| packageName | string | | Yes |
| category | enum | General, Senior, Beginner | Yes |
| numberOfClasses | string | positive integer or "unlimited" | Yes |
| startDate | string | YYYY-MM-DD | Yes |
| endDate | string | YYYY-MM-DD | Yes |
| price | number | float, min 0 | Yes |

#### `getPackage`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| packageId | string | P00001 | Yes |

#### `getAllPackages`
No parameters.

#### `updatePackage`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| packageId | string | P00001 | Yes |
| packageName | string | | |
| category | enum | General, Senior, Beginner | |
| numberOfClasses | string | positive integer or "unlimited" | |
| startDate | string | YYYY-MM-DD | |
| endDate | string | YYYY-MM-DD | |
| price | number | float, min 0 | |

#### `deletePackage`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| packageId | string | P00001 | Yes |

---

### `sale` ⚠️ *Not yet implemented*

#### `addSale`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |
| packageId | string | P00001 | Yes |
| amountPaid | number | float, min 0 | Yes |
| paymentMode | enum | cash, credit_card, debit_card, check | Yes |
| paymentDateTime | string | ISO 8601 datetime | |
| validityStartDate | string | YYYY-MM-DD | |
| validityEndDate | string | YYYY-MM-DD | |
| notes | string | | |

#### `getSale`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| saleId | string | S00001 | Yes |

#### `getByCustomer`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| customerId | string | C00001 | Yes |

#### `getAllSales`
No parameters.

#### `deleteSale`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| saleId | string | S00001 | Yes |

---

### `user`

#### `register`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| username | string | | Yes |
| password | string | min 6 characters | Yes |
| role | enum | manager, instructor, customer | Yes |
| email | string | email | |

#### `login`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| username | string | username or email | Yes |
| password | string | | Yes |

#### `getCurrentUser`
No parameters.

#### `getAllUsers`
No parameters.

#### `changePassword`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| newPassword | string | min 6 characters | Yes |
| confirmPassword | string | must match newPassword | |

#### `resetPassword`
| Parameter | Type | Format / Values | Required |
|---|---|---|---|
| username | string | | Yes |

`adminuser` account cannot be reset through this endpoint.

#### `logout`
No parameters.


## File Structure

```text
yogitrack/
  .env
  .gitignore
  index.js
  package.json
  package-lock.json
  README.md
  api_helpers/
    dbStatus.js
    formHelpers.js
    idGenerator.js
    routeFactory.js
    templateEngine.js
  api_items/
    attendance.js
    class.js
    customer.js
    index.js
    instructor.js
    package.js
    sale.js
    user.js
  api_models/
    Attendance.js
    Class.js
    Customer.js
    Instructor.js
    Package.js
    Sale.js
    User.js
  public/
    index.html
    robots.txt
    css/
      styles.css
  react_app/
    index.html
    index.js
    modules/
      Admin/
        CustomerAdmin.jsx
        InstructorAdmin.jsx
      Attendance/
        Attendance.jsx
        AttendanceForm.jsx
      Calendar/
        Calendar.jsx
      common/
        apiClients.js
        router.js
        utils.js
      Scheduling/
        ClassForm.jsx
        InstanceForm.jsx
        Scheduling.jsx
        SeriesEditForm.jsx
  views/
    apiIndex.html
    confirmMessage.html
    errorMessage.html
    form.html
    methodList.html
    status.html
    successMessage.html
```

## Recent Changes

- Login now accepts username or email.
- Manager accounts can be linked to instructor records by matching email.
- Role switching is supported for dual instructor/manager accounts.
- Class series creation uses batch ID generation and bulk insert for class instances.
- Class start/end date constraints were refined in model, API, and React forms.
- Series edit flow supports preserving or overwriting instructor assignment.
- Pagination controls were added to admin, scheduling, and attendance lists.
- Take Attendance customer search supports partial first or last name.
- Take Attendance shows the current attendance list for the selected class instance.
- Light styling was added to the React app.
- Authentication exception was added for `getClassInstances`.
- Calendar and list views now sort same-day classes by start time (earliest to latest).

## Role Layout

- `manager`: Schedule, Calendar, Customers, Instructors
- `instructor`: Attendance, Schedule, Calendar
- `customer`: Calendar