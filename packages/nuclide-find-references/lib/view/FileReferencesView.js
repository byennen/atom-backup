var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

'use babel';

var React = require('react-for-atom');
var FilePreview = require('./FilePreview');

var _require = require('nuclide-remote-uri');

var relative = _require.relative;

var FileReferencesView = React.createClass({
  displayName: 'FileReferencesView',

  propTypes: {
    uri: React.PropTypes.string.isRequired,
    grammar: React.PropTypes.object.isRequired,
    previewText: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    refGroups: React.PropTypes.arrayOf(React.PropTypes.object /*ReferenceGroup*/).isRequired,
    basePath: React.PropTypes.string.isRequired
  },

  _onRefClick: function _onRefClick(ref) {
    atom.workspace.open(this.props.uri, {
      initialLine: ref.start.line - 1,
      initialColumn: ref.start.column - 1
    });
  },

  _onFileClick: function _onFileClick() {
    atom.workspace.open(this.props.uri);
  },

  render: function render() {
    var _this = this;

    var groups = this.props.refGroups.map(function (group, i) {
      var previewText = _this.props.previewText[i];
      var ranges = group.references.map(function (ref, j) {
        var range = ref.start.line;
        if (ref.end.line !== ref.start.line) {
          range += '-' + ref.end.line;
        } else {
          range += ', column ' + ref.start.column;
        }
        var caller;
        if (ref.name) {
          caller = React.createElement(
            'span',
            null,
            ' ',
            'in ',
            React.createElement(
              'code',
              null,
              ref.name
            )
          );
        }
        return React.createElement(
          'div',
          {
            key: j,
            className: 'nuclide-find-references-ref-name',
            onClick: _this._onRefClick.bind(_this, ref) },
          'Line ',
          range,
          ' ',
          caller
        );
      });

      return React.createElement(
        'div',
        { key: group.startLine, className: 'nuclide-find-references-ref' },
        ranges,
        React.createElement(FilePreview, _extends({
          grammar: _this.props.grammar,
          text: previewText
        }, group))
      );
    });

    return React.createElement(
      'div',
      { className: 'nuclide-find-references-file' },
      React.createElement(
        'div',
        { className: 'nuclide-find-references-filename' },
        React.createElement(
          'a',
          { onClick: this._onFileClick },
          relative(this.props.basePath, this.props.uri)
        )
      ),
      React.createElement(
        'div',
        { className: 'nuclide-find-references-refs' },
        groups
      )
    );
  }
});

module.exports = FileReferencesView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWZpbmQtcmVmZXJlbmNlcy9saWIvdmlldy9GaWxlUmVmZXJlbmNlc1ZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLFdBQVcsQ0FBQzs7QUFhWixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN0QyxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7O2VBQzFCLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQzs7SUFBekMsUUFBUSxZQUFSLFFBQVE7O0FBRWIsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDOzs7QUFDekMsV0FBUyxFQUFFO0FBQ1QsT0FBRyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7QUFDdEMsV0FBTyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7QUFDMUMsZUFBVyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsVUFBVTtBQUN2RSxhQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLG9CQUFvQixDQUFDLFVBQVU7QUFDeEYsWUFBUSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7R0FDNUM7O0FBRUQsYUFBVyxFQUFBLHFCQUFDLEdBQWMsRUFBRTtBQUMxQixRQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtBQUNsQyxpQkFBVyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUM7QUFDL0IsbUJBQWEsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDO0tBQ3BDLENBQUMsQ0FBQztHQUNKOztBQUVELGNBQVksRUFBQSx3QkFBRztBQUNiLFFBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7R0FDckM7O0FBRUQsUUFBTSxFQUFBLGtCQUFpQjs7O0FBQ3JCLFFBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFDLEtBQUssRUFBa0IsQ0FBQyxFQUFLO0FBQ2xFLFVBQUksV0FBVyxHQUFHLE1BQUssS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QyxVQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUs7QUFDNUMsWUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7QUFDM0IsWUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRTtBQUNuQyxlQUFLLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1NBQzdCLE1BQU07QUFDTCxlQUFLLElBQUksV0FBVyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1NBQ3pDO0FBQ0QsWUFBSSxNQUFNLENBQUM7QUFDWCxZQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUU7QUFDWixnQkFBTSxHQUFHOzs7WUFBTyxHQUFHOztZQUFJOzs7Y0FBTyxHQUFHLENBQUMsSUFBSTthQUFRO1dBQU8sQ0FBQztTQUN2RDtBQUNELGVBQ0U7OztBQUNFLGVBQUcsRUFBRSxDQUFDLEFBQUM7QUFDUCxxQkFBUyxFQUFDLGtDQUFrQztBQUM1QyxtQkFBTyxFQUFFLE1BQUssV0FBVyxDQUFDLElBQUksUUFBTyxHQUFHLENBQUMsQUFBQzs7VUFDcEMsS0FBSzs7VUFBRyxNQUFNO1NBQ2hCLENBQ047T0FDSCxDQUFDLENBQUM7O0FBRUgsYUFDRTs7VUFBSyxHQUFHLEVBQUUsS0FBSyxDQUFDLFNBQVMsQUFBQyxFQUFDLFNBQVMsRUFBQyw2QkFBNkI7UUFDL0QsTUFBTTtRQUNQLG9CQUFDLFdBQVc7QUFDVixpQkFBTyxFQUFFLE1BQUssS0FBSyxDQUFDLE9BQU8sQUFBQztBQUM1QixjQUFJLEVBQUUsV0FBVyxBQUFDO1dBQ2QsS0FBSyxFQUNUO09BQ0UsQ0FDTjtLQUNILENBQUMsQ0FBQzs7QUFFSCxXQUNFOztRQUFLLFNBQVMsRUFBQyw4QkFBOEI7TUFDM0M7O1VBQUssU0FBUyxFQUFDLGtDQUFrQztRQUMvQzs7WUFBRyxPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksQUFBQztVQUMzQixRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7U0FDNUM7T0FDQTtNQUNOOztVQUFLLFNBQVMsRUFBQyw4QkFBOEI7UUFDMUMsTUFBTTtPQUNIO0tBQ0YsQ0FDTjtHQUNIO0NBQ0YsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsa0JBQWtCLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3hmL3JzcGg0X2M1NzMxNXJzNTd4eHNkc2tyeG52MzZ0MC9UL3RtcGVtbTJIdXB1Ymxpc2hfcGFja2FnZXMvYXBtL251Y2xpZGUtZmluZC1yZWZlcmVuY2VzL2xpYi92aWV3L0ZpbGVSZWZlcmVuY2VzVmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtSZWZlcmVuY2UsIFJlZmVyZW5jZUdyb3VwfSBmcm9tICcuLi90eXBlcyc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG52YXIgRmlsZVByZXZpZXcgPSByZXF1aXJlKCcuL0ZpbGVQcmV2aWV3Jyk7XG52YXIge3JlbGF0aXZlfSA9IHJlcXVpcmUoJ251Y2xpZGUtcmVtb3RlLXVyaScpO1xuXG52YXIgRmlsZVJlZmVyZW5jZXNWaWV3ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBwcm9wVHlwZXM6IHtcbiAgICB1cmk6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICBncmFtbWFyOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgcHJldmlld1RleHQ6IFJlYWN0LlByb3BUeXBlcy5hcnJheU9mKFJlYWN0LlByb3BUeXBlcy5zdHJpbmcpLmlzUmVxdWlyZWQsXG4gICAgcmVmR3JvdXBzOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXlPZihSZWFjdC5Qcm9wVHlwZXMub2JqZWN0IC8qUmVmZXJlbmNlR3JvdXAqLykuaXNSZXF1aXJlZCxcbiAgICBiYXNlUGF0aDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICB9LFxuXG4gIF9vblJlZkNsaWNrKHJlZjogUmVmZXJlbmNlKSB7XG4gICAgYXRvbS53b3Jrc3BhY2Uub3Blbih0aGlzLnByb3BzLnVyaSwge1xuICAgICAgaW5pdGlhbExpbmU6IHJlZi5zdGFydC5saW5lIC0gMSxcbiAgICAgIGluaXRpYWxDb2x1bW46IHJlZi5zdGFydC5jb2x1bW4gLSAxLFxuICAgIH0pO1xuICB9LFxuXG4gIF9vbkZpbGVDbGljaygpIHtcbiAgICBhdG9tLndvcmtzcGFjZS5vcGVuKHRoaXMucHJvcHMudXJpKTtcbiAgfSxcblxuICByZW5kZXIoKTogUmVhY3RFbGVtZW50IHtcbiAgICB2YXIgZ3JvdXBzID0gdGhpcy5wcm9wcy5yZWZHcm91cHMubWFwKChncm91cDogUmVmZXJlbmNlR3JvdXAsIGkpID0+IHtcbiAgICAgIHZhciBwcmV2aWV3VGV4dCA9IHRoaXMucHJvcHMucHJldmlld1RleHRbaV07XG4gICAgICB2YXIgcmFuZ2VzID0gZ3JvdXAucmVmZXJlbmNlcy5tYXAoKHJlZiwgaikgPT4ge1xuICAgICAgICB2YXIgcmFuZ2UgPSByZWYuc3RhcnQubGluZTtcbiAgICAgICAgaWYgKHJlZi5lbmQubGluZSAhPT0gcmVmLnN0YXJ0LmxpbmUpIHtcbiAgICAgICAgICByYW5nZSArPSAnLScgKyByZWYuZW5kLmxpbmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmFuZ2UgKz0gJywgY29sdW1uICcgKyByZWYuc3RhcnQuY29sdW1uO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjYWxsZXI7XG4gICAgICAgIGlmIChyZWYubmFtZSkge1xuICAgICAgICAgIGNhbGxlciA9IDxzcGFuPnsnICd9aW4gPGNvZGU+e3JlZi5uYW1lfTwvY29kZT48L3NwYW4+O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAga2V5PXtqfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwibnVjbGlkZS1maW5kLXJlZmVyZW5jZXMtcmVmLW5hbWVcIlxuICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25SZWZDbGljay5iaW5kKHRoaXMsIHJlZil9PlxuICAgICAgICAgICAgTGluZSB7cmFuZ2V9IHtjYWxsZXJ9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBrZXk9e2dyb3VwLnN0YXJ0TGluZX0gY2xhc3NOYW1lPVwibnVjbGlkZS1maW5kLXJlZmVyZW5jZXMtcmVmXCI+XG4gICAgICAgICAge3Jhbmdlc31cbiAgICAgICAgICA8RmlsZVByZXZpZXdcbiAgICAgICAgICAgIGdyYW1tYXI9e3RoaXMucHJvcHMuZ3JhbW1hcn1cbiAgICAgICAgICAgIHRleHQ9e3ByZXZpZXdUZXh0fVxuICAgICAgICAgICAgey4uLmdyb3VwfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm51Y2xpZGUtZmluZC1yZWZlcmVuY2VzLWZpbGVcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJudWNsaWRlLWZpbmQtcmVmZXJlbmNlcy1maWxlbmFtZVwiPlxuICAgICAgICAgIDxhIG9uQ2xpY2s9e3RoaXMuX29uRmlsZUNsaWNrfT5cbiAgICAgICAgICAgIHtyZWxhdGl2ZSh0aGlzLnByb3BzLmJhc2VQYXRoLCB0aGlzLnByb3BzLnVyaSl9XG4gICAgICAgICAgPC9hPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJudWNsaWRlLWZpbmQtcmVmZXJlbmNlcy1yZWZzXCI+XG4gICAgICAgICAge2dyb3Vwc31cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZVJlZmVyZW5jZXNWaWV3O1xuIl19
