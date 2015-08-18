
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _require = require('nuclide-client');

var getServiceByNuclideUri = _require.getServiceByNuclideUri;

module.exports = {
  getAutocompleteSuggestions: _asyncToGenerator(function* (request) {
    var editor = request.editor;
    var prefix = request.prefix;

    // OCaml.Pervasives has a lot of stuff that gets shown on every keystroke without this.
    if (prefix.trim().length === 0) {
      return [];
    }

    var path = editor.getPath();
    var ocamlmerlin = getServiceByNuclideUri('MerlinService', path);
    var text = editor.getText();

    var _editor$getCursorBufferPosition$toArray = editor.getCursorBufferPosition().toArray();

    var _editor$getCursorBufferPosition$toArray2 = _slicedToArray(_editor$getCursorBufferPosition$toArray, 2);

    var line = _editor$getCursorBufferPosition$toArray2[0];
    var col = _editor$getCursorBufferPosition$toArray2[1];

    // The default prefix at something like `Printf.[cursor]` is just the dot. Compute
    // `linePrefix` so that ocamlmerlin gets more context. Compute `replacementPrefix`
    // to make sure that the existing dot doesn't get clobbered when autocompleting.
    var linePrefix = editor.lineTextForBufferRow(line).substring(0, col);
    if (linePrefix.length > 0) {
      linePrefix = linePrefix.split(/([ \t\[\](){}<>,+*\/-])/).slice(-1)[0];
    }
    var replacementPrefix = prefix;
    if (replacementPrefix.startsWith('.')) {
      replacementPrefix = replacementPrefix.substring(1);
    }

    yield ocamlmerlin.pushNewBuffer(path, text);
    var output = yield ocamlmerlin.complete(path, line, col, linePrefix);
    return output.entries.map(function (item) {
      return {
        text: item.name,
        rightLabel: item.desc === '' ? '(module)' : item.desc,
        replacementPrefix: replacementPrefix
      };
    });
  })
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLW9jYW1sL2xpYi9BdXRvQ29tcGxldGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztlQVdtQixPQUFPLENBQUMsZ0JBQWdCLENBQUM7O0lBQW5ELHNCQUFzQixZQUF0QixzQkFBc0I7O0FBRTNCLE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixBQUFNLDRCQUEwQixvQkFBQSxXQUM1QixPQUEwRixFQUNwQztRQUVuRCxNQUFNLEdBQVksT0FBTyxDQUF6QixNQUFNO1FBQUUsTUFBTSxHQUFJLE9BQU8sQ0FBakIsTUFBTTs7O0FBR25CLFFBQUksTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDOUIsYUFBTyxFQUFFLENBQUM7S0FDWDs7QUFFRCxRQUFJLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDNUIsUUFBSSxXQUFXLEdBQUcsc0JBQXNCLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2hFLFFBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7a0RBQ1YsTUFBTSxDQUFDLHVCQUF1QixFQUFFLENBQUMsT0FBTyxFQUFFOzs7O1FBQXZELElBQUk7UUFBRSxHQUFHOzs7OztBQUtkLFFBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3JFLFFBQUksVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDekIsZ0JBQVUsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkU7QUFDRCxRQUFJLGlCQUFpQixHQUFHLE1BQU0sQ0FBQztBQUMvQixRQUFJLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUNyQyx1QkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDcEQ7O0FBRUQsVUFBTSxXQUFXLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM1QyxRQUFJLE1BQU0sR0FBRyxNQUFNLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDckUsV0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUksRUFBSztBQUNsQyxhQUFPO0FBQ0wsWUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO0FBQ2Ysa0JBQVUsRUFBRyxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUUsR0FBRyxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQUFBQztBQUN2RCx5QkFBaUIsRUFBRSxpQkFBaUI7T0FDckMsQ0FBQztLQUNILENBQUMsQ0FBQztHQUNKLENBQUE7Q0FDRixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLW9jYW1sL2xpYi9BdXRvQ29tcGxldGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge2dldFNlcnZpY2VCeU51Y2xpZGVVcml9ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFzeW5jIGdldEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb25zKFxuICAgICAgcmVxdWVzdDoge2VkaXRvcjogVGV4dEVkaXRvcjsgYnVmZmVyUG9zaXRpb246IFBvaW50OyBzY29wZURlc2NyaXB0b3I6IGFueTsgcHJlZml4OiBzdHJpbmd9KTpcbiAgICAgIFByb21pc2U8QXJyYXk8e3NuaXBwZXQ6IHN0cmluZzsgcmlnaHRMYWJlbDogc3RyaW5nfT4+IHtcblxuICAgIHZhciB7ZWRpdG9yLCBwcmVmaXh9ID0gcmVxdWVzdDtcblxuICAgIC8vIE9DYW1sLlBlcnZhc2l2ZXMgaGFzIGEgbG90IG9mIHN0dWZmIHRoYXQgZ2V0cyBzaG93biBvbiBldmVyeSBrZXlzdHJva2Ugd2l0aG91dCB0aGlzLlxuICAgIGlmIChwcmVmaXgudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHZhciBwYXRoID0gZWRpdG9yLmdldFBhdGgoKTtcbiAgICB2YXIgb2NhbWxtZXJsaW4gPSBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpKCdNZXJsaW5TZXJ2aWNlJywgcGF0aCk7XG4gICAgdmFyIHRleHQgPSBlZGl0b3IuZ2V0VGV4dCgpO1xuICAgIHZhciBbbGluZSwgY29sXSA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnRvQXJyYXkoKTtcblxuICAgIC8vIFRoZSBkZWZhdWx0IHByZWZpeCBhdCBzb21ldGhpbmcgbGlrZSBgUHJpbnRmLltjdXJzb3JdYCBpcyBqdXN0IHRoZSBkb3QuIENvbXB1dGVcbiAgICAvLyBgbGluZVByZWZpeGAgc28gdGhhdCBvY2FtbG1lcmxpbiBnZXRzIG1vcmUgY29udGV4dC4gQ29tcHV0ZSBgcmVwbGFjZW1lbnRQcmVmaXhgXG4gICAgLy8gdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGV4aXN0aW5nIGRvdCBkb2Vzbid0IGdldCBjbG9iYmVyZWQgd2hlbiBhdXRvY29tcGxldGluZy5cbiAgICB2YXIgbGluZVByZWZpeCA9IGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhsaW5lKS5zdWJzdHJpbmcoMCwgY29sKTtcbiAgICBpZiAobGluZVByZWZpeC5sZW5ndGggPiAwKSB7XG4gICAgICBsaW5lUHJlZml4ID0gbGluZVByZWZpeC5zcGxpdCgvKFsgXFx0XFxbXFxdKCl7fTw+LCsqXFwvLV0pLykuc2xpY2UoLTEpWzBdO1xuICAgIH1cbiAgICB2YXIgcmVwbGFjZW1lbnRQcmVmaXggPSBwcmVmaXg7XG4gICAgaWYgKHJlcGxhY2VtZW50UHJlZml4LnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgcmVwbGFjZW1lbnRQcmVmaXggPSByZXBsYWNlbWVudFByZWZpeC5zdWJzdHJpbmcoMSk7XG4gICAgfVxuXG4gICAgYXdhaXQgb2NhbWxtZXJsaW4ucHVzaE5ld0J1ZmZlcihwYXRoLCB0ZXh0KTtcbiAgICB2YXIgb3V0cHV0ID0gYXdhaXQgb2NhbWxtZXJsaW4uY29tcGxldGUocGF0aCwgbGluZSwgY29sLCBsaW5lUHJlZml4KTtcbiAgICByZXR1cm4gb3V0cHV0LmVudHJpZXMubWFwKChpdGVtKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0OiBpdGVtLm5hbWUsXG4gICAgICAgIHJpZ2h0TGFiZWw6IChpdGVtLmRlc2MgPT09ICcnID8gJyhtb2R1bGUpJyA6IGl0ZW0uZGVzYyksXG4gICAgICAgIHJlcGxhY2VtZW50UHJlZml4OiByZXBsYWNlbWVudFByZWZpeCxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cbn07XG4iXX0=
