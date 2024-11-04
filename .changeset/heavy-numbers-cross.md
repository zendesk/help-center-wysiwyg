---
"@zendesk/help-center-wysiwyg": patch
---

Inline the build and release part of the workflow.

This fixes the issue with the CKEditor license keys not being propagated to the reusable build & publish workflow due to [Github limitations](https://docs.github.com/en/actions/sharing-automations/reusing-workflows#limitations).

> Any environment variables set in an env context defined at the workflow level in the caller workflow are not propagated to the called workflow. For more information, see "Store information in variables" and "Accessing contextual information about workflow runs."
