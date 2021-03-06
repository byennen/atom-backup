
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

module.exports = {

  activate: function activate(state) {
    // TODO(mbolin): Add activation code here.
  },

  createHgRepositoryProvider: function createHgRepositoryProvider() {
    var HgRepositoryProvider = require('./HgRepositoryProvider');
    return new HgRepositoryProvider();
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhnLXJlcG9zaXRvcnkvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7O0FBV1osTUFBTSxDQUFDLE9BQU8sR0FBRzs7QUFFZixVQUFRLEVBQUEsa0JBQUMsS0FBVSxFQUFROztHQUUxQjs7QUFFRCw0QkFBMEIsRUFBQSxzQ0FBRztBQUMzQixRQUFJLG9CQUFvQixHQUFHLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0FBQzdELFdBQU8sSUFBSSxvQkFBb0IsRUFBRSxDQUFDO0dBQ25DO0NBQ0YsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1oZy1yZXBvc2l0b3J5L2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgYWN0aXZhdGUoc3RhdGU6IGFueSk6IHZvaWQge1xuICAgIC8vIFRPRE8obWJvbGluKTogQWRkIGFjdGl2YXRpb24gY29kZSBoZXJlLlxuICB9LFxuXG4gIGNyZWF0ZUhnUmVwb3NpdG9yeVByb3ZpZGVyKCkge1xuICAgIHZhciBIZ1JlcG9zaXRvcnlQcm92aWRlciA9IHJlcXVpcmUoJy4vSGdSZXBvc2l0b3J5UHJvdmlkZXInKTtcbiAgICByZXR1cm4gbmV3IEhnUmVwb3NpdG9yeVByb3ZpZGVyKCk7XG4gIH0sXG59O1xuIl19
