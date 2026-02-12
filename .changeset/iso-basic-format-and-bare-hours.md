---
"@taskade/temporal-parser": patch
---

Add support for ISO 8601 basic format and bare hours in `parseTimeString()`

**New formats supported:**

1. **ISO 8601 basic format** (compact, no colons):
   - `"1430"` → 14:30
   - `"143045"` → 14:30:45
   - `"143045.123"` → 14:30:45.123

2. **Bare hours** (defaults to :00 minutes):
   - `"7"` → 7:00
   - `"7 AM"` → 7:00 AM
   - `"23"` → 23:00

The parser intelligently detects the format based on digit count and presence of colons, maintaining full backward compatibility with existing formats.
