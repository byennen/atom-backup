
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var invariant = require('assert');

var _require = require('atom');

var Disposable = _require.Disposable;
var CompositeDisposable = _require.CompositeDisposable;

var _require2 = require('nuclide-commons');

var debounce = _require2.debounce;

// A reload changes the text in the buffer, so it should trigger a refresh.
var FILE_CHANGE_EVENTS = ['did-change', 'did-reload'];

// A reload basically indicates that an external program saved the file, so
// it should trigger a refresh.
var FILE_SAVE_EVENTS = ['did-save', 'did-reload'];

/**
 * Stores callbacks keyed on grammar and event, to allow for easy retrieval when
 * we need to dispatch to all callbacks registered for a given (grammar, event)
 * pair.
 */

var TextCallbackContainer = (function () {
  function TextCallbackContainer() {
    _classCallCheck(this, TextCallbackContainer);

    this._callbacks = new Map();
    this._allGrammarCallbacks = new Map();
  }

  // TODO(7806872) make this available to all DiagnosticProviders, but think
  // carefully about the API and where this should live before doing so.
  /**
   * Meant to make it simple and easy for a DiagnosticProvider to subscribe to
   * relevant events. Currently provides two methods, onFileChange and onFileSave.
   * A DiagnosticProvider will typically subscribe to only one, depending on
   * whether it wants to be notified whenever a file changes or only when it is
   * saved.
   *
   * Both methods take two arguments:
   * - An Array of grammars for which the DiagnosticProvider can provide
   * diagnostics.
   * - The callback to be called on a text event.
   *
   * A TextEventDispatcher will be subscribed to text events if and only if it has
   * subscribers of its own. If all subscribers unsubscribe, it will unsubscribe
   * from Atom's text events.
   *
   */

  _createClass(TextCallbackContainer, [{
    key: 'getCallbacks',
    value: function getCallbacks(grammar, event) {
      var eventMap = this._callbacks.get(grammar);
      var callbacksForGrammar = this._getCallbacksFromEventMap(eventMap, event);
      var callbacksForAll = this._getCallbacksFromEventMap(this._allGrammarCallbacks, event);
      var resultSet = new Set();
      var add = function add(callback) {
        resultSet.add(callback);
      };
      callbacksForGrammar.forEach(add);
      callbacksForAll.forEach(add);
      return resultSet;
    }
  }, {
    key: 'isEmpty',
    value: function isEmpty() {
      return this._callbacks.size === 0 && this._allGrammarCallbacks.size === 0;
    }
  }, {
    key: '_getCallbacksFromEventMap',
    value: function _getCallbacksFromEventMap(eventMap, event) {
      if (!eventMap) {
        return new Set();
      }
      var callbackSet = eventMap.get(event);
      if (!callbackSet) {
        return new Set();
      }
      return callbackSet;
    }
  }, {
    key: 'addCallback',
    value: function addCallback(grammarScopes, events, callback) {
      if (grammarScopes === 'all') {
        this._addToEventMap(this._allGrammarCallbacks, events, callback);
      } else {
        for (var grammarScope of grammarScopes) {
          var eventMap = this._callbacks.get(grammarScope);
          if (!eventMap) {
            eventMap = new Map();
            this._callbacks.set(grammarScope, eventMap);
          }
          this._addToEventMap(eventMap, events, callback);
        }
      }
    }

    // remove the callbacks, maintaining the invariant that there should be no
    // empty maps or sets in this._callbacks
  }, {
    key: 'removeCallback',
    value: function removeCallback(grammarScopes, events, callback) {
      if (grammarScopes === 'all') {
        this._removeFromEventMap(this._allGrammarCallbacks, events, callback);
      } else {
        for (var grammarScope of grammarScopes) {
          var eventMap = this._callbacks.get(grammarScope);
          invariant(eventMap);
          this._removeFromEventMap(eventMap, events, callback);
          if (eventMap.size === 0) {
            this._callbacks['delete'](grammarScope);
          }
        }
      }
    }
  }, {
    key: '_addToEventMap',
    value: function _addToEventMap(eventMap, events, callback) {
      for (var event of events) {
        var callbackSet = eventMap.get(event);
        if (!callbackSet) {
          callbackSet = new Set();
          eventMap.set(event, callbackSet);
        }
        callbackSet.add(callback);
      }
    }
  }, {
    key: '_removeFromEventMap',
    value: function _removeFromEventMap(eventMap, events, callback) {
      for (var event of events) {
        var callbackSet = eventMap.get(event);
        invariant(callbackSet);
        callbackSet['delete'](callback);
        if (callbackSet.size === 0) {
          eventMap['delete'](event);
        }
      }
    }
  }]);

  return TextCallbackContainer;
})();

var TextEventDispatcher = (function () {
  function TextEventDispatcher() {
    _classCallCheck(this, TextEventDispatcher);

    this._callbackContainer = new TextCallbackContainer();
    this._editorListenerDisposable = null;
    this._pendingEvents = new WeakMap();
  }

  _createClass(TextEventDispatcher, [{
    key: '_onEvents',
    value: function _onEvents(grammarScopes, events, callback) {
      var _this = this;

      if (this._callbackContainer.isEmpty()) {
        this._registerEditorListeners();
      }
      // Sometimes these events get triggered several times in succession
      // (particularly on startup).
      var debouncedCallback = debounce(callback, 50, true);
      this._callbackContainer.addCallback(grammarScopes, events, debouncedCallback);
      var disposables = new Disposable(function () {
        _this._callbackContainer.removeCallback(grammarScopes, events, debouncedCallback);
        if (_this._callbackContainer.isEmpty()) {
          _this._deregisterEditorListeners();
        }
      });
      return disposables;
    }
  }, {
    key: 'onFileChange',
    value: function onFileChange(grammarScopes, callback) {
      return this._onEvents(grammarScopes, FILE_CHANGE_EVENTS, callback);
    }
  }, {
    key: 'onAnyFileChange',
    value: function onAnyFileChange(callback) {
      return this._onEvents('all', FILE_CHANGE_EVENTS, callback);
    }
  }, {
    key: 'onFileSave',
    value: function onFileSave(grammarScopes, callback) {
      return this._onEvents(grammarScopes, FILE_SAVE_EVENTS, callback);
    }
  }, {
    key: 'onAnyFileSave',
    value: function onAnyFileSave(callback) {
      return this._onEvents('all', FILE_SAVE_EVENTS, callback);
    }
  }, {
    key: '_registerEditorListeners',
    value: function _registerEditorListeners() {
      var _this2 = this;

      if (!this._editorListenerDisposable) {
        this._editorListenerDisposable = new CompositeDisposable();
      }

      // Whenever the active pane item changes, we check to see if there are any
      // pending events for the newly-focused TextEditor.
      this._getEditorListenerDisposable().add(atom.workspace.onDidChangeActivePaneItem(function () {
        var currentEditor = atom.workspace.getActiveTextEditor();
        if (currentEditor) {
          var pendingEvents = _this2._pendingEvents.get(currentEditor.getBuffer());
          if (pendingEvents) {
            for (var event of pendingEvents) {
              _this2._dispatchEvents(currentEditor, event);
            }
            _this2._pendingEvents['delete'](currentEditor.getBuffer());
          }
        }
      }));

      this._getEditorListenerDisposable().add(atom.workspace.observeTextEditors(function (editor) {
        var buffer = editor.getBuffer();
        var makeDispatch = function makeDispatch(event) {
          return function () {
            _this2._dispatchEvents(editor, event);
          };
        };
        _this2._getEditorListenerDisposable().add(buffer.onDidStopChanging(makeDispatch('did-change')));
        _this2._getEditorListenerDisposable().add(buffer.onDidSave(makeDispatch('did-save')));
        _this2._getEditorListenerDisposable().add(buffer.onDidReload(makeDispatch('did-reload')));
      }));
    }
  }, {
    key: '_deregisterEditorListeners',
    value: function _deregisterEditorListeners() {
      if (this._editorListenerDisposables) {
        this._getEditorListenerDisposable().dispose();
        this._editorListenerDisposable = null;
      }
    }
  }, {
    key: '_dispatchEvents',
    value: function _dispatchEvents(editor, event) {
      var currentEditor = atom.workspace.getActiveTextEditor();
      if (!currentEditor) {
        return;
      }
      if (editor === currentEditor) {
        var callbacks = this._callbackContainer.getCallbacks(editor.getGrammar().scopeName, event);
        for (var callback of callbacks) {
          callback(editor);
        }
        // We want to avoid storing pending events if this event was generated by
        // the same buffer as the current editor, to avoid duplicating events when
        // multiple panes have the same file open.
      } else if (editor.getBuffer() !== currentEditor.getBuffer()) {
          // Trigger this event next time we switch to an editor with this buffer.
          var buffer = editor.getBuffer();
          var events = this._pendingEvents.get(buffer);
          if (!events) {
            events = new Set();
            this._pendingEvents.set(buffer, events);
          }
          events.add(event);
        }
    }
  }, {
    key: '_getEditorListenerDisposable',
    value: function _getEditorListenerDisposable() {
      var disposable = this._editorListenerDisposable;
      invariant(disposable, 'TextEventDispatcher disposable is not initialized');
      return disposable;
    }
  }]);

  return TextEventDispatcher;
})();

module.exports = {
  TextEventDispatcher: TextEventDispatcher,
  __TEST__: {
    TextCallbackContainer: TextCallbackContainer
  }
};

// grammar -> event -> callback
// invariant: no empty maps or sets (they should be removed instead)

// event -> callback
// invariant: no keys mapping to empty sets (they should be removed instead)
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWRpYWdub3N0aWNzLXN0b3JlL2xpYi9UZXh0RXZlbnREaXNwYXRjaGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFXWixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7O2VBQ00sT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBbEQsVUFBVSxZQUFWLFVBQVU7SUFBRSxtQkFBbUIsWUFBbkIsbUJBQW1COztnQkFFbkIsT0FBTyxDQUFDLGlCQUFpQixDQUFDOztJQUF0QyxRQUFRLGFBQVIsUUFBUTs7O0FBT2IsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQzs7OztBQUl0RCxJQUFJLGdCQUFnQixHQUFHLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDOzs7Ozs7OztJQU81QyxxQkFBcUI7QUFTZCxXQVRQLHFCQUFxQixHQVNYOzBCQVRWLHFCQUFxQjs7QUFVdkIsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQzVCLFFBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0dBQ3ZDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBWkcscUJBQXFCOztXQWNiLHNCQUFDLE9BQWUsRUFBRSxLQUFZLEVBQW9DO0FBQzVFLFVBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzVDLFVBQUksbUJBQW1CLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMxRSxVQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFD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QUFDO0FBQzNFLGFBQU8sVUFBVSxDQUFDO0tBQ25COzs7U0FsSEcsbUJBQW1COzs7QUFxSHpCLE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixxQkFBbUIsRUFBbkIsbUJBQW1CO0FBQ25CLFVBQVEsRUFBRTtBQUNSLHlCQUFxQixFQUFyQixxQkFBcUI7R0FDdEI7Q0FDRixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWRpYWdub3N0aWNzLXN0b3JlL2xpYi9UZXh0RXZlbnREaXNwYXRjaGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIGludmFyaWFudCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xudmFyIHtEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKTtcblxudmFyIHtkZWJvdW5jZX0gPSByZXF1aXJlKCdudWNsaWRlLWNvbW1vbnMnKTtcblxudHlwZSBFdmVudENhbGxiYWNrID0gKGVkaXRvcjogVGV4dEVkaXRvcikgPT4gbWl4ZWQ7XG5cbnR5cGUgRXZlbnQgPSAnZGlkLXJlbG9hZCcgfCAnZGlkLWNoYW5nZScgfCAnZGlkLXNhdmUnO1xuXG4vLyBBIHJlbG9hZCBjaGFuZ2VzIHRoZSB0ZXh0IGluIHRoZSBidWZmZXIsIHNvIGl0IHNob3VsZCB0cmlnZ2VyIGEgcmVmcmVzaC5cbnZhciBGSUxFX0NIQU5HRV9FVkVOVFMgPSBbJ2RpZC1jaGFuZ2UnLCAnZGlkLXJlbG9hZCddO1xuXG4vLyBBIHJlbG9hZCBiYXNpY2FsbHkgaW5kaWNhdGVzIHRoYXQgYW4gZXh0ZXJuYWwgcHJvZ3JhbSBzYXZlZCB0aGUgZmlsZSwgc29cbi8vIGl0IHNob3VsZCB0cmlnZ2VyIGEgcmVmcmVzaC5cbnZhciBGSUxFX1NBVkVfRVZFTlRTID0gWydkaWQtc2F2ZScsICdkaWQtcmVsb2FkJ107XG5cbi8qKlxuICogU3RvcmVzIGNhbGxiYWNrcyBrZXllZCBvbiBncmFtbWFyIGFuZCBldmVudCwgdG8gYWxsb3cgZm9yIGVhc3kgcmV0cmlldmFsIHdoZW5cbiAqIHdlIG5lZWQgdG8gZGlzcGF0Y2ggdG8gYWxsIGNhbGxiYWNrcyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIChncmFtbWFyLCBldmVudClcbiAqIHBhaXIuXG4gKi9cbmNsYXNzIFRleHRDYWxsYmFja0NvbnRhaW5lcjxDYWxsYmFja0FyZz4ge1xuICAvLyBncmFtbWFyIC0+IGV2ZW50IC0+IGNhbGxiYWNrXG4gIC8vIGludmFyaWFudDogbm8gZW1wdHkgbWFwcyBvciBzZXRzICh0aGV5IHNob3VsZCBiZSByZW1vdmVkIGluc3RlYWQpXG4gIF9jYWxsYmFja3M6IE1hcDxzdHJpbmcsIE1hcDxFdmVudCwgU2V0PChhcmc6IENhbGxiYWNrQXJnKSA9PiBtaXhlZD4+PjtcblxuICAvLyBldmVudCAtPiBjYWxsYmFja1xuICAvLyBpbnZhcmlhbnQ6IG5vIGtleXMgbWFwcGluZyB0byBlbXB0eSBzZXRzICh0aGV5IHNob3VsZCBiZSByZW1vdmVkIGluc3RlYWQpXG4gIF9hbGxHcmFtbWFyQ2FsbGJhY2tzOiBNYXA8RXZlbnQsIFNldDwoYXJnOiBDYWxsYmFja0FyZykgPT4gbWl4ZWQ+PjtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9jYWxsYmFja3MgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5fYWxsR3JhbW1hckNhbGxiYWNrcyA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIGdldENhbGxiYWNrcyhncmFtbWFyOiBzdHJpbmcsIGV2ZW50OiBFdmVudCk6IFNldDwoYXJnOiBDYWxsYmFja0FyZykgPT4gbWl4ZWQ+IHtcbiAgICB2YXIgZXZlbnRNYXAgPSB0aGlzLl9jYWxsYmFja3MuZ2V0KGdyYW1tYXIpO1xuICAgIHZhciBjYWxsYmFja3NGb3JHcmFtbWFyID0gdGhpcy5fZ2V0Q2FsbGJhY2tzRnJvbUV2ZW50TWFwKGV2ZW50TWFwLCBldmVudCk7XG4gICAgdmFyIGNhbGxiYWNrc0ZvckFsbCA9IHRoaXMuX2dldENhbGxiYWNrc0Zyb21FdmVudE1hcCh0aGlzLl9hbGxHcmFtbWFyQ2FsbGJhY2tzLCBldmVudCk7XG4gICAgdmFyIHJlc3VsdFNldCA9IG5ldyBTZXQoKTtcbiAgICB2YXIgYWRkID0gY2FsbGJhY2sgPT4geyByZXN1bHRTZXQuYWRkKGNhbGxiYWNrKTsgfTtcbiAgICBjYWxsYmFja3NGb3JHcmFtbWFyLmZvckVhY2goYWRkKTtcbiAgICBjYWxsYmFja3NGb3JBbGwuZm9yRWFjaChhZGQpO1xuICAgIHJldHVybiByZXN1bHRTZXQ7XG4gIH1cblxuICBpc0VtcHR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jYWxsYmFja3Muc2l6ZSA9PT0gMCAmJiB0aGlzLl9hbGxHcmFtbWFyQ2FsbGJhY2tzLnNpemUgPT09IDA7XG4gIH1cblxuICBfZ2V0Q2FsbGJhY2tzRnJvbUV2ZW50TWFwKGV2ZW50TWFwOiBNYXA8RXZlbnQsIFNldDwoYXJnOiBDYWxsYmFja0FyZykgPT4gbWl4ZWQ+PiwgZXZlbnQ6IEV2ZW50KTogU2V0PChhcmc6IENhbGxiYWNrQXJnKSA9PiBtaXhlZD4ge1xuICAgIGlmICghZXZlbnRNYXApIHtcbiAgICAgIHJldHVybiBuZXcgU2V0KCk7XG4gICAgfVxuICAgIHZhciBjYWxsYmFja1NldCA9IGV2ZW50TWFwLmdldChldmVudCk7XG4gICAgaWYgKCFjYWxsYmFja1NldCkge1xuICAgICAgcmV0dXJuIG5ldyBTZXQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhbGxiYWNrU2V0O1xuICB9XG5cbiAgYWRkQ2FsbGJhY2soXG4gICAgICBncmFtbWFyU2NvcGVzOiBBcnJheTxzdHJpbmc+IHwgJ2FsbCcsXG4gICAgICBldmVudHM6IEFycmF5PEV2ZW50PixcbiAgICAgIGNhbGxiYWNrOiAoYXJnOiBDYWxsYmFja0FyZykgPT4gbWl4ZWRcbiAgICAgICk6IHZvaWQge1xuICAgIGlmIChncmFtbWFyU2NvcGVzID09PSAnYWxsJykge1xuICAgICAgdGhpcy5fYWRkVG9FdmVudE1hcCh0aGlzLl9hbGxHcmFtbWFyQ2FsbGJhY2tzLCBldmVudHMsIGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgZ3JhbW1hclNjb3BlIG9mIGdyYW1tYXJTY29wZXMpIHtcbiAgICAgICAgdmFyIGV2ZW50TWFwID0gdGhpcy5fY2FsbGJhY2tzLmdldChncmFtbWFyU2NvcGUpO1xuICAgICAgICBpZiAoIWV2ZW50TWFwKSB7XG4gICAgICAgICAgZXZlbnRNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgdGhpcy5fY2FsbGJhY2tzLnNldChncmFtbWFyU2NvcGUsIGV2ZW50TWFwKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hZGRUb0V2ZW50TWFwKGV2ZW50TWFwLCBldmVudHMsIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyByZW1vdmUgdGhlIGNhbGxiYWNrcywgbWFpbnRhaW5pbmcgdGhlIGludmFyaWFudCB0aGF0IHRoZXJlIHNob3VsZCBiZSBub1xuICAvLyBlbXB0eSBtYXBzIG9yIHNldHMgaW4gdGhpcy5fY2FsbGJhY2tzXG4gIHJlbW92ZUNhbGxiYWNrKFxuICAgICAgZ3JhbW1hclNjb3BlczogQXJyYXk8c3RyaW5nPiB8ICdhbGwnLFxuICAgICAgZXZlbnRzOiBBcnJheTxFdmVudD4sXG4gICAgICBjYWxsYmFjazogKGFyZzogQ2FsbGJhY2tBcmcpID0+IG1peGVkXG4gICAgICApOiB2b2lkIHtcbiAgICBpZiAoZ3JhbW1hclNjb3BlcyA9PT0gJ2FsbCcpIHtcbiAgICAgIHRoaXMuX3JlbW92ZUZyb21FdmVudE1hcCh0aGlzLl9hbGxHcmFtbWFyQ2FsbGJhY2tzLCBldmVudHMsIGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgZ3JhbW1hclNjb3BlIG9mIGdyYW1tYXJTY29wZXMpIHtcbiAgICAgICAgdmFyIGV2ZW50TWFwID0gdGhpcy5fY2FsbGJhY2tzLmdldChncmFtbWFyU2NvcGUpO1xuICAgICAgICBpbnZhcmlhbnQoZXZlbnRNYXApO1xuICAgICAgICB0aGlzLl9yZW1vdmVGcm9tRXZlbnRNYXAoZXZlbnRNYXAsIGV2ZW50cywgY2FsbGJhY2spO1xuICAgICAgICBpZiAoZXZlbnRNYXAuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuX2NhbGxiYWNrcy5kZWxldGUoZ3JhbW1hclNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9hZGRUb0V2ZW50TWFwKFxuICAgICAgZXZlbnRNYXA6IE1hcDxFdmVudCwgU2V0PChhcmc6IENhbGxiYWNrQXJnKSA9PiBtaXhlZD4+LFxuICAgICAgZXZlbnRzOiBBcnJheTxFdmVudD4sXG4gICAgICBjYWxsYmFjazogKGFyZzogQ2FsbGJhY2tBcmcpID0+IG1peGVkKTogdm9pZCB7XG4gICAgZm9yICh2YXIgZXZlbnQgb2YgZXZlbnRzKSB7XG4gICAgICB2YXIgY2FsbGJhY2tTZXQgPSBldmVudE1hcC5nZXQoZXZlbnQpO1xuICAgICAgaWYgKCFjYWxsYmFja1NldCkge1xuICAgICAgICBjYWxsYmFja1NldCA9IG5ldyBTZXQoKTtcbiAgICAgICAgZXZlbnRNYXAuc2V0KGV2ZW50LCBjYWxsYmFja1NldCk7XG4gICAgICB9XG4gICAgICBjYWxsYmFja1NldC5hZGQoY2FsbGJhY2spO1xuICAgIH1cbiAgfVxuXG4gIF9yZW1vdmVGcm9tRXZlbnRNYXAoXG4gICAgICBldmVudE1hcDogTWFwPEV2ZW50LCBTZXQ8KGFyZzogQ2FsbGJhY2tBcmcpID0+IG1peGVkPj4sXG4gICAgICBldmVudHM6IEFycmF5PEV2ZW50PixcbiAgICAgIGNhbGxiYWNrOiAoYXJnOiBDYWxsYmFja0FyZykgPT4gbWl4ZWQpOiB2b2lkIHtcbiAgICBmb3IgKHZhciBldmVudCBvZiBldmVudHMpIHtcbiAgICAgIHZhciBjYWxsYmFja1NldCA9IGV2ZW50TWFwLmdldChldmVudCk7XG4gICAgICBpbnZhcmlhbnQoY2FsbGJhY2tTZXQpO1xuICAgICAgY2FsbGJhY2tTZXQuZGVsZXRlKGNhbGxiYWNrKTtcbiAgICAgIGlmIChjYWxsYmFja1NldC5zaXplID09PSAwKSB7XG4gICAgICAgIGV2ZW50TWFwLmRlbGV0ZShldmVudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIFRPRE8oNzgwNjg3MikgbWFrZSB0aGlzIGF2YWlsYWJsZSB0byBhbGwgRGlhZ25vc3RpY1Byb3ZpZGVycywgYnV0IHRoaW5rXG4vLyBjYXJlZnVsbHkgYWJvdXQgdGhlIEFQSSBhbmQgd2hlcmUgdGhpcyBzaG91bGQgbGl2ZSBiZWZvcmUgZG9pbmcgc28uXG4vKipcbiAqIE1lYW50IHRvIG1ha2UgaXQgc2ltcGxlIGFuZCBlYXN5IGZvciBhIERpYWdub3N0aWNQcm92aWRlciB0byBzdWJzY3JpYmUgdG9cbiAqIHJlbGV2YW50IGV2ZW50cy4gQ3VycmVudGx5IHByb3ZpZGVzIHR3byBtZXRob2RzLCBvbkZpbGVDaGFuZ2UgYW5kIG9uRmlsZVNhdmUuXG4gKiBBIERpYWdub3N0aWNQcm92aWRlciB3aWxsIHR5cGljYWxseSBzdWJzY3JpYmUgdG8gb25seSBvbmUsIGRlcGVuZGluZyBvblxuICogd2hldGhlciBpdCB3YW50cyB0byBiZSBub3RpZmllZCB3aGVuZXZlciBhIGZpbGUgY2hhbmdlcyBvciBvbmx5IHdoZW4gaXQgaXNcbiAqIHNhdmVkLlxuICpcbiAqIEJvdGggbWV0aG9kcyB0YWtlIHR3byBhcmd1bWVudHM6XG4gKiAtIEFuIEFycmF5IG9mIGdyYW1tYXJzIGZvciB3aGljaCB0aGUgRGlhZ25vc3RpY1Byb3ZpZGVyIGNhbiBwcm92aWRlXG4gKiBkaWFnbm9zdGljcy5cbiAqIC0gVGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBvbiBhIHRleHQgZXZlbnQuXG4gKlxuICogQSBUZXh0RXZlbnREaXNwYXRjaGVyIHdpbGwgYmUgc3Vic2NyaWJlZCB0byB0ZXh0IGV2ZW50cyBpZiBhbmQgb25seSBpZiBpdCBoYXNcbiAqIHN1YnNjcmliZXJzIG9mIGl0cyBvd24uIElmIGFsbCBzdWJzY3JpYmVycyB1bnN1YnNjcmliZSwgaXQgd2lsbCB1bnN1YnNjcmliZVxuICogZnJvbSBBdG9tJ3MgdGV4dCBldmVudHMuXG4gKlxuICovXG5jbGFzcyBUZXh0RXZlbnREaXNwYXRjaGVyIHtcbiAgX2NhbGxiYWNrQ29udGFpbmVyOiBUZXh0Q2FsbGJhY2tDb250YWluZXI8VGV4dEVkaXRvcj47XG5cbiAgX2VkaXRvckxpc3RlbmVyRGlzcG9zYWJsZTogP0NvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgX3BlbmRpbmdFdmVudHM6IFdlYWtNYXA8YXRvbSRUZXh0QnVmZmVyLCBTZXQ8RXZlbnQ+PjtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9jYWxsYmFja0NvbnRhaW5lciA9IG5ldyBUZXh0Q2FsbGJhY2tDb250YWluZXIoKTtcbiAgICB0aGlzLl9lZGl0b3JMaXN0ZW5lckRpc3Bvc2FibGUgPSBudWxsO1xuICAgIHRoaXMuX3BlbmRpbmdFdmVudHMgPSBuZXcgV2Vha01hcCgpO1xuICB9XG5cbiAgX29uRXZlbnRzKGdyYW1tYXJTY29wZXM6IEFycmF5PHN0cmluZz4gfCAnYWxsJywgZXZlbnRzOiBBcnJheTxFdmVudD4sIGNhbGxiYWNrOiBFdmVudENhbGxiYWNrKSB7XG4gICAgaWYgKHRoaXMuX2NhbGxiYWNrQ29udGFpbmVyLmlzRW1wdHkoKSkge1xuICAgICAgdGhpcy5fcmVnaXN0ZXJFZGl0b3JMaXN0ZW5lcnMoKTtcbiAgICB9XG4gICAgLy8gU29tZXRpbWVzIHRoZXNlIGV2ZW50cyBnZXQgdHJpZ2dlcmVkIHNldmVyYWwgdGltZXMgaW4gc3VjY2Vzc2lvblxuICAgIC8vIChwYXJ0aWN1bGFybHkgb24gc3RhcnR1cCkuXG4gICAgdmFyIGRlYm91bmNlZENhbGxiYWNrID0gZGVib3VuY2UoY2FsbGJhY2ssIDUwLCB0cnVlKTtcbiAgICB0aGlzLl9jYWxsYmFja0NvbnRhaW5lci5hZGRDYWxsYmFjayhncmFtbWFyU2NvcGVzLCBldmVudHMsIGRlYm91bmNlZENhbGxiYWNrKTtcbiAgICB2YXIgZGlzcG9zYWJsZXMgPSBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICB0aGlzLl9jYWxsYmFja0NvbnRhaW5lci5yZW1vdmVDYWxsYmFjayhncmFtbWFyU2NvcGVzLCBldmVudHMsIGRlYm91bmNlZENhbGxiYWNrKTtcbiAgICAgIGlmICh0aGlzLl9jYWxsYmFja0NvbnRhaW5lci5pc0VtcHR5KCkpIHtcbiAgICAgICAgdGhpcy5fZGVyZWdpc3RlckVkaXRvckxpc3RlbmVycygpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBkaXNwb3NhYmxlcztcbiAgfVxuXG4gIG9uRmlsZUNoYW5nZShncmFtbWFyU2NvcGVzOiBBcnJheTxzdHJpbmc+LCBjYWxsYmFjazogRXZlbnRDYWxsYmFjayk6IGF0b20kRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuX29uRXZlbnRzKGdyYW1tYXJTY29wZXMsIEZJTEVfQ0hBTkdFX0VWRU5UUywgY2FsbGJhY2spO1xuICB9XG4gIG9uQW55RmlsZUNoYW5nZShjYWxsYmFjazogRXZlbnRDYWxsYmFjayk6IGF0b20kRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuX29uRXZlbnRzKCdhbGwnLCBGSUxFX0NIQU5HRV9FVkVOVFMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIG9uRmlsZVNhdmUoZ3JhbW1hclNjb3BlczogQXJyYXk8c3RyaW5nPiwgY2FsbGJhY2s6IEV2ZW50Q2FsbGJhY2spOiBhdG9tJERpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLl9vbkV2ZW50cyhncmFtbWFyU2NvcGVzLCBGSUxFX1NBVkVfRVZFTlRTLCBjYWxsYmFjayk7XG4gIH1cblxuICBvbkFueUZpbGVTYXZlKGNhbGxiYWNrOiBFdmVudENhbGxiYWNrKTogYXRvbSREaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5fb25FdmVudHMoJ2FsbCcsIEZJTEVfU0FWRV9FVkVOVFMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIF9yZWdpc3RlckVkaXRvckxpc3RlbmVycygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2VkaXRvckxpc3RlbmVyRGlzcG9zYWJsZSkge1xuICAgICAgdGhpcy5fZWRpdG9yTGlzdGVuZXJEaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB9XG5cbiAgICAvLyBXaGVuZXZlciB0aGUgYWN0aXZlIHBhbmUgaXRlbSBjaGFuZ2VzLCB3ZSBjaGVjayB0byBzZWUgaWYgdGhlcmUgYXJlIGFueVxuICAgIC8vIHBlbmRpbmcgZXZlbnRzIGZvciB0aGUgbmV3bHktZm9jdXNlZCBUZXh0RWRpdG9yLlxuICAgIHRoaXMuX2dldEVkaXRvckxpc3RlbmVyRGlzcG9zYWJsZSgpLmFkZChhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtKCgpID0+IHtcbiAgICAgIHZhciBjdXJyZW50RWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgaWYgKGN1cnJlbnRFZGl0b3IpIHtcbiAgICAgICAgdmFyIHBlbmRpbmdFdmVudHMgPSB0aGlzLl9wZW5kaW5nRXZlbnRzLmdldChjdXJyZW50RWRpdG9yLmdldEJ1ZmZlcigpKTtcbiAgICAgICAgaWYgKHBlbmRpbmdFdmVudHMpIHtcbiAgICAgICAgICBmb3IgKHZhciBldmVudCBvZiBwZW5kaW5nRXZlbnRzKSB7XG4gICAgICAgICAgICB0aGlzLl9kaXNwYXRjaEV2ZW50cyhjdXJyZW50RWRpdG9yLCBldmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX3BlbmRpbmdFdmVudHMuZGVsZXRlKGN1cnJlbnRFZGl0b3IuZ2V0QnVmZmVyKCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgdGhpcy5fZ2V0RWRpdG9yTGlzdGVuZXJEaXNwb3NhYmxlKCkuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyhlZGl0b3IgPT4ge1xuICAgICAgdmFyIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICAgIHZhciBtYWtlRGlzcGF0Y2ggPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5fZGlzcGF0Y2hFdmVudHMoZWRpdG9yLCBldmVudCk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgICAgdGhpcy5fZ2V0RWRpdG9yTGlzdGVuZXJEaXNwb3NhYmxlKCkuYWRkKGJ1ZmZlci5vbkRpZFN0b3BDaGFuZ2luZyhtYWtlRGlzcGF0Y2goJ2RpZC1jaGFuZ2UnKSkpO1xuICAgICAgdGhpcy5fZ2V0RWRpdG9yTGlzdGVuZXJEaXNwb3NhYmxlKCkuYWRkKGJ1ZmZlci5vbkRpZFNhdmUobWFrZURpc3BhdGNoKCdkaWQtc2F2ZScpKSk7XG4gICAgICB0aGlzLl9nZXRFZGl0b3JMaXN0ZW5lckRpc3Bvc2FibGUoKS5hZGQoYnVmZmVyLm9uRGlkUmVsb2FkKG1ha2VEaXNwYXRjaCgnZGlkLXJlbG9hZCcpKSk7XG4gICAgfSkpO1xuICB9XG5cbiAgX2RlcmVnaXN0ZXJFZGl0b3JMaXN0ZW5lcnMoKSB7XG4gICAgaWYgKHRoaXMuX2VkaXRvckxpc3RlbmVyRGlzcG9zYWJsZXMpIHtcbiAgICAgIHRoaXMuX2dldEVkaXRvckxpc3RlbmVyRGlzcG9zYWJsZSgpLmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMuX2VkaXRvckxpc3RlbmVyRGlzcG9zYWJsZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgX2Rpc3BhdGNoRXZlbnRzKGVkaXRvcjogVGV4dEVkaXRvciwgZXZlbnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgdmFyIGN1cnJlbnRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgaWYgKCFjdXJyZW50RWRpdG9yKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChlZGl0b3IgPT09IGN1cnJlbnRFZGl0b3IpIHtcbiAgICAgIHZhciBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja0NvbnRhaW5lci5nZXRDYWxsYmFja3MoZWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUsIGV2ZW50KTtcbiAgICAgIGZvciAodmFyIGNhbGxiYWNrIG9mIGNhbGxiYWNrcykge1xuICAgICAgICBjYWxsYmFjayhlZGl0b3IpO1xuICAgICAgfVxuICAgIC8vIFdlIHdhbnQgdG8gYXZvaWQgc3RvcmluZyBwZW5kaW5nIGV2ZW50cyBpZiB0aGlzIGV2ZW50IHdhcyBnZW5lcmF0ZWQgYnlcbiAgICAvLyB0aGUgc2FtZSBidWZmZXIgYXMgdGhlIGN1cnJlbnQgZWRpdG9yLCB0byBhdm9pZCBkdXBsaWNhdGluZyBldmVudHMgd2hlblxuICAgIC8vIG11bHRpcGxlIHBhbmVzIGhhdmUgdGhlIHNhbWUgZmlsZSBvcGVuLlxuICAgIH0gZWxzZSBpZiAoZWRpdG9yLmdldEJ1ZmZlcigpICE9PSBjdXJyZW50RWRpdG9yLmdldEJ1ZmZlcigpKSB7XG4gICAgICAvLyBUcmlnZ2VyIHRoaXMgZXZlbnQgbmV4dCB0aW1lIHdlIHN3aXRjaCB0byBhbiBlZGl0b3Igd2l0aCB0aGlzIGJ1ZmZlci5cbiAgICAgIHZhciBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fcGVuZGluZ0V2ZW50cy5nZXQoYnVmZmVyKTtcbiAgICAgIGlmICghZXZlbnRzKSB7XG4gICAgICAgIGV2ZW50cyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5fcGVuZGluZ0V2ZW50cy5zZXQoYnVmZmVyLCBldmVudHMpO1xuICAgICAgfVxuICAgICAgZXZlbnRzLmFkZChldmVudCk7XG4gICAgfVxuICB9XG5cbiAgX2dldEVkaXRvckxpc3RlbmVyRGlzcG9zYWJsZSgpOiBDb21wb3NpdGVEaXNwb3NhYmxlIHtcbiAgICB2YXIgZGlzcG9zYWJsZSA9IHRoaXMuX2VkaXRvckxpc3RlbmVyRGlzcG9zYWJsZTtcbiAgICBpbnZhcmlhbnQoZGlzcG9zYWJsZSwgJ1RleHRFdmVudERpc3BhdGNoZXIgZGlzcG9zYWJsZSBpcyBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICByZXR1cm4gZGlzcG9zYWJsZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgVGV4dEV2ZW50RGlzcGF0Y2hlcixcbiAgX19URVNUX186IHtcbiAgICBUZXh0Q2FsbGJhY2tDb250YWluZXJcbiAgfVxufTtcbiJdfQ==
