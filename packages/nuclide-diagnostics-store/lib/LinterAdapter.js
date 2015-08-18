Object.defineProperty(exports, '__esModule', {
  value: true
});

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

'use babel';

var _require = require('atom');

var Emitter = _require.Emitter;
var Disposable = _require.Disposable;
var CompositeDisposable = _require.CompositeDisposable;

var _require2 = require('./TextEventDispatcher');

var TextEventDispatcher = _require2.TextEventDispatcher;

function linterMessageToDiagnosticMessage(msg, providerName) {
  if (msg.filePath) {
    return {
      scope: 'file',
      providerName: providerName,
      type: msg.type,
      filePath: msg.filePath,
      text: msg.text,
      html: msg.html,
      range: msg.range,
      trace: msg.trace
    };
  } else {
    return {
      scope: 'project',
      providerName: providerName,
      type: msg.type,
      text: msg.text,
      html: msg.html,
      range: msg.range,
      trace: msg.trace
    };
  }
}

function linterMessagesToDiagnosticUpdate(currentPath, msgs) {
  var providerName = arguments.length <= 2 || arguments[2] === undefined ? 'Unnamed Linter' : arguments[2];

  var filePathToMessages = new Map();
  if (currentPath) {
    // Make sure we invalidate the messages for the current path. We may want to
    // figure out which other paths we want to invalidate if it turns out that
    // linters regularly return messages for other files.
    filePathToMessages.set(currentPath, []);
  }
  var projectMessages = [];
  for (var msg of msgs) {
    var diagnosticMessage = linterMessageToDiagnosticMessage(msg, providerName);
    if (diagnosticMessage.scope === 'file') {
      var path = diagnosticMessage.filePath;
      if (!filePathToMessages.has(path)) {
        filePathToMessages.set(path, []);
      }
      filePathToMessages.get(path).push(diagnosticMessage);
    } else {
      // project scope
      projectMessages.push(diagnosticMessage);
    }
  }
  return {
    filePathToMessages: filePathToMessages,
    projectMessages: projectMessages
  };
}

var textEventDispatcher;

function getTextEventDispatcher() {
  if (!textEventDispatcher) {
    textEventDispatcher = new TextEventDispatcher();
  }
  return textEventDispatcher;
}

/**
 * Provides an adapter between legacy linters (defined by the LinterProvider
 * type), and Nuclide Diagnostic Providers.
 *
 * The constructor takes a LinterProvider as an argument, and the resulting
 * LinterAdapter is a valid DiagnosticProvider.
 *
 * Note that this allows an extension to ordinary LinterProviders. We allow an
 * optional additional field, providerName, to indicate the display name of the
 * linter.
 */

var LinterAdapter = (function () {
  function LinterAdapter(provider) {
    _classCallCheck(this, LinterAdapter);

    this._provider = provider;
    this._enabled = true;
    this._disposables = new CompositeDisposable();
    this._emitter = new Emitter();
    this._lastDispatchedLint = 0;
    this._lastFinishedLint = 0;

    this._subscribeToEvent(provider.lintOnFly);
  }

  // Subscribes to the appropriate event depending on whether we should lint on
  // the fly or not.

  _createClass(LinterAdapter, [{
    key: '_subscribeToEvent',
    value: function _subscribeToEvent(lintOnFly) {
      var _this = this;

      if (this._currentEventSubscription) {
        this._currentEventSubscription.dispose();
        this._currentEventSubscription = null;
      }
      var runLint = function runLint(editor) {
        return _this._runLint(editor);
      };
      var dispatcher = getTextEventDispatcher();
      var subscription;
      if (lintOnFly) {
        if (this._provider.allGrammarScopes) {
          subscription = dispatcher.onAnyFileChange(runLint);
        } else {
          subscription = dispatcher.onFileChange(this._provider.grammarScopes, runLint);
        }
      } else {
        if (this._provider.allGrammarScopes) {
          subscription = dispatcher.onAnyFileSave(runLint);
        } else {
          subscription = dispatcher.onFileSave(this._provider.grammarScopes, runLint);
        }
      }
      this._currentEventSubscription = subscription;
      this._disposables.add(subscription);
    }
  }, {
    key: '_runLint',
    value: _asyncToGenerator(function* (editor) {
      if (this._enabled) {
        var thisLint = this._lastDispatchedLint + 1;
        this._lastDispatchedLint = thisLint;
        var linterMessages = yield this._provider.lint(editor);
        if (this._lastFinishedLint < thisLint) {
          var diagnosticUpdate = linterMessagesToDiagnosticUpdate(editor.getPath(), linterMessages, this._provider.providerName);
          this._emitter.emit('update', diagnosticUpdate);
          this._lastFinishedLint = thisLint;
        }
      }
    })
  }, {
    key: 'onMessageUpdate',
    value: function onMessageUpdate(callback) {
      var disposable = this._emitter.on('update', callback);
      var activeTextEditor = atom.workspace.getActiveTextEditor();
      if (activeTextEditor) {
        var matchesGrammar = this._provider.grammarScopes.indexOf(activeTextEditor.getGrammar().scopeName) !== -1;
        if (!this._lintInProgress() && matchesGrammar) {
          this._runLint(activeTextEditor);
        }
      }
      return disposable;
    }
  }, {
    key: 'onMessageInvalidation',
    value: function onMessageInvalidation(callback) {
      // no-op; we don't publish invalidations
      return new Disposable(function () {});
    }
  }, {
    key: 'setEnabled',
    value: function setEnabled(enabled) {
      this._enabled = enabled;
    }
  }, {
    key: 'setLintOnFly',
    value: function setLintOnFly(lintOnFly) {
      this._subscribeToEvent(lintOnFly && this._provider.lintOnFly);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._emitter.dispose();
      this._disposables.dispose();
    }
  }, {
    key: '_lintInProgress',
    value: function _lintInProgress() {
      return this._lastDispatchedLint > this._lastFinishedLint;
    }
  }]);

  return LinterAdapter;
})();

module.exports = LinterAdapter;

// providerName is an extension to the current linter api

// extension to the linter API. overrides grammarScopes if true, to trigger the linter on all grammar scopes
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWRpYWdub3N0aWNzLXN0b3JlL2xpYi9MaW50ZXJBZGFwdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFdBQVcsQ0FBQzs7ZUF5Q3FDLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQTNELE9BQU8sWUFBUCxPQUFPO0lBQUUsVUFBVSxZQUFWLFVBQVU7SUFBRSxtQkFBbUIsWUFBbkIsbUJBQW1COztnQkFFakIsT0FBTyxDQUFDLHVCQUF1QixDQUFDOztJQUF2RCxtQkFBbUIsYUFBbkIsbUJBQW1COztBQUV4QixTQUFTLGdDQUFnQyxDQUFDLEdBQWtCLEVBQUUsWUFBb0IsRUFBcUI7QUFDckcsTUFBSSxHQUFHLENBQUMsUUFBUSxFQUFFO0FBQ2hCLFdBQU87QUFDTCxXQUFLLEVBQUUsTUFBTTtBQUNiLGtCQUFZLEVBQVosWUFBWTtBQUNaLFVBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtBQUNkLGNBQVEsRUFBRSxHQUFHLENBQUMsUUFBUTtBQUN0QixVQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7QUFDZCxVQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7QUFDZCxXQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUs7QUFDaEIsV0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO0tBQ2pCLENBQUM7R0FDSCxNQUFNO0FBQ0wsV0FBTztBQUNMLFdBQUssRUFBRSxTQUFTO0FBQ2hCLGtCQUFZLEVBQVosWUFBWTtBQUNaLFVBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtBQUNkLFVBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtBQUNkLFVBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtBQUNkLFdBQUssRUFBRSxHQUFHLENBQUMsS0FBSztBQUNoQixXQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUs7S0FDakIsQ0FBQztHQUNIO0NBQ0Y7O0FBRUQsU0FBUyxnQ0FBZ0MsQ0FBQyxXQUF3QixFQUFFLElBQTBCLEVBQXNFO01BQXBFLFlBQXFCLHlEQUFHLGdCQUFnQjs7QUFDdEksTUFBSSxrQkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ25DLE1BQUksV0FBVyxFQUFFOzs7O0FBSWYsc0JBQWtCLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztHQUN6QztBQUNELE1BQUksZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUN6QixPQUFLLElBQUksR0FBRyxJQUFJLElBQUksRUFBRTtBQUNwQixRQUFJLGlCQUFpQixHQUFHLGdDQUFnQyxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUM1RSxRQUFJLGlCQUFpQixDQUFDLEtBQUssS0FBSyxNQUFNLEVBQUU7QUFDdEMsVUFBSSxJQUFJLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDO0FBQ3RDLFVBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDakMsMEJBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztPQUNsQztBQUNELHdCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUN0RCxNQUFNOztBQUNMLHFCQUFlLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDekM7R0FDRjtBQUNELFNBQU87QUFDTCxzQkFBa0IsRUFBbEIsa0JBQWtCO0FBQ2xCLG1CQUFlLEVBQWYsZUFBZTtHQUNoQixDQUFDO0NBQ0g7O0FBRUQsSUFBSSxtQkFBbUIsQ0FBQzs7QUFFeEIsU0FBUyxzQkFBc0IsR0FBd0I7QUFDckQsTUFBSSxDQUFDLG1CQUFtQixFQUFFO0FBQ3hCLHVCQUFtQixHQUFHLElBQUksbUJBQW1CLEVBQUUsQ0FBQztHQUNqRDtBQUNELFNBQU8sbUJBQW1CLENBQUM7Q0FDNUI7Ozs7Ozs7Ozs7Ozs7O0lBYUssYUFBYTtBQWNOLFdBZFAsYUFBYSxDQWNMLFFBQXdCLEVBQUU7MEJBZGxDLGFBQWE7O0FBZWYsUUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7QUFDMUIsUUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDckIsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLG1CQUFtQixFQUFFLENBQUM7QUFDOUMsUUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzlCLFFBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUM7QUFDN0IsUUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQzs7QUFFM0IsUUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztHQUU1Qzs7Ozs7ZUF4QkcsYUFBYTs7V0E0QkEsMkJBQUMsU0FBa0IsRUFBRTs7O0FBQ3BDLFVBQUksSUFBSSxDQUFDLHlCQUF5QixFQUFFO0FBQ2xDLFlBQUksQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN6QyxZQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDO09BQ3ZDO0FBQ0QsVUFBSSxPQUFPLEdBQUcsU0FBVixPQUFPLENBQUcsTUFBTTtlQUFJLE1BQUssUUFBUSxDQUFDLE1BQU0sQ0FBQztPQUFBLENBQUM7QUFDOUMsVUFBSSxVQUFVLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztBQUMxQyxVQUFJLFlBQVksQ0FBQztBQUNqQixVQUFJLFNBQVMsRUFBRTtBQUNiLFlBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRTtBQUNuQyxzQkFBWSxHQUFHLFVBQVUsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDcEQsTUFBTTtBQUNMLHNCQUFZLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUMvRTtPQUNGLE1BQU07QUFDTCxZQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUU7QUFDbkMsc0JBQVksR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2xELE1BQU07QUFDTCxzQkFBWSxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDN0U7T0FDRjtBQUNELFVBQUksQ0FBQyx5QkFBeUIsR0FBRyxZQUFZLENBQUM7QUFDOUMsVUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDckM7Ozs2QkFFYSxXQUFDLE1BQWtCLEVBQWlCO0FBQ2hELFVBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUNqQixZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLFlBQUksQ0FBQyxtQkFBbUIsR0FBRyxRQUFRLENBQUM7QUFDcEMsWUFBSSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN2RCxZQUFJLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxRQUFRLEVBQUU7QUFDckMsY0FBSSxnQkFBZ0IsR0FBRyxnQ0FBZ0MsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDdkgsY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDL0MsY0FBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQztTQUNuQztPQUNGO0tBQ0Y7OztXQUVjLHlCQUFDLFFBQStCLEVBQW1CO0FBQ2hFLFVBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN0RCxVQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztBQUM1RCxVQUFJLGdCQUFnQixFQUFFO0FBQ3BCLFlBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMxRyxZQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLGNBQWMsRUFBRTtBQUM3QyxjQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDakM7T0FDRjtBQUNELGFBQU8sVUFBVSxDQUFDO0tBQ25COzs7V0FFb0IsK0JBQUMsUUFBcUMsRUFBbUI7O0FBRTVFLGFBQU8sSUFBSSxVQUFVLENBQUMsWUFBTSxFQUFFLENBQUMsQ0FBQztLQUNqQzs7O1dBRVMsb0JBQUMsT0FBZ0IsRUFBUTtBQUNqQyxVQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztLQUN6Qjs7O1dBRVcsc0JBQUMsU0FBa0IsRUFBUTtBQUNyQyxVQUFJLENBQUMsaUJBQWlCLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDL0Q7OztXQUVNLG1CQUFTO0FBQ2QsVUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN4QixVQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQzdCOzs7V0FFYywyQkFBWTtBQUN6QixhQUFPLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUM7S0FDMUQ7OztTQWxHRyxhQUFhOzs7QUFxR25CLE1BQU0sQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWRpYWdub3N0aWNzLXN0b3JlL2xpYi9MaW50ZXJBZGFwdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge051Y2xpZGVVcml9IGZyb20gJ251Y2xpZGUtcmVtb3RlLXVyaSc7XG5cbnR5cGUgTGludGVyVHJhY2UgPSB7XG4gIHR5cGU6ICdUcmFjZSc7XG4gIHRleHQ/OiBzdHJpbmc7XG4gIGh0bWw/OiBzdHJpbmc7XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIHJhbmdlPzogYXRvbSRSYW5nZTtcbn07XG5cbnR5cGUgTGludGVyTWVzc2FnZSA9IHtcbiAgdHlwZTogJ0Vycm9yJyB8ICdXYXJuaW5nJyxcbiAgdGV4dD86IHN0cmluZyxcbiAgaHRtbD86IHN0cmluZyxcbiAgZmlsZVBhdGg/OiBOdWNsaWRlVXJpLFxuICByYW5nZT86IGF0b20kUmFuZ2UsXG4gIHRyYWNlPzogQXJyYXk8TGludGVyVHJhY2U+LFxufTtcblxuZXhwb3J0IHR5cGUgTGludGVyUHJvdmlkZXIgPSB7XG4gIC8vIHByb3ZpZGVyTmFtZSBpcyBhbiBleHRlbnNpb24gdG8gdGhlIGN1cnJlbnQgbGludGVyIGFwaVxuICBwcm92aWRlck5hbWU/OiBzdHJpbmc7XG4gIGdyYW1tYXJTY29wZXM6IEFycmF5PHN0cmluZz47XG4gIC8vIGV4dGVuc2lvbiB0byB0aGUgbGludGVyIEFQSS4gb3ZlcnJpZGVzIGdyYW1tYXJTY29wZXMgaWYgdHJ1ZSwgdG8gdHJpZ2dlciB0aGUgbGludGVyIG9uIGFsbCBncmFtbWFyIHNjb3Blc1xuICBhbGxHcmFtbWFyU2NvcGVzPzogYm9vbGVhbjtcbiAgc2NvcGU6ICdmaWxlJyB8ICdwcm9qZWN0JztcbiAgbGludE9uRmx5OiBib29sO1xuICBsaW50OiAodGV4dEVkaXRvcjogVGV4dEVkaXRvcikgPT4gUHJvbWlzZTxBcnJheTxMaW50ZXJNZXNzYWdlPj47XG59O1xuXG52YXIge0VtaXR0ZXIsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xuXG52YXIge1RleHRFdmVudERpc3BhdGNoZXJ9ID0gcmVxdWlyZSgnLi9UZXh0RXZlbnREaXNwYXRjaGVyJyk7XG5cbmZ1bmN0aW9uIGxpbnRlck1lc3NhZ2VUb0RpYWdub3N0aWNNZXNzYWdlKG1zZzogTGludGVyTWVzc2FnZSwgcHJvdmlkZXJOYW1lOiBzdHJpbmcpOiBEaWFnbm9zdGljTWVzc2FnZSB7XG4gIGlmIChtc2cuZmlsZVBhdGgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2NvcGU6ICdmaWxlJyxcbiAgICAgIHByb3ZpZGVyTmFtZSxcbiAgICAgIHR5cGU6IG1zZy50eXBlLFxuICAgICAgZmlsZVBhdGg6IG1zZy5maWxlUGF0aCxcbiAgICAgIHRleHQ6IG1zZy50ZXh0LFxuICAgICAgaHRtbDogbXNnLmh0bWwsXG4gICAgICByYW5nZTogbXNnLnJhbmdlLFxuICAgICAgdHJhY2U6IG1zZy50cmFjZSxcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB7XG4gICAgICBzY29wZTogJ3Byb2plY3QnLFxuICAgICAgcHJvdmlkZXJOYW1lLFxuICAgICAgdHlwZTogbXNnLnR5cGUsXG4gICAgICB0ZXh0OiBtc2cudGV4dCxcbiAgICAgIGh0bWw6IG1zZy5odG1sLFxuICAgICAgcmFuZ2U6IG1zZy5yYW5nZSxcbiAgICAgIHRyYWNlOiBtc2cudHJhY2UsXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBsaW50ZXJNZXNzYWdlc1RvRGlhZ25vc3RpY1VwZGF0ZShjdXJyZW50UGF0aDogP051Y2xpZGVVcmksIG1zZ3M6IEFycmF5PExpbnRlck1lc3NhZ2U+LCBwcm92aWRlck5hbWU/OiBzdHJpbmcgPSAnVW5uYW1lZCBMaW50ZXInKTogRGlhZ25vc3RpY1Byb3ZpZGVyVXBkYXRlIHtcbiAgdmFyIGZpbGVQYXRoVG9NZXNzYWdlcyA9IG5ldyBNYXAoKTtcbiAgaWYgKGN1cnJlbnRQYXRoKSB7XG4gICAgLy8gTWFrZSBzdXJlIHdlIGludmFsaWRhdGUgdGhlIG1lc3NhZ2VzIGZvciB0aGUgY3VycmVudCBwYXRoLiBXZSBtYXkgd2FudCB0b1xuICAgIC8vIGZpZ3VyZSBvdXQgd2hpY2ggb3RoZXIgcGF0aHMgd2Ugd2FudCB0byBpbnZhbGlkYXRlIGlmIGl0IHR1cm5zIG91dCB0aGF0XG4gICAgLy8gbGludGVycyByZWd1bGFybHkgcmV0dXJuIG1lc3NhZ2VzIGZvciBvdGhlciBmaWxlcy5cbiAgICBmaWxlUGF0aFRvTWVzc2FnZXMuc2V0KGN1cnJlbnRQYXRoLCBbXSk7XG4gIH1cbiAgdmFyIHByb2plY3RNZXNzYWdlcyA9IFtdO1xuICBmb3IgKHZhciBtc2cgb2YgbXNncykge1xuICAgIHZhciBkaWFnbm9zdGljTWVzc2FnZSA9IGxpbnRlck1lc3NhZ2VUb0RpYWdub3N0aWNNZXNzYWdlKG1zZywgcHJvdmlkZXJOYW1lKTtcbiAgICBpZiAoZGlhZ25vc3RpY01lc3NhZ2Uuc2NvcGUgPT09ICdmaWxlJykge1xuICAgICAgdmFyIHBhdGggPSBkaWFnbm9zdGljTWVzc2FnZS5maWxlUGF0aDtcbiAgICAgIGlmICghZmlsZVBhdGhUb01lc3NhZ2VzLmhhcyhwYXRoKSkge1xuICAgICAgICBmaWxlUGF0aFRvTWVzc2FnZXMuc2V0KHBhdGgsIFtdKTtcbiAgICAgIH1cbiAgICAgIGZpbGVQYXRoVG9NZXNzYWdlcy5nZXQocGF0aCkucHVzaChkaWFnbm9zdGljTWVzc2FnZSk7XG4gICAgfSBlbHNlIHsgLy8gcHJvamVjdCBzY29wZVxuICAgICAgcHJvamVjdE1lc3NhZ2VzLnB1c2goZGlhZ25vc3RpY01lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge1xuICAgIGZpbGVQYXRoVG9NZXNzYWdlcyxcbiAgICBwcm9qZWN0TWVzc2FnZXMsXG4gIH07XG59XG5cbnZhciB0ZXh0RXZlbnREaXNwYXRjaGVyO1xuXG5mdW5jdGlvbiBnZXRUZXh0RXZlbnREaXNwYXRjaGVyKCk6IFRleHRFdmVudERpc3BhdGNoZXIge1xuICBpZiAoIXRleHRFdmVudERpc3BhdGNoZXIpIHtcbiAgICB0ZXh0RXZlbnREaXNwYXRjaGVyID0gbmV3IFRleHRFdmVudERpc3BhdGNoZXIoKTtcbiAgfVxuICByZXR1cm4gdGV4dEV2ZW50RGlzcGF0Y2hlcjtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhbiBhZGFwdGVyIGJldHdlZW4gbGVnYWN5IGxpbnRlcnMgKGRlZmluZWQgYnkgdGhlIExpbnRlclByb3ZpZGVyXG4gKiB0eXBlKSwgYW5kIE51Y2xpZGUgRGlhZ25vc3RpYyBQcm92aWRlcnMuXG4gKlxuICogVGhlIGNvbnN0cnVjdG9yIHRha2VzIGEgTGludGVyUHJvdmlkZXIgYXMgYW4gYXJndW1lbnQsIGFuZCB0aGUgcmVzdWx0aW5nXG4gKiBMaW50ZXJBZGFwdGVyIGlzIGEgdmFsaWQgRGlhZ25vc3RpY1Byb3ZpZGVyLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGFsbG93cyBhbiBleHRlbnNpb24gdG8gb3JkaW5hcnkgTGludGVyUHJvdmlkZXJzLiBXZSBhbGxvdyBhblxuICogb3B0aW9uYWwgYWRkaXRpb25hbCBmaWVsZCwgcHJvdmlkZXJOYW1lLCB0byBpbmRpY2F0ZSB0aGUgZGlzcGxheSBuYW1lIG9mIHRoZVxuICogbGludGVyLlxuICovXG5jbGFzcyBMaW50ZXJBZGFwdGVyIHtcbiAgX3Byb3ZpZGVyOiBMaW50ZXJQcm92aWRlcjtcblxuICBfZW1pdHRlcjogRW1pdHRlcjtcblxuICBfZGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgX2VuYWJsZWQ6IGJvb2xlYW47XG5cbiAgX2N1cnJlbnRFdmVudFN1YnNjcmlwdGlvbjogP2F0b20kRGlzcG9zYWJsZTtcblxuICBfbGFzdERpc3BhdGNoZWRMaW50OiBudW1iZXI7XG4gIF9sYXN0RmluaXNoZWRMaW50OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IocHJvdmlkZXI6IExpbnRlclByb3ZpZGVyKSB7XG4gICAgdGhpcy5fcHJvdmlkZXIgPSBwcm92aWRlcjtcbiAgICB0aGlzLl9lbmFibGVkID0gdHJ1ZTtcbiAgICB0aGlzLl9kaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgdGhpcy5fZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XG4gICAgdGhpcy5fbGFzdERpc3BhdGNoZWRMaW50ID0gMDtcbiAgICB0aGlzLl9sYXN0RmluaXNoZWRMaW50ID0gMDtcblxuICAgIHRoaXMuX3N1YnNjcmliZVRvRXZlbnQocHJvdmlkZXIubGludE9uRmx5KTtcblxuICB9XG5cbiAgLy8gU3Vic2NyaWJlcyB0byB0aGUgYXBwcm9wcmlhdGUgZXZlbnQgZGVwZW5kaW5nIG9uIHdoZXRoZXIgd2Ugc2hvdWxkIGxpbnQgb25cbiAgLy8gdGhlIGZseSBvciBub3QuXG4gIF9zdWJzY3JpYmVUb0V2ZW50KGxpbnRPbkZseTogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLl9jdXJyZW50RXZlbnRTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX2N1cnJlbnRFdmVudFN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICB0aGlzLl9jdXJyZW50RXZlbnRTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cbiAgICB2YXIgcnVuTGludCA9IGVkaXRvciA9PiB0aGlzLl9ydW5MaW50KGVkaXRvcik7XG4gICAgdmFyIGRpc3BhdGNoZXIgPSBnZXRUZXh0RXZlbnREaXNwYXRjaGVyKCk7XG4gICAgdmFyIHN1YnNjcmlwdGlvbjtcbiAgICBpZiAobGludE9uRmx5KSB7XG4gICAgICBpZiAodGhpcy5fcHJvdmlkZXIuYWxsR3JhbW1hclNjb3Blcykge1xuICAgICAgICBzdWJzY3JpcHRpb24gPSBkaXNwYXRjaGVyLm9uQW55RmlsZUNoYW5nZShydW5MaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN1YnNjcmlwdGlvbiA9IGRpc3BhdGNoZXIub25GaWxlQ2hhbmdlKHRoaXMuX3Byb3ZpZGVyLmdyYW1tYXJTY29wZXMsIHJ1bkxpbnQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5fcHJvdmlkZXIuYWxsR3JhbW1hclNjb3Blcykge1xuICAgICAgICBzdWJzY3JpcHRpb24gPSBkaXNwYXRjaGVyLm9uQW55RmlsZVNhdmUocnVuTGludCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdWJzY3JpcHRpb24gPSBkaXNwYXRjaGVyLm9uRmlsZVNhdmUodGhpcy5fcHJvdmlkZXIuZ3JhbW1hclNjb3BlcywgcnVuTGludCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX2N1cnJlbnRFdmVudFN1YnNjcmlwdGlvbiA9IHN1YnNjcmlwdGlvbjtcbiAgICB0aGlzLl9kaXNwb3NhYmxlcy5hZGQoc3Vic2NyaXB0aW9uKTtcbiAgfVxuXG4gIGFzeW5jIF9ydW5MaW50KGVkaXRvcjogVGV4dEVkaXRvcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9lbmFibGVkKSB7XG4gICAgICB2YXIgdGhpc0xpbnQgPSB0aGlzLl9sYXN0RGlzcGF0Y2hlZExpbnQgKyAxO1xuICAgICAgdGhpcy5fbGFzdERpc3BhdGNoZWRMaW50ID0gdGhpc0xpbnQ7XG4gICAgICB2YXIgbGludGVyTWVzc2FnZXMgPSBhd2FpdCB0aGlzLl9wcm92aWRlci5saW50KGVkaXRvcik7XG4gICAgICBpZiAodGhpcy5fbGFzdEZpbmlzaGVkTGludCA8IHRoaXNMaW50KSB7XG4gICAgICAgIHZhciBkaWFnbm9zdGljVXBkYXRlID0gbGludGVyTWVzc2FnZXNUb0RpYWdub3N0aWNVcGRhdGUoZWRpdG9yLmdldFBhdGgoKSwgbGludGVyTWVzc2FnZXMsIHRoaXMuX3Byb3ZpZGVyLnByb3ZpZGVyTmFtZSk7XG4gICAgICAgIHRoaXMuX2VtaXR0ZXIuZW1pdCgndXBkYXRlJywgZGlhZ25vc3RpY1VwZGF0ZSk7XG4gICAgICAgIHRoaXMuX2xhc3RGaW5pc2hlZExpbnQgPSB0aGlzTGludDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvbk1lc3NhZ2VVcGRhdGUoY2FsbGJhY2s6IE1lc3NhZ2VVcGRhdGVDYWxsYmFjayk6IGF0b20kRGlzcG9zYWJsZSB7XG4gICAgdmFyIGRpc3Bvc2FibGUgPSB0aGlzLl9lbWl0dGVyLm9uKCd1cGRhdGUnLCBjYWxsYmFjayk7XG4gICAgdmFyIGFjdGl2ZVRleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgaWYgKGFjdGl2ZVRleHRFZGl0b3IpIHtcbiAgICAgIHZhciBtYXRjaGVzR3JhbW1hciA9IHRoaXMuX3Byb3ZpZGVyLmdyYW1tYXJTY29wZXMuaW5kZXhPZihhY3RpdmVUZXh0RWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUpICE9PSAtMTtcbiAgICAgIGlmICghdGhpcy5fbGludEluUHJvZ3Jlc3MoKSAmJiBtYXRjaGVzR3JhbW1hcikge1xuICAgICAgICB0aGlzLl9ydW5MaW50KGFjdGl2ZVRleHRFZGl0b3IpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlzcG9zYWJsZTtcbiAgfVxuXG4gIG9uTWVzc2FnZUludmFsaWRhdGlvbihjYWxsYmFjazogTWVzc2FnZUludmFsaWRhdGlvbkNhbGxiYWNrKTogYXRvbSREaXNwb3NhYmxlIHtcbiAgICAvLyBuby1vcDsgd2UgZG9uJ3QgcHVibGlzaCBpbnZhbGlkYXRpb25zXG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHt9KTtcbiAgfVxuXG4gIHNldEVuYWJsZWQoZW5hYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuX2VuYWJsZWQgPSBlbmFibGVkO1xuICB9XG5cbiAgc2V0TGludE9uRmx5KGxpbnRPbkZseTogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuX3N1YnNjcmliZVRvRXZlbnQobGludE9uRmx5ICYmIHRoaXMuX3Byb3ZpZGVyLmxpbnRPbkZseSk7XG4gIH1cblxuICBkaXNwb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuX2VtaXR0ZXIuZGlzcG9zZSgpO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIF9saW50SW5Qcm9ncmVzcygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fbGFzdERpc3BhdGNoZWRMaW50ID4gdGhpcy5fbGFzdEZpbmlzaGVkTGludDtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpbnRlckFkYXB0ZXI7XG4iXX0=
