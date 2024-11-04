# @zendesk/help-center-wysiwyg

## 0.0.10

### Patch Changes

- 0510cf3: Inline the build and release part of the workflow.

  This fixes the issue with the CKEditor license keys not being propagated to the reusable build & publish workflow due to [Github limitations](https://docs.github.com/en/actions/sharing-automations/reusing-workflows#limitations).

  > Any environment variables set in an env context defined at the workflow level in the caller workflow are not propagated to the called workflow. For more information, see "Store information in variables" and "Accessing contextual information about workflow runs."

## 0.0.9

### Patch Changes

- 0eaa04c: Include CKEditor licenses in publishing

## 0.0.8

### Patch Changes

- 5587ee0: Fix z-index on link popup

## 0.0.7

### Patch Changes

- 8c770ed: Added package publishing and changelog generation. No code changes
