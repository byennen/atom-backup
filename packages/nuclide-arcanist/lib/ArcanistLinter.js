
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

module.exports = {
  // Workaround for https://github.com/AtomLinter/Linter/issues/248.
  //
  // This is here for backwards compatibility with the 'linter' package, which
  // does not support the allGrammarScopes extension.
  grammarScopes: atom.grammars.getGrammars().map(function (grammar) {
    return grammar.scopeName;
  }),
  // extension to the linter protocol, overrides grammarScopes.
  allGrammarScopes: true,
  providerName: 'Arc',
  scope: 'file',
  lintOnFly: false,
  lint: _asyncToGenerator(function* (textEditor) {
    var filePath = textEditor.getPath();
    if (!filePath) {
      return [];
    }
    try {
      var diagnostics = yield require('nuclide-arcanist-client').findDiagnostics(textEditor.getPath());

      var _require = require('atom');

      var Range = _require.Range;

      return diagnostics.map(function (diagnostic) {
        var range = new Range([diagnostic.row, diagnostic.col], [diagnostic.row, textEditor.getBuffer().lineLengthForRow(diagnostic.row)]);
        return {
          type: diagnostic.type,
          text: diagnostic.text,
          filePath: diagnostic.filePath,
          range: range
        };
      });
    } catch (error) {
      return [];
    }
  })
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWFyY2FuaXN0L2xpYi9BcmNhbmlzdExpbnRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7OztBQVdaLE1BQU0sQ0FBQyxPQUFPLEdBQUc7Ozs7O0FBS2YsZUFBYSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQUEsT0FBTztXQUFJLE9BQU8sQ0FBQyxTQUFTO0dBQUEsQ0FBQzs7QUFFNUUsa0JBQWdCLEVBQUUsSUFBSTtBQUN0QixjQUFZLEVBQUUsS0FBSztBQUNuQixPQUFLLEVBQUUsTUFBTTtBQUNiLFdBQVMsRUFBRSxLQUFLO0FBQ2hCLEFBQU0sTUFBSSxvQkFBQSxXQUFDLFVBQXNCLEVBQTBCO0FBQ3pELFFBQUksUUFBUSxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNwQyxRQUFJLENBQUMsUUFBUSxFQUFFO0FBQ2IsYUFBTyxFQUFFLENBQUM7S0FDWDtBQUNELFFBQUk7QUFDRixVQUFJLFdBQVcsR0FBRyxNQUFNLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQzs7cUJBQ25GLE9BQU8sQ0FBQyxNQUFNLENBQUM7O1VBQXhCLEtBQUssWUFBTCxLQUFLOztBQUNWLGFBQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFBLFVBQVUsRUFBSTtBQUNuQyxZQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FDbkIsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFDaEMsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDMUUsQ0FBQztBQUNGLGVBQU87QUFDTCxjQUFJLEVBQUUsVUFBVSxDQUFDLElBQUk7QUFDckIsY0FBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJO0FBQ3JCLGtCQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDN0IsZUFBSyxFQUFMLEtBQUs7U0FDTixDQUFDO09BQ0gsQ0FBQyxDQUFDO0tBQ0osQ0FBQyxPQUFPLEtBQUssRUFBRTtBQUNkLGFBQU8sRUFBRSxDQUFDO0tBQ1g7R0FDRixDQUFBO0NBQ0YsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1hcmNhbmlzdC9saWIvQXJjYW5pc3RMaW50ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL0F0b21MaW50ZXIvTGludGVyL2lzc3Vlcy8yNDguXG4gIC8vXG4gIC8vIFRoaXMgaXMgaGVyZSBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgJ2xpbnRlcicgcGFja2FnZSwgd2hpY2hcbiAgLy8gZG9lcyBub3Qgc3VwcG9ydCB0aGUgYWxsR3JhbW1hclNjb3BlcyBleHRlbnNpb24uXG4gIGdyYW1tYXJTY29wZXM6IGF0b20uZ3JhbW1hcnMuZ2V0R3JhbW1hcnMoKS5tYXAoZ3JhbW1hciA9PiBncmFtbWFyLnNjb3BlTmFtZSksXG4gIC8vIGV4dGVuc2lvbiB0byB0aGUgbGludGVyIHByb3RvY29sLCBvdmVycmlkZXMgZ3JhbW1hclNjb3Blcy5cbiAgYWxsR3JhbW1hclNjb3BlczogdHJ1ZSxcbiAgcHJvdmlkZXJOYW1lOiAnQXJjJyxcbiAgc2NvcGU6ICdmaWxlJyxcbiAgbGludE9uRmx5OiBmYWxzZSxcbiAgYXN5bmMgbGludCh0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yKTogUHJvbWlzZTxBcnJheTxPYmplY3Q+PiB7XG4gICAgdmFyIGZpbGVQYXRoID0gdGV4dEVkaXRvci5nZXRQYXRoKCk7XG4gICAgaWYgKCFmaWxlUGF0aCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgdmFyIGRpYWdub3N0aWNzID0gYXdhaXQgcmVxdWlyZSgnbnVjbGlkZS1hcmNhbmlzdC1jbGllbnQnKS5maW5kRGlhZ25vc3RpY3ModGV4dEVkaXRvci5nZXRQYXRoKCkpO1xuICAgICAgdmFyIHtSYW5nZX0gPSByZXF1aXJlKCdhdG9tJyk7XG4gICAgICByZXR1cm4gZGlhZ25vc3RpY3MubWFwKGRpYWdub3N0aWMgPT4ge1xuICAgICAgICB2YXIgcmFuZ2UgPSBuZXcgUmFuZ2UoXG4gICAgICAgICAgW2RpYWdub3N0aWMucm93LCBkaWFnbm9zdGljLmNvbF0sXG4gICAgICAgICAgW2RpYWdub3N0aWMucm93LCB0ZXh0RWRpdG9yLmdldEJ1ZmZlcigpLmxpbmVMZW5ndGhGb3JSb3coZGlhZ25vc3RpYy5yb3cpXVxuICAgICAgICApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IGRpYWdub3N0aWMudHlwZSxcbiAgICAgICAgICB0ZXh0OiBkaWFnbm9zdGljLnRleHQsXG4gICAgICAgICAgZmlsZVBhdGg6IGRpYWdub3N0aWMuZmlsZVBhdGgsXG4gICAgICAgICAgcmFuZ2VcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9LFxufTtcbiJdfQ==
