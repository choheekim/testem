'use strict';
var Bluebird = require('bluebird');
const log = require('npmlog');
var toResult = require('./to-result');

class ProcessTestRunner {
  constructor(launcher, reporter) {
    this.launcher = launcher;
    this.reporter = reporter;
    this.launcherId = this.launcher.id;
    this.finished = false;
  }

  start(onFinish) {
    this.onStart();
    this.finished = false;

    return new Bluebird.Promise((resolve, reject) => {
      this.onFinish = resolve;
      this.launcher.start().then(testProcess => {
        this.process = testProcess;
        this.process.once('processExit', this.onProcessExit.bind(this));
        this.process.once('processError', this.onProcessError.bind(this));
      }).catch(reject);
    }).asCallback(onFinish);
  }

  exit() {
    log.info('process_test_runner: exit');
    if (!this.process) {
      return Bluebird.resolve();
    }

    return this.process.kill();
  }

  onProcessExit(code, stdout, stderr) {
    log.info('process_test_runner: onProcessExit');
    this.finish(null, code, stdout, stderr);
  }

  name() {
    return this.launcher.name;
  }

  onProcessError(err, stdout, stderr) {
    log.info('process_test_runner: onProcessError');
    this.lastErr = err;
    this.lastStderr = stderr;
    this.finish(err, 0, stdout, stderr);
  }

  onStart() {
    this.reporter.onStart(this.launcher.name, {
      launcherId: this.launcherId
    });
  }

  onEnd() {
    this.reporter.onEnd(this.launcher.name, {
      launcherId: this.launcherId
    });
  }

  finish(err, code) {
    log.info('process_test_runner: finish');
    if (this.finished) {
      return;
    }
    this.finished = true;
    var runnerProcess = this.process;
    this.process = null;

    var result = toResult(this.launcherId, err, code, runnerProcess);
    this.reporter.report(this.launcher.name, result);
    this.onEnd();

    this.onFinish();
  }
}

module.exports = ProcessTestRunner;
