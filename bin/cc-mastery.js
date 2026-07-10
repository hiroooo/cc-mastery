#!/usr/bin/env node
import { run } from '../src/cli.js';

// Set exitCode instead of calling process.exit() so buffered stdout (e.g. the
// --json payload written to a pipe) is fully flushed before the process ends.
run().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error(`cc-mastery: ${err?.stack ?? err}`);
    process.exitCode = 1;
  }
);
