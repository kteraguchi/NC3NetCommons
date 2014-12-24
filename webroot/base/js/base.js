var NetCommonsApp = angular.module('NetCommonsApp',
    [
      'ui.bootstrap',
      'ui.tinymce'
    ]
    );

//CakePHPがX-Requested-Withで判断しているため
NetCommonsApp.config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
}]);

/**
 * ncHtmlContent filter
 *
 * @param {string} filter name
 * @param {Array} use service
 */
NetCommonsApp.filter('ncHtmlContent', ['$sce', function($sce) {
  return function(input) {
    return $sce.trustAsHtml(input);
  };
}]);


/**
 * NetCommonsFlash factory
 */
NetCommonsApp.factory('NetCommonsFlash', function() {

  /**
   * element
   *
   * @type {Object.<string>}
   */
  var element = angular.element('#nc-flash-message');

  /**
   * scope
   *
   * @type {Object.<string>}
   */
  var scope = element.scope();

  /**
   * variables
   *
   * @type {Object.<string>}
   */
  var variables = {
    message: '',
    type: ''
  };

  /**
   * functions
   *
   * @type {Object.<function>}
   */
  var functions = {
    /**
     * new method
     *
     * @return {Object.<Object|string|function>}
     */
    new: function() {
      return angular.extend(variables, functions);
    },

    /**
     * close method
     *
     * @return {void}
     */
    close: function() {
      scope.flash.message = '';
      scope.flash.type = '';
      element.addClass('hidden');
    },

    /**
     * success method
     *
     * @param {string} message
     * @return {void}
     */
    success: function(message) {
      functions.custom(message, 'alert-success', true);
    },

    /**
     * info method
     *
     * @param {string} message
     */
    info: function(message) {
      functions.custom(message, 'alert-info', true);
    },

    /**
     * warning method
     *
     * @param {string} message
     * @return {void}
     */
    warning: function(message) {
      functions.custom(message, 'alert-warning', false);
    },

    /**
     * danger method
     *
     * @param {string} message
     * @return {void}
     */
    danger: function(message) {
      functions.custom(message, 'alert-danger', false);
    },

    /**
     * custom method
     *
     * @param {string} message
     * @param {string} type
     * @param {boolean} true is fadeOut, false is no fadeOut.
     * @return {void}
     */
    custom: function(message, type, fadeOut) {
      scope.flash.message = message;
      scope.flash.type = type;
      element.removeClass('hidden');
      if (fadeOut) {
        element.fadeIn(500).fadeTo(1000, 1).fadeOut(1500);
      } else {
        element.fadeIn(500);
      }
    }
  };

  return functions.new();
});


/**
 * NetCommonsBase factory
 */
NetCommonsApp.factory('NetCommonsBase',
    ['$http', '$q', '$modal', '$modalStack', '$location',
      '$anchorScroll', 'NetCommonsFlash',
      function(
         $http, $q, $modal, $modalStack, $location,
         $anchorScroll, NetCommonsFlash) {

        /**
         * variables
         *
         * @type {Object.<string>}
         */
        var urlVariables = {
          plugin: '',
          controller: '',
          action: ''
        };

        /**
         * functions
         *
         * @type {Object.<function>}
         */
        var urlFunctions = {
          /**
           * initUrl method
           *
           * @param {string} plugin name
           * @param {string} controller name
           * @return {Object.<Object|string|function>}
           */
          initUrl: function(plugin, controller) {
            urlFunctions.setPlugin(plugin);
            urlFunctions.setController(controller);
            return angular.extend(urlVariables, urlFunctions);
          },

          /**
           * setPlugin method
           *
           * @param {string} plugin name
           * @return {void}
           */
          setPlugin: function(plugin) {
            urlVariables.plugin = plugin;
          },

          /**
           * setController method
           *
           * @param {string} controller name
           * @return {void}
           */
          setController: function(controller) {
            urlVariables.controller = controller;
          },

          /**
           * getUrl method
           *
           * @param {string} action name
           * @param {Object.<string>} options
           * @return {string} url
           */
          getUrl: function(action, options) {
            var url = '/' + urlVariables.plugin + '/' + urlVariables.controller;
            if (! angular.isString(action)) {
              url = url + '/' + urlVariables.action;
            } else {
              url = url + '/' + action;
            }
            if (angular.isArray(options)) {
              for (var i = 0; i < options.length; i++) {
                url = url + '/' + options[i];
              }
            } else if (angular.isString(options)) {
              url = url + '/' + options;
            } else if (angular.isNumber(options)) {
              url = url + '/' + options.toString();
            }
            return url;
          }
        };

        /**
         * variables
         *
         * @type {Object.<string>}
         */
        var variables = {
          /**
           * Relative path to login form
           *
           * @const
           */
          LOGIN_URI: '/auth/login',

          /**
           * Relative path to login form
           *
           * @const
           */
          LOGOUT_URI: '/auth/logout',

          /**
           * status published
           *
           * @const
           */
          STATUS_PUBLISHED: '1',

          /**
           * status approved
           *
           * @const
           */
          STATUS_APPROVED: '2',

          /**
           * in draft status
           *
           * @const
           */
          STATUS_INDRAFT: '3',

          /**
           * status disaproved
           *
           * @const
           */
          STATUS_DISAPPROVED: '4',

          /**
           * SERVER_VALIDATE_KEY
           *
           * @const
           */
          VALIDATE_KEY: 'validation',

          /**
           * SERVER_VALIDATE_KEY
           *
           * @const
           */
          VALIDATE_MESSAGE_KEY: 'validationErrors'

        };

        /**
         * functions
         *
         * @type {Object.<function>}
         */
        var functions = {
          /**
           * new method
           *
           * @return {Object.<Object|string|function>}
           */
          new: function() {
            return angular.extend(variables, urlVariables,
                                  functions, urlFunctions);
          },

          /**
           * show setting method
           *
           * @param {string} editUrl
           * @param {function} callback
           * @param {Object.<string>}
           *               modalOptions is {scope, templateUrl, controller, ...}
           * @return {void}
           */
          showSetting: function(editUrl, callback, modalOptions) {
            functions.get(editUrl)
                .success(function(data) {
                  //最新データセット
                  if (angular.isFunction(callback)) {
                    callback(data.results);
                  }
                  //ダイアログ呼び出し
                  functions.showDialog(modalOptions).result.then(
                      function(result) {},
                      function(reason) {
                        if (typeof reason.data === 'object') {
                          //openによるエラー
                          NetCommonsFlash.danger(reason.data.name);
                        } else if (reason === 'canceled') {
                          //キャンセル
                          NetCommonsFlash.close();
                        }
                      }
                  );
                })
                .error(function(data) {
                  // TODO: translation
                  var message = data.name ||
                                'Network error. Please try again later.';
                  NetCommonsFlash.danger(message);
                });
          },

          /**
           * show dialog method
           *
           * @param {Object.<string>} options
           * @return {Object.<*>}
           */
          showDialog: function(options) {
            if (! angular.isString(options['backdrop'])) {
              options['backdrop'] = 'static';
            }
            $modalStack.dismissAll('canceled');

            //ダイアログ表示
            return $modal.open(options);
          },

          /**
           * send get
           *
           * @param {string} url
           * @return {Object.<function>} promise
           */
          get: function(url) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            $http.get(url, {cache: false})
              .success(function(data) {
                  //success condition
                  deferred.resolve(data);
                })
              .error(function(data, status) {
                  //error condition
                  deferred.reject(data, status);
                });

            promise.success = function(fn) {
              promise.then(fn);
              return promise;
            };

            promise.error = function(fn) {
              promise.then(null, fn);
              return promise;
            };

            return promise;
          },

          /**
           * send delete
           *
           * @param {string} url
           * @return {Object.<function>} promise
           */
          delete: function(url) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            $http.delete(url, {cache: false})
              .success(function(data) {
                  //success condition
                  deferred.resolve(data);
                })
              .error(function(data, status) {
                  //error condition
                  deferred.reject(data, status);
                });

            promise.success = function(fn) {
              promise.then(fn);
              return promise;
            };

            promise.error = function(fn) {
              promise.then(null, fn);
              return promise;
            };

            return promise;
          },

          /**
           * send post
           *
           * @param {string} url
           * @param {Object.<string>} postParams
           * @return {Object.<function>} promise
           */
          post: function(url, postParams) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            $http.post(url, $.param(postParams),
                {cache: false,
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                  }
                })
              .success(function(data) {
                  //success condition
                  deferred.resolve(data);
                })
              .error(function(data, status) {
                  //error condition
                  deferred.reject(data, status);
                });

            promise.success = function(fn) {
              promise.then(fn);
              return promise;
            };

            promise.error = function(fn) {
              promise.then(null, fn);
              return promise;
            };

            return promise;
          },

          /**
           * save
           *
           * @param {Object} form
           * @param {string} postUrl
           * @param {Object.<string>} postParams
           * @param {function} callback
           * @return {Object.<function>} promise
           */
          save: function(form, postUrl, postParams, callback) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            var scope = angular.element('body').scope();
            scope.sending = true;

            //booleanの値をPOSTするとCakePHP側でbooleanの項目が
            //文字列の'true', 'false'と判断されてしまい、エラーとなってしまう。
            //そのため、true->1、false->0に変換してPOSTする。
            postParams = functions.bool2intInArray(postParams);

            functions.get('/net_commons/net_commons/csrfToken.json')
                .success(function(data) {
                  if (angular.isObject(postParams.data._Token)) {
                    postParams.data._Token.key = data.data._Token.key;
                  }

                  //登録情報をPOST
                  functions.post(postUrl, postParams)
                    .success(function(data) {
                        if (angular.isFunction(callback)) {
                          callback(data);
                        }
                        //success condition
                        deferred.resolve(data);
                      })
                    .error(function(data, status) {
                       if (angular.isObject(form) &&
                            angular.isObject(data['results']) &&
                            angular.isObject(
                            data['results'][variables.VALIDATE_MESSAGE_KEY])) {

                          angular.forEach(
                              data['results'][variables.VALIDATE_MESSAGE_KEY],
                              function(value, key) {

                           if (! angular.isUndefined(form[key])) {
                             form[key].$setValidity(
                                      variables.VALIDATE_KEY, false);
                             form[key][variables.VALIDATE_MESSAGE_KEY] = value;
                           }
                         });
                        }

                        if (! angular.isObject(form) || ! form.$invalid) {
                          NetCommonsFlash.danger(data.name);
                        }
                        //error condition
                        deferred.reject(data, status);
                      });
                })
                .error(function(data, status, test) {
                  // TODO: use data.code instead
                  if (data.name === 'Forbidden') {
                    location.href = variables.LOGIN_URI;
                  }
                  // TODO: translation
                  var message = data.name ||
                                'Network error. Please try again later.';
                  NetCommonsFlash.danger(message);
                  //keyの取得に失敗
                  //error condition
                  deferred.reject(data, status);
                });

            promise.success = function(fn) {
              promise.then(fn);
              return promise;
            };

            promise.error = function(fn) {
              promise.then(null, fn);
              return promise;
            };

            promise.finally (function() {
              scope.sending = false;
            });

            return promise;
          },

          /**
           * top method
           *
           * @return {void}
           */
          top: function() {
            $location.hash('nc-modal-top');
            $anchorScroll();
          },

          /**
           * getScopeById method
           *
           * @param {string} scopeId is $scope.$id
           * @return {Object | null}
           */
          getElementByScopeId: function(scopeId) {
            var scopes = angular.element('.ng-scope');
            var element = null;
            for (var i = 0; i < scopes.length; i++) {
              element = angular.element(scopes[i]);
              if (element.scope().$id === scopeId) {
                return element;
              }
            }
            return null;
          },

          /**
           * serverValidationClear
           *
           * @param {Object} form
           * @param {string} key
           * @return {void}
           */
          serverValidationClear: function(form, key) {
            if (! angular.isUndefined(
                            form[key].$error[variables.VALIDATE_KEY]) &&
                    form[key].$error[variables.VALIDATE_KEY]) {
              form[key].$setValidity(variables.VALIDATE_KEY, true);
              form[key][variables.VALIDATE_MESSAGE_KEY] = '';
            }
          },

          /**
           * bool2intInArray
           *
           * @param {Object|Array} arrayVar
           * @return {Object}
           */
          bool2intInArray: function(arrayVar) {
            angular.forEach(arrayVar, function(value, key) {
              if (angular.isObject(arrayVar[key]) || angular.isArray(arrayVar[key])) {
                functions.bool2intInArray(arrayVar[key]);
              } else if (arrayVar[key] === true || arrayVar[key] === false) {
                arrayVar[key] = Number(arrayVar[key]);
              }
            });
            return arrayVar;
          }

        };

        return functions.new();
      }]);


/**
 * NetCommonsUser factory
 */
NetCommonsApp.factory('NetCommonsUser', function() {

  /**
   * variables
   *
   * @type {Object.<string>}
   */
  var variables = {};

  /**
   * functions
   *
   * @type {Object.<function>}
   */
  var functions = {
    /**
     * new method
     *
     * @return {Object.<Object|string|function>}
     */
    new: function() {
      return angular.extend(variables, functions);
    },

    /**
     * show user information method
     *
     * @param {number} users.id
     * @return {void}
     */
    showUser: function(user_id) {
      alert('user_id:' + user_id);
    }
  };

  return functions.new();
});


/**
 * NetCommonsTab factory
 */
NetCommonsApp.factory('NetCommonsTab', function() {

  /**
   * variables
   *
   * @type {Object.<string|number>}
   */
  var variables = {
    tabId: 0
  };

  /**
   * functions
   *
   * @type {Object.<function>}
   */
  var functions = {
    /**
     * new method
     *
     * @return {Object.<Object|string|function>}
     */
    new: function() {
      return angular.extend(variables, functions);
    },

    /**
     * setTab method
     *
     * @param {number} tabId
     * @return {void}
     */
    setTab: function(tabId) {
      variables.tabId = tabId;
    },

    /**
     * isSet method
     *
     * @param {number} tabId
     * @return {boolean}
     */
    isSet: function(tabId) {
      return variables.tabId === tabId;
    }
  };

  return functions.new();
});


/**
 * base controller
 */
NetCommonsApp.controller('NetCommons.base', function(
    $scope, $modalStack, NetCommonsBase, NetCommonsFlash, NetCommonsTab) {

      /**
       * messages
       *
       * @type {Object}
       */
      $scope.messages = {};

      /**
       * placeholder
       *
       * @type {string}
       */
      $scope.placeholder = '';

      /**
       * top
       *
       * @type {function}
       */
      $scope.top = NetCommonsBase.top;

      /**
       * dialog cancel
       *
       * @return {void}
       */
      $scope.cancel = function() {
        $modalStack.dismissAll('canceled');
      };

      /**
       * flash
       *
       * @type {Object}
       */
      $scope.flash = NetCommonsFlash.new();

      /**
       * tab
       *
       * @type {object}
       */
      $scope.tab = NetCommonsTab.new();

      /**
       * sending
       *
       * @type {boolean}
       */
      $scope.sending = false;

    });
