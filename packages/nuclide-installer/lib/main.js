
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

// This should be long enough that it does not interfere with Atom load time,
// but short enough so that users who have just installed the nuclide-installer
// for the first time do not get impatient waiting to see Nuclide packages start
// to appear under Installed Packages in Settings.

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var TIME_TO_WAIT_BEFORE_CHECKING_FOR_UPDATES_IN_MS = 5 * 1000;

module.exports = {
  activate: function activate(state) {
    // Add a delay before checking for package updates so that this
    // is not on the critical path for Atom startup.
    setTimeout(_asyncToGenerator(function* () {
      var pathToConfig;
      try {
        pathToConfig = require.resolve('./config.json');
      } catch (e) {
        // The config.json file will not be present in development.
        return;
      }

      var config = require(pathToConfig);

      var _require = require('nuclide-installer-base');

      var installPackagesInConfig = _require.installPackagesInConfig;

      installPackagesInConfig(config);
    }), TIME_TO_WAIT_BEFORE_CHECKING_FOR_UPDATES_IN_MS);
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWluc3RhbGxlci9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZVosSUFBSSw4Q0FBOEMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDOztBQUU5RCxNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsVUFBUSxFQUFBLGtCQUFDLEtBQWMsRUFBUTs7O0FBRzdCLGNBQVUsbUJBQUMsYUFBWTtBQUNyQixVQUFJLFlBQVksQ0FBQztBQUNqQixVQUFJO0FBQ0Ysb0JBQVksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO09BQ2pELENBQUMsT0FBTyxDQUFDLEVBQUU7O0FBRVYsZUFBTztPQUNSOztBQUVELFVBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQzs7cUJBQ0gsT0FBTyxDQUFDLHdCQUF3QixDQUFDOztVQUE1RCx1QkFBdUIsWUFBdkIsdUJBQXVCOztBQUM1Qiw2QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNqQyxHQUFFLDhDQUE4QyxDQUFDLENBQUM7R0FDcEQ7Q0FDRixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWluc3RhbGxlci9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbi8vIFRoaXMgc2hvdWxkIGJlIGxvbmcgZW5vdWdoIHRoYXQgaXQgZG9lcyBub3QgaW50ZXJmZXJlIHdpdGggQXRvbSBsb2FkIHRpbWUsXG4vLyBidXQgc2hvcnQgZW5vdWdoIHNvIHRoYXQgdXNlcnMgd2hvIGhhdmUganVzdCBpbnN0YWxsZWQgdGhlIG51Y2xpZGUtaW5zdGFsbGVyXG4vLyBmb3IgdGhlIGZpcnN0IHRpbWUgZG8gbm90IGdldCBpbXBhdGllbnQgd2FpdGluZyB0byBzZWUgTnVjbGlkZSBwYWNrYWdlcyBzdGFydFxuLy8gdG8gYXBwZWFyIHVuZGVyIEluc3RhbGxlZCBQYWNrYWdlcyBpbiBTZXR0aW5ncy5cbnZhciBUSU1FX1RPX1dBSVRfQkVGT1JFX0NIRUNLSU5HX0ZPUl9VUERBVEVTX0lOX01TID0gNSAqIDEwMDA7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhY3RpdmF0ZShzdGF0ZTogP09iamVjdCk6IHZvaWQge1xuICAgIC8vIEFkZCBhIGRlbGF5IGJlZm9yZSBjaGVja2luZyBmb3IgcGFja2FnZSB1cGRhdGVzIHNvIHRoYXQgdGhpc1xuICAgIC8vIGlzIG5vdCBvbiB0aGUgY3JpdGljYWwgcGF0aCBmb3IgQXRvbSBzdGFydHVwLlxuICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgdmFyIHBhdGhUb0NvbmZpZztcbiAgICAgIHRyeSB7XG4gICAgICAgIHBhdGhUb0NvbmZpZyA9IHJlcXVpcmUucmVzb2x2ZSgnLi9jb25maWcuanNvbicpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBUaGUgY29uZmlnLmpzb24gZmlsZSB3aWxsIG5vdCBiZSBwcmVzZW50IGluIGRldmVsb3BtZW50LlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBjb25maWcgPSByZXF1aXJlKHBhdGhUb0NvbmZpZyk7XG4gICAgICB2YXIge2luc3RhbGxQYWNrYWdlc0luQ29uZmlnfSA9IHJlcXVpcmUoJ251Y2xpZGUtaW5zdGFsbGVyLWJhc2UnKTtcbiAgICAgIGluc3RhbGxQYWNrYWdlc0luQ29uZmlnKGNvbmZpZyk7XG4gICAgfSwgVElNRV9UT19XQUlUX0JFRk9SRV9DSEVDS0lOR19GT1JfVVBEQVRFU19JTl9NUyk7XG4gIH0sXG59O1xuIl19
