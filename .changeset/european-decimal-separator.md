---
'@taskade/temporal-parser': patch
---

fix: Support comma as decimal separator in fractional seconds (European format)

Add support for comma (`,`) as a decimal separator in fractional seconds for both time and duration components, as specified in ISO 8601. This enables parsing of European-formatted temporal strings while maintaining canonical dot (`.`) notation in serialized output.

**Supported formats:**
- Time with fractional seconds: `T10:30:45,123` → `T10:30:45.123`
- Duration with fractional seconds: `PT1,5S` → `PT1.5S`

**Behavior:**
- Parser accepts both `.` and `,` as decimal separators
- Stringify normalizes all output to use `.` for consistency
- Full round-trip compatibility maintained

This change improves ISO 8601 compliance and enables parsing of temporal strings from European locales where comma is the standard decimal separator.
