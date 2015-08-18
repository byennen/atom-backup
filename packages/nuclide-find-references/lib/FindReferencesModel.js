var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var readFileContents = _asyncToGenerator(function* (uri) {
  var client = getClient(uri);
  if (!client) {
    getLogger().error('find-references: could not load client for ' + uri);
    return null;
  }
  var localPath = getPath(uri);
  try {
    var contents = yield client.readFile(localPath, 'utf8');
  } catch (e) {
    getLogger().error('find-references: could not load file ' + uri, e);
    return null;
  }
  return contents;
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

'use babel';

var _require = require('nuclide-logging');

var getLogger = _require.getLogger;

var _require2 = require('nuclide-client');

var getClient = _require2.getClient;

var _require3 = require('nuclide-remote-uri');

var getPath = _require3.getPath;

function compareLocation(x, y) {
  var lineDiff = x.line - y.line;
  if (lineDiff) {
    return lineDiff;
  }
  return x.column - y.column;
}

function compareReference(x, y) {
  return compareLocation(x.start, y.start) || compareLocation(x.end, y.end);
}

function addReferenceGroup(groups, references, startLine, endLine) {
  if (references.length) {
    groups.push({ references: references, startLine: startLine, endLine: endLine });
  }
}

var FindReferencesModel = (function () {

  /**
   * @param basePath    Base path of the project. Used to display paths in a friendly way.
   * @param symbolName  The name of the symbol we're finding references for.
   * @param references  A list of references to `symbolName`.
   * @param options     See `FindReferencesOptions`.
   */

  function FindReferencesModel(basePath, symbolName, references, options) {
    _classCallCheck(this, FindReferencesModel);

    this._basePath = basePath;
    this._symbolName = symbolName;
    this._referenceCount = references.length;
    this._options = options || {};

    this._groupReferencesByFile(references);
  }

  /**
   * The main public entry point.
   * Returns a list of references, grouped by file (with previews),
   * according to the given offset and limit.
   * References in each file are grouped together if they're adjacent.
   */

  _createClass(FindReferencesModel, [{
    key: 'getFileReferences',
    value: _asyncToGenerator(function* (offset, limit) {
      /* $FlowFixMe - need array compact function */
      var fileReferences = yield Promise.all(this._references.slice(offset, offset + limit).map(this._makeFileReferences.bind(this)));
      return fileReferences.filter(function (x) {
        return !!x;
      });
    })
  }, {
    key: 'getBasePath',
    value: function getBasePath() {
      return this._basePath;
    }
  }, {
    key: 'getSymbolName',
    value: function getSymbolName() {
      return this._symbolName;
    }
  }, {
    key: 'getReferenceCount',
    value: function getReferenceCount() {
      return this._referenceCount;
    }
  }, {
    key: 'getFileCount',
    value: function getFileCount() {
      return this._references.length;
    }
  }, {
    key: 'getPreviewContext',
    value: function getPreviewContext() {
      return this._options.previewContext || 1;
    }
  }, {
    key: '_groupReferencesByFile',
    value: function _groupReferencesByFile(references) {
      // 1. Group references by file.
      var refsByFile = new Map();
      for (var reference of references) {
        var fileReferences = refsByFile.get(reference.uri);
        if (fileReferences == null) {
          refsByFile.set(reference.uri, fileReferences = []);
        }
        fileReferences.push(reference);
      }

      // 2. Group references within each file.
      this._references = [];
      for (var entry of refsByFile) {
        var _entry = _slicedToArray(entry, 2);

        var fileUri = _entry[0];
        var references = _entry[1];

        references.sort(compareReference);
        // Group references that are <= 1 line apart together.
        var groups = [];
        var curGroup = [];
        var curStartLine = -11;
        var curEndLine = -11;
        for (var ref of references) {
          if (ref.start.line <= curEndLine + 1 + this.getPreviewContext()) {
            curGroup.push(ref);
            curEndLine = Math.max(curEndLine, ref.end.line);
          } else {
            addReferenceGroup(groups, curGroup, curStartLine, curEndLine);
            curGroup = [ref];
            curStartLine = ref.start.line;
            curEndLine = ref.end.line;
          }
        }
        addReferenceGroup(groups, curGroup, curStartLine, curEndLine);
        this._references.push([fileUri, groups]);
      }

      // Finally, sort by file name.
      this._references.sort(function (x, y) {
        return x[0].localeCompare(y[0]);
      });
    }

    /**
     * Fetch file previews and expand line ranges with context.
     */
  }, {
    key: '_makeFileReferences',
    value: _asyncToGenerator(function* (fileReferences) {
      var _this = this;

      var _fileReferences = _slicedToArray(fileReferences, 2);

      var uri = _fileReferences[0];
      var refGroups = _fileReferences[1];

      var fileContents = yield readFileContents(uri);
      if (!fileContents) {
        return null;
      }
      var fileLines = fileContents.split('\n');
      var previewText = [];
      refGroups = refGroups.map(function (group) {
        var references = group.references;
        var startLine = group.startLine;
        var endLine = group.endLine;

        // Expand start/end lines with context.
        startLine = Math.max(startLine - _this.getPreviewContext(), 1);
        endLine = Math.min(endLine + _this.getPreviewContext(), fileLines.length);
        // However, don't include blank lines.
        while (startLine < endLine && fileLines[startLine - 1] === '') {
          startLine++;
        }
        while (startLine < endLine && fileLines[endLine - 1] === '') {
          endLine--;
        }

        previewText.push(fileLines.slice(startLine - 1, endLine).join('\n'));
        return { references: references, startLine: startLine, endLine: endLine };
      });
      return {
        uri: uri,
        /* $FlowFixMe - define atom.grammars */
        grammar: atom.grammars.selectGrammar(uri, fileContents),
        previewText: previewText,
        refGroups: refGroups
      };
    })
  }]);

  return FindReferencesModel;
})();

module.exports = FindReferencesModel;

// Lines of context to show around each preview block. Defaults to 1.
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWZpbmQtcmVmZXJlbmNlcy9saWIvRmluZFJlZmVyZW5jZXNNb2RlbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBd0NlLGdCQUFnQixxQkFBL0IsV0FBZ0MsR0FBZSxFQUFvQjtBQUNqRSxNQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUIsTUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNYLGFBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQyw2Q0FBNkMsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUN2RSxXQUFPLElBQUksQ0FBQztHQUNiO0FBQ0QsTUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdCLE1BQUk7QUFDRixRQUFJLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0dBQ3pELENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDVixhQUFTLEVBQUUsQ0FBQyxLQUFLLDJDQUF5QyxHQUFHLEVBQUksQ0FBQyxDQUFDLENBQUM7QUFDcEUsV0FBTyxJQUFJLENBQUM7R0FDYjtBQUNELFNBQU8sUUFBUSxDQUFDO0NBQ2pCOzs7Ozs7Ozs7Ozs7OztBQXRERCxXQUFXLENBQUM7O2VBd0JNLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQzs7SUFBdkMsU0FBUyxZQUFULFNBQVM7O2dCQUNJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzs7SUFBdEMsU0FBUyxhQUFULFNBQVM7O2dCQUNFLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQzs7SUFBeEMsT0FBTyxhQUFQLE9BQU87O0FBRVosU0FBUyxlQUFlLENBQUMsQ0FBVyxFQUFFLENBQVcsRUFBVTtBQUN6RCxNQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFH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QUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3JFLGVBQU8sRUFBQyxVQUFVLEVBQVYsVUFBVSxFQUFFLFNBQVMsRUFBVCxTQUFTLEVBQUUsT0FBTyxFQUFQLE9BQU8sRUFBQyxDQUFDO09BQ3pDLENBQUMsQ0FBQztBQUNILGFBQU87QUFDTCxXQUFHLEVBQUgsR0FBRzs7QUFFSCxlQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQztBQUN2RCxtQkFBVyxFQUFYLFdBQVc7QUFDWCxpQkFBUyxFQUFULFNBQVM7T0FDVixDQUFDO0tBQ0g7OztTQTlJRyxtQkFBbUI7OztBQWtKekIsTUFBTSxDQUFDLE9BQU8sR0FBRyxtQkFBbUIsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1maW5kLXJlZmVyZW5jZXMvbGliL0ZpbmRSZWZlcmVuY2VzTW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEZpbGVSZWZlcmVuY2VzLFxuICBMb2NhdGlvbixcbiAgTnVjbGlkZVVyaSxcbiAgUmVmZXJlbmNlLFxuICBSZWZlcmVuY2VHcm91cCxcbn0gZnJvbSAnLi90eXBlcyc7XG5cbnR5cGUgRmluZFJlZmVyZW5jZXNPcHRpb25zID0ge1xuICAvLyBMaW5lcyBvZiBjb250ZXh0IHRvIHNob3cgYXJvdW5kIGVhY2ggcHJldmlldyBibG9jay4gRGVmYXVsdHMgdG8gMS5cbiAgcHJldmlld0NvbnRleHQ/OiBudW1iZXI7XG59O1xuXG52YXIge2dldExvZ2dlcn0gPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKTtcbnZhciB7Z2V0Q2xpZW50fSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG52YXIge2dldFBhdGh9ID0gcmVxdWlyZSgnbnVjbGlkZS1yZW1vdGUtdXJpJyk7XG5cbmZ1bmN0aW9uIGNvbXBhcmVMb2NhdGlvbih4OiBMb2NhdGlvbiwgeTogTG9jYXRpb24pOiBudW1iZXIge1xuICB2YXIgbGluZURpZmYgPSB4LmxpbmUgLSB5LmxpbmU7XG4gIGlmIChsaW5lRGlmZikge1xuICAgIHJldHVybiBsaW5lRGlmZjtcbiAgfVxuICByZXR1cm4geC5jb2x1bW4gLSB5LmNvbHVtbjtcbn1cblxuZnVuY3Rpb24gY29tcGFyZVJlZmVyZW5jZSh4OiBSZWZlcmVuY2UsIHk6IFJlZmVyZW5jZSk6IG51bWJlciB7XG4gIHJldHVybiBjb21wYXJlTG9jYXRpb24oeC5zdGFydCwgeS5zdGFydCkgfHwgY29tcGFyZUxvY2F0aW9uKHguZW5kLCB5LmVuZCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRGaWxlQ29udGVudHModXJpOiBOdWNsaWRlVXJpKTogUHJvbWlzZTw/c3RyaW5nPiB7XG4gIHZhciBjbGllbnQgPSBnZXRDbGllbnQodXJpKTtcbiAgaWYgKCFjbGllbnQpIHtcbiAgICBnZXRMb2dnZXIoKS5lcnJvcignZmluZC1yZWZlcmVuY2VzOiBjb3VsZCBub3QgbG9hZCBjbGllbnQgZm9yICcgKyB1cmkpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHZhciBsb2NhbFBhdGggPSBnZXRQYXRoKHVyaSk7XG4gIHRyeSB7XG4gICAgdmFyIGNvbnRlbnRzID0gYXdhaXQgY2xpZW50LnJlYWRGaWxlKGxvY2FsUGF0aCwgJ3V0ZjgnKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGdldExvZ2dlcigpLmVycm9yKGBmaW5kLXJlZmVyZW5jZXM6IGNvdWxkIG5vdCBsb2FkIGZpbGUgJHt1cml9YCwgZSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGNvbnRlbnRzO1xufVxuXG5mdW5jdGlvbiBhZGRSZWZlcmVuY2VHcm91cChcbiAgZ3JvdXBzOiBBcnJheTxSZWZlcmVuY2VHcm91cD4sXG4gIHJlZmVyZW5jZXM6IEFycmF5PFJlZmVyZW5jZT4sXG4gIHN0YXJ0TGluZTogbnVtYmVyLFxuICBlbmRMaW5lOiBudW1iZXJcbikge1xuICBpZiAocmVmZXJlbmNlcy5sZW5ndGgpIHtcbiAgICBncm91cHMucHVzaCh7cmVmZXJlbmNlcywgc3RhcnRMaW5lLCBlbmRMaW5lfSk7XG4gIH1cbn1cblxuY2xhc3MgRmluZFJlZmVyZW5jZXNNb2RlbCB7XG4gIF9iYXNlUGF0aDogTnVjbGlkZVVyaTtcbiAgX3N5bWJvbE5hbWU6IHN0cmluZztcbiAgX3JlZmVyZW5jZXM6IEFycmF5PFtzdHJpbmcsIEFycmF5PFJlZmVyZW5jZUdyb3VwPl0+O1xuICBfcmVmZXJlbmNlQ291bnQ6IG51bWJlcjtcbiAgX29wdGlvbnM6IEZpbmRSZWZlcmVuY2VzT3B0aW9ucztcblxuICAvKipcbiAgICogQHBhcmFtIGJhc2VQYXRoICAgIEJhc2UgcGF0aCBvZiB0aGUgcHJvamVjdC4gVXNlZCB0byBkaXNwbGF5IHBhdGhzIGluIGEgZnJpZW5kbHkgd2F5LlxuICAgKiBAcGFyYW0gc3ltYm9sTmFtZSAgVGhlIG5hbWUgb2YgdGhlIHN5bWJvbCB3ZSdyZSBmaW5kaW5nIHJlZmVyZW5jZXMgZm9yLlxuICAgKiBAcGFyYW0gcmVmZXJlbmNlcyAgQSBsaXN0IG9mIHJlZmVyZW5jZXMgdG8gYHN5bWJvbE5hbWVgLlxuICAgKiBAcGFyYW0gb3B0aW9ucyAgICAgU2VlIGBGaW5kUmVmZXJlbmNlc09wdGlvbnNgLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgYmFzZVBhdGg6IE51Y2xpZGVVcmksXG4gICAgc3ltYm9sTmFtZTogc3RyaW5nLFxuICAgIHJlZmVyZW5jZXM6IEFycmF5PFJlZmVyZW5jZT4sXG4gICAgb3B0aW9ucz86IEZpbmRSZWZlcmVuY2VzT3B0aW9uc1xuICApIHtcbiAgICB0aGlzLl9iYXNlUGF0aCA9IGJhc2VQYXRoO1xuICAgIHRoaXMuX3N5bWJvbE5hbWUgPSBzeW1ib2xOYW1lO1xuICAgIHRoaXMuX3JlZmVyZW5jZUNvdW50ID0gcmVmZXJlbmNlcy5sZW5ndGg7XG4gICAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICB0aGlzLl9ncm91cFJlZmVyZW5jZXNCeUZpbGUocmVmZXJlbmNlcyk7XG4gIH1cblxuICAvKipcbiAgICogVGhlIG1haW4gcHVibGljIGVudHJ5IHBvaW50LlxuICAgKiBSZXR1cm5zIGEgbGlzdCBvZiByZWZlcmVuY2VzLCBncm91cGVkIGJ5IGZpbGUgKHdpdGggcHJldmlld3MpLFxuICAgKiBhY2NvcmRpbmcgdG8gdGhlIGdpdmVuIG9mZnNldCBhbmQgbGltaXQuXG4gICAqIFJlZmVyZW5jZXMgaW4gZWFjaCBmaWxlIGFyZSBncm91cGVkIHRvZ2V0aGVyIGlmIHRoZXkncmUgYWRqYWNlbnQuXG4gICAqL1xuICBhc3luYyBnZXRGaWxlUmVmZXJlbmNlcyhcbiAgICBvZmZzZXQ6IG51bWJlcixcbiAgICBsaW1pdDogbnVtYmVyXG4gICk6IFByb21pc2U8QXJyYXk8RmlsZVJlZmVyZW5jZXM+PiB7XG4gICAgLyogJEZsb3dGaXhNZSAtIG5lZWQgYXJyYXkgY29tcGFjdCBmdW5jdGlvbiAqL1xuICAgIHZhciBmaWxlUmVmZXJlbmNlczogQXJyYXk8P0ZpbGVSZWZlcmVuY2VzPiA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgdGhpcy5fcmVmZXJlbmNlcy5zbGljZShvZmZzZXQsIG9mZnNldCArIGxpbWl0KS5tYXAoXG4gICAgICAgIHRoaXMuX21ha2VGaWxlUmVmZXJlbmNlcy5iaW5kKHRoaXMpXG4gICAgICApXG4gICAgKTtcbiAgICByZXR1cm4gZmlsZVJlZmVyZW5jZXMuZmlsdGVyKHggPT4gISF4KTtcbiAgfVxuXG4gIGdldEJhc2VQYXRoKCk6IE51Y2xpZGVVcmkge1xuICAgIHJldHVybiB0aGlzLl9iYXNlUGF0aDtcbiAgfVxuXG4gIGdldFN5bWJvbE5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fc3ltYm9sTmFtZTtcbiAgfVxuXG4gIGdldFJlZmVyZW5jZUNvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3JlZmVyZW5jZUNvdW50O1xuICB9XG5cbiAgZ2V0RmlsZUNvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3JlZmVyZW5jZXMubGVuZ3RoO1xuICB9XG5cbiAgZ2V0UHJldmlld0NvbnRleHQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fb3B0aW9ucy5wcmV2aWV3Q29udGV4dCB8fCAxO1xuICB9XG5cbiAgX2dyb3VwUmVmZXJlbmNlc0J5RmlsZShyZWZlcmVuY2VzOiBBcnJheTxSZWZlcmVuY2U+KTogdm9pZCB7XG4gICAgLy8gMS4gR3JvdXAgcmVmZXJlbmNlcyBieSBmaWxlLlxuICAgIHZhciByZWZzQnlGaWxlID0gbmV3IE1hcCgpO1xuICAgIGZvciAodmFyIHJlZmVyZW5jZSBvZiByZWZlcmVuY2VzKSB7XG4gICAgICB2YXIgZmlsZVJlZmVyZW5jZXMgPSByZWZzQnlGaWxlLmdldChyZWZlcmVuY2UudXJpKTtcbiAgICAgIGlmIChmaWxlUmVmZXJlbmNlcyA9PSBudWxsKSB7XG4gICAgICAgIHJlZnNCeUZpbGUuc2V0KHJlZmVyZW5jZS51cmksIGZpbGVSZWZlcmVuY2VzID0gW10pO1xuICAgICAgfVxuICAgICAgZmlsZVJlZmVyZW5jZXMucHVzaChyZWZlcmVuY2UpO1xuICAgIH1cblxuICAgIC8vIDIuIEdyb3VwIHJlZmVyZW5jZXMgd2l0aGluIGVhY2ggZmlsZS5cbiAgICB0aGlzLl9yZWZlcmVuY2VzID0gW107XG4gICAgZm9yICh2YXIgZW50cnkgb2YgcmVmc0J5RmlsZSkge1xuICAgICAgdmFyIFtmaWxlVXJpLCByZWZlcmVuY2VzXSA9IGVudHJ5O1xuICAgICAgcmVmZXJlbmNlcy5zb3J0KGNvbXBhcmVSZWZlcmVuY2UpO1xuICAgICAgLy8gR3JvdXAgcmVmZXJlbmNlcyB0aGF0IGFyZSA8PSAxIGxpbmUgYXBhcnQgdG9nZXRoZXIuXG4gICAgICB2YXIgZ3JvdXBzID0gW107XG4gICAgICB2YXIgY3VyR3JvdXAgPSBbXTtcbiAgICAgIHZhciBjdXJTdGFydExpbmUgPSAtMTE7XG4gICAgICB2YXIgY3VyRW5kTGluZSA9IC0xMTtcbiAgICAgIGZvciAodmFyIHJlZiBvZiByZWZlcmVuY2VzKSB7XG4gICAgICAgIGlmIChyZWYuc3RhcnQubGluZSA8PSBjdXJFbmRMaW5lICsgMSArIHRoaXMuZ2V0UHJldmlld0NvbnRleHQoKSkge1xuICAgICAgICAgIGN1ckdyb3VwLnB1c2gocmVmKTtcbiAgICAgICAgICBjdXJFbmRMaW5lID0gTWF0aC5tYXgoY3VyRW5kTGluZSwgcmVmLmVuZC5saW5lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhZGRSZWZlcmVuY2VHcm91cChncm91cHMsIGN1ckdyb3VwLCBjdXJTdGFydExpbmUsIGN1ckVuZExpbmUpO1xuICAgICAgICAgIGN1ckdyb3VwID0gW3JlZl07XG4gICAgICAgICAgY3VyU3RhcnRMaW5lID0gcmVmLnN0YXJ0LmxpbmU7XG4gICAgICAgICAgY3VyRW5kTGluZSA9IHJlZi5lbmQubGluZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYWRkUmVmZXJlbmNlR3JvdXAoZ3JvdXBzLCBjdXJHcm91cCwgY3VyU3RhcnRMaW5lLCBjdXJFbmRMaW5lKTtcbiAgICAgIHRoaXMuX3JlZmVyZW5jZXMucHVzaChbZmlsZVVyaSwgZ3JvdXBzXSk7XG4gICAgfVxuXG4gICAgLy8gRmluYWxseSwgc29ydCBieSBmaWxlIG5hbWUuXG4gICAgdGhpcy5fcmVmZXJlbmNlcy5zb3J0KCh4LCB5KSA9PiB4WzBdLmxvY2FsZUNvbXBhcmUoeVswXSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGZpbGUgcHJldmlld3MgYW5kIGV4cGFuZCBsaW5lIHJhbmdlcyB3aXRoIGNvbnRleHQuXG4gICAqL1xuICBhc3luYyBfbWFrZUZpbGVSZWZlcmVuY2VzKFxuICAgIGZpbGVSZWZlcmVuY2VzOiBbc3RyaW5nLCBBcnJheTxSZWZlcmVuY2VHcm91cD5dXG4gICk6IFByb21pc2U8P0ZpbGVSZWZlcmVuY2VzPiB7XG4gICAgdmFyIFt1cmksIHJlZkdyb3Vwc10gPSBmaWxlUmVmZXJlbmNlcztcbiAgICB2YXIgZmlsZUNvbnRlbnRzID0gYXdhaXQgcmVhZEZpbGVDb250ZW50cyh1cmkpO1xuICAgIGlmICghZmlsZUNvbnRlbnRzKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIGZpbGVMaW5lcyA9IGZpbGVDb250ZW50cy5zcGxpdCgnXFxuJyk7XG4gICAgdmFyIHByZXZpZXdUZXh0ID0gW107XG4gICAgcmVmR3JvdXBzID0gcmVmR3JvdXBzLm1hcChncm91cCA9PiB7XG4gICAgICB2YXIge3JlZmVyZW5jZXMsIHN0YXJ0TGluZSwgZW5kTGluZX0gPSBncm91cDtcbiAgICAgIC8vIEV4cGFuZCBzdGFydC9lbmQgbGluZXMgd2l0aCBjb250ZXh0LlxuICAgICAgc3RhcnRMaW5lID0gTWF0aC5tYXgoc3RhcnRMaW5lIC0gdGhpcy5nZXRQcmV2aWV3Q29udGV4dCgpLCAxKTtcbiAgICAgIGVuZExpbmUgPSBNYXRoLm1pbihlbmRMaW5lICsgdGhpcy5nZXRQcmV2aWV3Q29udGV4dCgpLCBmaWxlTGluZXMubGVuZ3RoKTtcbiAgICAgIC8vIEhvd2V2ZXIsIGRvbid0IGluY2x1ZGUgYmxhbmsgbGluZXMuXG4gICAgICB3aGlsZSAoc3RhcnRMaW5lIDwgZW5kTGluZSAmJiBmaWxlTGluZXNbc3RhcnRMaW5lIC0gMV0gPT09ICcnKSB7XG4gICAgICAgIHN0YXJ0TGluZSsrO1xuICAgICAgfVxuICAgICAgd2hpbGUgKHN0YXJ0TGluZSA8IGVuZExpbmUgJiYgZmlsZUxpbmVzW2VuZExpbmUgLSAxXSA9PT0gJycpIHtcbiAgICAgICAgZW5kTGluZS0tO1xuICAgICAgfVxuXG4gICAgICBwcmV2aWV3VGV4dC5wdXNoKGZpbGVMaW5lcy5zbGljZShzdGFydExpbmUgLSAxLCBlbmRMaW5lKS5qb2luKCdcXG4nKSk7XG4gICAgICByZXR1cm4ge3JlZmVyZW5jZXMsIHN0YXJ0TGluZSwgZW5kTGluZX07XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVyaSxcbiAgICAgIC8qICRGbG93Rml4TWUgLSBkZWZpbmUgYXRvbS5ncmFtbWFycyAqL1xuICAgICAgZ3JhbW1hcjogYXRvbS5ncmFtbWFycy5zZWxlY3RHcmFtbWFyKHVyaSwgZmlsZUNvbnRlbnRzKSxcbiAgICAgIHByZXZpZXdUZXh0LFxuICAgICAgcmVmR3JvdXBzLFxuICAgIH07XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbmRSZWZlcmVuY2VzTW9kZWw7XG4iXX0=
