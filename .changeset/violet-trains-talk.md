---
"@zendesk/help-center-wysiwyg": patch
---

Update `MentionsDataProcessor` to store the `data-user-name` attribute value from the <span> element in a constant variable (userName) before resetting the element’s classes and attributes. This ensures we retain the original value, which could otherwise be lost when clearing the attribute map. We then set the `data-user-name` attribute on the new <x-zendesk-user> tag using this variable. This change prevents a bug where the attribute value could become undefined if accessed after resetting the attributes.