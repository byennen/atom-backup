
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var GRAMMARS = new Set(['source.ocaml']);
var EXTENSIONS = new Set(['ml', 'mli']);

module.exports = {
  priority: 20,
  getSuggestionForWord: _asyncToGenerator(function* (textEditor, text, range) {
    var _require = require('nuclide-client');

    var getServiceByNuclideUri = _require.getServiceByNuclideUri;

    if (!GRAMMARS.has(textEditor.getGrammar().scopeName)) {
      return null;
    }

    var file = textEditor.getPath();

    var kind = 'ml';
    var extension = require('path').extname(file);
    if (EXTENSIONS.has(extension)) {
      kind = extension;
    }

    var instance = yield getServiceByNuclideUri('MerlinService', file);
    var start = range.start;

    return {
      range: [range],
      callback: _asyncToGenerator(function* () {
        yield instance.pushNewBuffer(file, textEditor.getText());
        var location = yield instance.locate(file, start.row, start.column, kind);
        if (!location) {
          return;
        }

        var _require2 = require('nuclide-atom-helpers');

        var goToLocation = _require2.goToLocation;

        goToLocation(location.file, location.pos.line - 1, location.pos.col);
      })
    };
  })
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLW9jYW1sL2xpYi9IeXBlcmNsaWNrUHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7QUFXWixJQUFJLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUNyQixjQUFjLENBQ2YsQ0FBQyxDQUFDO0FBQ0gsSUFBSSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FDdkIsSUFBSSxFQUNKLEtBQUssQ0FDTixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLFVBQVEsRUFBRSxFQUFFO0FBQ1osQUFBTSxzQkFBb0Isb0JBQUEsV0FBQyxVQUFzQixFQUFFLElBQVksRUFBRSxLQUFpQixFQUFFO21CQUNuRCxPQUFPLENBQUMsZ0JBQWdCLENBQUM7O1FBQW5ELHNCQUFzQixZQUF0QixzQkFBc0I7O0FBRTNCLFFBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNwRCxhQUFPLElBQUksQ0FBQztLQUNiOztBQUVELFFBQUksSUFBSSxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFaEMsUUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLFFBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUMsUUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQzdCLFVBQUksR0FBRyxTQUFTLENBQUM7S0FDbEI7O0FBRUQsUUFBSSxRQUFRLEdBQUcsTUFBTSxzQkFBc0IsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbkUsUUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQzs7QUFFeEIsV0FBTztBQUNMLFdBQUssRUFBRSxDQUFDLEtBQUssQ0FBQztBQUNkLGNBQVEsb0JBQUUsYUFBaUI7QUFDekIsY0FBTSxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUN6RCxZQUFJLFFBQVEsR0FBRyxNQUFNLFFBQVEsQ0FBQyxNQUFNLENBQ2xDLElBQUksRUFDSixLQUFLLENBQUMsR0FBRyxFQUNULEtBQUssQ0FBQyxNQUFNLEVBQ1osSUFBSSxDQUFDLENBQUM7QUFDUixZQUFJLENBQUMsUUFBUSxFQUFFO0FBQ2IsaUJBQU87U0FDUjs7d0JBRW9CLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQzs7WUFBL0MsWUFBWSxhQUFaLFlBQVk7O0FBQ2pCLG9CQUFZLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUN0RSxDQUFBO0tBQ0YsQ0FBQztHQUNILENBQUE7Q0FDRixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLW9jYW1sL2xpYi9IeXBlcmNsaWNrUHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgR1JBTU1BUlMgPSBuZXcgU2V0KFtcbiAgJ3NvdXJjZS5vY2FtbCcsXG5dKTtcbnZhciBFWFRFTlNJT05TID0gbmV3IFNldChbXG4gICdtbCcsXG4gICdtbGknLFxuXSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwcmlvcml0eTogMjAsXG4gIGFzeW5jIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHRleHQ6IHN0cmluZywgcmFuZ2U6IGF0b20kUmFuZ2UpIHtcbiAgICB2YXIge2dldFNlcnZpY2VCeU51Y2xpZGVVcml9ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcblxuICAgIGlmICghR1JBTU1BUlMuaGFzKHRleHRFZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBmaWxlID0gdGV4dEVkaXRvci5nZXRQYXRoKCk7XG5cbiAgICB2YXIga2luZCA9ICdtbCc7XG4gICAgdmFyIGV4dGVuc2lvbiA9IHJlcXVpcmUoJ3BhdGgnKS5leHRuYW1lKGZpbGUpO1xuICAgIGlmIChFWFRFTlNJT05TLmhhcyhleHRlbnNpb24pKSB7XG4gICAgICBraW5kID0gZXh0ZW5zaW9uO1xuICAgIH1cblxuICAgIHZhciBpbnN0YW5jZSA9IGF3YWl0IGdldFNlcnZpY2VCeU51Y2xpZGVVcmkoJ01lcmxpblNlcnZpY2UnLCBmaWxlKTtcbiAgICB2YXIgc3RhcnQgPSByYW5nZS5zdGFydDtcblxuICAgIHJldHVybiB7XG4gICAgICByYW5nZTogW3JhbmdlXSxcbiAgICAgIGNhbGxiYWNrOiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgICAgYXdhaXQgaW5zdGFuY2UucHVzaE5ld0J1ZmZlcihmaWxlLCB0ZXh0RWRpdG9yLmdldFRleHQoKSk7XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IGF3YWl0IGluc3RhbmNlLmxvY2F0ZShcbiAgICAgICAgICBmaWxlLFxuICAgICAgICAgIHN0YXJ0LnJvdyxcbiAgICAgICAgICBzdGFydC5jb2x1bW4sXG4gICAgICAgICAga2luZCk7XG4gICAgICAgIGlmICghbG9jYXRpb24pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIge2dvVG9Mb2NhdGlvbn0gPSByZXF1aXJlKCdudWNsaWRlLWF0b20taGVscGVycycpO1xuICAgICAgICBnb1RvTG9jYXRpb24obG9jYXRpb24uZmlsZSwgbG9jYXRpb24ucG9zLmxpbmUgLSAxLCBsb2NhdGlvbi5wb3MuY29sKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG59O1xuIl19
