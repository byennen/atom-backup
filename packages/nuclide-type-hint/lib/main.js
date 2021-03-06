
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var typeHintManager = null;

var _require = require('atom');

var Disposable = _require.Disposable;

module.exports = {

  activate: function activate(state) {
    if (!typeHintManager) {
      var TypeHintManager = require('./TypeHintManager');
      typeHintManager = new TypeHintManager();
    }
  },

  consumeProvider: function consumeProvider(provider) {
    typeHintManager.addProvider(provider);
    return new Disposable(function () {
      return typeHintManager.removeProvider(provider);
    });
  },

  deactivate: function deactivate() {
    if (typeHintManager) {
      typeHintManager.dispose();
      typeHintManager = null;
    }
  }

};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXR5cGUtaGludC9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7QUFXWixJQUFJLGVBQWlDLEdBQUcsSUFBSSxDQUFDOztlQUUxQixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUE3QixVQUFVLFlBQVYsVUFBVTs7QUFFZixNQUFNLENBQUMsT0FBTyxHQUFHOztBQUVmLFVBQVEsRUFBQSxrQkFBQyxLQUFXLEVBQVE7QUFDMUIsUUFBSSxDQUFDLGVBQWUsRUFBRTtBQUNwQixVQUFJLGVBQWUsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNuRCxxQkFBZSxHQUFHLElBQUksZUFBZSxFQUFFLENBQUM7S0FDekM7R0FDRjs7QUFFRCxpQkFBZSxFQUFBLHlCQUFDLFFBQTBCLEVBQWM7QUFDdEQsbUJBQWUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdEMsV0FBTyxJQUFJLFVBQVUsQ0FBQzthQUFNLGVBQWUsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDO0tBQUEsQ0FBQyxDQUFDO0dBQ3ZFOztBQUVELFlBQVUsRUFBQSxzQkFBRztBQUNYLFFBQUksZUFBZSxFQUFFO0FBQ25CLHFCQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDMUIscUJBQWUsR0FBRyxJQUFJLENBQUM7S0FDeEI7R0FDRjs7Q0FFRixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXR5cGUtaGludC9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB0eXBlSGludE1hbmFnZXI6ID9UeXBlSGludE1hbmFnZXIgPSBudWxsO1xuXG52YXIge0Rpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBhY3RpdmF0ZShzdGF0ZTogP2FueSk6IHZvaWQge1xuICAgIGlmICghdHlwZUhpbnRNYW5hZ2VyKSB7XG4gICAgICB2YXIgVHlwZUhpbnRNYW5hZ2VyID0gcmVxdWlyZSgnLi9UeXBlSGludE1hbmFnZXInKTtcbiAgICAgIHR5cGVIaW50TWFuYWdlciA9IG5ldyBUeXBlSGludE1hbmFnZXIoKTtcbiAgICB9XG4gIH0sXG5cbiAgY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyOiBUeXBlSGludFByb3ZpZGVyKTogRGlzcG9zYWJsZSB7XG4gICAgdHlwZUhpbnRNYW5hZ2VyLmFkZFByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4gdHlwZUhpbnRNYW5hZ2VyLnJlbW92ZVByb3ZpZGVyKHByb3ZpZGVyKSk7XG4gIH0sXG5cbiAgZGVhY3RpdmF0ZSgpIHtcbiAgICBpZiAodHlwZUhpbnRNYW5hZ2VyKSB7XG4gICAgICB0eXBlSGludE1hbmFnZXIuZGlzcG9zZSgpO1xuICAgICAgdHlwZUhpbnRNYW5hZ2VyID0gbnVsbDtcbiAgICB9XG4gIH1cblxufTtcbiJdfQ==
