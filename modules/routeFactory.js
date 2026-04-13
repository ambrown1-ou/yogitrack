/*
  Route Factory: Central factory for building Express routers from a config object.
  Provides createRouter() to generate method-list, form, and POST routes for any API module,
  plus shared helpers (sendError, sendSuccess, sendConfirmation, requireField, formatDate,
  escapeHtml) used across all route handlers.
*/

const express = require('express');
const { renderMethodList, renderForm } = require('./formHelpers');
const { renderTemplate } = require('./templateEngine');

// Escapes HTML special characters to prevent XSS
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Sends an error response page with the given status and message
function sendError(res, status, message, error, backUrl) {
  res.status(status).send(renderTemplate('errorMessage', {
    message,
    error: escapeHtml(error),
    backUrl,
    backText: '< Back to methods'
  }));
}

// Sends a success response page with the result data
function sendSuccess(res, message, data, backUrl) {
  res.send(renderTemplate('successMessage', {
    message,
    data: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
    backUrl,
    backText: '< Back to methods'
  }));
}

// Validates that a string field is present and non-empty; sends a 400 and returns false if not
function requireField(res, value, name, backUrl) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    sendError(res, 400, 'Error: Required Fields Missing', `${name} is required`, backUrl);
    return false;
  }
  return true;
}

// Formats a Date value to YYYY-MM-DD; returns the original value if it is not a Date
function formatDate(val) {
  return val instanceof Date ? val.toISOString().split('T')[0] : val;
}

// Sends a 501 response for methods not yet implemented
function sendNotImplemented(res, moduleTitle, methodName, backUrl) {
  sendError(
    res,
    501,
    'Method Not Implemented',
    `${moduleTitle} method "${methodName}" has not been implemented yet.`,
    backUrl
  );
}

// Sends a confirmation page with hidden form fields for re-submission
function sendConfirmation(res, { message, details, action, formData, extraFields = {}, confirmText, backUrl }) {
  const allFields = { ...formData, ...extraFields };
  const hiddenFields = Object.entries(allFields)
    .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}">`)
    .join('\n        ');
  res.send(renderTemplate('confirmMessage', {
    message,
    details: escapeHtml(details),
    action,
    hiddenFields,
    confirmText: confirmText || 'Confirm',
    backUrl
  }));
}

// Creates an Express router with form pages and POST handlers from config
function createRouter(config) {
  const router = express.Router();
  const { moduleTitle, basePath, methods, handlers = {} } = config;

  // GET / - list all methods
  router.get('/', (req, res) => {
    res.send(renderMethodList(basePath, Object.keys(methods), moduleTitle));
  });

  // GET /:method - render form
  router.get('/:method', (req, res) => {
    const methodCfg = methods[req.params.method];
    if (!methodCfg) {
      return res.status(404).send(`<h1>Method not found: ${escapeHtml(req.params.method)}</h1>`);
    }
    res.send(renderForm(req.params.method, basePath, methodCfg.fields, moduleTitle));
  });

  // Wraps a handler with a catch-all try/catch to avoid boilerplate in each handler
  function wrapHandler(fn, name) {
    return async (req, res) => {
      try {
        await fn(req, res);
      } catch (err) {
        console.error(`${moduleTitle} ${name} error:`, err);
        const isValidation = err.name === 'ValidationError';
        sendError(res, isValidation ? 400 : 500, isValidation ? 'Validation Failed' : `${moduleTitle} Error`, err.message, basePath);
      }
    };
  }

  // POST handlers for each method
  for (const name of Object.keys(methods)) {
    const handler = handlers[name];
    router.post(`/${name}`, handler
      ? wrapHandler(handler, name)
      : (req, res) => sendNotImplemented(res, moduleTitle, name, basePath)
    );
  }

  return router;
}

module.exports = { createRouter, sendError, sendSuccess, sendConfirmation, sendNotImplemented, escapeHtml, requireField, formatDate };
