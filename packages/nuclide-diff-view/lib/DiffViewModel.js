
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var DiffViewModel = (function () {
  // The model will evolve with every step of the diff view to include more of the diff and source control logic.

  function DiffViewModel(uri, filePath, uiProviders) {
    _classCallCheck(this, DiffViewModel);

    this._uri = uri;
    this._filePath = filePath;
    this._diffState = null;
    this._uiProviders = uiProviders;
  }

  _createClass(DiffViewModel, [{
    key: 'fetchDiffState',
    value: _asyncToGenerator(function* () {
      var _this = this;

      var uiElementPromises = this._uiProviders.map(function (provider) {
        return provider.composeUiElements(_this._filePath);
      });

      var uiComponentLists = yield Promise.all(uiElementPromises);

      // flatten uiComponentLists from list of lists of components to a list of components
      var uiComponents = [].concat.apply([], uiComponentLists);

      // Calling atom.project.repositoryForDirectory gets the real path of the directory,
      // which is another round-trip and calls the repository providers to get an existing repository.
      // Instead, the first match of the filtering here is the only possible match.

      var _require = require('nuclide-hg-git-bridge');

      var repositoryForPath = _require.repositoryForPath;

      var repository = repositoryForPath(this._filePath);

      if (!repository || repository.getType() !== 'hg') {
        throw new Error('Diff view only supports hg repositories right now: found ' + (repository && repository.getType()));
      }
      var committedContents = yield repository.fetchFileContentAtRevision(this._filePath);

      var _require2 = require('nuclide-client');

      var getClient = _require2.getClient;

      var _require3 = require('nuclide-remote-uri');

      var getPath = _require3.getPath;

      var client = getClient(this._filePath);
      var localFilePath = getPath(this._filePath);
      var filesystemContents = yield client.readFile(localFilePath, 'utf8');

      this._diffState = {
        filePath: this._filePath,
        oldText: committedContents,
        newText: filesystemContents,
        uiComponents: uiComponents
      };
    })
  }, {
    key: 'getDiffState',
    value: function getDiffState() {
      if (!this._diffState) {
        throw new Error('No diff state is set!');
      }
      return this._diffState;
    }
  }, {
    key: 'getURI',
    value: function getURI() {
      return this._uri;
    }
  }, {
    key: 'computeDiff',
    value: function computeDiff(oldText, newText) {
      var _computeDiffChunks2 = this._computeDiffChunks(oldText, newText);

      var addedLines = _computeDiffChunks2.addedLines;
      var removedLines = _computeDiffChunks2.removedLines;
      var chunks = _computeDiffChunks2.chunks;

      var _computeOffsets2 = this._computeOffsets(chunks);

      var oldLineOffsets = _computeOffsets2.oldLineOffsets;
      var newLineOffsets = _computeOffsets2.newLineOffsets;

      return {
        addedLines: addedLines,
        removedLines: removedLines,
        oldLineOffsets: oldLineOffsets,
        newLineOffsets: newLineOffsets
      };
    }
  }, {
    key: '_computeDiffChunks',
    value: function _computeDiffChunks(oldText, newText) {

      var JsDiff = require('diff');

      // If the last line has changes, JsDiff doesn't return that.
      // Generally, content with new line ending are easier to calculate offsets for.
      if (oldText[oldText.length - 1] !== '\n' || newText[newText.length - 1] !== '\n') {
        oldText += '\n';
        newText += '\n';
      }

      var lineDiff = JsDiff.diffLines(oldText, newText);
      var chunks = [];

      var addedCount = 0;
      var removedCount = 0;
      var nextOffset = 0;
      var offset = 0;

      var addedLines = [];
      var removedLines = [];

      lineDiff.forEach(function (part) {
        var added = part.added;
        var removed = part.removed;
        var value = part.value;

        var count = value.split('\n').length - 1;
        if (!added && !removed) {
          addedCount += count;
          removedCount += count;
          offset = nextOffset;
          nextOffset = 0;
        } else if (added) {
          for (var i = 0; i < count; i++) {
            addedLines.push(addedCount + i);
          }
          addedCount += count;
          nextOffset += count;
        } else {
          for (var i = 0; i < count; i++) {
            removedLines.push(removedCount + i);
          }
          removedCount += count;
          nextOffset -= count;
        }
        chunks.push({ added: added, removed: removed, value: value, count: count, offset: offset });
        offset = 0;
      });
      return { addedLines: addedLines, removedLines: removedLines, chunks: chunks };
    }
  }, {
    key: '_computeOffsets',
    value: function _computeOffsets(diffChunks) {
      var newLineOffsets = {};
      var oldLineOffsets = {};

      var oldLineCount = 0;
      var newLineCount = 0;

      for (var chunk of diffChunks) {
        var added = chunk.added;
        var removed = chunk.removed;
        var offset = chunk.offset;
        var count = chunk.count;

        if (added) {
          newLineCount += count;
        } else if (removed) {
          oldLineCount += count;
        } else {
          if (offset < 0) {
            newLineOffsets[newLineCount] = offset * -1;
          } else if (offset > 0) {
            oldLineOffsets[oldLineCount] = offset;
          }
          newLineCount += count;
          oldLineCount += count;
        }
      }

      return {
        oldLineOffsets: oldLineOffsets,
        newLineOffsets: newLineOffsets
      };
    }
  }]);

  return DiffViewModel;
})();

;

module.exports = DiffViewModel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWRpZmYtdmlldy9saWIvRGlmZlZpZXdNb2RlbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7SUF3Qk4sYUFBYTs7O0FBRU4sV0FGUCxhQUFhLENBRUwsR0FBVyxFQUFFLFFBQWdCLEVBQUUsV0FBMEIsRUFBRTswQkFGbkUsYUFBYTs7QUFHZixRQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUNoQixRQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztBQUMxQixRQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztBQUN2QixRQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztHQUNqQzs7ZUFQRyxhQUFhOzs2QkFTRyxhQUFrQjs7O0FBQ3BDLFVBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsVUFBQSxRQUFRO2VBQUksUUFBUSxDQUFDLGlCQUFpQixDQUFDLE1BQUssU0FBUyxDQUFDO09BQUEsQ0FBQyxDQUFDOztBQUV0RyxVQUFJLGdCQUFnQixHQUFHLGtCQUFPLGlCQUFpQixDQUFBLENBQUM7OztBQUdoRCxVQUFJLFlBQVksR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQzs7Ozs7O3FCQUsvQixPQUFPLENBQUMsdUJBQXVCLENBQUM7O1VBQXJELGlCQUFpQixZQUFqQixpQkFBaUI7O0FBQ3RCLFVBQUksVUFBVSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFbkQsVUFBSSxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLEtBQUssSUFBSSxFQUFFO0FBQ2hELGNBQU0sSUFBSSxLQUFLLENBQUMsMkRBQTJELElBQUksVUFBVSxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQSxBQUFDLENBQUMsQ0FBQztPQUNySDtBQUNELFVBQUksaUJBQWlCLEdBQUcsTUFBTSxVQUFVLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztzQkFFbEUsT0FBTyxDQUFDLGdCQUFnQixDQUFDOztVQUF0QyxTQUFTLGFBQVQsU0FBUzs7c0JBQ0UsT0FBTyxDQUFDLG9CQUFvQixDQUFDOztVQUF4QyxPQUFPLGFBQVAsT0FBTzs7QUFFWixVQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3ZDLFVBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDNUMsVUFBSSxrQkFBa0IsR0FBRyxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUV0RSxVQUFJLENBQUMsVUFBVSxHQUFHO0FBQ2hCLGdCQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVM7QUFDeEIsZUFBTyxFQUFFLGlCQUFpQjtBQUMxQixlQUFPLEVBQUUsa0JBQWtCO0FBQzNCLG9CQUFZLEVBQVosWUFBWTtPQUNiLENBQUM7S0FDSDs7O1dBRVcsd0JBQWtCO0FBQzVCLFVBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ3BCLGNBQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztPQUMxQztBQUNELGFBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztLQUN4Qjs7O1dBRUssa0JBQVc7QUFDZixhQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7S0FDbEI7OztXQUVVLHFCQUFDLE9BQWUsRUFBRSxPQUFlLEVBQVk7Z0NBQ2IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUM7O1VBQTdFLFVBQVUsdUJBQVYsVUFBVTtVQUFFLFlBQVksdUJBQVosWUFBWTtVQUFFLE1BQU0sdUJBQU4sTUFBTTs7NkJBQ0UsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUM7O1VBQTlELGNBQWMsb0JBQWQsY0FBYztVQUFFLGNBQWMsb0JBQWQsY0FBYzs7QUFFbkMsYUFBTztBQUNMLGtCQUFVLEVBQVYsVUFBVTtBQUNWLG9CQUFZLEVBQVosWUFBWTtBQUNaLHNCQUFjLEVBQWQsY0FBYztBQUNkLHNCQUFjLEVBQWQsY0FBYztPQUNmLENBQUM7S0FDSDs7O1dBRWlCLDRCQUFDLE9BQWUsRUFBRSxPQUFlLEVBQ2dDOztBQUVqRixVQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Ozs7QUFJN0IsVUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQ2hGLGVBQU8sSUFBSSxJQUFJLENBQUM7QUFDaEIsZUFBTyxJQUFJLElBQUksQ0FBQztPQUNqQjs7QUFFRCxVQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNsRCxVQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7O0FBRWhCLFVBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztBQUNuQixVQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7QUFDckIsVUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBQ25CLFVBQUksTUFBTSxHQUFHLENBQUMsQ0FBQzs7QUFFZixVQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDcEIsVUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDOztBQUV0QixjQUFRLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSSxFQUFJO1lBQ2xCLEtBQUssR0FBb0IsSUFBSSxDQUE3QixLQUFLO1lBQUUsT0FBTyxHQUFXLElBQUksQ0FBdEIsT0FBTztZQUFFLEtBQUssR0FBSSxJQUFJLENBQWIsS0FBSzs7QUFDMUIsWUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ3pDLFlBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDdEIsb0JBQVUsSUFBSSxLQUFLLENBQUM7QUFDcEIsc0JBQVksSUFBSSxLQUFLLENBQUM7QUFDdEIsZ0JBQU0sR0FBRyxVQUFVLENBQUM7QUFDcEIsb0JBQVUsR0FBRyxDQUFDLENBQUM7U0FDaEIsTUFBTSxJQUFJLEtBQUssRUFBRTtBQUNoQixlQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzlCLHNCQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztXQUNqQztBQUNELG9CQUFVLElBQUksS0FBSyxDQUFDO0FBQ3BCLG9CQUFVLElBQUksS0FBSyxDQUFDO1NBQ3JCLE1BQU07QUFDTCxlQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzlCLHdCQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQztXQUNyQztBQUNELHNCQUFZLElBQUksS0FBSyxDQUFDO0FBQ3RCLG9CQUFVLElBQUksS0FBSyxDQUFDO1NBQ3JCO0FBQ0QsY0FBTSxDQUFDLElBQUksQ0FBQyxFQUFDLEtBQUssRUFBTCxLQUFLLEVBQUUsT0FBTyxFQUFQLE9BQU8sRUFBRSxLQUFLLEVBQUwsS0FBSyxFQUFFLEtBQUssRUFBTCxLQUFLLEVBQUUsTUFBTSxFQUFOLE1BQU0sRUFBQyxDQUFDLENBQUM7QUFDcEQsY0FBTSxHQUFHLENBQUMsQ0FBQztPQUNaLENBQUMsQ0FBQztBQUNILGFBQU8sRUFBQyxVQUFVLEVBQVYsVUFBVSxFQUFFLFlBQVksRUFBWixZQUFZLEVBQUUsTUFBTSxFQUFOLE1BQU0sRUFBQyxDQUFDO0tBQzNDOzs7V0FFYyx5QkFBQyxVQUFzQixFQUErQztBQUNuRixVQUFJLGNBQWMsR0FBRyxFQUFFLENBQUM7QUFDeEIsVUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDOztBQUV4QixVQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7QUFDckIsVUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDOztBQUVyQixXQUFLLElBQUksS0FBSyxJQUFJLFVBQVUsRUFBRTtZQUN2QixLQUFLLEdBQTRCLEtBQUssQ0FBdEMsS0FBSztZQUFFLE9BQU8sR0FBbUIsS0FBSyxDQUEvQixPQUFPO1lBQUUsTUFBTSxHQUFXLEtBQUssQ0FBdEIsTUFBTTtZQUFFLEtBQUssR0FBSSxLQUFLLENBQWQsS0FBSzs7QUFDbEMsWUFBSSxLQUFLLEVBQUU7QUFDVCxzQkFBWSxJQUFJLEtBQUssQ0FBQztTQUN2QixNQUFNLElBQUksT0FBTyxFQUFFO0FBQ2xCLHNCQUFZLElBQUksS0FBSyxDQUFDO1NBQ3ZCLE1BQU07QUFDTCxjQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDZCwwQkFBYyxDQUFDLFlBQVksQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztXQUM1QyxNQUFNLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRTtBQUNyQiwwQkFBYyxDQUFDLFlBQVksQ0FBQyxHQUFHLE1BQU0sQ0FBQztXQUN2QztBQUNELHNCQUFZLElBQUksS0FBSyxDQUFDO0FBQ3RCLHNCQUFZLElBQUksS0FBSyxDQUFDO1NBQ3ZCO09BQ0Y7O0FBRUQsYUFBTztBQUNMLHNCQUFjLEVBQWQsY0FBYztBQUNkLHNCQUFjLEVBQWQsY0FBYztPQUNmLENBQUM7S0FDSDs7O1NBaEpHLGFBQWE7OztBQWlKbEIsQ0FBQzs7QUFFRixNQUFNLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1kaWZmLXZpZXcvbGliL0RpZmZWaWV3TW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG50eXBlIERpZmZWaWV3U3RhdGUgPSB7XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIG9sZFRleHQ6IHN0cmluZztcbiAgbmV3VGV4dDogc3RyaW5nO1xufTtcblxudHlwZSBUZXh0RGlmZiA9IHtcbiAgYWRkZWRMaW5lczogQXJyYXk8bnVtYmVyPjtcbiAgcmVtb3ZlZExpbmVzOiBBcnJheTxudW1iZXI+O1xuICBvbGRMaW5lT2Zmc2V0czoge1tsaW5lTnVtYmVyOiBzdHJpbmddOiBudW1iZXJ9O1xuICBuZXdMaW5lT2Zmc2V0czoge1tsaW5lTnVtYmVyOiBzdHJpbmddOiBudW1iZXJ9O1xufTtcblxuY2xhc3MgRGlmZlZpZXdNb2RlbCB7XG4gIC8vIFRoZSBtb2RlbCB3aWxsIGV2b2x2ZSB3aXRoIGV2ZXJ5IHN0ZXAgb2YgdGhlIGRpZmYgdmlldyB0byBpbmNsdWRlIG1vcmUgb2YgdGhlIGRpZmYgYW5kIHNvdXJjZSBjb250cm9sIGxvZ2ljLlxuICBjb25zdHJ1Y3Rvcih1cmk6IHN0cmluZywgZmlsZVBhdGg6IHN0cmluZywgdWlQcm92aWRlcnM6IEFycmF5PE9iamVjdD4pIHtcbiAgICB0aGlzLl91cmkgPSB1cmk7XG4gICAgdGhpcy5fZmlsZVBhdGggPSBmaWxlUGF0aDtcbiAgICB0aGlzLl9kaWZmU3RhdGUgPSBudWxsO1xuICAgIHRoaXMuX3VpUHJvdmlkZXJzID0gdWlQcm92aWRlcnM7XG4gIH1cblxuICBhc3luYyBmZXRjaERpZmZTdGF0ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB2YXIgdWlFbGVtZW50UHJvbWlzZXMgPSB0aGlzLl91aVByb3ZpZGVycy5tYXAocHJvdmlkZXIgPT4gcHJvdmlkZXIuY29tcG9zZVVpRWxlbWVudHModGhpcy5fZmlsZVBhdGgpKTtcblxuICAgIHZhciB1aUNvbXBvbmVudExpc3RzID0gYXdhaXQqIHVpRWxlbWVudFByb21pc2VzO1xuXG4gICAgLy8gZmxhdHRlbiB1aUNvbXBvbmVudExpc3RzIGZyb20gbGlzdCBvZiBsaXN0cyBvZiBjb21wb25lbnRzIHRvIGEgbGlzdCBvZiBjb21wb25lbnRzXG4gICAgdmFyIHVpQ29tcG9uZW50cyA9IFtdLmNvbmNhdC5hcHBseShbXSwgdWlDb21wb25lbnRMaXN0cyk7XG5cbiAgICAvLyBDYWxsaW5nIGF0b20ucHJvamVjdC5yZXBvc2l0b3J5Rm9yRGlyZWN0b3J5IGdldHMgdGhlIHJlYWwgcGF0aCBvZiB0aGUgZGlyZWN0b3J5LFxuICAgIC8vIHdoaWNoIGlzIGFub3RoZXIgcm91bmQtdHJpcCBhbmQgY2FsbHMgdGhlIHJlcG9zaXRvcnkgcHJvdmlkZXJzIHRvIGdldCBhbiBleGlzdGluZyByZXBvc2l0b3J5LlxuICAgIC8vIEluc3RlYWQsIHRoZSBmaXJzdCBtYXRjaCBvZiB0aGUgZmlsdGVyaW5nIGhlcmUgaXMgdGhlIG9ubHkgcG9zc2libGUgbWF0Y2guXG4gICAgdmFyIHtyZXBvc2l0b3J5Rm9yUGF0aH0gPSByZXF1aXJlKCdudWNsaWRlLWhnLWdpdC1icmlkZ2UnKTtcbiAgICB2YXIgcmVwb3NpdG9yeSA9IHJlcG9zaXRvcnlGb3JQYXRoKHRoaXMuX2ZpbGVQYXRoKTtcblxuICAgIGlmICghcmVwb3NpdG9yeSB8fCByZXBvc2l0b3J5LmdldFR5cGUoKSAhPT0gJ2hnJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdEaWZmIHZpZXcgb25seSBzdXBwb3J0cyBoZyByZXBvc2l0b3JpZXMgcmlnaHQgbm93OiBmb3VuZCAnICsgKHJlcG9zaXRvcnkgJiYgcmVwb3NpdG9yeS5nZXRUeXBlKCkpKTtcbiAgICB9XG4gICAgdmFyIGNvbW1pdHRlZENvbnRlbnRzID0gYXdhaXQgcmVwb3NpdG9yeS5mZXRjaEZpbGVDb250ZW50QXRSZXZpc2lvbih0aGlzLl9maWxlUGF0aCk7XG5cbiAgICB2YXIge2dldENsaWVudH0gPSByZXF1aXJlKCdudWNsaWRlLWNsaWVudCcpO1xuICAgIHZhciB7Z2V0UGF0aH0gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS11cmknKTtcblxuICAgIHZhciBjbGllbnQgPSBnZXRDbGllbnQodGhpcy5fZmlsZVBhdGgpO1xuICAgIHZhciBsb2NhbEZpbGVQYXRoID0gZ2V0UGF0aCh0aGlzLl9maWxlUGF0aCk7XG4gICAgdmFyIGZpbGVzeXN0ZW1Db250ZW50cyA9IGF3YWl0IGNsaWVudC5yZWFkRmlsZShsb2NhbEZpbGVQYXRoLCAndXRmOCcpO1xuXG4gICAgdGhpcy5fZGlmZlN0YXRlID0ge1xuICAgICAgZmlsZVBhdGg6IHRoaXMuX2ZpbGVQYXRoLFxuICAgICAgb2xkVGV4dDogY29tbWl0dGVkQ29udGVudHMsXG4gICAgICBuZXdUZXh0OiBmaWxlc3lzdGVtQ29udGVudHMsXG4gICAgICB1aUNvbXBvbmVudHMsXG4gICAgfTtcbiAgfVxuXG4gIGdldERpZmZTdGF0ZSgpOiBEaWZmVmlld1N0YXRlIHtcbiAgICBpZiAoIXRoaXMuX2RpZmZTdGF0ZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBkaWZmIHN0YXRlIGlzIHNldCEnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2RpZmZTdGF0ZTtcbiAgfVxuXG4gIGdldFVSSSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl91cmk7XG4gIH1cblxuICBjb21wdXRlRGlmZihvbGRUZXh0OiBzdHJpbmcsIG5ld1RleHQ6IHN0cmluZyk6IFRleHREaWZmIHtcbiAgICB2YXIge2FkZGVkTGluZXMsIHJlbW92ZWRMaW5lcywgY2h1bmtzfSA9IHRoaXMuX2NvbXB1dGVEaWZmQ2h1bmtzKG9sZFRleHQsIG5ld1RleHQpO1xuICAgIHZhciB7b2xkTGluZU9mZnNldHMsIG5ld0xpbmVPZmZzZXRzfSA9IHRoaXMuX2NvbXB1dGVPZmZzZXRzKGNodW5rcyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWRkZWRMaW5lcyxcbiAgICAgIHJlbW92ZWRMaW5lcyxcbiAgICAgIG9sZExpbmVPZmZzZXRzLFxuICAgICAgbmV3TGluZU9mZnNldHMsXG4gICAgfTtcbiAgfVxuXG4gIF9jb21wdXRlRGlmZkNodW5rcyhvbGRUZXh0OiBzdHJpbmcsIG5ld1RleHQ6IHN0cmluZylcbiAgICAgIDp7YWRkZWRMaW5lczogQXJyYXk8bnVtYmVyPjsgcmVtb3ZlZExpbmVzOiBBcnJheTxudW1iZXI+OyBjaHVua3M6IEFycmF5PGFueT47fSB7XG5cbiAgICB2YXIgSnNEaWZmID0gcmVxdWlyZSgnZGlmZicpO1xuXG4gICAgLy8gSWYgdGhlIGxhc3QgbGluZSBoYXMgY2hhbmdlcywgSnNEaWZmIGRvZXNuJ3QgcmV0dXJuIHRoYXQuXG4gICAgLy8gR2VuZXJhbGx5LCBjb250ZW50IHdpdGggbmV3IGxpbmUgZW5kaW5nIGFyZSBlYXNpZXIgdG8gY2FsY3VsYXRlIG9mZnNldHMgZm9yLlxuICAgIGlmIChvbGRUZXh0W29sZFRleHQubGVuZ3RoIC0gMV0gIT09ICdcXG4nIHx8IG5ld1RleHRbbmV3VGV4dC5sZW5ndGggLSAxXSAhPT0gJ1xcbicpIHtcbiAgICAgIG9sZFRleHQgKz0gJ1xcbic7XG4gICAgICBuZXdUZXh0ICs9ICdcXG4nO1xuICAgIH1cblxuICAgIHZhciBsaW5lRGlmZiA9IEpzRGlmZi5kaWZmTGluZXMob2xkVGV4dCwgbmV3VGV4dCk7XG4gICAgdmFyIGNodW5rcyA9IFtdO1xuXG4gICAgdmFyIGFkZGVkQ291bnQgPSAwO1xuICAgIHZhciByZW1vdmVkQ291bnQgPSAwO1xuICAgIHZhciBuZXh0T2Zmc2V0ID0gMDtcbiAgICB2YXIgb2Zmc2V0ID0gMDtcblxuICAgIHZhciBhZGRlZExpbmVzID0gW107XG4gICAgdmFyIHJlbW92ZWRMaW5lcyA9IFtdO1xuXG4gICAgbGluZURpZmYuZm9yRWFjaChwYXJ0ID0+IHtcbiAgICAgIHZhciB7YWRkZWQsIHJlbW92ZWQsIHZhbHVlfSA9IHBhcnQ7XG4gICAgICB2YXIgY291bnQgPSB2YWx1ZS5zcGxpdCgnXFxuJykubGVuZ3RoIC0gMTtcbiAgICAgIGlmICghYWRkZWQgJiYgIXJlbW92ZWQpIHtcbiAgICAgICAgYWRkZWRDb3VudCArPSBjb3VudDtcbiAgICAgICAgcmVtb3ZlZENvdW50ICs9IGNvdW50O1xuICAgICAgICBvZmZzZXQgPSBuZXh0T2Zmc2V0O1xuICAgICAgICBuZXh0T2Zmc2V0ID0gMDtcbiAgICAgIH0gZWxzZSBpZiAoYWRkZWQpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgYWRkZWRMaW5lcy5wdXNoKGFkZGVkQ291bnQgKyBpKTtcbiAgICAgICAgfVxuICAgICAgICBhZGRlZENvdW50ICs9IGNvdW50O1xuICAgICAgICBuZXh0T2Zmc2V0ICs9IGNvdW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgcmVtb3ZlZExpbmVzLnB1c2gocmVtb3ZlZENvdW50ICsgaSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVtb3ZlZENvdW50ICs9IGNvdW50O1xuICAgICAgICBuZXh0T2Zmc2V0IC09IGNvdW50O1xuICAgICAgfVxuICAgICAgY2h1bmtzLnB1c2goe2FkZGVkLCByZW1vdmVkLCB2YWx1ZSwgY291bnQsIG9mZnNldH0pO1xuICAgICAgb2Zmc2V0ID0gMDtcbiAgICB9KTtcbiAgICByZXR1cm4ge2FkZGVkTGluZXMsIHJlbW92ZWRMaW5lcywgY2h1bmtzfTtcbiAgfVxuXG4gIF9jb21wdXRlT2Zmc2V0cyhkaWZmQ2h1bmtzOiBBcnJheTxhbnk+KToge29sZExpbmVPZmZzZXRzOiBhbnk7IG5ld0xpbmVPZmZzZXRzOiBhbnk7fSB7XG4gICAgdmFyIG5ld0xpbmVPZmZzZXRzID0ge307XG4gICAgdmFyIG9sZExpbmVPZmZzZXRzID0ge307XG5cbiAgICB2YXIgb2xkTGluZUNvdW50ID0gMDtcbiAgICB2YXIgbmV3TGluZUNvdW50ID0gMDtcblxuICAgIGZvciAodmFyIGNodW5rIG9mIGRpZmZDaHVua3MpIHtcbiAgICAgIHZhciB7YWRkZWQsIHJlbW92ZWQsIG9mZnNldCwgY291bnR9ID0gY2h1bms7XG4gICAgICBpZiAoYWRkZWQpIHtcbiAgICAgICAgbmV3TGluZUNvdW50ICs9IGNvdW50O1xuICAgICAgfSBlbHNlIGlmIChyZW1vdmVkKSB7XG4gICAgICAgIG9sZExpbmVDb3VudCArPSBjb3VudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChvZmZzZXQgPCAwKSB7XG4gICAgICAgICAgbmV3TGluZU9mZnNldHNbbmV3TGluZUNvdW50XSA9IG9mZnNldCAqIC0xO1xuICAgICAgICB9IGVsc2UgaWYgKG9mZnNldCA+IDApIHtcbiAgICAgICAgICBvbGRMaW5lT2Zmc2V0c1tvbGRMaW5lQ291bnRdID0gb2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIG5ld0xpbmVDb3VudCArPSBjb3VudDtcbiAgICAgICAgb2xkTGluZUNvdW50ICs9IGNvdW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBvbGRMaW5lT2Zmc2V0cyxcbiAgICAgIG5ld0xpbmVPZmZzZXRzLFxuICAgIH07XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRGlmZlZpZXdNb2RlbDtcbiJdfQ==
