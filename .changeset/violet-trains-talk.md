---
"@zendesk/help-center-wysiwyg": patch
---

Updating MentionsDataProcessor to store the data-user-name attribute value we get from the span element as a constant variable called userName. We do this before we create a new set and map for classes and attributes respectively on our new x-zendesk-user tag. Then we use that new userName variable to set the attribute value for data-user-name on the new x-zendesk-user tag. This avoids the bug where the attribute would be lost if you tried to access it after resetting the attribute map.