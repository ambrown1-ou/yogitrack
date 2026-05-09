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

