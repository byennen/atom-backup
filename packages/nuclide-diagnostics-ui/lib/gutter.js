
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react-for-atom');

var GUTTER_ID = 'nuclide-diagnostics-gutter';

// TODO(mbolin): Make it so that when mousing over an element with this CSS class (or specifically,
// the child element with the "region" CSS class), we also do a showPopupFor(). This seems to be
// tricky given how the DOM of a TextEditor works today. There are div.tile elements, each of which
// has its own div.highlights element and many div.line elements. The div.highlights element has 0
// or more children, each child being a div.highlight with a child div.region. The div.region
// element is defined to be {position: absolute; pointer-events: none; z-index: -1}. The absolute
// positioning and negative z-index make it so it isn't eligible for mouseover events, so we
// might have to listen for mouseover events on TextEditor and then use its own APIs, such as
// decorationsForScreenRowRange(), to see if there is a hit target instead. Since this will be
// happening onmousemove, we also have to be careful to make sure this is not expensive.
var HIGHLIGHT_CSS = 'nuclide-diagnostics-gutter-ui-highlight';

var ERROR_HIGHLIGHT_CSS = 'nuclide-diagnostics-gutter-ui-highlight-error';
var WARNING_HIGHLIGHT_CSS = 'nuclide-diagnostics-gutter-ui-highlight-warning';

var ERROR_GUTTER_CSS = 'nuclide-diagnostics-gutter-ui-gutter-error';
var WARNING_GUTTER_CSS = 'nuclide-diagnostics-gutter-ui-gutter-warning';

var editorToMarkers = new WeakMap();

function applyUpdateToEditor(editor, update) {
  var gutter = editor.gutterWithName(GUTTER_ID);
  if (!gutter) {
    // TODO(jessicalin): Determine an appropriate priority so that the gutter:
    // (1) Shows up to the right of the line numbers.
    // (2) Shows the items that are added to it right away.
    // Using a value of 10 fixes (1), but breaks (2). This seems like it is likely a bug in Atom.

    // By default, a gutter will be destroyed when its editor is destroyed,
    // so there is no need to register a callback via onDidDestroy().
    gutter = editor.addGutter({
      name: GUTTER_ID,
      visible: false
    });
  }

  var marker;
  var markers = editorToMarkers.get(editor);

  // TODO: Consider a more efficient strategy that does not blindly destroy all of the
  // existing markers.
  if (markers) {
    for (marker of markers) {
      marker.destroy();
    }
    markers.clear();
  } else {
    markers = new Set();
  }

  var rowToMessage = new Map();
  function addMessageForRow(message, row) {
    var messages = rowToMessage.get(row);
    if (!messages) {
      messages = [];
      rowToMessage.set(row, messages);
    }
    messages.push(message);
  }

  for (var message of update.messages) {
    var range = message.range;
    var highlightMarker;
    if (range) {
      addMessageForRow(message, range.start.row);
      highlightMarker = editor.markBufferRange(range);
    } else {
      addMessageForRow(message, 0);
    }

    var highlightCssClass;
    var gutterMarkerCssClass;
    if (message.type === 'Error') {
      highlightCssClass = HIGHLIGHT_CSS + ' ' + ERROR_HIGHLIGHT_CSS;
      gutterMarkerCssClass = ERROR_GUTTER_CSS;
    } else {
      highlightCssClass = HIGHLIGHT_CSS + ' ' + WARNING_HIGHLIGHT_CSS;
      gutterMarkerCssClass = WARNING_GUTTER_CSS;
    }

    // This marker underlines text.
    if (highlightMarker) {
      editor.decorateMarker(highlightMarker, {
        type: 'highlight',
        'class': highlightCssClass
      });
      markers.add(highlightMarker);
    }
  }

  // Find all of the gutter markers for the same row and combine them into one marker/popup.
  for (var _ref of rowToMessage.entries()) {
    var _ref2 = _slicedToArray(_ref, 2);

    var row = _ref2[0];
    var messages = _ref2[1];

    // If at least one of the diagnostics is an error rather than the warning,
    // display the glyph in the gutter to represent an error rather than a warning.
    var gutterMarkerCssClass = messages.some(function (msg) {
      return msg.type === 'Error';
    }) ? ERROR_GUTTER_CSS : WARNING_GUTTER_CSS;

    // This marker adds some UI to the gutter.

    var _createGutterItem = createGutterItem(messages, gutterMarkerCssClass);

    var item = _createGutterItem.item;
    var dispose = _createGutterItem.dispose;

    var gutterMarker = editor.markBufferPosition([row, 0]);
    gutter.decorateMarker(gutterMarker, { item: item });
    gutterMarker.onDidDestroy(dispose);
    markers.add(gutterMarker);
  }

  editorToMarkers.set(editor, markers);

  // Once the gutter is shown for the first time, it is displayed for the lifetime of the TextEditor.
  if (update.messages.length > 0) {
    gutter.show();
  }
}

function createGutterItem(messages, gutterMarkerCssClass) {
  var item = window.document.createElement('span');
  item.innerText = '▶'; // Unicode character for a right-pointing triangle.
  item.className = gutterMarkerCssClass;
  var popupElement;
  item.addEventListener('mouseenter', function (event) {
    popupElement = showPopupFor(messages, item);
  });
  var dispose = function dispose() {
    if (popupElement) {
      React.unmountComponentAtNode(popupElement);
      popupElement.parentNode.removeChild(popupElement);
      popupElement = null;
    }
  };
  item.addEventListener('mouseleave', dispose);
  return { item: item, dispose: dispose };
}

/**
 * Shows a popup for the diagnostic just below the specified item.
 */
function showPopupFor(messages, item) {
  var children = messages.map(function (message) {
    var contents;
    if (message.html) {
      contents = React.createElement('span', { dangerouslySetInnerHTML: { __html: message.html } });
    } else if (message.text) {
      contents = React.createElement(
        'span',
        null,
        message.providerName + ': ' + message.text
      );
    } else {
      contents = React.createElement(
        'span',
        null,
        'Diagnostic lacks message.'
      );
    }

    var diagnosticTypeClass = message.type === 'Error' ? 'nuclide-diagnostics-gutter-ui-popup-error' : 'nuclide-diagnostics-gutter-ui-popup-warning';
    return React.createElement(
      'div',
      { className: 'nuclide-diagnostics-gutter-ui-popup-diagnostic ' + diagnosticTypeClass },
      contents
    );
  });

  // The popup will be an absolutely positioned child element of <atom-workspace> so that it appears
  // on top of everything.
  var workspaceElement = atom.views.getView(atom.workspace);
  var hostElement = window.document.createElement('div');
  workspaceElement.parentNode.appendChild(hostElement);

  // Move it down vertically so it does not end up under the mouse pointer.

  var _item$getBoundingClientRect = item.getBoundingClientRect();

  var top = _item$getBoundingClientRect.top;
  var left = _item$getBoundingClientRect.left;

  top += 15;

  React.render(React.createElement(
    DiagnosticsPopup,
    { left: left, top: top },
    children
  ), hostElement);

  return hostElement;
}

var DiagnosticsPopup = (function (_React$Component) {
  _inherits(DiagnosticsPopup, _React$Component);

  function DiagnosticsPopup() {
    _classCallCheck(this, DiagnosticsPopup);

    _get(Object.getPrototypeOf(DiagnosticsPopup.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(DiagnosticsPopup, [{
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        {
          className: 'nuclide-diagnostics-gutter-ui-popup',
          style: { left: this.props.left + 'px', top: this.props.top + 'px' }
        },
        this.props.children
      );
    }
  }]);

  return DiagnosticsPopup;
})(React.Component);

var PropTypes = React.PropTypes;

DiagnosticsPopup.propTypes = {
  children: PropTypes.node,
  left: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired
};

module.exports = {
  applyUpdateToEditor: applyUpdateToEditor
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWRpYWdub3N0aWNzLXVpL2xpYi9ndXR0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVVaLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOztBQUV0QyxJQUFJLFNBQVMsR0FBRyw0QkFBNEIsQ0FBQzs7Ozs7Ozs7Ozs7O0FBWTdDLElBQUksYUFBYSxHQUFHLHlDQUF5QyxDQUFDOztBQUU5RCxJQUFJLG1CQUFtQixHQUFHLCtDQUErQyxDQUFDO0FBQzFFLElBQUkscUJBQXFCLEdBQUcsaURBQWlELENBQUM7O0FBRTlFLElBQUksZ0JBQWdCLEdBQUcsNENBQTRDLENBQUM7QUFDcEUsSUFBSSxrQkFBa0IsR0FBRyw4Q0FBOEMsQ0FBQzs7QUFFeEUsSUFBSSxlQUFzRCxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7O0FBRTNFLFNBQVMsbUJBQW1CLENBQUMsTUFBa0IsRUFBRSxNQUF5QixFQUFRO0FBQ2hGLE1BQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDOUMsTUFBSSxDQUFDLE1BQU0sRUFBRTs7Ozs7Ozs7QUFRWCxVQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUN4QixVQUFJLEVBQUUsU0FBUztBQUNmLGFBQU8sRUFBRSxLQUFLO0tBQ2YsQ0FBQyxDQUFDO0dBQ0o7O0FBRUQsTUFBSSxNQUFNLENBQUM7QUFDWCxNQUFJLE9BQU8sR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7O0FBSTFDLE1BQUksT0FBTyxFQUFFO0FBQ1gsU0FBSyxNQUFNLElBQUksT0FBTyxFQUFFO0FBQ3RCLFlBQU0sQ0FBQyxPQUFPLEVBQUUsQ0FB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SUFBSSxHQUFHLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxFQUFDLEFBQUM7O1FBRWpFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUTtPQUNoQixDQUNOO0tBQ0g7OztTQVhHLGdCQUFnQjtHQUFTLEtBQUssQ0FBQyxTQUFTOztJQWN6QyxTQUFTLEdBQUksS0FBSyxDQUFsQixTQUFTOztBQUVkLGdCQUFnQixDQUFDLFNBQVMsR0FBRztBQUMzQixVQUFRLEVBQUUsU0FBUyxDQUFDLElBQUk7QUFDeEIsTUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVTtBQUNqQyxLQUFHLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVO0NBQ2pDLENBQUM7O0FBRUYsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLHFCQUFtQixFQUFuQixtQkFBbUI7Q0FDcEIsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1kaWFnbm9zdGljcy11aS9saWIvZ3V0dGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG5cbnZhciBHVVRURVJfSUQgPSAnbnVjbGlkZS1kaWFnbm9zdGljcy1ndXR0ZXInO1xuXG4vLyBUT0RPKG1ib2xpbik6IE1ha2UgaXQgc28gdGhhdCB3aGVuIG1vdXNpbmcgb3ZlciBhbiBlbGVtZW50IHdpdGggdGhpcyBDU1MgY2xhc3MgKG9yIHNwZWNpZmljYWxseSxcbi8vIHRoZSBjaGlsZCBlbGVtZW50IHdpdGggdGhlIFwicmVnaW9uXCIgQ1NTIGNsYXNzKSwgd2UgYWxzbyBkbyBhIHNob3dQb3B1cEZvcigpLiBUaGlzIHNlZW1zIHRvIGJlXG4vLyB0cmlja3kgZ2l2ZW4gaG93IHRoZSBET00gb2YgYSBUZXh0RWRpdG9yIHdvcmtzIHRvZGF5LiBUaGVyZSBhcmUgZGl2LnRpbGUgZWxlbWVudHMsIGVhY2ggb2Ygd2hpY2hcbi8vIGhhcyBpdHMgb3duIGRpdi5oaWdobGlnaHRzIGVsZW1lbnQgYW5kIG1hbnkgZGl2LmxpbmUgZWxlbWVudHMuIFRoZSBkaXYuaGlnaGxpZ2h0cyBlbGVtZW50IGhhcyAwXG4vLyBvciBtb3JlIGNoaWxkcmVuLCBlYWNoIGNoaWxkIGJlaW5nIGEgZGl2LmhpZ2hsaWdodCB3aXRoIGEgY2hpbGQgZGl2LnJlZ2lvbi4gVGhlIGRpdi5yZWdpb25cbi8vIGVsZW1lbnQgaXMgZGVmaW5lZCB0byBiZSB7cG9zaXRpb246IGFic29sdXRlOyBwb2ludGVyLWV2ZW50czogbm9uZTsgei1pbmRleDogLTF9LiBUaGUgYWJzb2x1dGVcbi8vIHBvc2l0aW9uaW5nIGFuZCBuZWdhdGl2ZSB6LWluZGV4IG1ha2UgaXQgc28gaXQgaXNuJ3QgZWxpZ2libGUgZm9yIG1vdXNlb3ZlciBldmVudHMsIHNvIHdlXG4vLyBtaWdodCBoYXZlIHRvIGxpc3RlbiBmb3IgbW91c2VvdmVyIGV2ZW50cyBvbiBUZXh0RWRpdG9yIGFuZCB0aGVuIHVzZSBpdHMgb3duIEFQSXMsIHN1Y2ggYXNcbi8vIGRlY29yYXRpb25zRm9yU2NyZWVuUm93UmFuZ2UoKSwgdG8gc2VlIGlmIHRoZXJlIGlzIGEgaGl0IHRhcmdldCBpbnN0ZWFkLiBTaW5jZSB0aGlzIHdpbGwgYmVcbi8vIGhhcHBlbmluZyBvbm1vdXNlbW92ZSwgd2UgYWxzbyBoYXZlIHRvIGJlIGNhcmVmdWwgdG8gbWFrZSBzdXJlIHRoaXMgaXMgbm90IGV4cGVuc2l2ZS5cbnZhciBISUdITElHSFRfQ1NTID0gJ251Y2xpZGUtZGlhZ25vc3RpY3MtZ3V0dGVyLXVpLWhpZ2hsaWdodCc7XG5cbnZhciBFUlJPUl9ISUdITElHSFRfQ1NTID0gJ251Y2xpZGUtZGlhZ25vc3RpY3MtZ3V0dGVyLXVpLWhpZ2hsaWdodC1lcnJvcic7XG52YXIgV0FSTklOR19ISUdITElHSFRfQ1NTID0gJ251Y2xpZGUtZGlhZ25vc3RpY3MtZ3V0dGVyLXVpLWhpZ2hsaWdodC13YXJuaW5nJztcblxudmFyIEVSUk9SX0dVVFRFUl9DU1MgPSAnbnVjbGlkZS1kaWFnbm9zdGljcy1ndXR0ZXItdWktZ3V0dGVyLWVycm9yJztcbnZhciBXQVJOSU5HX0dVVFRFUl9DU1MgPSAnbnVjbGlkZS1kaWFnbm9zdGljcy1ndXR0ZXItdWktZ3V0dGVyLXdhcm5pbmcnO1xuXG52YXIgZWRpdG9yVG9NYXJrZXJzOiBXZWFrTWFwPFRleHRFZGl0b3IsIFNldDxhdG9tJE1hcmtlcj4+ID0gbmV3IFdlYWtNYXAoKTtcblxuZnVuY3Rpb24gYXBwbHlVcGRhdGVUb0VkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IsIHVwZGF0ZTogRmlsZU1lc3NhZ2VVcGRhdGUpOiB2b2lkIHtcbiAgdmFyIGd1dHRlciA9IGVkaXRvci5ndXR0ZXJXaXRoTmFtZShHVVRURVJfSUQpO1xuICBpZiAoIWd1dHRlcikge1xuICAgIC8vIFRPRE8oamVzc2ljYWxpbik6IERldGVybWluZSBhbiBhcHByb3ByaWF0ZSBwcmlvcml0eSBzbyB0aGF0IHRoZSBndXR0ZXI6XG4gICAgLy8gKDEpIFNob3dzIHVwIHRvIHRoZSByaWdodCBvZiB0aGUgbGluZSBudW1iZXJzLlxuICAgIC8vICgyKSBTaG93cyB0aGUgaXRlbXMgdGhhdCBhcmUgYWRkZWQgdG8gaXQgcmlnaHQgYXdheS5cbiAgICAvLyBVc2luZyBhIHZhbHVlIG9mIDEwIGZpeGVzICgxKSwgYnV0IGJyZWFrcyAoMikuIFRoaXMgc2VlbXMgbGlrZSBpdCBpcyBsaWtlbHkgYSBidWcgaW4gQXRvbS5cblxuICAgIC8vIEJ5IGRlZmF1bHQsIGEgZ3V0dGVyIHdpbGwgYmUgZGVzdHJveWVkIHdoZW4gaXRzIGVkaXRvciBpcyBkZXN0cm95ZWQsXG4gICAgLy8gc28gdGhlcmUgaXMgbm8gbmVlZCB0byByZWdpc3RlciBhIGNhbGxiYWNrIHZpYSBvbkRpZERlc3Ryb3koKS5cbiAgICBndXR0ZXIgPSBlZGl0b3IuYWRkR3V0dGVyKHtcbiAgICAgIG5hbWU6IEdVVFRFUl9JRCxcbiAgICAgIHZpc2libGU6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgdmFyIG1hcmtlcjtcbiAgdmFyIG1hcmtlcnMgPSBlZGl0b3JUb01hcmtlcnMuZ2V0KGVkaXRvcik7XG5cbiAgLy8gVE9ETzogQ29uc2lkZXIgYSBtb3JlIGVmZmljaWVudCBzdHJhdGVneSB0aGF0IGRvZXMgbm90IGJsaW5kbHkgZGVzdHJveSBhbGwgb2YgdGhlXG4gIC8vIGV4aXN0aW5nIG1hcmtlcnMuXG4gIGlmIChtYXJrZXJzKSB7XG4gICAgZm9yIChtYXJrZXIgb2YgbWFya2Vycykge1xuICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICB9XG4gICAgbWFya2Vycy5jbGVhcigpO1xuICB9IGVsc2Uge1xuICAgIG1hcmtlcnMgPSBuZXcgU2V0KCk7XG4gIH1cblxuICB2YXIgcm93VG9NZXNzYWdlOiBNYXA8bnVtYmVyLCBBcnJheTxGaWxlRGlhZ25vc3RpY01lc3NhZ2U+PiA9IG5ldyBNYXAoKTtcbiAgZnVuY3Rpb24gYWRkTWVzc2FnZUZvclJvdyhtZXNzYWdlOiBGaWxlRGlhZ25vc3RpY01lc3NhZ2UsIHJvdzogbnVtYmVyKSB7XG4gICAgdmFyIG1lc3NhZ2VzID0gcm93VG9NZXNzYWdlLmdldChyb3cpO1xuICAgIGlmICghbWVzc2FnZXMpIHtcbiAgICAgIG1lc3NhZ2VzID0gW107XG4gICAgICByb3dUb01lc3NhZ2Uuc2V0KHJvdywgbWVzc2FnZXMpO1xuICAgIH1cbiAgICBtZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICB9XG5cbiAgZm9yICh2YXIgbWVzc2FnZSBvZiB1cGRhdGUubWVzc2FnZXMpIHtcbiAgICB2YXIgcmFuZ2UgPSBtZXNzYWdlLnJhbmdlO1xuICAgIHZhciBoaWdobGlnaHRNYXJrZXI7XG4gICAgaWYgKHJhbmdlKSB7XG4gICAgICBhZGRNZXNzYWdlRm9yUm93KG1lc3NhZ2UsIHJhbmdlLnN0YXJ0LnJvdyk7XG4gICAgICBoaWdobGlnaHRNYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWRkTWVzc2FnZUZvclJvdyhtZXNzYWdlLCAwKTtcbiAgICB9XG5cbiAgICB2YXIgaGlnaGxpZ2h0Q3NzQ2xhc3M7XG4gICAgdmFyIGd1dHRlck1hcmtlckNzc0NsYXNzO1xuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdFcnJvcicpIHtcbiAgICAgIGhpZ2hsaWdodENzc0NsYXNzID0gSElHSExJR0hUX0NTUyArICcgJyArIEVSUk9SX0hJR0hMSUdIVF9DU1M7XG4gICAgICBndXR0ZXJNYXJrZXJDc3NDbGFzcyA9IEVSUk9SX0dVVFRFUl9DU1M7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZ2hsaWdodENzc0NsYXNzID0gSElHSExJR0hUX0NTUyArICcgJyArIFdBUk5JTkdfSElHSExJR0hUX0NTUztcbiAgICAgIGd1dHRlck1hcmtlckNzc0NsYXNzID0gV0FSTklOR19HVVRURVJfQ1NTO1xuICAgIH1cblxuICAgIC8vIFRoaXMgbWFya2VyIHVuZGVybGluZXMgdGV4dC5cbiAgICBpZiAoaGlnaGxpZ2h0TWFya2VyKSB7XG4gICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIoaGlnaGxpZ2h0TWFya2VyLCB7XG4gICAgICAgIHR5cGU6ICdoaWdobGlnaHQnLFxuICAgICAgICBjbGFzczogaGlnaGxpZ2h0Q3NzQ2xhc3MsXG4gICAgICB9KTtcbiAgICAgIG1hcmtlcnMuYWRkKGhpZ2hsaWdodE1hcmtlcik7XG4gICAgfVxuICB9XG5cbiAgLy8gRmluZCBhbGwgb2YgdGhlIGd1dHRlciBtYXJrZXJzIGZvciB0aGUgc2FtZSByb3cgYW5kIGNvbWJpbmUgdGhlbSBpbnRvIG9uZSBtYXJrZXIvcG9wdXAuXG4gIGZvciAodmFyIFtyb3csIG1lc3NhZ2VzXSBvZiByb3dUb01lc3NhZ2UuZW50cmllcygpKSB7XG4gICAgLy8gSWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBkaWFnbm9zdGljcyBpcyBhbiBlcnJvciByYXRoZXIgdGhhbiB0aGUgd2FybmluZyxcbiAgICAvLyBkaXNwbGF5IHRoZSBnbHlwaCBpbiB0aGUgZ3V0dGVyIHRvIHJlcHJlc2VudCBhbiBlcnJvciByYXRoZXIgdGhhbiBhIHdhcm5pbmcuXG4gICAgdmFyIGd1dHRlck1hcmtlckNzc0NsYXNzID0gbWVzc2FnZXMuc29tZShtc2cgPT4gbXNnLnR5cGUgPT09ICdFcnJvcicpXG4gICAgICA/IEVSUk9SX0dVVFRFUl9DU1NcbiAgICAgIDogV0FSTklOR19HVVRURVJfQ1NTO1xuXG4gICAgLy8gVGhpcyBtYXJrZXIgYWRkcyBzb21lIFVJIHRvIHRoZSBndXR0ZXIuXG4gICAgdmFyIHtpdGVtLCBkaXNwb3NlfSA9IGNyZWF0ZUd1dHRlckl0ZW0obWVzc2FnZXMsIGd1dHRlck1hcmtlckNzc0NsYXNzKTtcbiAgICB2YXIgZ3V0dGVyTWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJQb3NpdGlvbihbcm93LCAwXSk7XG4gICAgZ3V0dGVyLmRlY29yYXRlTWFya2VyKGd1dHRlck1hcmtlciwge2l0ZW19KTtcbiAgICBndXR0ZXJNYXJrZXIub25EaWREZXN0cm95KGRpc3Bvc2UpO1xuICAgIG1hcmtlcnMuYWRkKGd1dHRlck1hcmtlcik7XG4gIH1cblxuICBlZGl0b3JUb01hcmtlcnMuc2V0KGVkaXRvciwgbWFya2Vycyk7XG5cbiAgLy8gT25jZSB0aGUgZ3V0dGVyIGlzIHNob3duIGZvciB0aGUgZmlyc3QgdGltZSwgaXQgaXMgZGlzcGxheWVkIGZvciB0aGUgbGlmZXRpbWUgb2YgdGhlIFRleHRFZGl0b3IuXG4gIGlmICh1cGRhdGUubWVzc2FnZXMubGVuZ3RoID4gMCkge1xuICAgIGd1dHRlci5zaG93KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlR3V0dGVySXRlbShcbiAgbWVzc2FnZXM6IEFycmF5PEZpbGVEaWFnbm9zdGljTWVzc2FnZT4sXG4gIGd1dHRlck1hcmtlckNzc0NsYXNzOiBzdHJpbmdcbik6IHtpdGVtOiBIVE1MRWxlbWVudDsgZGlzcG9zZTogKCkgPT4gdm9pZH0ge1xuICB2YXIgaXRlbSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGl0ZW0uaW5uZXJUZXh0ID0gJ1xcdTI1QjYnOyAvLyBVbmljb2RlIGNoYXJhY3RlciBmb3IgYSByaWdodC1wb2ludGluZyB0cmlhbmdsZS5cbiAgaXRlbS5jbGFzc05hbWUgPSBndXR0ZXJNYXJrZXJDc3NDbGFzcztcbiAgdmFyIHBvcHVwRWxlbWVudDtcbiAgaXRlbS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgZXZlbnQgPT4ge1xuICAgIHBvcHVwRWxlbWVudCA9IHNob3dQb3B1cEZvcihtZXNzYWdlcywgaXRlbSk7XG4gIH0pO1xuICB2YXIgZGlzcG9zZSA9ICgpID0+IHtcbiAgICBpZiAocG9wdXBFbGVtZW50KSB7XG4gICAgICBSZWFjdC51bm1vdW50Q29tcG9uZW50QXROb2RlKHBvcHVwRWxlbWVudCk7XG4gICAgICBwb3B1cEVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwb3B1cEVsZW1lbnQpO1xuICAgICAgcG9wdXBFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH07XG4gIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIGRpc3Bvc2UpO1xuICByZXR1cm4ge2l0ZW0sIGRpc3Bvc2V9O1xufVxuXG4vKipcbiAqIFNob3dzIGEgcG9wdXAgZm9yIHRoZSBkaWFnbm9zdGljIGp1c3QgYmVsb3cgdGhlIHNwZWNpZmllZCBpdGVtLlxuICovXG5mdW5jdGlvbiBzaG93UG9wdXBGb3IoXG4gICAgbWVzc2FnZXM6IEFycmF5PEZpbGVEaWFnbm9zdGljTWVzc2FnZT4sXG4gICAgaXRlbTogSFRNTEVsZW1lbnRcbiAgICApOiBIVE1MRWxlbWVudCB7XG4gIHZhciBjaGlsZHJlbiA9IG1lc3NhZ2VzLm1hcChtZXNzYWdlID0+IHtcbiAgICB2YXIgY29udGVudHM7XG4gICAgaWYgKG1lc3NhZ2UuaHRtbCkge1xuICAgICAgY29udGVudHMgPSA8c3BhbiBkYW5nZXJvdXNseVNldElubmVySFRNTD17e19faHRtbDogbWVzc2FnZS5odG1sfX0gLz47XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnRleHQpIHtcbiAgICAgIGNvbnRlbnRzID0gPHNwYW4+e2Ake21lc3NhZ2UucHJvdmlkZXJOYW1lfTogJHttZXNzYWdlLnRleHR9YH08L3NwYW4+O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZW50cyA9IDxzcGFuPkRpYWdub3N0aWMgbGFja3MgbWVzc2FnZS48L3NwYW4+O1xuICAgIH1cblxuICAgIHZhciBkaWFnbm9zdGljVHlwZUNsYXNzID0gbWVzc2FnZS50eXBlID09PSAnRXJyb3InXG4gICAgICA/ICdudWNsaWRlLWRpYWdub3N0aWNzLWd1dHRlci11aS1wb3B1cC1lcnJvcidcbiAgICAgIDogJ251Y2xpZGUtZGlhZ25vc3RpY3MtZ3V0dGVyLXVpLXBvcHVwLXdhcm5pbmcnO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YG51Y2xpZGUtZGlhZ25vc3RpY3MtZ3V0dGVyLXVpLXBvcHVwLWRpYWdub3N0aWMgJHtkaWFnbm9zdGljVHlwZUNsYXNzfWB9PlxuICAgICAgICB7Y29udGVudHN9XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9KTtcblxuICAvLyBUaGUgcG9wdXAgd2lsbCBiZSBhbiBhYnNvbHV0ZWx5IHBvc2l0aW9uZWQgY2hpbGQgZWxlbWVudCBvZiA8YXRvbS13b3Jrc3BhY2U+IHNvIHRoYXQgaXQgYXBwZWFyc1xuICAvLyBvbiB0b3Agb2YgZXZlcnl0aGluZy5cbiAgdmFyIHdvcmtzcGFjZUVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpO1xuICB2YXIgaG9zdEVsZW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHdvcmtzcGFjZUVsZW1lbnQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChob3N0RWxlbWVudCk7XG5cbiAgLy8gTW92ZSBpdCBkb3duIHZlcnRpY2FsbHkgc28gaXQgZG9lcyBub3QgZW5kIHVwIHVuZGVyIHRoZSBtb3VzZSBwb2ludGVyLlxuICB2YXIge3RvcCwgbGVmdH0gPSBpdGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB0b3AgKz0gMTU7XG5cbiAgUmVhY3QucmVuZGVyKFxuICAgIDxEaWFnbm9zdGljc1BvcHVwIGxlZnQ9e2xlZnR9IHRvcD17dG9wfT5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L0RpYWdub3N0aWNzUG9wdXA+LFxuICAgIGhvc3RFbGVtZW50KTtcblxuICByZXR1cm4gaG9zdEVsZW1lbnQ7XG59XG5cbmNsYXNzIERpYWdub3N0aWNzUG9wdXAgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdlxuICAgICAgICBjbGFzc05hbWU9XCJudWNsaWRlLWRpYWdub3N0aWNzLWd1dHRlci11aS1wb3B1cFwiXG4gICAgICAgIHN0eWxlPXt7bGVmdDogdGhpcy5wcm9wcy5sZWZ0ICsgJ3B4JywgdG9wOiB0aGlzLnByb3BzLnRvcCArICdweCd9fVxuICAgICAgICA+XG4gICAgICAgIHt0aGlzLnByb3BzLmNoaWxkcmVufVxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufVxuXG52YXIge1Byb3BUeXBlc30gPSBSZWFjdDtcblxuRGlhZ25vc3RpY3NQb3B1cC5wcm9wVHlwZXMgPSB7XG4gIGNoaWxkcmVuOiBQcm9wVHlwZXMubm9kZSxcbiAgbGVmdDogUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICB0b3A6IFByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhcHBseVVwZGF0ZVRvRWRpdG9yLFxufTtcbiJdfQ==
