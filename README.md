# Temporal Parser

## Motivation

Time is one of the most complex human inventions.
Leap years, calendars, time zones, daylight saving rules, cultural conventions—every attempt to model time exposes exceptions and edge cases. Even today, we still struggle to write correct and maintainable code for something as fundamental as dates and times.

Despite its wide adoption, ISO 8601 / RFC 3339 is incomplete. It lacks proper support for time zones beyond numeric offsets, forcing real-world systems to rely on extensions such as IXDTF (inspired by Java’s ZonedDateTime). Unfortunately, only very recent tools—and the latest generation of LLMs—have begun to meaningfully understand these formats.

In JavaScript and TypeScript, temporal parsing remains especially difficult. No single data structure can fully represent time. Instead, we are left with a wide variety of string representations, each with different semantics and assumptions.

Even the TC39 community explicitly chose not to fully solve parsing when designing the Temporal API, acknowledging the scope and complexity of the problem.
(See: https://tc39.es/proposal-temporal/docs/parse-draft.html)

And yet, time remains one of the most important concepts for human productivity and coordination.

This project tackles the problem head-on.

## Approach

This repository treats temporal parsing as a compiler problem.

Instead of relying on fragile regexes or opinionated parsers, we apply classic compiler techniques—lexing and parsing—to temporal strings. Our goal is not to impose a single "correct" interpretation of time, but to make the structure of temporal expressions explicit and programmable.

What makes this project different is that we intentionally expose the lexer.
- The lexer is designed to be generic and logic-light
- It focuses on turning temporal strings into a meaningful token stream
- Parsers are built on top of this lexer to interpret tokens into higher-level structures

If the provided parser does not match your needs, you are free to:
- Write your own parser
- Extend or replace parts of the grammar
- Apply your own semantics to the same token stream

In other words, this project does not claim to "solve time."
It gives you the tools to reason about it.
