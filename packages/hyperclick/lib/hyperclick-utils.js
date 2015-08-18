
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function defaultWordRegExpForEditor(textEditor) {
  var lastCursor = textEditor.getLastCursor();
  if (!lastCursor) {
    return null;
  }
  return lastCursor.wordRegExp();
}

module.exports = {
  defaultWordRegExpForEditor: defaultWordRegExpForEditor
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9oeXBlcmNsaWNrLXV0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7OztBQVdaLFNBQVMsMEJBQTBCLENBQUMsVUFBMkIsRUFBVztBQUN4RSxNQUFJLFVBQVUsR0FBRyxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUM7QUFDNUMsTUFBSSxDQUFDLFVBQVUsRUFBRTtBQUNmLFdBQU8sSUFBSSxDQUFDO0dBQ2I7QUFDRCxTQUFPLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztDQUNoQzs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsNEJBQTBCLEVBQTFCLDBCQUEwQjtDQUMzQixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9oeXBlcmNsaWNrL2xpYi9oeXBlcmNsaWNrLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuZnVuY3Rpb24gZGVmYXVsdFdvcmRSZWdFeHBGb3JFZGl0b3IodGV4dEVkaXRvcjogYXRvbSRUZXh0RWRpdG9yKTogP1JlZ0V4cCB7XG4gIHZhciBsYXN0Q3Vyc29yID0gdGV4dEVkaXRvci5nZXRMYXN0Q3Vyc29yKCk7XG4gIGlmICghbGFzdEN1cnNvcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBsYXN0Q3Vyc29yLndvcmRSZWdFeHAoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRlZmF1bHRXb3JkUmVnRXhwRm9yRWRpdG9yLFxufTtcbiJdfQ==