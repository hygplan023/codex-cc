---
name: Windows .bat config-file generation
description: Pitfall when emitting a config file from a generated Windows batch script.
---

# Emitting a config file from a Windows .bat

When generating a `.bat` that writes a multi-line config via a redirect block:

```bat
> "%TARGET%" (
  echo(line one
  echo(
  echo(line two
)
```

**Use `echo(` for every line, including blank lines.** The common mistake is mapping a
blank line to `echo .` — `echo.` actually prints a literal `.` into the file, producing an
invalid config (e.g. a stray `.` line breaks TOML parsing). `echo(` prints an empty line
when there is no following text, and prints the text otherwise, so it is safe for both.

Also escape cmd metacharacters in each line: `replace(/[&<>|^%]/g, "^$&")`.

**Why:** this exact bug shipped a fallback `.bat` that wrote `.` lines into `config.toml`,
silently breaking the container-degrade path while the happy path looked fine.
