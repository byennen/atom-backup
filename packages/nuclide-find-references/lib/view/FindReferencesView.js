var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

'use babel';

var React = require('react-for-atom');
var FileReferencesView = require('./FileReferencesView');
var FindReferencesModel = require('../FindReferencesModel');

// Number of files to show on every page.
var PAGE_SIZE = 10;
// Start loading more once the user scrolls within this many pixels of the bottom.
var SCROLL_LOAD_THRESHOLD = 250;

function pluralize(noun, count) {
  return count === 1 ? noun : noun + 's';
}

var FindReferencesView = React.createClass({
  displayName: 'FindReferencesView',

  propTypes: {
    model: React.PropTypes.objectOf(FindReferencesModel).isRequired
  },

  getInitialState: function getInitialState() {
    var references = [];
    return {
      loading: true,
      fetched: 0,
      references: references
    };
  },

  componentDidMount: function componentDidMount() {
    this._fetchMore(PAGE_SIZE);
  },

  _fetchMore: _asyncToGenerator(function* (count) {
    var next = yield this.props.model.getFileReferences(this.state.fetched, PAGE_SIZE);
    this.setState({
      loading: false,
      fetched: this.state.fetched + PAGE_SIZE,
      references: this.state.references.concat(next)
    });
  }),

  _onScroll: function _onScroll(evt) {
    var root = this.refs.root.getDOMNode();
    if (this.state.loading || root.clientHeight >= root.scrollHeight) {
      return;
    }
    var scrollBottom = root.scrollTop + root.clientHeight;
    if (root.scrollHeight - scrollBottom <= SCROLL_LOAD_THRESHOLD) {
      this.setState({ loading: true });
      this._fetchMore(PAGE_SIZE);
    }
  },

  render: function render() {
    var _this = this;

    var children = this.state.references.map(function (fileRefs, i) {
      return React.createElement(FileReferencesView, _extends({
        key: i
      }, fileRefs, {
        basePath: _this.props.model.getBasePath()
      }));
    });

    var refCount = this.props.model.getReferenceCount();
    var fileCount = this.props.model.getFileCount();
    if (this.state.fetched < fileCount) {
      children.push(React.createElement('div', {
        key: 'loading',
        className: 'nuclide-find-references-loading loading-spinner-medium'
      }));
    }

    return React.createElement(
      'div',
      { className: 'nuclide-find-references', onScroll: this._onScroll, ref: 'root' },
      React.createElement(
        'div',
        { className: 'nuclide-find-references-count' },
        'Found ',
        refCount,
        ' ',
        pluralize('reference', refCount),
        ' ',
        'in ',
        fileCount,
        ' ',
        pluralize('file', fileCount),
        '.'
      ),
      children
    );
  }

});

module.exports = FindReferencesView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWZpbmQtcmVmZXJlbmNlcy9saWIvdmlldy9GaW5kUmVmZXJlbmNlc1ZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsV0FBVyxDQUFDOztBQWFaLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3RDLElBQUksa0JBQWtCLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDekQsSUFBSSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQzs7O0FBRzVELElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQzs7QUFFbkIsSUFBSSxxQkFBcUIsR0FBRyxHQUFHLENBQUM7O0FBRWhDLFNBQVMsU0FBUyxDQUFDLElBQVksRUFBRSxLQUFhLEVBQUU7QUFDOUMsU0FBTyxLQUFLLEtBQUssQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDO0NBQ3hDOztBQUVELElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQzs7O0FBRXpDLFdBQVMsRUFBRTtBQUNULFNBQUssRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLFVBQVU7R0FDaEU7O0FBRUQsaUJBQWUsRUFBQSwyQkFBRztBQUNoQixRQUFJLFVBQWlDLEdBQUcsRUFBRSxDQUFDO0FBQzNDLFdBQU87QUFDTCxhQUFPLEVBQUUsSUFBSTtBQUNiLGFBQU8sRUFBRSxDQUFDO0FBQ1YsZ0JBQVUsRUFBVixVQUFVO0tBQ1gsQ0FBQztHQUNIOztBQUVELG1CQUFpQixFQUFBLDZCQUFHO0FBQ2xCLFFBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7R0FDNUI7O0FBRUQsQUFBTSxZQUFVLG9CQUFBLFdBQUMsS0FBYSxFQUFpQjtBQUM3QyxRQUFJLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUNqRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFDbEIsU0FBUyxDQUNWLENBQUM7QUFDRixRQUFJLENBQUMsUUFBUSxDQUFDO0FBQ1osYUFBTyxFQUFFLEtBQUs7QUFDZCxhQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUztBQUN2QyxnQkFBVSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7S0FDL0MsQ0FBQyxDQUFDO0dBQ0osQ0FBQTs7QUFFRCxXQUFTLEVBQUEsbUJBQUMsR0FBVSxFQUFFO0FBQ3BCLFFBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ3ZDLFFBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFO0FBQ2hFLGFBQU87S0FDUjtBQUNELFFBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztBQUN0RCxRQUFJLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxJQUFJLHFCQUFxQixFQUFFO0FBQzdELFVBQUksQ0FBQyxRQUFRLENBQUMsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUMvQixVQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQzVCO0dBQ0Y7O0FBRUQsUUFBTSxFQUFBLGtCQUFpQjs7O0FBQ3JCLFFBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFDLFFBQVEsRUFBRSxDQUFDO2FBQ25ELG9CQUFDLGtCQUFrQjtBQUNqQixXQUFHLEVBQUUsQ0FBQyxBQUFDO1NBQ0gsUUFBUTtBQUNaLGdCQUFRLEVBQUUsTUFBSyxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxBQUFDO1NBQ3pDO0tBQUEsQ0FDSCxDQUFDOztBQUVGLFFBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFDcEQsUUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDaEQsUUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxTQUFTLEVBQUU7QUFDbEMsY0FBUSxDQUFDLElBQUksQ0FDWDtBQUNFLFdBQUcsRUFBQyxTQUFTO0FBQ2IsaUJBQVMsRUFBQyx3REFBd0Q7UUFDbEUsQ0FDSCxDQUFDO0tBQ0g7O0FBRUQsV0FDRTs7UUFBSyxTQUFTLEVBQUMseUJBQXlCLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEFBQUMsRUFBQyxHQUFHLEVBQUMsTUFBTTtNQUMzRTs7VUFBSyxTQUFTLEVBQUMsK0JBQStCOztRQUNyQyxRQUFROztRQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDO1FBQUUsR0FBRzs7UUFDbkQsU0FBUzs7UUFBRyxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQzs7T0FDeEM7TUFDTCxRQUFRO0tBQ0wsQ0FDTjtHQUNIOztDQUVGLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLGtCQUFrQixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWZpbmQtcmVmZXJlbmNlcy9saWIvdmlldy9GaW5kUmVmZXJlbmNlc1ZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7RmlsZVJlZmVyZW5jZXN9IGZyb20gJy4uL3R5cGVzJztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcbnZhciBGaWxlUmVmZXJlbmNlc1ZpZXcgPSByZXF1aXJlKCcuL0ZpbGVSZWZlcmVuY2VzVmlldycpO1xudmFyIEZpbmRSZWZlcmVuY2VzTW9kZWwgPSByZXF1aXJlKCcuLi9GaW5kUmVmZXJlbmNlc01vZGVsJyk7XG5cbi8vIE51bWJlciBvZiBmaWxlcyB0byBzaG93IG9uIGV2ZXJ5IHBhZ2UuXG52YXIgUEFHRV9TSVpFID0gMTA7XG4vLyBTdGFydCBsb2FkaW5nIG1vcmUgb25jZSB0aGUgdXNlciBzY3JvbGxzIHdpdGhpbiB0aGlzIG1hbnkgcGl4ZWxzIG9mIHRoZSBib3R0b20uXG52YXIgU0NST0xMX0xPQURfVEhSRVNIT0xEID0gMjUwO1xuXG5mdW5jdGlvbiBwbHVyYWxpemUobm91bjogc3RyaW5nLCBjb3VudDogbnVtYmVyKSB7XG4gIHJldHVybiBjb3VudCA9PT0gMSA/IG5vdW4gOiBub3VuICsgJ3MnO1xufVxuXG52YXIgRmluZFJlZmVyZW5jZXNWaWV3ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIHByb3BUeXBlczoge1xuICAgIG1vZGVsOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0T2YoRmluZFJlZmVyZW5jZXNNb2RlbCkuaXNSZXF1aXJlZCxcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgdmFyIHJlZmVyZW5jZXM6IEFycmF5PEZpbGVSZWZlcmVuY2VzPiA9IFtdO1xuICAgIHJldHVybiB7XG4gICAgICBsb2FkaW5nOiB0cnVlLFxuICAgICAgZmV0Y2hlZDogMCxcbiAgICAgIHJlZmVyZW5jZXMsXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICB0aGlzLl9mZXRjaE1vcmUoUEFHRV9TSVpFKTtcbiAgfSxcblxuICBhc3luYyBfZmV0Y2hNb3JlKGNvdW50OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB2YXIgbmV4dCA9IGF3YWl0IHRoaXMucHJvcHMubW9kZWwuZ2V0RmlsZVJlZmVyZW5jZXMoXG4gICAgICB0aGlzLnN0YXRlLmZldGNoZWQsXG4gICAgICBQQUdFX1NJWkVcbiAgICApO1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICBmZXRjaGVkOiB0aGlzLnN0YXRlLmZldGNoZWQgKyBQQUdFX1NJWkUsXG4gICAgICByZWZlcmVuY2VzOiB0aGlzLnN0YXRlLnJlZmVyZW5jZXMuY29uY2F0KG5leHQpLFxuICAgIH0pO1xuICB9LFxuXG4gIF9vblNjcm9sbChldnQ6IEV2ZW50KSB7XG4gICAgdmFyIHJvb3QgPSB0aGlzLnJlZnMucm9vdC5nZXRET01Ob2RlKCk7XG4gICAgaWYgKHRoaXMuc3RhdGUubG9hZGluZyB8fCByb290LmNsaWVudEhlaWdodCA+PSByb290LnNjcm9sbEhlaWdodCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgc2Nyb2xsQm90dG9tID0gcm9vdC5zY3JvbGxUb3AgKyByb290LmNsaWVudEhlaWdodDtcbiAgICBpZiAocm9vdC5zY3JvbGxIZWlnaHQgLSBzY3JvbGxCb3R0b20gPD0gU0NST0xMX0xPQURfVEhSRVNIT0xEKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtsb2FkaW5nOiB0cnVlfSk7XG4gICAgICB0aGlzLl9mZXRjaE1vcmUoUEFHRV9TSVpFKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyKCk6IFJlYWN0RWxlbWVudCB7XG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5zdGF0ZS5yZWZlcmVuY2VzLm1hcCgoZmlsZVJlZnMsIGkpID0+XG4gICAgICA8RmlsZVJlZmVyZW5jZXNWaWV3XG4gICAgICAgIGtleT17aX1cbiAgICAgICAgey4uLmZpbGVSZWZzfVxuICAgICAgICBiYXNlUGF0aD17dGhpcy5wcm9wcy5tb2RlbC5nZXRCYXNlUGF0aCgpfVxuICAgICAgLz5cbiAgICApO1xuXG4gICAgdmFyIHJlZkNvdW50ID0gdGhpcy5wcm9wcy5tb2RlbC5nZXRSZWZlcmVuY2VDb3VudCgpO1xuICAgIHZhciBmaWxlQ291bnQgPSB0aGlzLnByb3BzLm1vZGVsLmdldEZpbGVDb3VudCgpO1xuICAgIGlmICh0aGlzLnN0YXRlLmZldGNoZWQgPCBmaWxlQ291bnQpIHtcbiAgICAgIGNoaWxkcmVuLnB1c2goXG4gICAgICAgIDxkaXZcbiAgICAgICAgICBrZXk9XCJsb2FkaW5nXCJcbiAgICAgICAgICBjbGFzc05hbWU9XCJudWNsaWRlLWZpbmQtcmVmZXJlbmNlcy1sb2FkaW5nIGxvYWRpbmctc3Bpbm5lci1tZWRpdW1cIlxuICAgICAgICAvPlxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJudWNsaWRlLWZpbmQtcmVmZXJlbmNlc1wiIG9uU2Nyb2xsPXt0aGlzLl9vblNjcm9sbH0gcmVmPVwicm9vdFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm51Y2xpZGUtZmluZC1yZWZlcmVuY2VzLWNvdW50XCI+XG4gICAgICAgICAgRm91bmQge3JlZkNvdW50fSB7cGx1cmFsaXplKCdyZWZlcmVuY2UnLCByZWZDb3VudCl9eycgJ31cbiAgICAgICAgICBpbiB7ZmlsZUNvdW50fSB7cGx1cmFsaXplKCdmaWxlJywgZmlsZUNvdW50KX0uXG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7Y2hpbGRyZW59XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbmRSZWZlcmVuY2VzVmlldztcbiJdfQ==
