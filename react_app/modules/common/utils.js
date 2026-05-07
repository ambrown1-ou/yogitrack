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
