YogiTrack

Yoga studio management app built with Node.js, Express, MongoDB, and a small React app served from a single container. The API endpoints with no url query return form-based HTML views for testing and demonstration.


Run:
npm install
npm start

Environment variables expected:
MONGODB_URI
DB_NAME

Notes:
All API actions use POST.
API returns JSON with consistent structure to aid in web API testing and validation.


```javascript
{
  "success": true || false,
  "resultsType": "array"||"number"||"errorMessage"||"singleId", // etc
  "results": [] || 3 || "Error 123" || "C00001" // etc
}
```


Current file structure:

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
  docs/
    yogitrack-class-diagram-reference.html
    yogitrack-class-diagram-reference.txt
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

Recent changes from the previous version:

- Login now accepts username or email.
- Manager accounts can be linked to instructor records by matching email.
- Role switching is now supported for dual instructor/manager accounts.
- Class series creation now uses batch ID generation and bulk insert for class instances.
- Class start and end date constraints were refined in the model, API, and React forms.
- Series edit flow now has option to preserve or overwrite existing edits.
- Pagination controls were added to the admin/scheduling/attendance lists.
- Take Attendance customer search now supports partial name matches.
- Take Attendance now shows the current attendance list for the selected class instance.
- Light styling was added to the React app
- Added an authentication exception specifically for getClassInstances

Current role layout in the React app:
- manager: Schedule, Calendar, Customers, Instructors
- instructor: Attendance, Schedule, Calendar
- customer: Calendar

