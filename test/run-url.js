#!/usr/bin/env node

/* Copyright 2017 Mozilla
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. */

'use strict';

const fileURL = require('file-url');
const path = require('path');
const spawn = require('child_process').spawn;
const tap = require('tap');

const mainURL = fileURL(path.resolve('test', 'hello-world', 'main.html'));
const child = spawn('node', [ path.join('bin', 'cli.js'), 'run', mainURL ]);
const outputRegex = /opened (.*)test\/hello-world\/main\.html in new window/;

let totalOutput = '';
let quitting = false;

child.stdout.on('data', data => {
  const output = data.toString('utf8');
  totalOutput += output;
  console.log(output.trim());

  if (outputRegex.test(totalOutput) && !quitting) {
    // Now that the app has output the data we were looking for,
    // kill the app.  We assert that the output contains the data
    // after the app finishes dying, since eventually the app
    // will quit itself instead of relying on us to kill it.
    child.kill('SIGINT');
    quitting = true;
  }
});

child.stderr.on('data', data => {
  console.error(data.toString('utf8').trim());
});

child.on('close', (code, signal) => {
  tap.true(outputRegex.test(totalOutput), 'output confirms page opened');

  // Windows and Mac (or perhaps different versions of Node) seem to disagree
  // about the values of code and signal here.
  // TODO: figure out why and resolve the issue or conditionally check values.
  // tap.equal(code, 0);
  // tap.equal(signal, 'SIGINT');

  process.exit(code);
});
