# AI Agent Security Standard

This document defines mandatory security principles and restrictions for all AI coding assistants operating in this repository. All AI agents must follow these requirements without exception.

**Authority:** Derived from [Zendesk Minimum Baseline Security Standard](https://docs.google.com/document/d/17GZ9TpjKCt6WCdw3yxL44Ra_YscbOBVnVkUVGgx5Hz0/) and internal security policies.

---

## Core Security Mandate

Security is a first-class requirement. Every code suggestion must be evaluated against these guidelines. If a request would result in insecure code:

1. **Stop** and flag the security concern
2. **Explain** why it's problematic
3. **Propose** a secure alternative

AI-generated code requires human review before merging.

---

## Absolute Prohibitions

AI agents must **NEVER** do the following:

### Secrets & Credentials
- Hardcode secrets, API keys, tokens, or passwords in source code
- Commit CKEditor license keys (`CKEDITOR_LICENSE_KEY_*`), npm tokens, or any other secrets
- Log, print, or expose secret values in any output
- Store secrets in `.env` files committed to git

### Security Controls
- Disable CSRF token validation or skip CSRF token fetching before image uploads
- Set `xhr.withCredentials = false` or bypass credential handling in upload adapters
- Disable or weaken authentication/authorization checks
- Disable TLS certificate validation

### Dangerous Code Patterns
- Use `eval()` or `innerHTML` with unsanitized user input
- Construct API URLs using raw string concatenation from user input without validation
- Introduce dependencies with known critical vulnerabilities

### Data Exposure
- Log sensitive data (authentication tokens, CSRF tokens, PII)
- Expose internal API paths, stack traces, or error details to end users

---

## Required Security Patterns

### CSRF Token Handling

All image upload requests must fetch a CSRF token first before submitting form data.

```js
// Correct: fetch CSRF token before upload
const { current_session: { csrf_token } } = await fetch('/api/v2/help_center/sessions.json')
  .then(r => r.json());
data.append('authenticity_token', csrf_token);
```

```js
// NEVER: submit upload without CSRF token
const data = new FormData();
data.append('file', file);
xhr.send(data); // missing authenticity_token
```

### CKEditor License Key

```js
// Correct: inject from environment at build time via webpack.DefinePlugin
licenseKey: process.env.NODE_ENV === 'production'
  ? process.env.CKEDITOR_LICENSE_KEY_PRODUCTION
  : process.env.CKEDITOR_LICENSE_KEY_DEVELOPMENT || 'GPL',
```

```js
// NEVER: hardcode the license key
licenseKey: 'abc123-real-license-key',
```

### Fetch Credentials

Image upload requests to Zendesk APIs must use `credentials: 'same-origin'` (or `xhr.withCredentials = true`) to send session cookies.

```js
// Correct
await fetch('/api/v2/guide/user_images/uploads', {
  method: 'POST',
  credentials: 'same-origin',
  headers: { 'x-csrf-token': authenticity_token },
  body: JSON.stringify({ ... }),
});
```

---

## Security Requirements by Domain

### Authentication & CSRF
- Always fetch a fresh CSRF token (`authenticity_token`) from the Zendesk session API before any state-changing request
- Never cache or reuse CSRF tokens across requests
- `XHRImageUploadPlugin` must use `xhr.withCredentials = true` for all requests

### Secrets Management
- CKEditor license keys are stored as GitHub Actions secrets and injected at build time via `process.env`
- NPM publish token (`NPM_TOKEN`) is a GitHub Actions secret — never reference it outside CI workflows
- Never add new secrets to source code; always use GitHub Actions secrets or environment variables

### Dependency Security
- Dependabot is enabled — review and merge security updates promptly
- Do not introduce dependencies with known high/critical CVEs
- The `resolutions` field in `package.json` is used to force patched versions — keep it up to date

### Content Security
- Image uploads are restricted to `jpeg`, `png`, `gif` types (enforced in `Editor.defaultConfig.image.upload.types`)
- Do not expand accepted MIME types without security review
- External images in community posts are marked by `MarkExternalImagesPlugin` — do not remove this plugin

### Output Safety
- Never render unsanitized HTML from the editor output directly in other contexts without sanitization
- CKEditor's `getData()` output is HTML — treat it as untrusted when used outside the editor context

---

## When to Stop and Escalate

Stop, explain the concern, and recommend involving Security if a task requires:

- Removing or bypassing CSRF token validation in image upload flows
- Disabling credential handling (`withCredentials`) for API calls
- Hardcoding or exposing the CKEditor license key or any other secret
- Expanding accepted file upload types beyond `jpeg`, `png`, `gif` without review
- Removing `MarkExternalImagesPlugin` or weakening image handling security
- Adding new external API endpoints that handle user data
- Disabling CodeQL scanning or security workflows

---

## Security Testing

When generating features involving uploads, mentions, or form submission, include:

- Tests verifying CSRF tokens are attached to upload requests
- Negative test cases for invalid or missing config (plugins throw `Error` for missing required config)
- Error path coverage for failed API responses in upload adapters

---

## References

- [Minimum Baseline Security Standard](https://docs.google.com/document/d/17GZ9TpjKCt6WCdw3yxL44Ra_YscbOBVnVkUVGgx5Hz0/)
- [Cryptography Standards](https://techmenu.zende.sk/standards/cryptography-standards/)
- [Unified JWT Standard](https://techmenu.zende.sk/standards/unified-jwt/)

---

**Questions?** Reach out to the Security team or file a ticket via the Security Engagement process.
