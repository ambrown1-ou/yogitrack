// YogiUtils - Shared utility functions for YogiTrack frontend
// Uses var to ensure global availability across UMD script tags

var YogiUtils = {

  // Format a YYYY-MM-DD (or ISO) date string as "Mon, Jan 1, 2026"
  // Uses noon local time to avoid timezone-offset display issues
  formatDate: function (dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr.split('T')[0] + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  // Format an HH:MM time string as "10:30 AM"
  formatTime: function (hhmm) {
    if (!hhmm) return '';
    var parts = hhmm.split(':');
    var h = parseInt(parts[0], 10);
    var m = parts[1] || '00';
    var ampm = h >= 12 ? 'PM' : 'AM';
    var hour = h % 12 || 12;
    return hour + ':' + m + ' ' + ampm;
  },

  // Return today's date as YYYY-MM-DD
  todayStr: function () {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  },

  // Return a date N days in the future as YYYY-MM-DD
  futureDateStr: function (days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  },

  // Return current time as HH:MM
  currentTimeStr: function () {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  // Format a duration label with its padded minutes (Short=60, Standard=75, Long=90)
  formatDuration: function (label) {
    var mins = { Short: 60, Standard: 75, Long: 90 };
    return mins[label] ? label + ' (' + mins[label] + ' min)' : label;
  }

};

// Returns { visibleItems, controls } for a per-page selector with optional Prev/Next navigation.
// pageSize is a number (25, 50, 100) or the string 'ALL'.
YogiUtils.paginateControls = function (items, pageSize, currentPage, setPageSize, setCurrentPage) {
  var total = items.length;
  var totalPages = pageSize === 'ALL' ? 1 : Math.ceil(total / pageSize);
  var visibleItems = pageSize === 'ALL' ? items : items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  var start = pageSize === 'ALL' ? 1 : (currentPage - 1) * pageSize + 1;
  var end = pageSize === 'ALL' ? total : Math.min(currentPage * pageSize, total);

  var controls = total === 0 ? null : (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', fontSize: '0.9rem', flexWrap: 'wrap' }}>
      <span>{'Showing ' + start + '\u2013' + end + ' of ' + total}</span>
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal', margin: 0 }}>
        {'Show: '}
        <select
          value={pageSize}
          onChange={function (e) {
            var val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
            setPageSize(val);
            setCurrentPage(1);
          }}
          style={{ width: 'auto' }}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value="ALL">All</option>
        </select>
      </label>
      {totalPages > 1 && (
        <>
          <button className="link-button" disabled={currentPage <= 1} onClick={function () { setCurrentPage(currentPage - 1); }}>{'< Prev'}</button>
          <span>{'Page ' + currentPage + ' of ' + totalPages}</span>
          <button className="link-button" disabled={currentPage >= totalPages} onClick={function () { setCurrentPage(currentPage + 1); }}>{'Next >'}</button>
        </>
      )}
    </div>
  );

  return { visibleItems: visibleItems, controls: controls };
};
