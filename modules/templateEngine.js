/*
  Template Engine: Loads HTML templates from the views/ directory and substitutes
  {{placeholder}} tokens with provided values. Used by all modules that render
  HTML responses.
*/

const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, '../views');

// Loads an HTML template and replaces {{placeholders}} with values
function renderTemplate(templateName, variables = {}) {
  const templatePath = path.join(viewsDir, `${templateName}.html`);
  let html = fs.readFileSync(templatePath, 'utf-8');

  // Replace all {{variable}} with corresponding values
  for (const [key, value] of Object.entries(variables)) {
    html = html.split(`{{${key}}}`).join(value);
  }

  return html;
}

module.exports = {
  renderTemplate
};
