(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function () {
    'use strict';
    var moq = require('./../moq'),
        httpError = moq.httpError,
        promise = moq.promise,
        callback = moq.callback;


    var goods = {
        "draw01": {name: "pencil", price: 2},
        "food01": {name: "apple", price: 3},
        "move01": {name: "car", price: 1000},
        "food02": {name: "bottle of water", price: 8},
        "move02": {name: "bus ticket", price: 5},
        "tech01": {name: "laptop", price: 500}
    };

    var vendorCodes = Object.getOwnPropertyNames(goods);

    var users = {
        "jane": {
            password: "qwe",
            order: {food02: 3, tech01: 1}
        },
        "john": {
            password: "123",
            order: {food01: 2, move02: 20}
        }
    };

    var currentUser = undefined;


    function login(login, password) {
        if (typeof login != "string") {
            throw httpError(400, 'Incorrect user name')
        }
        var candidate = users[login];
        currentUser = (candidate && candidate.password == password) ? users[login] : null;
        if (!currentUser) {
            throw httpError(400, 'Wrong user name or password')
        }
    }

    function getGoodsList() {
        return vendorCodes.map(function (vendorCode) {
            var position = goods[vendorCode];
            return {vendorCode: vendorCode, name: position.name, price: position.price}
        })
    }

    function validateVendorCode(vendorCode) {
        if (!vendorCode || typeof vendorCode != "string" || !goods[vendorCode]) {
            throw  httpError(400, 'Unknown vendor code')
        }
    }

    function validateAuthorization(){
        if (!currentUser) {
            throw  httpError(401, 'You should be authorized for this operation')
        }
    }

    function getMyOrder() {
        validateAuthorization();
        var codes = Object.getOwnPropertyNames(currentUser.order);
        var total = 0;
        var items = codes.map(function (vendorCode) {
            var position = goods[vendorCode];
            var count = currentUser.order[vendorCode];
            var price = position.price * count;
            total += price;
            return {vendorCode: vendorCode, count: count, name: position.name, price: price}
        });
        return {totalPrice: total, items: items}
    }

    function addToOrder(vendorCode) {
        validateAuthorization();
        validateVendorCode(vendorCode);
        currentUser.order[vendorCode] = (currentUser.order[vendorCode] || 0) + 1;
        return getMyOrder()
    }

    function removeFromOrder(vendorCode) {
        validateAuthorization();
        validateVendorCode(vendorCode);
        delete currentUser.order[vendorCode];
        return getMyOrder()
    }


    window.service = {
        login: callback(login),
        getGoodsList: callback(getGoodsList),
        getMyOrder: promise(getMyOrder),
        addToOrder: promise(addToOrder),
        removeFromOrder: promise(removeFromOrder)
    }
})();

},{"./../moq":2}],2:[function(require,module,exports){
(function () {
    'use strict';

    var q = require('q');


    function error(message) {
        var result = new Error(message);
        result.message = message;
        return result
    }

    function httpError(code, message) {
        var result = error(message);
        result.code = code;
        return result
    }


    function serverify(sync, args, resolve, fail) {
        setTimeout(function () {
            if (0.10 > Math.random()) {
                var message = "Too Many Requests";
                resolve({code: 429, body: message, headers: {"Retry-After": "1000"}});
                return;
            }
            try {
                var result = sync.apply(null, args);
                resolve( {code: 200, body: result, headers: {}});
            }
            catch (e) {
                resolve({code: e.code, body: e.message, headers: {}});
            }
        }, Math.random() * 500);
    }


    function promise(sync) {
        return function () {
            var deferredResult = q.defer();
            var resolve = deferredResult.resolve.bind(deferredResult);
            var reject = deferredResult.reject.bind(deferredResult);
            serverify(sync, arguments, resolve, reject);
            return deferredResult.promise;
        }
    }

    function callback(sync) {
        return function () {
            var cb = arguments[arguments.length - 1];
            var args = Array.prototype.splice.bind(arguments)(0, arguments.length - 1);
            if (typeof cb != "function") {
                throw new error("callback argument should be a function")
            }
            serverify(sync, args, cb.bind(null, null), cb);
        }
    }


    module.exports = {
        httpError: httpError,
        promise: promise,
        callback: callback
    }
})();

},{"q":4}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
(function (process){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof self !== "undefined") {
        self.Q = definition();

    } else {
        throw new Error("This environment was not anticipated by Q. Please file a bug.");
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        /* jshint loopfunc: true */

        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    if (domain) {
                        domain.exit();
                    }
                    setTimeout(flush, 0);
                    if (domain) {
                        domain.enter();
                    }

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function(resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function(answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var pendingCount = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (pendingCount === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Returns the first resolved promise of an array. Prior rejected promises are
 * ignored.  Rejects only if all promises are rejected.
 * @param {Array*} an array containing values or promises for values
 * @returns a promise fulfilled with the value of the first resolved promise,
 * or a rejected promise if all promises are rejected.
 */
Q.any = any;

function any(promises) {
    if (promises.length === 0) {
        return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function(prev, current, index) {
        var promise = promises[index];

        pendingCount++;

        when(promise, onFulfilled, onRejected, onProgress);
        function onFulfilled(result) {
            deferred.resolve(result);
        }
        function onRejected() {
            pendingCount--;
            if (pendingCount === 0) {
                deferred.reject(new Error(
                    "Can't get fulfillment value from any promise, all " +
                    "promises were rejected."
                ));
            }
        }
        function onProgress(progress) {
            deferred.notify({
                index: index,
                value: progress
            });
        }
    }, undefined);

    return deferred.promise;
}

Promise.prototype.any = function() {
    return any(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this,require('_process'))
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9xL3EuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB2aW06dHM9NDpzdHM9NDpzdz00OlxuLyohXG4gKlxuICogQ29weXJpZ2h0IDIwMDktMjAxMiBLcmlzIEtvd2FsIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUXG4gKiBsaWNlbnNlIGZvdW5kIGF0IGh0dHA6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9xL3Jhdy9tYXN0ZXIvTElDRU5TRVxuICpcbiAqIFdpdGggcGFydHMgYnkgVHlsZXIgQ2xvc2VcbiAqIENvcHlyaWdodCAyMDA3LTIwMDkgVHlsZXIgQ2xvc2UgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVQgWCBsaWNlbnNlIGZvdW5kXG4gKiBhdCBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLmh0bWxcbiAqIEZvcmtlZCBhdCByZWZfc2VuZC5qcyB2ZXJzaW9uOiAyMDA5LTA1LTExXG4gKlxuICogV2l0aCBwYXJ0cyBieSBNYXJrIE1pbGxlclxuICogQ29weXJpZ2h0IChDKSAyMDExIEdvb2dsZSBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICovXG5cbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8gVGhpcyBmaWxlIHdpbGwgZnVuY3Rpb24gcHJvcGVybHkgYXMgYSA8c2NyaXB0PiB0YWcsIG9yIGEgbW9kdWxlXG4gICAgLy8gdXNpbmcgQ29tbW9uSlMgYW5kIE5vZGVKUyBvciBSZXF1aXJlSlMgbW9kdWxlIGZvcm1hdHMuICBJblxuICAgIC8vIENvbW1vbi9Ob2RlL1JlcXVpcmVKUywgdGhlIG1vZHVsZSBleHBvcnRzIHRoZSBRIEFQSSBhbmQgd2hlblxuICAgIC8vIGV4ZWN1dGVkIGFzIGEgc2ltcGxlIDxzY3JpcHQ+LCBpdCBjcmVhdGVzIGEgUSBnbG9iYWwgaW5zdGVhZC5cblxuICAgIC8vIE1vbnRhZ2UgUmVxdWlyZVxuICAgIGlmICh0eXBlb2YgYm9vdHN0cmFwID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgYm9vdHN0cmFwKFwicHJvbWlzZVwiLCBkZWZpbml0aW9uKTtcblxuICAgIC8vIENvbW1vbkpTXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuXG4gICAgLy8gUmVxdWlyZUpTXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZGVmaW5pdGlvbik7XG5cbiAgICAvLyBTRVMgKFNlY3VyZSBFY21hU2NyaXB0KVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpZiAoIXNlcy5vaygpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXMubWFrZVEgPSBkZWZpbml0aW9uO1xuICAgICAgICB9XG5cbiAgICAvLyA8c2NyaXB0PlxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgc2VsZi5RID0gZGVmaW5pdGlvbigpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBlbnZpcm9ubWVudCB3YXMgbm90IGFudGljaXBhdGVkIGJ5IFEuIFBsZWFzZSBmaWxlIGEgYnVnLlwiKTtcbiAgICB9XG5cbn0pKGZ1bmN0aW9uICgpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgaGFzU3RhY2tzID0gZmFsc2U7XG50cnkge1xuICAgIHRocm93IG5ldyBFcnJvcigpO1xufSBjYXRjaCAoZSkge1xuICAgIGhhc1N0YWNrcyA9ICEhZS5zdGFjaztcbn1cblxuLy8gQWxsIGNvZGUgYWZ0ZXIgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzIHJlcG9ydGVkXG4vLyBieSBRLlxudmFyIHFTdGFydGluZ0xpbmUgPSBjYXB0dXJlTGluZSgpO1xudmFyIHFGaWxlTmFtZTtcblxuLy8gc2hpbXNcblxuLy8gdXNlZCBmb3IgZmFsbGJhY2sgaW4gXCJhbGxSZXNvbHZlZFwiXG52YXIgbm9vcCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4vLyBVc2UgdGhlIGZhc3Rlc3QgcG9zc2libGUgbWVhbnMgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gYSBmdXR1cmUgdHVyblxuLy8gb2YgdGhlIGV2ZW50IGxvb3AuXG52YXIgbmV4dFRpY2sgPShmdW5jdGlvbiAoKSB7XG4gICAgLy8gbGlua2VkIGxpc3Qgb2YgdGFza3MgKHNpbmdsZSwgd2l0aCBoZWFkIG5vZGUpXG4gICAgdmFyIGhlYWQgPSB7dGFzazogdm9pZCAwLCBuZXh0OiBudWxsfTtcbiAgICB2YXIgdGFpbCA9IGhlYWQ7XG4gICAgdmFyIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgdmFyIHJlcXVlc3RUaWNrID0gdm9pZCAwO1xuICAgIHZhciBpc05vZGVKUyA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgICAgIC8qIGpzaGludCBsb29wZnVuYzogdHJ1ZSAqL1xuXG4gICAgICAgIHdoaWxlIChoZWFkLm5leHQpIHtcbiAgICAgICAgICAgIGhlYWQgPSBoZWFkLm5leHQ7XG4gICAgICAgICAgICB2YXIgdGFzayA9IGhlYWQudGFzaztcbiAgICAgICAgICAgIGhlYWQudGFzayA9IHZvaWQgMDtcbiAgICAgICAgICAgIHZhciBkb21haW4gPSBoZWFkLmRvbWFpbjtcblxuICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgIGhlYWQuZG9tYWluID0gdm9pZCAwO1xuICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRhc2soKTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChpc05vZGVKUykge1xuICAgICAgICAgICAgICAgICAgICAvLyBJbiBub2RlLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBjb25zaWRlcmVkIGZhdGFsIGVycm9ycy5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBzeW5jaHJvbm91c2x5IHRvIGludGVycnVwdCBmbHVzaGluZyFcblxuICAgICAgICAgICAgICAgICAgICAvLyBFbnN1cmUgY29udGludWF0aW9uIGlmIHRoZSB1bmNhdWdodCBleGNlcHRpb24gaXMgc3VwcHJlc3NlZFxuICAgICAgICAgICAgICAgICAgICAvLyBsaXN0ZW5pbmcgXCJ1bmNhdWdodEV4Y2VwdGlvblwiIGV2ZW50cyAoYXMgZG9tYWlucyBkb2VzKS5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ29udGludWUgaW4gbmV4dCBldmVudCB0byBhdm9pZCB0aWNrIHJlY3Vyc2lvbi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW4gYnJvd3NlcnMsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIG5vdCBmYXRhbC5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBhc3luY2hyb25vdXNseSB0byBhdm9pZCBzbG93LWRvd25zLlxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBuZXh0VGljayA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRhaWwgPSB0YWlsLm5leHQgPSB7XG4gICAgICAgICAgICB0YXNrOiB0YXNrLFxuICAgICAgICAgICAgZG9tYWluOiBpc05vZGVKUyAmJiBwcm9jZXNzLmRvbWFpbixcbiAgICAgICAgICAgIG5leHQ6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0VGljaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG4gICAgICAgIC8vIE5vZGUuanMgYmVmb3JlIDAuOS4gTm90ZSB0aGF0IHNvbWUgZmFrZS1Ob2RlIGVudmlyb25tZW50cywgbGlrZSB0aGVcbiAgICAgICAgLy8gTW9jaGEgdGVzdCBydW5uZXIsIGludHJvZHVjZSBhIGBwcm9jZXNzYCBnbG9iYWwgd2l0aG91dCBhIGBuZXh0VGlja2AuXG4gICAgICAgIGlzTm9kZUpTID0gdHJ1ZTtcblxuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgLy8gSW4gSUUxMCwgTm9kZS5qcyAwLjkrLCBvciBodHRwczovL2dpdGh1Yi5jb20vTm9ibGVKUy9zZXRJbW1lZGlhdGVcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gc2V0SW1tZWRpYXRlLmJpbmQod2luZG93LCBmbHVzaCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZXRJbW1lZGlhdGUoZmx1c2gpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gbW9kZXJuIGJyb3dzZXJzXG4gICAgICAgIC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG4gICAgICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgIC8vIEF0IGxlYXN0IFNhZmFyaSBWZXJzaW9uIDYuMC41ICg4NTM2LjMwLjEpIGludGVybWl0dGVudGx5IGNhbm5vdCBjcmVhdGVcbiAgICAgICAgLy8gd29ya2luZyBtZXNzYWdlIHBvcnRzIHRoZSBmaXJzdCB0aW1lIGEgcGFnZSBsb2Fkcy5cbiAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHJlcXVlc3RQb3J0VGljaztcbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVxdWVzdFBvcnRUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gT3BlcmEgcmVxdWlyZXMgdXMgdG8gcHJvdmlkZSBhIG1lc3NhZ2UgcGF5bG9hZCwgcmVnYXJkbGVzcyBvZlxuICAgICAgICAgICAgLy8gd2hldGhlciB3ZSB1c2UgaXQuXG4gICAgICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgcmVxdWVzdFBvcnRUaWNrKCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBvbGQgYnJvd3NlcnNcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV4dFRpY2s7XG59KSgpO1xuXG4vLyBBdHRlbXB0IHRvIG1ha2UgZ2VuZXJpY3Mgc2FmZSBpbiB0aGUgZmFjZSBvZiBkb3duc3RyZWFtXG4vLyBtb2RpZmljYXRpb25zLlxuLy8gVGhlcmUgaXMgbm8gc2l0dWF0aW9uIHdoZXJlIHRoaXMgaXMgbmVjZXNzYXJ5LlxuLy8gSWYgeW91IG5lZWQgYSBzZWN1cml0eSBndWFyYW50ZWUsIHRoZXNlIHByaW1vcmRpYWxzIG5lZWQgdG8gYmVcbi8vIGRlZXBseSBmcm96ZW4gYW55d2F5LCBhbmQgaWYgeW91IGRvbuKAmXQgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSxcbi8vIHRoaXMgaXMganVzdCBwbGFpbiBwYXJhbm9pZC5cbi8vIEhvd2V2ZXIsIHRoaXMgKiptaWdodCoqIGhhdmUgdGhlIG5pY2Ugc2lkZS1lZmZlY3Qgb2YgcmVkdWNpbmcgdGhlIHNpemUgb2Zcbi8vIHRoZSBtaW5pZmllZCBjb2RlIGJ5IHJlZHVjaW5nIHguY2FsbCgpIHRvIG1lcmVseSB4KClcbi8vIFNlZSBNYXJrIE1pbGxlcuKAmXMgZXhwbGFuYXRpb24gb2Ygd2hhdCB0aGlzIGRvZXMuXG4vLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1jb252ZW50aW9uczpzYWZlX21ldGFfcHJvZ3JhbW1pbmdcbnZhciBjYWxsID0gRnVuY3Rpb24uY2FsbDtcbmZ1bmN0aW9uIHVuY3VycnlUaGlzKGYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY2FsbC5hcHBseShmLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG4vLyBUaGlzIGlzIGVxdWl2YWxlbnQsIGJ1dCBzbG93ZXI6XG4vLyB1bmN1cnJ5VGhpcyA9IEZ1bmN0aW9uX2JpbmQuYmluZChGdW5jdGlvbl9iaW5kLmNhbGwpO1xuLy8gaHR0cDovL2pzcGVyZi5jb20vdW5jdXJyeXRoaXNcblxudmFyIGFycmF5X3NsaWNlID0gdW5jdXJyeVRoaXMoQXJyYXkucHJvdG90eXBlLnNsaWNlKTtcblxudmFyIGFycmF5X3JlZHVjZSA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCBiYXNpcykge1xuICAgICAgICB2YXIgaW5kZXggPSAwLFxuICAgICAgICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XG4gICAgICAgIC8vIGNvbmNlcm5pbmcgdGhlIGluaXRpYWwgdmFsdWUsIGlmIG9uZSBpcyBub3QgcHJvdmlkZWRcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIC8vIHNlZWsgdG8gdGhlIGZpcnN0IHZhbHVlIGluIHRoZSBhcnJheSwgYWNjb3VudGluZ1xuICAgICAgICAgICAgLy8gZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IGlzIGlzIGEgc3BhcnNlIGFycmF5XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgYmFzaXMgPSB0aGlzW2luZGV4KytdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCsraW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IHdoaWxlICgxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZWR1Y2VcbiAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAvLyBhY2NvdW50IGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCB0aGUgYXJyYXkgaXMgc3BhcnNlXG4gICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgIGJhc2lzID0gY2FsbGJhY2soYmFzaXMsIHRoaXNbaW5kZXhdLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2lzO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9pbmRleE9mID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgfHwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5vdCBhIHZlcnkgZ29vZCBzaGltLCBidXQgZ29vZCBlbm91Z2ggZm9yIG91ciBvbmUgdXNlIG9mIGl0XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9tYXAgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUubWFwIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3ApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgY29sbGVjdCA9IFtdO1xuICAgICAgICBhcnJheV9yZWR1Y2Uoc2VsZiwgZnVuY3Rpb24gKHVuZGVmaW5lZCwgdmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICBjb2xsZWN0LnB1c2goY2FsbGJhY2suY2FsbCh0aGlzcCwgdmFsdWUsIGluZGV4LCBzZWxmKSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIHJldHVybiBjb2xsZWN0O1xuICAgIH1cbik7XG5cbnZhciBvYmplY3RfY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiAocHJvdG90eXBlKSB7XG4gICAgZnVuY3Rpb24gVHlwZSgpIHsgfVxuICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIHJldHVybiBuZXcgVHlwZSgpO1xufTtcblxudmFyIG9iamVjdF9oYXNPd25Qcm9wZXJ0eSA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuXG52YXIgb2JqZWN0X2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3RfaGFzT3duUHJvcGVydHkob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ga2V5cztcbn07XG5cbnZhciBvYmplY3RfdG9TdHJpbmcgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nKTtcblxuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IE9iamVjdCh2YWx1ZSk7XG59XG5cbi8vIGdlbmVyYXRvciByZWxhdGVkIHNoaW1zXG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBmdW5jdGlvbiBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpbiBTcGlkZXJNb25rZXkuXG5mdW5jdGlvbiBpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgb2JqZWN0X3RvU3RyaW5nKGV4Y2VwdGlvbikgPT09IFwiW29iamVjdCBTdG9wSXRlcmF0aW9uXVwiIHx8XG4gICAgICAgIGV4Y2VwdGlvbiBpbnN0YW5jZW9mIFFSZXR1cm5WYWx1ZVxuICAgICk7XG59XG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBoZWxwZXIgYW5kIFEucmV0dXJuIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluXG4vLyBTcGlkZXJNb25rZXkuXG52YXIgUVJldHVyblZhbHVlO1xuaWYgKHR5cGVvZiBSZXR1cm5WYWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIFFSZXR1cm5WYWx1ZSA9IFJldHVyblZhbHVlO1xufSBlbHNlIHtcbiAgICBRUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH07XG59XG5cbi8vIGxvbmcgc3RhY2sgdHJhY2VzXG5cbnZhciBTVEFDS19KVU1QX1NFUEFSQVRPUiA9IFwiRnJvbSBwcmV2aW91cyBldmVudDpcIjtcblxuZnVuY3Rpb24gbWFrZVN0YWNrVHJhY2VMb25nKGVycm9yLCBwcm9taXNlKSB7XG4gICAgLy8gSWYgcG9zc2libGUsIHRyYW5zZm9ybSB0aGUgZXJyb3Igc3RhY2sgdHJhY2UgYnkgcmVtb3ZpbmcgTm9kZSBhbmQgUVxuICAgIC8vIGNydWZ0LCB0aGVuIGNvbmNhdGVuYXRpbmcgd2l0aCB0aGUgc3RhY2sgdHJhY2Ugb2YgYHByb21pc2VgLiBTZWUgIzU3LlxuICAgIGlmIChoYXNTdGFja3MgJiZcbiAgICAgICAgcHJvbWlzZS5zdGFjayAmJlxuICAgICAgICB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgZXJyb3IgIT09IG51bGwgJiZcbiAgICAgICAgZXJyb3Iuc3RhY2sgJiZcbiAgICAgICAgZXJyb3Iuc3RhY2suaW5kZXhPZihTVEFDS19KVU1QX1NFUEFSQVRPUikgPT09IC0xXG4gICAgKSB7XG4gICAgICAgIHZhciBzdGFja3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgcCA9IHByb21pc2U7ICEhcDsgcCA9IHAuc291cmNlKSB7XG4gICAgICAgICAgICBpZiAocC5zdGFjaykge1xuICAgICAgICAgICAgICAgIHN0YWNrcy51bnNoaWZ0KHAuc3RhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0YWNrcy51bnNoaWZ0KGVycm9yLnN0YWNrKTtcblxuICAgICAgICB2YXIgY29uY2F0ZWRTdGFja3MgPSBzdGFja3Muam9pbihcIlxcblwiICsgU1RBQ0tfSlVNUF9TRVBBUkFUT1IgKyBcIlxcblwiKTtcbiAgICAgICAgZXJyb3Iuc3RhY2sgPSBmaWx0ZXJTdGFja1N0cmluZyhjb25jYXRlZFN0YWNrcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBmaWx0ZXJTdGFja1N0cmluZyhzdGFja1N0cmluZykge1xuICAgIHZhciBsaW5lcyA9IHN0YWNrU3RyaW5nLnNwbGl0KFwiXFxuXCIpO1xuICAgIHZhciBkZXNpcmVkTGluZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBsaW5lID0gbGluZXNbaV07XG5cbiAgICAgICAgaWYgKCFpc0ludGVybmFsRnJhbWUobGluZSkgJiYgIWlzTm9kZUZyYW1lKGxpbmUpICYmIGxpbmUpIHtcbiAgICAgICAgICAgIGRlc2lyZWRMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZXNpcmVkTGluZXMuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gaXNOb2RlRnJhbWUoc3RhY2tMaW5lKSB7XG4gICAgcmV0dXJuIHN0YWNrTGluZS5pbmRleE9mKFwiKG1vZHVsZS5qczpcIikgIT09IC0xIHx8XG4gICAgICAgICAgIHN0YWNrTGluZS5pbmRleE9mKFwiKG5vZGUuanM6XCIpICE9PSAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKHN0YWNrTGluZSkge1xuICAgIC8vIE5hbWVkIGZ1bmN0aW9uczogXCJhdCBmdW5jdGlvbk5hbWUgKGZpbGVuYW1lOmxpbmVOdW1iZXI6Y29sdW1uTnVtYmVyKVwiXG4gICAgLy8gSW4gSUUxMCBmdW5jdGlvbiBuYW1lIGNhbiBoYXZlIHNwYWNlcyAoXCJBbm9ueW1vdXMgZnVuY3Rpb25cIikgT19vXG4gICAgdmFyIGF0dGVtcHQxID0gL2F0IC4rIFxcKCguKyk6KFxcZCspOig/OlxcZCspXFwpJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0MSkge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQxWzFdLCBOdW1iZXIoYXR0ZW1wdDFbMl0pXTtcbiAgICB9XG5cbiAgICAvLyBBbm9ueW1vdXMgZnVuY3Rpb25zOiBcImF0IGZpbGVuYW1lOmxpbmVOdW1iZXI6Y29sdW1uTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDIgPSAvYXQgKFteIF0rKTooXFxkKyk6KD86XFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQyKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDJbMV0sIE51bWJlcihhdHRlbXB0MlsyXSldO1xuICAgIH1cblxuICAgIC8vIEZpcmVmb3ggc3R5bGU6IFwiZnVuY3Rpb25AZmlsZW5hbWU6bGluZU51bWJlciBvciBAZmlsZW5hbWU6bGluZU51bWJlclwiXG4gICAgdmFyIGF0dGVtcHQzID0gLy4qQCguKyk6KFxcZCspJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0Mykge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQzWzFdLCBOdW1iZXIoYXR0ZW1wdDNbMl0pXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzSW50ZXJuYWxGcmFtZShzdGFja0xpbmUpIHtcbiAgICB2YXIgZmlsZU5hbWVBbmRMaW5lTnVtYmVyID0gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKHN0YWNrTGluZSk7XG5cbiAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgIHZhciBsaW5lTnVtYmVyID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuXG4gICAgcmV0dXJuIGZpbGVOYW1lID09PSBxRmlsZU5hbWUgJiZcbiAgICAgICAgbGluZU51bWJlciA+PSBxU3RhcnRpbmdMaW5lICYmXG4gICAgICAgIGxpbmVOdW1iZXIgPD0gcUVuZGluZ0xpbmU7XG59XG5cbi8vIGRpc2NvdmVyIG93biBmaWxlIG5hbWUgYW5kIGxpbmUgbnVtYmVyIHJhbmdlIGZvciBmaWx0ZXJpbmcgc3RhY2tcbi8vIHRyYWNlc1xuZnVuY3Rpb24gY2FwdHVyZUxpbmUoKSB7XG4gICAgaWYgKCFoYXNTdGFja3MpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdmFyIGxpbmVzID0gZS5zdGFjay5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgdmFyIGZpcnN0TGluZSA9IGxpbmVzWzBdLmluZGV4T2YoXCJAXCIpID4gMCA/IGxpbmVzWzFdIDogbGluZXNbMl07XG4gICAgICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoZmlyc3RMaW5lKTtcbiAgICAgICAgaWYgKCFmaWxlTmFtZUFuZExpbmVOdW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHFGaWxlTmFtZSA9IGZpbGVOYW1lQW5kTGluZU51bWJlclswXTtcbiAgICAgICAgcmV0dXJuIGZpbGVOYW1lQW5kTGluZU51bWJlclsxXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlcHJlY2F0ZShjYWxsYmFjaywgbmFtZSwgYWx0ZXJuYXRpdmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlLndhcm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG5hbWUgKyBcIiBpcyBkZXByZWNhdGVkLCB1c2UgXCIgKyBhbHRlcm5hdGl2ZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgXCIgaW5zdGVhZC5cIiwgbmV3IEVycm9yKFwiXCIpLnN0YWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoY2FsbGJhY2ssIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cblxuLy8gZW5kIG9mIHNoaW1zXG4vLyBiZWdpbm5pbmcgb2YgcmVhbCB3b3JrXG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UsIHBhc3NlcyBwcm9taXNlcyB0aHJvdWdoLCBvclxuICogY29lcmNlcyBwcm9taXNlcyBmcm9tIGRpZmZlcmVudCBzeXN0ZW1zLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2Ugb3IgcHJvbWlzZVxuICovXG5mdW5jdGlvbiBRKHZhbHVlKSB7XG4gICAgLy8gSWYgdGhlIG9iamVjdCBpcyBhbHJlYWR5IGEgUHJvbWlzZSwgcmV0dXJuIGl0IGRpcmVjdGx5LiAgVGhpcyBlbmFibGVzXG4gICAgLy8gdGhlIHJlc29sdmUgZnVuY3Rpb24gdG8gYm90aCBiZSB1c2VkIHRvIGNyZWF0ZWQgcmVmZXJlbmNlcyBmcm9tIG9iamVjdHMsXG4gICAgLy8gYnV0IHRvIHRvbGVyYWJseSBjb2VyY2Ugbm9uLXByb21pc2VzIHRvIHByb21pc2VzLlxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8vIGFzc2ltaWxhdGUgdGhlbmFibGVzXG4gICAgaWYgKGlzUHJvbWlzZUFsaWtlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gY29lcmNlKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVsZmlsbCh2YWx1ZSk7XG4gICAgfVxufVxuUS5yZXNvbHZlID0gUTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIHRhc2sgaW4gYSBmdXR1cmUgdHVybiBvZiB0aGUgZXZlbnQgbG9vcC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHRhc2tcbiAqL1xuUS5uZXh0VGljayA9IG5leHRUaWNrO1xuXG4vKipcbiAqIENvbnRyb2xzIHdoZXRoZXIgb3Igbm90IGxvbmcgc3RhY2sgdHJhY2VzIHdpbGwgYmUgb25cbiAqL1xuUS5sb25nU3RhY2tTdXBwb3J0ID0gZmFsc2U7XG5cbi8vIGVuYWJsZSBsb25nIHN0YWNrcyBpZiBRX0RFQlVHIGlzIHNldFxuaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MgJiYgcHJvY2Vzcy5lbnYgJiYgcHJvY2Vzcy5lbnYuUV9ERUJVRykge1xuICAgIFEubG9uZ1N0YWNrU3VwcG9ydCA9IHRydWU7XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHtwcm9taXNlLCByZXNvbHZlLCByZWplY3R9IG9iamVjdC5cbiAqXG4gKiBgcmVzb2x2ZWAgaXMgYSBjYWxsYmFjayB0byBpbnZva2Ugd2l0aCBhIG1vcmUgcmVzb2x2ZWQgdmFsdWUgZm9yIHRoZVxuICogcHJvbWlzZS4gVG8gZnVsZmlsbCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGFueSB2YWx1ZSB0aGF0IGlzXG4gKiBub3QgYSB0aGVuYWJsZS4gVG8gcmVqZWN0IHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYSByZWplY3RlZFxuICogdGhlbmFibGUsIG9yIGludm9rZSBgcmVqZWN0YCB3aXRoIHRoZSByZWFzb24gZGlyZWN0bHkuIFRvIHJlc29sdmUgdGhlXG4gKiBwcm9taXNlIHRvIGFub3RoZXIgdGhlbmFibGUsIHRodXMgcHV0dGluZyBpdCBpbiB0aGUgc2FtZSBzdGF0ZSwgaW52b2tlXG4gKiBgcmVzb2x2ZWAgd2l0aCB0aGF0IG90aGVyIHRoZW5hYmxlLlxuICovXG5RLmRlZmVyID0gZGVmZXI7XG5mdW5jdGlvbiBkZWZlcigpIHtcbiAgICAvLyBpZiBcIm1lc3NhZ2VzXCIgaXMgYW4gXCJBcnJheVwiLCB0aGF0IGluZGljYXRlcyB0aGF0IHRoZSBwcm9taXNlIGhhcyBub3QgeWV0XG4gICAgLy8gYmVlbiByZXNvbHZlZC4gIElmIGl0IGlzIFwidW5kZWZpbmVkXCIsIGl0IGhhcyBiZWVuIHJlc29sdmVkLiAgRWFjaFxuICAgIC8vIGVsZW1lbnQgb2YgdGhlIG1lc3NhZ2VzIGFycmF5IGlzIGl0c2VsZiBhbiBhcnJheSBvZiBjb21wbGV0ZSBhcmd1bWVudHMgdG9cbiAgICAvLyBmb3J3YXJkIHRvIHRoZSByZXNvbHZlZCBwcm9taXNlLiAgV2UgY29lcmNlIHRoZSByZXNvbHV0aW9uIHZhbHVlIHRvIGFcbiAgICAvLyBwcm9taXNlIHVzaW5nIHRoZSBgcmVzb2x2ZWAgZnVuY3Rpb24gYmVjYXVzZSBpdCBoYW5kbGVzIGJvdGggZnVsbHlcbiAgICAvLyBub24tdGhlbmFibGUgdmFsdWVzIGFuZCBvdGhlciB0aGVuYWJsZXMgZ3JhY2VmdWxseS5cbiAgICB2YXIgbWVzc2FnZXMgPSBbXSwgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSBbXSwgcmVzb2x2ZWRQcm9taXNlO1xuXG4gICAgdmFyIGRlZmVycmVkID0gb2JqZWN0X2NyZWF0ZShkZWZlci5wcm90b3R5cGUpO1xuICAgIHZhciBwcm9taXNlID0gb2JqZWN0X2NyZWF0ZShQcm9taXNlLnByb3RvdHlwZSk7XG5cbiAgICBwcm9taXNlLnByb21pc2VEaXNwYXRjaCA9IGZ1bmN0aW9uIChyZXNvbHZlLCBvcCwgb3BlcmFuZHMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2goYXJncyk7XG4gICAgICAgICAgICBpZiAob3AgPT09IFwid2hlblwiICYmIG9wZXJhbmRzWzFdKSB7IC8vIHByb2dyZXNzIG9wZXJhbmRcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVycy5wdXNoKG9wZXJhbmRzWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkocmVzb2x2ZWRQcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFhYWCBkZXByZWNhdGVkXG4gICAgcHJvbWlzZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuZWFyZXJWYWx1ZSA9IG5lYXJlcihyZXNvbHZlZFByb21pc2UpO1xuICAgICAgICBpZiAoaXNQcm9taXNlKG5lYXJlclZhbHVlKSkge1xuICAgICAgICAgICAgcmVzb2x2ZWRQcm9taXNlID0gbmVhcmVyVmFsdWU7IC8vIHNob3J0ZW4gY2hhaW5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmVhcmVyVmFsdWU7XG4gICAgfTtcblxuICAgIHByb21pc2UuaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN0YXRlOiBcInBlbmRpbmdcIiB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNvbHZlZFByb21pc2UuaW5zcGVjdCgpO1xuICAgIH07XG5cbiAgICBpZiAoUS5sb25nU3RhY2tTdXBwb3J0ICYmIGhhc1N0YWNrcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIE5PVEU6IGRvbid0IHRyeSB0byB1c2UgYEVycm9yLmNhcHR1cmVTdGFja1RyYWNlYCBvciB0cmFuc2ZlciB0aGVcbiAgICAgICAgICAgIC8vIGFjY2Vzc29yIGFyb3VuZDsgdGhhdCBjYXVzZXMgbWVtb3J5IGxlYWtzIGFzIHBlciBHSC0xMTEuIEp1c3RcbiAgICAgICAgICAgIC8vIHJlaWZ5IHRoZSBzdGFjayB0cmFjZSBhcyBhIHN0cmluZyBBU0FQLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEF0IHRoZSBzYW1lIHRpbWUsIGN1dCBvZmYgdGhlIGZpcnN0IGxpbmU7IGl0J3MgYWx3YXlzIGp1c3RcbiAgICAgICAgICAgIC8vIFwiW29iamVjdCBQcm9taXNlXVxcblwiLCBhcyBwZXIgdGhlIGB0b1N0cmluZ2AuXG4gICAgICAgICAgICBwcm9taXNlLnN0YWNrID0gZS5zdGFjay5zdWJzdHJpbmcoZS5zdGFjay5pbmRleE9mKFwiXFxuXCIpICsgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOT1RFOiB3ZSBkbyB0aGUgY2hlY2tzIGZvciBgcmVzb2x2ZWRQcm9taXNlYCBpbiBlYWNoIG1ldGhvZCwgaW5zdGVhZCBvZlxuICAgIC8vIGNvbnNvbGlkYXRpbmcgdGhlbSBpbnRvIGBiZWNvbWVgLCBzaW5jZSBvdGhlcndpc2Ugd2UnZCBjcmVhdGUgbmV3XG4gICAgLy8gcHJvbWlzZXMgd2l0aCB0aGUgbGluZXMgYGJlY29tZSh3aGF0ZXZlcih2YWx1ZSkpYC4gU2VlIGUuZy4gR0gtMjUyLlxuXG4gICAgZnVuY3Rpb24gYmVjb21lKG5ld1Byb21pc2UpIHtcbiAgICAgICAgcmVzb2x2ZWRQcm9taXNlID0gbmV3UHJvbWlzZTtcbiAgICAgICAgcHJvbWlzZS5zb3VyY2UgPSBuZXdQcm9taXNlO1xuXG4gICAgICAgIGFycmF5X3JlZHVjZShtZXNzYWdlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgbWVzc2FnZSkge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbmV3UHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkobmV3UHJvbWlzZSwgbWVzc2FnZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcblxuICAgICAgICBtZXNzYWdlcyA9IHZvaWQgMDtcbiAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSB2b2lkIDA7XG4gICAgfVxuXG4gICAgZGVmZXJyZWQucHJvbWlzZSA9IHByb21pc2U7XG4gICAgZGVmZXJyZWQucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUoUSh2YWx1ZSkpO1xuICAgIH07XG5cbiAgICBkZWZlcnJlZC5mdWxmaWxsID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShmdWxmaWxsKHZhbHVlKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5yZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShyZWplY3QocmVhc29uKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5ub3RpZnkgPSBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb2dyZXNzTGlzdGVuZXJzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9ncmVzc0xpc3RlbmVyKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVyKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgIH07XG5cbiAgICByZXR1cm4gZGVmZXJyZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIE5vZGUtc3R5bGUgY2FsbGJhY2sgdGhhdCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0IHRoZSBkZWZlcnJlZFxuICogcHJvbWlzZS5cbiAqIEByZXR1cm5zIGEgbm9kZWJhY2tcbiAqL1xuZGVmZXIucHJvdG90eXBlLm1ha2VOb2RlUmVzb2x2ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXJyb3IsIHZhbHVlKSB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgc2VsZi5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUoYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHJlc29sdmVyIHtGdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgbm90aGluZyBhbmQgYWNjZXB0c1xuICogdGhlIHJlc29sdmUsIHJlamVjdCwgYW5kIG5vdGlmeSBmdW5jdGlvbnMgZm9yIGEgZGVmZXJyZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCBtYXkgYmUgcmVzb2x2ZWQgd2l0aCB0aGUgZ2l2ZW4gcmVzb2x2ZSBhbmQgcmVqZWN0XG4gKiBmdW5jdGlvbnMsIG9yIHJlamVjdGVkIGJ5IGEgdGhyb3duIGV4Y2VwdGlvbiBpbiByZXNvbHZlclxuICovXG5RLlByb21pc2UgPSBwcm9taXNlOyAvLyBFUzZcblEucHJvbWlzZSA9IHByb21pc2U7XG5mdW5jdGlvbiBwcm9taXNlKHJlc29sdmVyKSB7XG4gICAgaWYgKHR5cGVvZiByZXNvbHZlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJyZXNvbHZlciBtdXN0IGJlIGEgZnVuY3Rpb24uXCIpO1xuICAgIH1cbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmVyKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICB9IGNhdGNoIChyZWFzb24pIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlYXNvbik7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5wcm9taXNlLnJhY2UgPSByYWNlOyAvLyBFUzZcbnByb21pc2UuYWxsID0gYWxsOyAvLyBFUzZcbnByb21pc2UucmVqZWN0ID0gcmVqZWN0OyAvLyBFUzZcbnByb21pc2UucmVzb2x2ZSA9IFE7IC8vIEVTNlxuXG4vLyBYWFggZXhwZXJpbWVudGFsLiAgVGhpcyBtZXRob2QgaXMgYSB3YXkgdG8gZGVub3RlIHRoYXQgYSBsb2NhbCB2YWx1ZSBpc1xuLy8gc2VyaWFsaXphYmxlIGFuZCBzaG91bGQgYmUgaW1tZWRpYXRlbHkgZGlzcGF0Y2hlZCB0byBhIHJlbW90ZSB1cG9uIHJlcXVlc3QsXG4vLyBpbnN0ZWFkIG9mIHBhc3NpbmcgYSByZWZlcmVuY2UuXG5RLnBhc3NCeUNvcHkgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgLy9mcmVlemUob2JqZWN0KTtcbiAgICAvL3Bhc3NCeUNvcGllcy5zZXQob2JqZWN0LCB0cnVlKTtcbiAgICByZXR1cm4gb2JqZWN0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUucGFzc0J5Q29weSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJZiB0d28gcHJvbWlzZXMgZXZlbnR1YWxseSBmdWxmaWxsIHRvIHRoZSBzYW1lIHZhbHVlLCBwcm9taXNlcyB0aGF0IHZhbHVlLFxuICogYnV0IG90aGVyd2lzZSByZWplY3RzLlxuICogQHBhcmFtIHgge0FueSp9XG4gKiBAcGFyYW0geSB7QW55Kn1cbiAqIEByZXR1cm5zIHtBbnkqfSBhIHByb21pc2UgZm9yIHggYW5kIHkgaWYgdGhleSBhcmUgdGhlIHNhbWUsIGJ1dCBhIHJlamVjdGlvblxuICogb3RoZXJ3aXNlLlxuICpcbiAqL1xuUS5qb2luID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICByZXR1cm4gUSh4KS5qb2luKHkpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uICh0aGF0KSB7XG4gICAgcmV0dXJuIFEoW3RoaXMsIHRoYXRdKS5zcHJlYWQoZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgaWYgKHggPT09IHkpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFwiPT09XCIgc2hvdWxkIGJlIE9iamVjdC5pcyBvciBlcXVpdlxuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBqb2luOiBub3QgdGhlIHNhbWU6IFwiICsgeCArIFwiIFwiICsgeSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSBmaXJzdCBvZiBhbiBhcnJheSBvZiBwcm9taXNlcyB0byBiZWNvbWUgc2V0dGxlZC5cbiAqIEBwYXJhbSBhbnN3ZXJzIHtBcnJheVtBbnkqXX0gcHJvbWlzZXMgdG8gcmFjZVxuICogQHJldHVybnMge0FueSp9IHRoZSBmaXJzdCBwcm9taXNlIHRvIGJlIHNldHRsZWRcbiAqL1xuUS5yYWNlID0gcmFjZTtcbmZ1bmN0aW9uIHJhY2UoYW5zd2VyUHMpIHtcbiAgICByZXR1cm4gcHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gU3dpdGNoIHRvIHRoaXMgb25jZSB3ZSBjYW4gYXNzdW1lIGF0IGxlYXN0IEVTNVxuICAgICAgICAvLyBhbnN3ZXJQcy5mb3JFYWNoKGZ1bmN0aW9uKGFuc3dlclApIHtcbiAgICAgICAgLy8gICAgIFEoYW5zd2VyUCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy8gVXNlIHRoaXMgaW4gdGhlIG1lYW50aW1lXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhbnN3ZXJQcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgUShhbnN3ZXJQc1tpXSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihRLnJhY2UpO1xufTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgUHJvbWlzZSB3aXRoIGEgcHJvbWlzZSBkZXNjcmlwdG9yIG9iamVjdCBhbmQgb3B0aW9uYWwgZmFsbGJhY2tcbiAqIGZ1bmN0aW9uLiAgVGhlIGRlc2NyaXB0b3IgY29udGFpbnMgbWV0aG9kcyBsaWtlIHdoZW4ocmVqZWN0ZWQpLCBnZXQobmFtZSksXG4gKiBzZXQobmFtZSwgdmFsdWUpLCBwb3N0KG5hbWUsIGFyZ3MpLCBhbmQgZGVsZXRlKG5hbWUpLCB3aGljaCBhbGxcbiAqIHJldHVybiBlaXRoZXIgYSB2YWx1ZSwgYSBwcm9taXNlIGZvciBhIHZhbHVlLCBvciBhIHJlamVjdGlvbi4gIFRoZSBmYWxsYmFja1xuICogYWNjZXB0cyB0aGUgb3BlcmF0aW9uIG5hbWUsIGEgcmVzb2x2ZXIsIGFuZCBhbnkgZnVydGhlciBhcmd1bWVudHMgdGhhdCB3b3VsZFxuICogaGF2ZSBiZWVuIGZvcndhcmRlZCB0byB0aGUgYXBwcm9wcmlhdGUgbWV0aG9kIGFib3ZlIGhhZCBhIG1ldGhvZCBiZWVuXG4gKiBwcm92aWRlZCB3aXRoIHRoZSBwcm9wZXIgbmFtZS4gIFRoZSBBUEkgbWFrZXMgbm8gZ3VhcmFudGVlcyBhYm91dCB0aGUgbmF0dXJlXG4gKiBvZiB0aGUgcmV0dXJuZWQgb2JqZWN0LCBhcGFydCBmcm9tIHRoYXQgaXQgaXMgdXNhYmxlIHdoZXJlZXZlciBwcm9taXNlcyBhcmVcbiAqIGJvdWdodCBhbmQgc29sZC5cbiAqL1xuUS5tYWtlUHJvbWlzZSA9IFByb21pc2U7XG5mdW5jdGlvbiBQcm9taXNlKGRlc2NyaXB0b3IsIGZhbGxiYWNrLCBpbnNwZWN0KSB7XG4gICAgaWYgKGZhbGxiYWNrID09PSB2b2lkIDApIHtcbiAgICAgICAgZmFsbGJhY2sgPSBmdW5jdGlvbiAob3ApIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIFwiUHJvbWlzZSBkb2VzIG5vdCBzdXBwb3J0IG9wZXJhdGlvbjogXCIgKyBvcFxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChpbnNwZWN0ID09PSB2b2lkIDApIHtcbiAgICAgICAgaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7c3RhdGU6IFwidW5rbm93blwifTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgcHJvbWlzZSA9IG9iamVjdF9jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpO1xuXG4gICAgcHJvbWlzZS5wcm9taXNlRGlzcGF0Y2ggPSBmdW5jdGlvbiAocmVzb2x2ZSwgb3AsIGFyZ3MpIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChkZXNjcmlwdG9yW29wXSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGRlc2NyaXB0b3Jbb3BdLmFwcGx5KHByb21pc2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxsYmFjay5jYWxsKHByb21pc2UsIG9wLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb21pc2UuaW5zcGVjdCA9IGluc3BlY3Q7XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZCBgdmFsdWVPZmAgYW5kIGBleGNlcHRpb25gIHN1cHBvcnRcbiAgICBpZiAoaW5zcGVjdCkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcInJlamVjdGVkXCIpIHtcbiAgICAgICAgICAgIHByb21pc2UuZXhjZXB0aW9uID0gaW5zcGVjdGVkLnJlYXNvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb21pc2UudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpbnNwZWN0ZWQgPSBpbnNwZWN0KCk7XG4gICAgICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcInBlbmRpbmdcIiB8fFxuICAgICAgICAgICAgICAgIGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXCJbb2JqZWN0IFByb21pc2VdXCI7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgZG9uZSA9IGZhbHNlOyAgIC8vIGVuc3VyZSB0aGUgdW50cnVzdGVkIHByb21pc2UgbWFrZXMgYXQgbW9zdCBhXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaW5nbGUgY2FsbCB0byBvbmUgb2YgdGhlIGNhbGxiYWNrc1xuXG4gICAgZnVuY3Rpb24gX2Z1bGZpbGxlZCh2YWx1ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBmdWxmaWxsZWQgPT09IFwiZnVuY3Rpb25cIiA/IGZ1bGZpbGxlZCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcmVqZWN0ZWQoZXhjZXB0aW9uKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVqZWN0ZWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgbWFrZVN0YWNrVHJhY2VMb25nKGV4Y2VwdGlvbiwgc2VsZik7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3RlZChleGNlcHRpb24pO1xuICAgICAgICAgICAgfSBjYXRjaCAobmV3RXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXdFeGNlcHRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcHJvZ3Jlc3NlZCh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHByb2dyZXNzZWQgPT09IFwiZnVuY3Rpb25cIiA/IHByb2dyZXNzZWQodmFsdWUpIDogdmFsdWU7XG4gICAgfVxuXG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfZnVsZmlsbGVkKHZhbHVlKSk7XG4gICAgICAgIH0sIFwid2hlblwiLCBbZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfcmVqZWN0ZWQoZXhjZXB0aW9uKSk7XG4gICAgICAgIH1dKTtcbiAgICB9KTtcblxuICAgIC8vIFByb2dyZXNzIHByb3BhZ2F0b3IgbmVlZCB0byBiZSBhdHRhY2hlZCBpbiB0aGUgY3VycmVudCB0aWNrLlxuICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKHZvaWQgMCwgXCJ3aGVuXCIsIFt2b2lkIDAsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgbmV3VmFsdWU7XG4gICAgICAgIHZhciB0aHJldyA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbmV3VmFsdWUgPSBfcHJvZ3Jlc3NlZCh2YWx1ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocmV3ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChRLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBRLm9uZXJyb3IoZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRocmV3KSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkobmV3VmFsdWUpO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5RLnRhcCA9IGZ1bmN0aW9uIChwcm9taXNlLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRhcChjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIFdvcmtzIGFsbW9zdCBsaWtlIFwiZmluYWxseVwiLCBidXQgbm90IGNhbGxlZCBmb3IgcmVqZWN0aW9ucy5cbiAqIE9yaWdpbmFsIHJlc29sdXRpb24gdmFsdWUgaXMgcGFzc2VkIHRocm91Z2ggY2FsbGJhY2sgdW5hZmZlY3RlZC5cbiAqIENhbGxiYWNrIG1heSByZXR1cm4gYSBwcm9taXNlIHRoYXQgd2lsbCBiZSBhd2FpdGVkIGZvci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJucyB7US5Qcm9taXNlfVxuICogQGV4YW1wbGVcbiAqIGRvU29tZXRoaW5nKClcbiAqICAgLnRoZW4oLi4uKVxuICogICAudGFwKGNvbnNvbGUubG9nKVxuICogICAudGhlbiguLi4pO1xuICovXG5Qcm9taXNlLnByb3RvdHlwZS50YXAgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKHZhbHVlKS50aGVuUmVzb2x2ZSh2YWx1ZSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVycyBhbiBvYnNlcnZlciBvbiBhIHByb21pc2UuXG4gKlxuICogR3VhcmFudGVlczpcbiAqXG4gKiAxLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBiZSBjYWxsZWQgb25seSBvbmNlLlxuICogMi4gdGhhdCBlaXRoZXIgdGhlIGZ1bGZpbGxlZCBjYWxsYmFjayBvciB0aGUgcmVqZWN0ZWQgY2FsbGJhY2sgd2lsbCBiZVxuICogICAgY2FsbGVkLCBidXQgbm90IGJvdGguXG4gKiAzLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBub3QgYmUgY2FsbGVkIGluIHRoaXMgdHVybi5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgICAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgdG8gb2JzZXJ2ZVxuICogQHBhcmFtIGZ1bGZpbGxlZCAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIGZ1bGZpbGxlZCB2YWx1ZVxuICogQHBhcmFtIHJlamVjdGVkICAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIHJlamVjdGlvbiBleGNlcHRpb25cbiAqIEBwYXJhbSBwcm9ncmVzc2VkIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBhbnkgcHJvZ3Jlc3Mgbm90aWZpY2F0aW9uc1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIGZyb20gdGhlIGludm9rZWQgY2FsbGJhY2tcbiAqL1xuUS53aGVuID0gd2hlbjtcbmZ1bmN0aW9uIHdoZW4odmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbHVlOyB9KTtcbn07XG5cblEudGhlblJlc29sdmUgPSBmdW5jdGlvbiAocHJvbWlzZSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVzb2x2ZSh2YWx1ZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuUmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKCkgeyB0aHJvdyByZWFzb247IH0pO1xufTtcblxuUS50aGVuUmVqZWN0ID0gZnVuY3Rpb24gKHByb21pc2UsIHJlYXNvbikge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRoZW5SZWplY3QocmVhc29uKTtcbn07XG5cbi8qKlxuICogSWYgYW4gb2JqZWN0IGlzIG5vdCBhIHByb21pc2UsIGl0IGlzIGFzIFwibmVhclwiIGFzIHBvc3NpYmxlLlxuICogSWYgYSBwcm9taXNlIGlzIHJlamVjdGVkLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZSB0b28uXG4gKiBJZiBpdOKAmXMgYSBmdWxmaWxsZWQgcHJvbWlzZSwgdGhlIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5lYXJlci5cbiAqIElmIGl04oCZcyBhIGRlZmVycmVkIHByb21pc2UgYW5kIHRoZSBkZWZlcnJlZCBoYXMgYmVlbiByZXNvbHZlZCwgdGhlXG4gKiByZXNvbHV0aW9uIGlzIFwibmVhcmVyXCIuXG4gKiBAcGFyYW0gb2JqZWN0XG4gKiBAcmV0dXJucyBtb3N0IHJlc29sdmVkIChuZWFyZXN0KSBmb3JtIG9mIHRoZSBvYmplY3RcbiAqL1xuXG4vLyBYWFggc2hvdWxkIHdlIHJlLWRvIHRoaXM/XG5RLm5lYXJlciA9IG5lYXJlcjtcbmZ1bmN0aW9uIG5lYXJlcih2YWx1ZSkge1xuICAgIGlmIChpc1Byb21pc2UodmFsdWUpKSB7XG4gICAgICAgIHZhciBpbnNwZWN0ZWQgPSB2YWx1ZS5pbnNwZWN0KCk7XG4gICAgICAgIGlmIChpbnNwZWN0ZWQuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnNwZWN0ZWQudmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHByb21pc2UuXG4gKiBPdGhlcndpc2UgaXQgaXMgYSBmdWxmaWxsZWQgdmFsdWUuXG4gKi9cblEuaXNQcm9taXNlID0gaXNQcm9taXNlO1xuZnVuY3Rpb24gaXNQcm9taXNlKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBQcm9taXNlO1xufVxuXG5RLmlzUHJvbWlzZUFsaWtlID0gaXNQcm9taXNlQWxpa2U7XG5mdW5jdGlvbiBpc1Byb21pc2VBbGlrZShvYmplY3QpIHtcbiAgICByZXR1cm4gaXNPYmplY3Qob2JqZWN0KSAmJiB0eXBlb2Ygb2JqZWN0LnRoZW4gPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwZW5kaW5nIHByb21pc2UsIG1lYW5pbmcgbm90XG4gKiBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG4gKi9cblEuaXNQZW5kaW5nID0gaXNQZW5kaW5nO1xuZnVuY3Rpb24gaXNQZW5kaW5nKG9iamVjdCkge1xuICAgIHJldHVybiBpc1Byb21pc2Uob2JqZWN0KSAmJiBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcInBlbmRpbmdcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNQZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59O1xuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHZhbHVlIG9yIGZ1bGZpbGxlZFxuICogcHJvbWlzZS5cbiAqL1xuUS5pc0Z1bGZpbGxlZCA9IGlzRnVsZmlsbGVkO1xuZnVuY3Rpb24gaXNGdWxmaWxsZWQob2JqZWN0KSB7XG4gICAgcmV0dXJuICFpc1Byb21pc2Uob2JqZWN0KSB8fCBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc0Z1bGZpbGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCI7XG59O1xuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHJlamVjdGVkIHByb21pc2UuXG4gKi9cblEuaXNSZWplY3RlZCA9IGlzUmVqZWN0ZWQ7XG5mdW5jdGlvbiBpc1JlamVjdGVkKG9iamVjdCkge1xuICAgIHJldHVybiBpc1Byb21pc2Uob2JqZWN0KSAmJiBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcInJlamVjdGVkXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUmVqZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcInJlamVjdGVkXCI7XG59O1xuXG4vLy8vIEJFR0lOIFVOSEFORExFRCBSRUpFQ1RJT04gVFJBQ0tJTkdcblxuLy8gVGhpcyBwcm9taXNlIGxpYnJhcnkgY29uc3VtZXMgZXhjZXB0aW9ucyB0aHJvd24gaW4gaGFuZGxlcnMgc28gdGhleSBjYW4gYmVcbi8vIGhhbmRsZWQgYnkgYSBzdWJzZXF1ZW50IHByb21pc2UuICBUaGUgZXhjZXB0aW9ucyBnZXQgYWRkZWQgdG8gdGhpcyBhcnJheSB3aGVuXG4vLyB0aGV5IGFyZSBjcmVhdGVkLCBhbmQgcmVtb3ZlZCB3aGVuIHRoZXkgYXJlIGhhbmRsZWQuICBOb3RlIHRoYXQgaW4gRVM2IG9yXG4vLyBzaGltbWVkIGVudmlyb25tZW50cywgdGhpcyB3b3VsZCBuYXR1cmFsbHkgYmUgYSBgU2V0YC5cbnZhciB1bmhhbmRsZWRSZWFzb25zID0gW107XG52YXIgdW5oYW5kbGVkUmVqZWN0aW9ucyA9IFtdO1xudmFyIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG5cbmZ1bmN0aW9uIHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpIHtcbiAgICB1bmhhbmRsZWRSZWFzb25zLmxlbmd0aCA9IDA7XG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5sZW5ndGggPSAwO1xuXG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gdHJ1ZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyYWNrUmVqZWN0aW9uKHByb21pc2UsIHJlYXNvbikge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB1bmhhbmRsZWRSZWplY3Rpb25zLnB1c2gocHJvbWlzZSk7XG4gICAgaWYgKHJlYXNvbiAmJiB0eXBlb2YgcmVhc29uLnN0YWNrICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMucHVzaChyZWFzb24uc3RhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMucHVzaChcIihubyBzdGFjaykgXCIgKyByZWFzb24pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdW50cmFja1JlamVjdGlvbihwcm9taXNlKSB7XG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBhdCA9IGFycmF5X2luZGV4T2YodW5oYW5kbGVkUmVqZWN0aW9ucywgcHJvbWlzZSk7XG4gICAgaWYgKGF0ICE9PSAtMSkge1xuICAgICAgICB1bmhhbmRsZWRSZWplY3Rpb25zLnNwbGljZShhdCwgMSk7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICB9XG59XG5cblEucmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zID0gcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zO1xuXG5RLmdldFVuaGFuZGxlZFJlYXNvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gTWFrZSBhIGNvcHkgc28gdGhhdCBjb25zdW1lcnMgY2FuJ3QgaW50ZXJmZXJlIHdpdGggb3VyIGludGVybmFsIHN0YXRlLlxuICAgIHJldHVybiB1bmhhbmRsZWRSZWFzb25zLnNsaWNlKCk7XG59O1xuXG5RLnN0b3BVbmhhbmRsZWRSZWplY3Rpb25UcmFja2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcbiAgICB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSBmYWxzZTtcbn07XG5cbnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuXG4vLy8vIEVORCBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHJlamVjdGVkIHByb21pc2UuXG4gKiBAcGFyYW0gcmVhc29uIHZhbHVlIGRlc2NyaWJpbmcgdGhlIGZhaWx1cmVcbiAqL1xuUS5yZWplY3QgPSByZWplY3Q7XG5mdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gICAgdmFyIHJlamVjdGlvbiA9IFByb21pc2Uoe1xuICAgICAgICBcIndoZW5cIjogZnVuY3Rpb24gKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAvLyBub3RlIHRoYXQgdGhlIGVycm9yIGhhcyBiZWVuIGhhbmRsZWRcbiAgICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHVudHJhY2tSZWplY3Rpb24odGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQgPyByZWplY3RlZChyZWFzb24pIDogdGhpcztcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJyZWplY3RlZFwiLCByZWFzb246IHJlYXNvbiB9O1xuICAgIH0pO1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoZSByZWFzb24gaGFzIG5vdCBiZWVuIGhhbmRsZWQuXG4gICAgdHJhY2tSZWplY3Rpb24ocmVqZWN0aW9uLCByZWFzb24pO1xuXG4gICAgcmV0dXJuIHJlamVjdGlvbjtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgZnVsZmlsbGVkIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZVxuICovXG5RLmZ1bGZpbGwgPSBmdWxmaWxsO1xuZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRcIjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRcIjogZnVuY3Rpb24gKG5hbWUsIHJocykge1xuICAgICAgICAgICAgdmFsdWVbbmFtZV0gPSByaHM7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlXCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwicG9zdFwiOiBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgICAgICAgICAgLy8gTWFyayBNaWxsZXIgcHJvcG9zZXMgdGhhdCBwb3N0IHdpdGggbm8gbmFtZSBzaG91bGQgYXBwbHkgYVxuICAgICAgICAgICAgLy8gcHJvbWlzZWQgZnVuY3Rpb24uXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbnVsbCB8fCBuYW1lID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodm9pZCAwLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlW25hbWVdLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJhcHBseVwiOiBmdW5jdGlvbiAodGhpc3AsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hcHBseSh0aGlzcCwgYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIFwia2V5c1wiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0X2tleXModmFsdWUpO1xuICAgICAgICB9XG4gICAgfSwgdm9pZCAwLCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJmdWxmaWxsZWRcIiwgdmFsdWU6IHZhbHVlIH07XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlbmFibGVzIHRvIFEgcHJvbWlzZXMuXG4gKiBAcGFyYW0gcHJvbWlzZSB0aGVuYWJsZSBwcm9taXNlXG4gKiBAcmV0dXJucyBhIFEgcHJvbWlzZVxuICovXG5mdW5jdGlvbiBjb2VyY2UocHJvbWlzZSkge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0LCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGFuIG9iamVjdCBzdWNoIHRoYXQgaXQgd2lsbCBuZXZlciBiZVxuICogdHJhbnNmZXJyZWQgYXdheSBmcm9tIHRoaXMgcHJvY2VzcyBvdmVyIGFueSBwcm9taXNlXG4gKiBjb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gKiBAcGFyYW0gb2JqZWN0XG4gKiBAcmV0dXJucyBwcm9taXNlIGEgd3JhcHBpbmcgb2YgdGhhdCBvYmplY3QgdGhhdFxuICogYWRkaXRpb25hbGx5IHJlc3BvbmRzIHRvIHRoZSBcImlzRGVmXCIgbWVzc2FnZVxuICogd2l0aG91dCBhIHJlamVjdGlvbi5cbiAqL1xuUS5tYXN0ZXIgPSBtYXN0ZXI7XG5mdW5jdGlvbiBtYXN0ZXIob2JqZWN0KSB7XG4gICAgcmV0dXJuIFByb21pc2Uoe1xuICAgICAgICBcImlzRGVmXCI6IGZ1bmN0aW9uICgpIHt9XG4gICAgfSwgZnVuY3Rpb24gZmFsbGJhY2sob3AsIGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpO1xuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFEob2JqZWN0KS5pbnNwZWN0KCk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogU3ByZWFkcyB0aGUgdmFsdWVzIG9mIGEgcHJvbWlzZWQgYXJyYXkgb2YgYXJndW1lbnRzIGludG8gdGhlXG4gKiBmdWxmaWxsbWVudCBjYWxsYmFjay5cbiAqIEBwYXJhbSBmdWxmaWxsZWQgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyB2YXJpYWRpYyBhcmd1bWVudHMgZnJvbSB0aGVcbiAqIHByb21pc2VkIGFycmF5XG4gKiBAcGFyYW0gcmVqZWN0ZWQgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyB0aGUgZXhjZXB0aW9uIGlmIHRoZSBwcm9taXNlXG4gKiBpcyByZWplY3RlZC5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvciB0aHJvd24gZXhjZXB0aW9uIG9mXG4gKiBlaXRoZXIgY2FsbGJhY2suXG4gKi9cblEuc3ByZWFkID0gc3ByZWFkO1xuZnVuY3Rpb24gc3ByZWFkKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnNwcmVhZChmdWxmaWxsZWQsIHJlamVjdGVkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuc3ByZWFkID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gdGhpcy5hbGwoKS50aGVuKGZ1bmN0aW9uIChhcnJheSkge1xuICAgICAgICByZXR1cm4gZnVsZmlsbGVkLmFwcGx5KHZvaWQgMCwgYXJyYXkpO1xuICAgIH0sIHJlamVjdGVkKTtcbn07XG5cbi8qKlxuICogVGhlIGFzeW5jIGZ1bmN0aW9uIGlzIGEgZGVjb3JhdG9yIGZvciBnZW5lcmF0b3IgZnVuY3Rpb25zLCB0dXJuaW5nXG4gKiB0aGVtIGludG8gYXN5bmNocm9ub3VzIGdlbmVyYXRvcnMuICBBbHRob3VnaCBnZW5lcmF0b3JzIGFyZSBvbmx5IHBhcnRcbiAqIG9mIHRoZSBuZXdlc3QgRUNNQVNjcmlwdCA2IGRyYWZ0cywgdGhpcyBjb2RlIGRvZXMgbm90IGNhdXNlIHN5bnRheFxuICogZXJyb3JzIGluIG9sZGVyIGVuZ2luZXMuICBUaGlzIGNvZGUgc2hvdWxkIGNvbnRpbnVlIHRvIHdvcmsgYW5kIHdpbGxcbiAqIGluIGZhY3QgaW1wcm92ZSBvdmVyIHRpbWUgYXMgdGhlIGxhbmd1YWdlIGltcHJvdmVzLlxuICpcbiAqIEVTNiBnZW5lcmF0b3JzIGFyZSBjdXJyZW50bHkgcGFydCBvZiBWOCB2ZXJzaW9uIDMuMTkgd2l0aCB0aGVcbiAqIC0taGFybW9ueS1nZW5lcmF0b3JzIHJ1bnRpbWUgZmxhZyBlbmFibGVkLiAgU3BpZGVyTW9ua2V5IGhhcyBoYWQgdGhlbVxuICogZm9yIGxvbmdlciwgYnV0IHVuZGVyIGFuIG9sZGVyIFB5dGhvbi1pbnNwaXJlZCBmb3JtLiAgVGhpcyBmdW5jdGlvblxuICogd29ya3Mgb24gYm90aCBraW5kcyBvZiBnZW5lcmF0b3JzLlxuICpcbiAqIERlY29yYXRlcyBhIGdlbmVyYXRvciBmdW5jdGlvbiBzdWNoIHRoYXQ6XG4gKiAgLSBpdCBtYXkgeWllbGQgcHJvbWlzZXNcbiAqICAtIGV4ZWN1dGlvbiB3aWxsIGNvbnRpbnVlIHdoZW4gdGhhdCBwcm9taXNlIGlzIGZ1bGZpbGxlZFxuICogIC0gdGhlIHZhbHVlIG9mIHRoZSB5aWVsZCBleHByZXNzaW9uIHdpbGwgYmUgdGhlIGZ1bGZpbGxlZCB2YWx1ZVxuICogIC0gaXQgcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgKHdoZW4gdGhlIGdlbmVyYXRvclxuICogICAgc3RvcHMgaXRlcmF0aW5nKVxuICogIC0gdGhlIGRlY29yYXRlZCBmdW5jdGlvbiByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICogICAgb2YgdGhlIGdlbmVyYXRvciBvciB0aGUgZmlyc3QgcmVqZWN0ZWQgcHJvbWlzZSBhbW9uZyB0aG9zZVxuICogICAgeWllbGRlZC5cbiAqICAtIGlmIGFuIGVycm9yIGlzIHRocm93biBpbiB0aGUgZ2VuZXJhdG9yLCBpdCBwcm9wYWdhdGVzIHRocm91Z2hcbiAqICAgIGV2ZXJ5IGZvbGxvd2luZyB5aWVsZCB1bnRpbCBpdCBpcyBjYXVnaHQsIG9yIHVudGlsIGl0IGVzY2FwZXNcbiAqICAgIHRoZSBnZW5lcmF0b3IgZnVuY3Rpb24gYWx0b2dldGhlciwgYW5kIGlzIHRyYW5zbGF0ZWQgaW50byBhXG4gKiAgICByZWplY3Rpb24gZm9yIHRoZSBwcm9taXNlIHJldHVybmVkIGJ5IHRoZSBkZWNvcmF0ZWQgZ2VuZXJhdG9yLlxuICovXG5RLmFzeW5jID0gYXN5bmM7XG5mdW5jdGlvbiBhc3luYyhtYWtlR2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gd2hlbiB2ZXJiIGlzIFwic2VuZFwiLCBhcmcgaXMgYSB2YWx1ZVxuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJ0aHJvd1wiLCBhcmcgaXMgYW4gZXhjZXB0aW9uXG4gICAgICAgIGZ1bmN0aW9uIGNvbnRpbnVlcih2ZXJiLCBhcmcpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgICAgICAgIC8vIFVudGlsIFY4IDMuMTkgLyBDaHJvbWl1bSAyOSBpcyByZWxlYXNlZCwgU3BpZGVyTW9ua2V5IGlzIHRoZSBvbmx5XG4gICAgICAgICAgICAvLyBlbmdpbmUgdGhhdCBoYXMgYSBkZXBsb3llZCBiYXNlIG9mIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBnZW5lcmF0b3JzLlxuICAgICAgICAgICAgLy8gSG93ZXZlciwgU00ncyBnZW5lcmF0b3JzIHVzZSB0aGUgUHl0aG9uLWluc3BpcmVkIHNlbWFudGljcyBvZlxuICAgICAgICAgICAgLy8gb3V0ZGF0ZWQgRVM2IGRyYWZ0cy4gIFdlIHdvdWxkIGxpa2UgdG8gc3VwcG9ydCBFUzYsIGJ1dCB3ZSdkIGFsc29cbiAgICAgICAgICAgIC8vIGxpa2UgdG8gbWFrZSBpdCBwb3NzaWJsZSB0byB1c2UgZ2VuZXJhdG9ycyBpbiBkZXBsb3llZCBicm93c2Vycywgc29cbiAgICAgICAgICAgIC8vIHdlIGFsc28gc3VwcG9ydCBQeXRob24tc3R5bGUgZ2VuZXJhdG9ycy4gIEF0IHNvbWUgcG9pbnQgd2UgY2FuIHJlbW92ZVxuICAgICAgICAgICAgLy8gdGhpcyBibG9jay5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBTdG9wSXRlcmF0aW9uID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgLy8gRVM2IEdlbmVyYXRvcnNcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0oYXJnKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFEocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQudmFsdWUsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFNwaWRlck1vbmtleSBHZW5lcmF0b3JzXG4gICAgICAgICAgICAgICAgLy8gRklYTUU6IFJlbW92ZSB0aGlzIGNhc2Ugd2hlbiBTTSBkb2VzIEVTNiBnZW5lcmF0b3JzLlxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdG9wSXRlcmF0aW9uKGV4Y2VwdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBRKGV4Y2VwdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdoZW4ocmVzdWx0LCBjYWxsYmFjaywgZXJyYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IG1ha2VHZW5lcmF0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gY29udGludWVyLmJpbmQoY29udGludWVyLCBcIm5leHRcIik7XG4gICAgICAgIHZhciBlcnJiYWNrID0gY29udGludWVyLmJpbmQoY29udGludWVyLCBcInRocm93XCIpO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIFRoZSBzcGF3biBmdW5jdGlvbiBpcyBhIHNtYWxsIHdyYXBwZXIgYXJvdW5kIGFzeW5jIHRoYXQgaW1tZWRpYXRlbHlcbiAqIGNhbGxzIHRoZSBnZW5lcmF0b3IgYW5kIGFsc28gZW5kcyB0aGUgcHJvbWlzZSBjaGFpbiwgc28gdGhhdCBhbnlcbiAqIHVuaGFuZGxlZCBlcnJvcnMgYXJlIHRocm93biBpbnN0ZWFkIG9mIGZvcndhcmRlZCB0byB0aGUgZXJyb3JcbiAqIGhhbmRsZXIuIFRoaXMgaXMgdXNlZnVsIGJlY2F1c2UgaXQncyBleHRyZW1lbHkgY29tbW9uIHRvIHJ1blxuICogZ2VuZXJhdG9ycyBhdCB0aGUgdG9wLWxldmVsIHRvIHdvcmsgd2l0aCBsaWJyYXJpZXMuXG4gKi9cblEuc3Bhd24gPSBzcGF3bjtcbmZ1bmN0aW9uIHNwYXduKG1ha2VHZW5lcmF0b3IpIHtcbiAgICBRLmRvbmUoUS5hc3luYyhtYWtlR2VuZXJhdG9yKSgpKTtcbn1cblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGludGVyZmFjZSBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpbiBTcGlkZXJNb25rZXkuXG4vKipcbiAqIFRocm93cyBhIFJldHVyblZhbHVlIGV4Y2VwdGlvbiB0byBzdG9wIGFuIGFzeW5jaHJvbm91cyBnZW5lcmF0b3IuXG4gKlxuICogVGhpcyBpbnRlcmZhY2UgaXMgYSBzdG9wLWdhcCBtZWFzdXJlIHRvIHN1cHBvcnQgZ2VuZXJhdG9yIHJldHVyblxuICogdmFsdWVzIGluIG9sZGVyIEZpcmVmb3gvU3BpZGVyTW9ua2V5LiAgSW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEVTNlxuICogZ2VuZXJhdG9ycyBsaWtlIENocm9taXVtIDI5LCBqdXN0IHVzZSBcInJldHVyblwiIGluIHlvdXIgZ2VuZXJhdG9yXG4gKiBmdW5jdGlvbnMuXG4gKlxuICogQHBhcmFtIHZhbHVlIHRoZSByZXR1cm4gdmFsdWUgZm9yIHRoZSBzdXJyb3VuZGluZyBnZW5lcmF0b3JcbiAqIEB0aHJvd3MgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHdpdGggdGhlIHZhbHVlLlxuICogQGV4YW1wbGVcbiAqIC8vIEVTNiBzdHlsZVxuICogUS5hc3luYyhmdW5jdGlvbiogKCkge1xuICogICAgICB2YXIgZm9vID0geWllbGQgZ2V0Rm9vUHJvbWlzZSgpO1xuICogICAgICB2YXIgYmFyID0geWllbGQgZ2V0QmFyUHJvbWlzZSgpO1xuICogICAgICByZXR1cm4gZm9vICsgYmFyO1xuICogfSlcbiAqIC8vIE9sZGVyIFNwaWRlck1vbmtleSBzdHlsZVxuICogUS5hc3luYyhmdW5jdGlvbiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIFEucmV0dXJuKGZvbyArIGJhcik7XG4gKiB9KVxuICovXG5RW1wicmV0dXJuXCJdID0gX3JldHVybjtcbmZ1bmN0aW9uIF9yZXR1cm4odmFsdWUpIHtcbiAgICB0aHJvdyBuZXcgUVJldHVyblZhbHVlKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBUaGUgcHJvbWlzZWQgZnVuY3Rpb24gZGVjb3JhdG9yIGVuc3VyZXMgdGhhdCBhbnkgcHJvbWlzZSBhcmd1bWVudHNcbiAqIGFyZSBzZXR0bGVkIGFuZCBwYXNzZWQgYXMgdmFsdWVzIChgdGhpc2AgaXMgYWxzbyBzZXR0bGVkIGFuZCBwYXNzZWRcbiAqIGFzIGEgdmFsdWUpLiAgSXQgd2lsbCBhbHNvIGVuc3VyZSB0aGF0IHRoZSByZXN1bHQgb2YgYSBmdW5jdGlvbiBpc1xuICogYWx3YXlzIGEgcHJvbWlzZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIGFkZCA9IFEucHJvbWlzZWQoZnVuY3Rpb24gKGEsIGIpIHtcbiAqICAgICByZXR1cm4gYSArIGI7XG4gKiB9KTtcbiAqIGFkZChRKGEpLCBRKEIpKTtcbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gZGVjb3JhdGVcbiAqIEByZXR1cm5zIHtmdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IGhhcyBiZWVuIGRlY29yYXRlZC5cbiAqL1xuUS5wcm9taXNlZCA9IHByb21pc2VkO1xuZnVuY3Rpb24gcHJvbWlzZWQoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc3ByZWFkKFt0aGlzLCBhbGwoYXJndW1lbnRzKV0sIGZ1bmN0aW9uIChzZWxmLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG5cbi8qKlxuICogc2VuZHMgYSBtZXNzYWdlIHRvIGEgdmFsdWUgaW4gYSBmdXR1cmUgdHVyblxuICogQHBhcmFtIG9iamVjdCogdGhlIHJlY2lwaWVudFxuICogQHBhcmFtIG9wIHRoZSBuYW1lIG9mIHRoZSBtZXNzYWdlIG9wZXJhdGlvbiwgZS5nLiwgXCJ3aGVuXCIsXG4gKiBAcGFyYW0gYXJncyBmdXJ0aGVyIGFyZ3VtZW50cyB0byBiZSBmb3J3YXJkZWQgdG8gdGhlIG9wZXJhdGlvblxuICogQHJldHVybnMgcmVzdWx0IHtQcm9taXNlfSBhIHByb21pc2UgZm9yIHRoZSByZXN1bHQgb2YgdGhlIG9wZXJhdGlvblxuICovXG5RLmRpc3BhdGNoID0gZGlzcGF0Y2g7XG5mdW5jdGlvbiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChvcCwgYXJncyk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gKG9wLCBhcmdzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGRlZmVycmVkLnJlc29sdmUsIG9wLCBhcmdzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBnZXRcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHByb3BlcnR5IHZhbHVlXG4gKi9cblEuZ2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3Igb2JqZWN0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIHNldFxuICogQHBhcmFtIHZhbHVlICAgICBuZXcgdmFsdWUgb2YgcHJvcGVydHlcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG4vKipcbiAqIERlbGV0ZXMgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBkZWxldGVcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLmRlbCA9IC8vIFhYWCBsZWdhY3lcblFbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbCA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gdmFsdWUgICAgIGEgdmFsdWUgdG8gcG9zdCwgdHlwaWNhbGx5IGFuIGFycmF5IG9mXG4gKiAgICAgICAgICAgICAgICAgIGludm9jYXRpb24gYXJndW1lbnRzIGZvciBwcm9taXNlcyB0aGF0XG4gKiAgICAgICAgICAgICAgICAgIGFyZSB1bHRpbWF0ZWx5IGJhY2tlZCB3aXRoIGByZXNvbHZlYCB2YWx1ZXMsXG4gKiAgICAgICAgICAgICAgICAgIGFzIG9wcG9zZWQgdG8gdGhvc2UgYmFja2VkIHdpdGggVVJMc1xuICogICAgICAgICAgICAgICAgICB3aGVyZWluIHRoZSBwb3N0ZWQgdmFsdWUgY2FuIGJlIGFueVxuICogICAgICAgICAgICAgICAgICBKU09OIHNlcmlhbGl6YWJsZSBvYmplY3QuXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuLy8gYm91bmQgbG9jYWxseSBiZWNhdXNlIGl0IGlzIHVzZWQgYnkgb3RoZXIgbWV0aG9kc1xuUS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBpbnZvY2F0aW9uIGFyZ3VtZW50c1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5RLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEuaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblByb21pc2UucHJvdG90eXBlLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gYXJncyAgICAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZhcHBseSA9IGZ1bmN0aW9uIChvYmplY3QsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmFwcGx5ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RW1widHJ5XCJdID1cblEuZmNhbGwgPSBmdW5jdGlvbiAob2JqZWN0IC8qIC4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzKV0pO1xufTtcblxuLyoqXG4gKiBCaW5kcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24sIHRyYW5zZm9ybWluZyByZXR1cm4gdmFsdWVzIGludG8gYSBmdWxmaWxsZWRcbiAqIHByb21pc2UgYW5kIHRocm93biBlcnJvcnMgaW50byBhIHJlamVjdGVkIG9uZS5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmJpbmQgPSBmdW5jdGlvbiAob2JqZWN0IC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSBRKG9iamVjdCk7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuUHJvbWlzZS5wcm90b3R5cGUuZmJpbmQgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuXG4vKipcbiAqIFJlcXVlc3RzIHRoZSBuYW1lcyBvZiB0aGUgb3duZWQgcHJvcGVydGllcyBvZiBhIHByb21pc2VkXG4gKiBvYmplY3QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBrZXlzIG9mIHRoZSBldmVudHVhbGx5IHNldHRsZWQgb2JqZWN0XG4gKi9cblEua2V5cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheS4gIElmIGFueSBvZlxuICogdGhlIHByb21pc2VzIGdldHMgcmVqZWN0ZWQsIHRoZSB3aG9sZSBhcnJheSBpcyByZWplY3RlZCBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHZhbHVlcyAob3JcbiAqIHByb21pc2VzIGZvciB2YWx1ZXMpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlc1xuICovXG4vLyBCeSBNYXJrIE1pbGxlclxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9c3RyYXdtYW46Y29uY3VycmVuY3kmcmV2PTEzMDg3NzY1MjEjYWxsZnVsZmlsbGVkXG5RLmFsbCA9IGFsbDtcbmZ1bmN0aW9uIGFsbChwcm9taXNlcykge1xuICAgIHJldHVybiB3aGVuKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgdmFyIHBlbmRpbmdDb3VudCA9IDA7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvbWlzZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBzbmFwc2hvdDtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBpc1Byb21pc2UocHJvbWlzZSkgJiZcbiAgICAgICAgICAgICAgICAoc25hcHNob3QgPSBwcm9taXNlLmluc3BlY3QoKSkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHNuYXBzaG90LnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICArK3BlbmRpbmdDb3VudDtcbiAgICAgICAgICAgICAgICB3aGVuKFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC0tcGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoeyBpbmRleDogaW5kZXgsIHZhbHVlOiBwcm9ncmVzcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFsbCh0aGlzKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgcmVzb2x2ZWQgcHJvbWlzZSBvZiBhbiBhcnJheS4gUHJpb3IgcmVqZWN0ZWQgcHJvbWlzZXMgYXJlXG4gKiBpZ25vcmVkLiAgUmVqZWN0cyBvbmx5IGlmIGFsbCBwcm9taXNlcyBhcmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0ge0FycmF5Kn0gYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgb3IgcHJvbWlzZXMgZm9yIHZhbHVlc1xuICogQHJldHVybnMgYSBwcm9taXNlIGZ1bGZpbGxlZCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgcmVzb2x2ZWQgcHJvbWlzZSxcbiAqIG9yIGEgcmVqZWN0ZWQgcHJvbWlzZSBpZiBhbGwgcHJvbWlzZXMgYXJlIHJlamVjdGVkLlxuICovXG5RLmFueSA9IGFueTtcblxuZnVuY3Rpb24gYW55KHByb21pc2VzKSB7XG4gICAgaWYgKHByb21pc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gUS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgIHZhciBwZW5kaW5nQ291bnQgPSAwO1xuICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24ocHJldiwgY3VycmVudCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSBwcm9taXNlc1tpbmRleF07XG5cbiAgICAgICAgcGVuZGluZ0NvdW50Kys7XG5cbiAgICAgICAgd2hlbihwcm9taXNlLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgb25Qcm9ncmVzcyk7XG4gICAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbGVkKHJlc3VsdCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uUmVqZWN0ZWQoKSB7XG4gICAgICAgICAgICBwZW5kaW5nQ291bnQtLTtcbiAgICAgICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIkNhbid0IGdldCBmdWxmaWxsbWVudCB2YWx1ZSBmcm9tIGFueSBwcm9taXNlLCBhbGwgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInByb21pc2VzIHdlcmUgcmVqZWN0ZWQuXCJcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblByb2dyZXNzKHByb2dyZXNzKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoe1xuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcHJvZ3Jlc3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSwgdW5kZWZpbmVkKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbnkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gYW55KHRoaXMpO1xufTtcblxuLyoqXG4gKiBXYWl0cyBmb3IgYWxsIHByb21pc2VzIHRvIGJlIHNldHRsZWQsIGVpdGhlciBmdWxmaWxsZWQgb3JcbiAqIHJlamVjdGVkLiAgVGhpcyBpcyBkaXN0aW5jdCBmcm9tIGBhbGxgIHNpbmNlIHRoYXQgd291bGQgc3RvcFxuICogd2FpdGluZyBhdCB0aGUgZmlyc3QgcmVqZWN0aW9uLiAgVGhlIHByb21pc2UgcmV0dXJuZWQgYnlcbiAqIGBhbGxSZXNvbHZlZGAgd2lsbCBuZXZlciBiZSByZWplY3RlZC5cbiAqIEBwYXJhbSBwcm9taXNlcyBhIHByb21pc2UgZm9yIGFuIGFycmF5IChvciBhbiBhcnJheSkgb2YgcHJvbWlzZXNcbiAqIChvciB2YWx1ZXMpXG4gKiBAcmV0dXJuIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgcHJvbWlzZXNcbiAqL1xuUS5hbGxSZXNvbHZlZCA9IGRlcHJlY2F0ZShhbGxSZXNvbHZlZCwgXCJhbGxSZXNvbHZlZFwiLCBcImFsbFNldHRsZWRcIik7XG5mdW5jdGlvbiBhbGxSZXNvbHZlZChwcm9taXNlcykge1xuICAgIHJldHVybiB3aGVuKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgcHJvbWlzZXMgPSBhcnJheV9tYXAocHJvbWlzZXMsIFEpO1xuICAgICAgICByZXR1cm4gd2hlbihhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHdoZW4ocHJvbWlzZSwgbm9vcCwgbm9vcCk7XG4gICAgICAgIH0pKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2VzO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYWxsUmVzb2x2ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFsbFJlc29sdmVkKHRoaXMpO1xufTtcblxuLyoqXG4gKiBAc2VlIFByb21pc2UjYWxsU2V0dGxlZFxuICovXG5RLmFsbFNldHRsZWQgPSBhbGxTZXR0bGVkO1xuZnVuY3Rpb24gYWxsU2V0dGxlZChwcm9taXNlcykge1xuICAgIHJldHVybiBRKHByb21pc2VzKS5hbGxTZXR0bGVkKCk7XG59XG5cbi8qKlxuICogVHVybnMgYW4gYXJyYXkgb2YgcHJvbWlzZXMgaW50byBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHRoZWlyIHN0YXRlcyAoYXNcbiAqIHJldHVybmVkIGJ5IGBpbnNwZWN0YCkgd2hlbiB0aGV5IGhhdmUgYWxsIHNldHRsZWQuXG4gKiBAcGFyYW0ge0FycmF5W0FueSpdfSB2YWx1ZXMgYW4gYXJyYXkgKG9yIHByb21pc2UgZm9yIGFuIGFycmF5KSBvZiB2YWx1ZXMgKG9yXG4gKiBwcm9taXNlcyBmb3IgdmFsdWVzKVxuICogQHJldHVybnMge0FycmF5W1N0YXRlXX0gYW4gYXJyYXkgb2Ygc3RhdGVzIGZvciB0aGUgcmVzcGVjdGl2ZSB2YWx1ZXMuXG4gKi9cblByb21pc2UucHJvdG90eXBlLmFsbFNldHRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgcmV0dXJuIGFsbChhcnJheV9tYXAocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgICAgICAgICBwcm9taXNlID0gUShwcm9taXNlKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlZ2FyZGxlc3MoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2UuaW5zcGVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihyZWdhcmRsZXNzLCByZWdhcmRsZXNzKTtcbiAgICAgICAgfSkpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBDYXB0dXJlcyB0aGUgZmFpbHVyZSBvZiBhIHByb21pc2UsIGdpdmluZyBhbiBvcG9ydHVuaXR5IHRvIHJlY292ZXJcbiAqIHdpdGggYSBjYWxsYmFjay4gIElmIHRoZSBnaXZlbiBwcm9taXNlIGlzIGZ1bGZpbGxlZCwgdGhlIHJldHVybmVkXG4gKiBwcm9taXNlIGlzIGZ1bGZpbGxlZC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBmb3Igc29tZXRoaW5nXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBmdWxmaWxsIHRoZSByZXR1cm5lZCBwcm9taXNlIGlmIHRoZVxuICogZ2l2ZW4gcHJvbWlzZSBpcyByZWplY3RlZFxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBjYWxsYmFja1xuICovXG5RLmZhaWwgPSAvLyBYWFggbGVnYWN5XG5RW1wiY2F0Y2hcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCByZWplY3RlZCkge1xuICAgIHJldHVybiBRKG9iamVjdCkudGhlbih2b2lkIDAsIHJlamVjdGVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZhaWwgPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbih2b2lkIDAsIHJlamVjdGVkKTtcbn07XG5cbi8qKlxuICogQXR0YWNoZXMgYSBsaXN0ZW5lciB0aGF0IGNhbiByZXNwb25kIHRvIHByb2dyZXNzIG5vdGlmaWNhdGlvbnMgZnJvbSBhXG4gKiBwcm9taXNlJ3Mgb3JpZ2luYXRpbmcgZGVmZXJyZWQuIFRoaXMgbGlzdGVuZXIgcmVjZWl2ZXMgdGhlIGV4YWN0IGFyZ3VtZW50c1xuICogcGFzc2VkIHRvIGBgZGVmZXJyZWQubm90aWZ5YGAuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gcmVjZWl2ZSBhbnkgcHJvZ3Jlc3Mgbm90aWZpY2F0aW9uc1xuICogQHJldHVybnMgdGhlIGdpdmVuIHByb21pc2UsIHVuY2hhbmdlZFxuICovXG5RLnByb2dyZXNzID0gcHJvZ3Jlc3M7XG5mdW5jdGlvbiBwcm9ncmVzcyhvYmplY3QsIHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5wcm9ncmVzcyA9IGZ1bmN0aW9uIChwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbih2b2lkIDAsIHZvaWQgMCwgcHJvZ3Jlc3NlZCk7XG59O1xuXG4vKipcbiAqIFByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIG9ic2VydmUgdGhlIHNldHRsaW5nIG9mIGEgcHJvbWlzZSxcbiAqIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB0aGUgcHJvbWlzZSBpcyBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuICBGb3J3YXJkc1xuICogdGhlIHJlc29sdXRpb24gdG8gdGhlIHJldHVybmVkIHByb21pc2Ugd2hlbiB0aGUgY2FsbGJhY2sgaXMgZG9uZS5cbiAqIFRoZSBjYWxsYmFjayBjYW4gcmV0dXJuIGEgcHJvbWlzZSB0byBkZWZlciBjb21wbGV0aW9uLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBvYnNlcnZlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlblxuICogcHJvbWlzZSwgdGFrZXMgbm8gYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSB3aGVuXG4gKiBgYGZpbmBgIGlzIGRvbmUuXG4gKi9cblEuZmluID0gLy8gWFhYIGxlZ2FjeVxuUVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgIHJldHVybiBRKG9iamVjdClbXCJmaW5hbGx5XCJdKGNhbGxiYWNrKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZpbiA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiZmluYWxseVwiXSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrID0gUShjYWxsYmFjayk7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gVE9ETyBhdHRlbXB0IHRvIHJlY3ljbGUgdGhlIHJlamVjdGlvbiB3aXRoIFwidGhpc1wiLlxuICAgICAgICByZXR1cm4gY2FsbGJhY2suZmNhbGwoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRocm93IHJlYXNvbjtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFRlcm1pbmF0ZXMgYSBjaGFpbiBvZiBwcm9taXNlcywgZm9yY2luZyByZWplY3Rpb25zIHRvIGJlXG4gKiB0aHJvd24gYXMgZXhjZXB0aW9ucy5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBhdCB0aGUgZW5kIG9mIGEgY2hhaW4gb2YgcHJvbWlzZXNcbiAqIEByZXR1cm5zIG5vdGhpbmdcbiAqL1xuUS5kb25lID0gZnVuY3Rpb24gKG9iamVjdCwgZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRvbmUoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykge1xuICAgIHZhciBvblVuaGFuZGxlZEVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIC8vIGZvcndhcmQgdG8gYSBmdXR1cmUgdHVybiBzbyB0aGF0IGBgd2hlbmBgXG4gICAgICAgIC8vIGRvZXMgbm90IGNhdGNoIGl0IGFuZCB0dXJuIGl0IGludG8gYSByZWplY3Rpb24uXG4gICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFrZVN0YWNrVHJhY2VMb25nKGVycm9yLCBwcm9taXNlKTtcbiAgICAgICAgICAgIGlmIChRLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBRLm9uZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIEF2b2lkIHVubmVjZXNzYXJ5IGBuZXh0VGlja2BpbmcgdmlhIGFuIHVubmVjZXNzYXJ5IGB3aGVuYC5cbiAgICB2YXIgcHJvbWlzZSA9IGZ1bGZpbGxlZCB8fCByZWplY3RlZCB8fCBwcm9ncmVzcyA/XG4gICAgICAgIHRoaXMudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykgOlxuICAgICAgICB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MgJiYgcHJvY2Vzcy5kb21haW4pIHtcbiAgICAgICAgb25VbmhhbmRsZWRFcnJvciA9IHByb2Nlc3MuZG9tYWluLmJpbmQob25VbmhhbmRsZWRFcnJvcik7XG4gICAgfVxuXG4gICAgcHJvbWlzZS50aGVuKHZvaWQgMCwgb25VbmhhbmRsZWRFcnJvcik7XG59O1xuXG4vKipcbiAqIENhdXNlcyBhIHByb21pc2UgdG8gYmUgcmVqZWN0ZWQgaWYgaXQgZG9lcyBub3QgZ2V0IGZ1bGZpbGxlZCBiZWZvcmVcbiAqIHNvbWUgbWlsbGlzZWNvbmRzIHRpbWUgb3V0LlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge051bWJlcn0gbWlsbGlzZWNvbmRzIHRpbWVvdXRcbiAqIEBwYXJhbSB7QW55Kn0gY3VzdG9tIGVycm9yIG1lc3NhZ2Ugb3IgRXJyb3Igb2JqZWN0IChvcHRpb25hbClcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgaWYgaXQgaXNcbiAqIGZ1bGZpbGxlZCBiZWZvcmUgdGhlIHRpbWVvdXQsIG90aGVyd2lzZSByZWplY3RlZC5cbiAqL1xuUS50aW1lb3V0ID0gZnVuY3Rpb24gKG9iamVjdCwgbXMsIGVycm9yKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aW1lb3V0KG1zLCBlcnJvcik7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aW1lb3V0ID0gZnVuY3Rpb24gKG1zLCBlcnJvcikge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWVycm9yIHx8IFwic3RyaW5nXCIgPT09IHR5cGVvZiBlcnJvcikge1xuICAgICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoZXJyb3IgfHwgXCJUaW1lZCBvdXQgYWZ0ZXIgXCIgKyBtcyArIFwiIG1zXCIpO1xuICAgICAgICAgICAgZXJyb3IuY29kZSA9IFwiRVRJTUVET1VUXCI7XG4gICAgICAgIH1cbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICB9LCBtcyk7XG5cbiAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICB9LCBmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9LCBkZWZlcnJlZC5ub3RpZnkpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgZ2l2ZW4gdmFsdWUgKG9yIHByb21pc2VkIHZhbHVlKSwgc29tZVxuICogbWlsbGlzZWNvbmRzIGFmdGVyIGl0IHJlc29sdmVkLiBQYXNzZXMgcmVqZWN0aW9ucyBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kc1xuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSBhZnRlciBtaWxsaXNlY29uZHNcbiAqIHRpbWUgaGFzIGVsYXBzZWQgc2luY2UgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UuXG4gKiBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSByZWplY3RzLCB0aGF0IGlzIHBhc3NlZCBpbW1lZGlhdGVseS5cbiAqL1xuUS5kZWxheSA9IGZ1bmN0aW9uIChvYmplY3QsIHRpbWVvdXQpIHtcbiAgICBpZiAodGltZW91dCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRpbWVvdXQgPSBvYmplY3Q7XG4gICAgICAgIG9iamVjdCA9IHZvaWQgMDtcbiAgICB9XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kZWxheSh0aW1lb3V0KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24gKHRpbWVvdXQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGFzIGFuIGFycmF5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKlxuICogICAgICBRLm5mYXBwbHkoRlMucmVhZEZpbGUsIFtfX2ZpbGVuYW1lXSlcbiAqICAgICAgLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqICAgICAgfSlcbiAqXG4gKi9cblEubmZhcHBseSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgYXJncykge1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZhcHBseSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogUGFzc2VzIGEgY29udGludWF0aW9uIHRvIGEgTm9kZSBmdW5jdGlvbiwgd2hpY2ggaXMgY2FsbGVkIHdpdGggdGhlIGdpdmVuXG4gKiBhcmd1bWVudHMgcHJvdmlkZWQgaW5kaXZpZHVhbGx5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmNhbGwoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpXG4gKiAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogfSlcbiAqXG4gKi9cblEubmZjYWxsID0gZnVuY3Rpb24gKGNhbGxiYWNrIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZjYWxsID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBXcmFwcyBhIE5vZGVKUyBjb250aW51YXRpb24gcGFzc2luZyBmdW5jdGlvbiBhbmQgcmV0dXJucyBhbiBlcXVpdmFsZW50XG4gKiB2ZXJzaW9uIHRoYXQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmJpbmQoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpKFwidXRmLThcIilcbiAqIC50aGVuKGNvbnNvbGUubG9nKVxuICogLmRvbmUoKVxuICovXG5RLm5mYmluZCA9XG5RLmRlbm9kZWlmeSA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIFEoY2FsbGJhY2spLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZiaW5kID1cblByb21pc2UucHJvdG90eXBlLmRlbm9kZWlmeSA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEuZGVub2RlaWZ5LmFwcGx5KHZvaWQgMCwgYXJncyk7XG59O1xuXG5RLm5iaW5kID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXNwLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIFEoYm91bmQpLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmJpbmQgPSBmdW5jdGlvbiAoLyp0aGlzcCwgLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDApO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICByZXR1cm4gUS5uYmluZC5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrIHdpdGggYSBnaXZlbiBhcnJheSBvZiBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZCBjYWxsYmFjay5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3MgYXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIG1ldGhvZDsgdGhlIGNhbGxiYWNrXG4gKiB3aWxsIGJlIHByb3ZpZGVkIGJ5IFEgYW5kIGFwcGVuZGVkIHRvIHRoZXNlIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9yIGVycm9yXG4gKi9cblEubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLm5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkubnBvc3QobmFtZSwgYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5ubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLm5wb3N0ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzIHx8IFtdKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2ssIGZvcndhcmRpbmcgdGhlIGdpdmVuIHZhcmlhZGljIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkXG4gKiBjYWxsYmFjayBhcmd1bWVudC5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSAuLi5hcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFjayB3aWxsXG4gKiBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5zZW5kID0gLy8gWFhYIEJhc2VkIG9uIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgXCJzZW5kXCJcblEubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUS5uaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5Qcm9taXNlLnByb3RvdHlwZS5ubWNhbGwgPSAvLyBYWFggQmFzZWQgb24gXCJSZWRzYW5kcm8nc1wiIHByb3Bvc2FsXG5Qcm9taXNlLnByb3RvdHlwZS5uaW52b2tlID0gZnVuY3Rpb24gKG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogSWYgYSBmdW5jdGlvbiB3b3VsZCBsaWtlIHRvIHN1cHBvcnQgYm90aCBOb2RlIGNvbnRpbnVhdGlvbi1wYXNzaW5nLXN0eWxlIGFuZFxuICogcHJvbWlzZS1yZXR1cm5pbmctc3R5bGUsIGl0IGNhbiBlbmQgaXRzIGludGVybmFsIHByb21pc2UgY2hhaW4gd2l0aFxuICogYG5vZGVpZnkobm9kZWJhY2spYCwgZm9yd2FyZGluZyB0aGUgb3B0aW9uYWwgbm9kZWJhY2sgYXJndW1lbnQuICBJZiB0aGUgdXNlclxuICogZWxlY3RzIHRvIHVzZSBhIG5vZGViYWNrLCB0aGUgcmVzdWx0IHdpbGwgYmUgc2VudCB0aGVyZS4gIElmIHRoZXkgZG8gbm90XG4gKiBwYXNzIGEgbm9kZWJhY2ssIHRoZXkgd2lsbCByZWNlaXZlIHRoZSByZXN1bHQgcHJvbWlzZS5cbiAqIEBwYXJhbSBvYmplY3QgYSByZXN1bHQgKG9yIGEgcHJvbWlzZSBmb3IgYSByZXN1bHQpXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBub2RlYmFjayBhIE5vZGUuanMtc3R5bGUgY2FsbGJhY2tcbiAqIEByZXR1cm5zIGVpdGhlciB0aGUgcHJvbWlzZSBvciBub3RoaW5nXG4gKi9cblEubm9kZWlmeSA9IG5vZGVpZnk7XG5mdW5jdGlvbiBub2RlaWZ5KG9iamVjdCwgbm9kZWJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5vZGVpZnkobm9kZWJhY2spO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKG5vZGViYWNrKSB7XG4gICAgaWYgKG5vZGViYWNrKSB7XG4gICAgICAgIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5vZGViYWNrKG51bGwsIHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5vZGViYWNrKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59O1xuXG4vLyBBbGwgY29kZSBiZWZvcmUgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzLlxudmFyIHFFbmRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcblxucmV0dXJuIFE7XG5cbn0pO1xuIl19
},{"_process":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9hbmRyZXcvc2VydmljZS5qcyIsImpzL21vcS5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcS9xLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgdmFyIG1vcSA9IHJlcXVpcmUoJy4vLi4vbW9xJyksXHJcbiAgICAgICAgaHR0cEVycm9yID0gbW9xLmh0dHBFcnJvcixcclxuICAgICAgICBwcm9taXNlID0gbW9xLnByb21pc2UsXHJcbiAgICAgICAgY2FsbGJhY2sgPSBtb3EuY2FsbGJhY2s7XHJcblxyXG5cclxuICAgIHZhciBnb29kcyA9IHtcclxuICAgICAgICBcImRyYXcwMVwiOiB7bmFtZTogXCJwZW5jaWxcIiwgcHJpY2U6IDJ9LFxyXG4gICAgICAgIFwiZm9vZDAxXCI6IHtuYW1lOiBcImFwcGxlXCIsIHByaWNlOiAzfSxcclxuICAgICAgICBcIm1vdmUwMVwiOiB7bmFtZTogXCJjYXJcIiwgcHJpY2U6IDEwMDB9LFxyXG4gICAgICAgIFwiZm9vZDAyXCI6IHtuYW1lOiBcImJvdHRsZSBvZiB3YXRlclwiLCBwcmljZTogOH0sXHJcbiAgICAgICAgXCJtb3ZlMDJcIjoge25hbWU6IFwiYnVzIHRpY2tldFwiLCBwcmljZTogNX0sXHJcbiAgICAgICAgXCJ0ZWNoMDFcIjoge25hbWU6IFwibGFwdG9wXCIsIHByaWNlOiA1MDB9XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciB2ZW5kb3JDb2RlcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGdvb2RzKTtcclxuXHJcbiAgICB2YXIgdXNlcnMgPSB7XHJcbiAgICAgICAgXCJqYW5lXCI6IHtcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IFwicXdlXCIsXHJcbiAgICAgICAgICAgIG9yZGVyOiB7Zm9vZDAyOiAzLCB0ZWNoMDE6IDF9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImpvaG5cIjoge1xyXG4gICAgICAgICAgICBwYXNzd29yZDogXCIxMjNcIixcclxuICAgICAgICAgICAgb3JkZXI6IHtmb29kMDE6IDIsIG1vdmUwMjogMjB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgY3VycmVudFVzZXIgPSB1bmRlZmluZWQ7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGxvZ2luKGxvZ2luLCBwYXNzd29yZCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbG9naW4gIT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICB0aHJvdyBodHRwRXJyb3IoNDAwLCAnSW5jb3JyZWN0IHVzZXIgbmFtZScpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBjYW5kaWRhdGUgPSB1c2Vyc1tsb2dpbl07XHJcbiAgICAgICAgY3VycmVudFVzZXIgPSAoY2FuZGlkYXRlICYmIGNhbmRpZGF0ZS5wYXNzd29yZCA9PSBwYXNzd29yZCkgPyB1c2Vyc1tsb2dpbl0gOiBudWxsO1xyXG4gICAgICAgIGlmICghY3VycmVudFVzZXIpIHtcclxuICAgICAgICAgICAgdGhyb3cgaHR0cEVycm9yKDQwMCwgJ1dyb25nIHVzZXIgbmFtZSBvciBwYXNzd29yZCcpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldEdvb2RzTGlzdCgpIHtcclxuICAgICAgICByZXR1cm4gdmVuZG9yQ29kZXMubWFwKGZ1bmN0aW9uICh2ZW5kb3JDb2RlKSB7XHJcbiAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IGdvb2RzW3ZlbmRvckNvZGVdO1xyXG4gICAgICAgICAgICByZXR1cm4ge3ZlbmRvckNvZGU6IHZlbmRvckNvZGUsIG5hbWU6IHBvc2l0aW9uLm5hbWUsIHByaWNlOiBwb3NpdGlvbi5wcmljZX1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlVmVuZG9yQ29kZSh2ZW5kb3JDb2RlKSB7XHJcbiAgICAgICAgaWYgKCF2ZW5kb3JDb2RlIHx8IHR5cGVvZiB2ZW5kb3JDb2RlICE9IFwic3RyaW5nXCIgfHwgIWdvb2RzW3ZlbmRvckNvZGVdKSB7XHJcbiAgICAgICAgICAgIHRocm93ICBodHRwRXJyb3IoNDAwLCAnVW5rbm93biB2ZW5kb3IgY29kZScpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlQXV0aG9yaXphdGlvbigpe1xyXG4gICAgICAgIGlmICghY3VycmVudFVzZXIpIHtcclxuICAgICAgICAgICAgdGhyb3cgIGh0dHBFcnJvcig0MDEsICdZb3Ugc2hvdWxkIGJlIGF1dGhvcml6ZWQgZm9yIHRoaXMgb3BlcmF0aW9uJylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0TXlPcmRlcigpIHtcclxuICAgICAgICB2YWxpZGF0ZUF1dGhvcml6YXRpb24oKTtcclxuICAgICAgICB2YXIgY29kZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjdXJyZW50VXNlci5vcmRlcik7XHJcbiAgICAgICAgdmFyIHRvdGFsID0gMDtcclxuICAgICAgICB2YXIgaXRlbXMgPSBjb2Rlcy5tYXAoZnVuY3Rpb24gKHZlbmRvckNvZGUpIHtcclxuICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gZ29vZHNbdmVuZG9yQ29kZV07XHJcbiAgICAgICAgICAgIHZhciBjb3VudCA9IGN1cnJlbnRVc2VyLm9yZGVyW3ZlbmRvckNvZGVdO1xyXG4gICAgICAgICAgICB2YXIgcHJpY2UgPSBwb3NpdGlvbi5wcmljZSAqIGNvdW50O1xyXG4gICAgICAgICAgICB0b3RhbCArPSBwcmljZTtcclxuICAgICAgICAgICAgcmV0dXJuIHt2ZW5kb3JDb2RlOiB2ZW5kb3JDb2RlLCBjb3VudDogY291bnQsIG5hbWU6IHBvc2l0aW9uLm5hbWUsIHByaWNlOiBwcmljZX1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4ge3RvdGFsUHJpY2U6IHRvdGFsLCBpdGVtczogaXRlbXN9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkVG9PcmRlcih2ZW5kb3JDb2RlKSB7XHJcbiAgICAgICAgdmFsaWRhdGVBdXRob3JpemF0aW9uKCk7XHJcbiAgICAgICAgdmFsaWRhdGVWZW5kb3JDb2RlKHZlbmRvckNvZGUpO1xyXG4gICAgICAgIGN1cnJlbnRVc2VyLm9yZGVyW3ZlbmRvckNvZGVdID0gKGN1cnJlbnRVc2VyLm9yZGVyW3ZlbmRvckNvZGVdIHx8IDApICsgMTtcclxuICAgICAgICByZXR1cm4gZ2V0TXlPcmRlcigpXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVtb3ZlRnJvbU9yZGVyKHZlbmRvckNvZGUpIHtcclxuICAgICAgICB2YWxpZGF0ZUF1dGhvcml6YXRpb24oKTtcclxuICAgICAgICB2YWxpZGF0ZVZlbmRvckNvZGUodmVuZG9yQ29kZSk7XHJcbiAgICAgICAgZGVsZXRlIGN1cnJlbnRVc2VyLm9yZGVyW3ZlbmRvckNvZGVdO1xyXG4gICAgICAgIHJldHVybiBnZXRNeU9yZGVyKClcclxuICAgIH1cclxuXHJcblxyXG4gICAgd2luZG93LnNlcnZpY2UgPSB7XHJcbiAgICAgICAgbG9naW46IGNhbGxiYWNrKGxvZ2luKSxcclxuICAgICAgICBnZXRHb29kc0xpc3Q6IGNhbGxiYWNrKGdldEdvb2RzTGlzdCksXHJcbiAgICAgICAgZ2V0TXlPcmRlcjogcHJvbWlzZShnZXRNeU9yZGVyKSxcclxuICAgICAgICBhZGRUb09yZGVyOiBwcm9taXNlKGFkZFRvT3JkZXIpLFxyXG4gICAgICAgIHJlbW92ZUZyb21PcmRlcjogcHJvbWlzZShyZW1vdmVGcm9tT3JkZXIpXHJcbiAgICB9XHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbiAoKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIHEgPSByZXF1aXJlKCdxJyk7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlID0gbWVzc2FnZTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaHR0cEVycm9yKGNvZGUsIG1lc3NhZ2UpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gZXJyb3IobWVzc2FnZSk7XHJcbiAgICAgICAgcmVzdWx0LmNvZGUgPSBjb2RlO1xyXG4gICAgICAgIHJldHVybiByZXN1bHRcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gc2VydmVyaWZ5KHN5bmMsIGFyZ3MsIHJlc29sdmUsIGZhaWwpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKDAuMTAgPiBNYXRoLnJhbmRvbSgpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZSA9IFwiVG9vIE1hbnkgUmVxdWVzdHNcIjtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe2NvZGU6IDQyOSwgYm9keTogbWVzc2FnZSwgaGVhZGVyczoge1wiUmV0cnktQWZ0ZXJcIjogXCIxMDAwXCJ9fSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBzeW5jLmFwcGx5KG51bGwsIGFyZ3MpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgge2NvZGU6IDIwMCwgYm9keTogcmVzdWx0LCBoZWFkZXJzOiB7fX0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtjb2RlOiBlLmNvZGUsIGJvZHk6IGUubWVzc2FnZSwgaGVhZGVyczoge319KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIE1hdGgucmFuZG9tKCkgKiA1MDApO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBwcm9taXNlKHN5bmMpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgZGVmZXJyZWRSZXN1bHQgPSBxLmRlZmVyKCk7XHJcbiAgICAgICAgICAgIHZhciByZXNvbHZlID0gZGVmZXJyZWRSZXN1bHQucmVzb2x2ZS5iaW5kKGRlZmVycmVkUmVzdWx0KTtcclxuICAgICAgICAgICAgdmFyIHJlamVjdCA9IGRlZmVycmVkUmVzdWx0LnJlamVjdC5iaW5kKGRlZmVycmVkUmVzdWx0KTtcclxuICAgICAgICAgICAgc2VydmVyaWZ5KHN5bmMsIGFyZ3VtZW50cywgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkUmVzdWx0LnByb21pc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNhbGxiYWNrKHN5bmMpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgY2IgPSBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYmluZChhcmd1bWVudHMpKDAsIGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYiAhPSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcihcImNhbGxiYWNrIGFyZ3VtZW50IHNob3VsZCBiZSBhIGZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2VydmVyaWZ5KHN5bmMsIGFyZ3MsIGNiLmJpbmQobnVsbCwgbnVsbCksIGNiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGh0dHBFcnJvcjogaHR0cEVycm9yLFxyXG4gICAgICAgIHByb21pc2U6IHByb21pc2UsXHJcbiAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrXHJcbiAgICB9XHJcbn0pKCk7XHJcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gdHJ1ZTtcbiAgICB2YXIgY3VycmVudFF1ZXVlO1xuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbaV0oKTtcbiAgICAgICAgfVxuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG59XG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHF1ZXVlLnB1c2goZnVuKTtcbiAgICBpZiAoIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xuLy8gdmltOnRzPTQ6c3RzPTQ6c3c9NDpcbi8qIVxuICpcbiAqIENvcHlyaWdodCAyMDA5LTIwMTIgS3JpcyBLb3dhbCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVFxuICogbGljZW5zZSBmb3VuZCBhdCBodHRwOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9yYXcvbWFzdGVyL0xJQ0VOU0VcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IFR5bGVyIENsb3NlXG4gKiBDb3B5cmlnaHQgMjAwNy0yMDA5IFR5bGVyIENsb3NlIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUIFggbGljZW5zZSBmb3VuZFxuICogYXQgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5odG1sXG4gKiBGb3JrZWQgYXQgcmVmX3NlbmQuanMgdmVyc2lvbjogMjAwOS0wNS0xMVxuICpcbiAqIFdpdGggcGFydHMgYnkgTWFyayBNaWxsZXJcbiAqIENvcHlyaWdodCAoQykgMjAxMSBHb29nbGUgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqL1xuXG4oZnVuY3Rpb24gKGRlZmluaXRpb24pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8vIFRoaXMgZmlsZSB3aWxsIGZ1bmN0aW9uIHByb3Blcmx5IGFzIGEgPHNjcmlwdD4gdGFnLCBvciBhIG1vZHVsZVxuICAgIC8vIHVzaW5nIENvbW1vbkpTIGFuZCBOb2RlSlMgb3IgUmVxdWlyZUpTIG1vZHVsZSBmb3JtYXRzLiAgSW5cbiAgICAvLyBDb21tb24vTm9kZS9SZXF1aXJlSlMsIHRoZSBtb2R1bGUgZXhwb3J0cyB0aGUgUSBBUEkgYW5kIHdoZW5cbiAgICAvLyBleGVjdXRlZCBhcyBhIHNpbXBsZSA8c2NyaXB0PiwgaXQgY3JlYXRlcyBhIFEgZ2xvYmFsIGluc3RlYWQuXG5cbiAgICAvLyBNb250YWdlIFJlcXVpcmVcbiAgICBpZiAodHlwZW9mIGJvb3RzdHJhcCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGJvb3RzdHJhcChcInByb21pc2VcIiwgZGVmaW5pdGlvbik7XG5cbiAgICAvLyBDb21tb25KU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcblxuICAgIC8vIFJlcXVpcmVKU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKGRlZmluaXRpb24pO1xuXG4gICAgLy8gU0VTIChTZWN1cmUgRWNtYVNjcmlwdClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaWYgKCFzZXMub2soKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VzLm1ha2VRID0gZGVmaW5pdGlvbjtcbiAgICAgICAgfVxuXG4gICAgLy8gPHNjcmlwdD5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHNlbGYuUSA9IGRlZmluaXRpb24oKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgZW52aXJvbm1lbnQgd2FzIG5vdCBhbnRpY2lwYXRlZCBieSBRLiBQbGVhc2UgZmlsZSBhIGJ1Zy5cIik7XG4gICAgfVxuXG59KShmdW5jdGlvbiAoKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGhhc1N0YWNrcyA9IGZhbHNlO1xudHJ5IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbn0gY2F0Y2ggKGUpIHtcbiAgICBoYXNTdGFja3MgPSAhIWUuc3RhY2s7XG59XG5cbi8vIEFsbCBjb2RlIGFmdGVyIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcyByZXBvcnRlZFxuLy8gYnkgUS5cbnZhciBxU3RhcnRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcbnZhciBxRmlsZU5hbWU7XG5cbi8vIHNoaW1zXG5cbi8vIHVzZWQgZm9yIGZhbGxiYWNrIGluIFwiYWxsUmVzb2x2ZWRcIlxudmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IHBvc3NpYmxlIG1lYW5zIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm5cbi8vIG9mIHRoZSBldmVudCBsb29wLlxudmFyIG5leHRUaWNrID0oZnVuY3Rpb24gKCkge1xuICAgIC8vIGxpbmtlZCBsaXN0IG9mIHRhc2tzIChzaW5nbGUsIHdpdGggaGVhZCBub2RlKVxuICAgIHZhciBoZWFkID0ge3Rhc2s6IHZvaWQgMCwgbmV4dDogbnVsbH07XG4gICAgdmFyIHRhaWwgPSBoZWFkO1xuICAgIHZhciBmbHVzaGluZyA9IGZhbHNlO1xuICAgIHZhciByZXF1ZXN0VGljayA9IHZvaWQgMDtcbiAgICB2YXIgaXNOb2RlSlMgPSBmYWxzZTtcblxuICAgIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgICAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6IHRydWUgKi9cblxuICAgICAgICB3aGlsZSAoaGVhZC5uZXh0KSB7XG4gICAgICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgICAgICAgdmFyIHRhc2sgPSBoZWFkLnRhc2s7XG4gICAgICAgICAgICBoZWFkLnRhc2sgPSB2b2lkIDA7XG4gICAgICAgICAgICB2YXIgZG9tYWluID0gaGVhZC5kb21haW47XG5cbiAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICBoZWFkLmRvbWFpbiA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0YXNrKCk7XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNOb2RlSlMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW4gbm9kZSwgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgY29uc2lkZXJlZCBmYXRhbCBlcnJvcnMuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gc3luY2hyb25vdXNseSB0byBpbnRlcnJ1cHQgZmx1c2hpbmchXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRW5zdXJlIGNvbnRpbnVhdGlvbiBpZiB0aGUgdW5jYXVnaHQgZXhjZXB0aW9uIGlzIHN1cHByZXNzZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gbGlzdGVuaW5nIFwidW5jYXVnaHRFeGNlcHRpb25cIiBldmVudHMgKGFzIGRvbWFpbnMgZG9lcykuXG4gICAgICAgICAgICAgICAgICAgIC8vIENvbnRpbnVlIGluIG5leHQgZXZlbnQgdG8gYXZvaWQgdGljayByZWN1cnNpb24uXG4gICAgICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluIGJyb3dzZXJzLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgc2xvdy1kb3ducy5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgbmV4dFRpY2sgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0YWlsID0gdGFpbC5uZXh0ID0ge1xuICAgICAgICAgICAgdGFzazogdGFzayxcbiAgICAgICAgICAgIGRvbWFpbjogaXNOb2RlSlMgJiYgcHJvY2Vzcy5kb21haW4sXG4gICAgICAgICAgICBuZXh0OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgICAgICAgICAgcmVxdWVzdFRpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2Vzcy5uZXh0VGljaykge1xuICAgICAgICAvLyBOb2RlLmpzIGJlZm9yZSAwLjkuIE5vdGUgdGhhdCBzb21lIGZha2UtTm9kZSBlbnZpcm9ubWVudHMsIGxpa2UgdGhlXG4gICAgICAgIC8vIE1vY2hhIHRlc3QgcnVubmVyLCBpbnRyb2R1Y2UgYSBgcHJvY2Vzc2AgZ2xvYmFsIHdpdGhvdXQgYSBgbmV4dFRpY2tgLlxuICAgICAgICBpc05vZGVKUyA9IHRydWU7XG5cbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIC8vIEluIElFMTAsIE5vZGUuanMgMC45Kywgb3IgaHR0cHM6Ly9naXRodWIuY29tL05vYmxlSlMvc2V0SW1tZWRpYXRlXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHNldEltbWVkaWF0ZS5iaW5kKHdpbmRvdywgZmx1c2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZsdXNoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIG1vZGVybiBicm93c2Vyc1xuICAgICAgICAvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuICAgICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICAvLyBBdCBsZWFzdCBTYWZhcmkgVmVyc2lvbiA2LjAuNSAoODUzNi4zMC4xKSBpbnRlcm1pdHRlbnRseSBjYW5ub3QgY3JlYXRlXG4gICAgICAgIC8vIHdvcmtpbmcgbWVzc2FnZSBwb3J0cyB0aGUgZmlyc3QgdGltZSBhIHBhZ2UgbG9hZHMuXG4gICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSByZXF1ZXN0UG9ydFRpY2s7XG4gICAgICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlcXVlc3RQb3J0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIE9wZXJhIHJlcXVpcmVzIHVzIHRvIHByb3ZpZGUgYSBtZXNzYWdlIHBheWxvYWQsIHJlZ2FyZGxlc3Mgb2ZcbiAgICAgICAgICAgIC8vIHdoZXRoZXIgd2UgdXNlIGl0LlxuICAgICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgIHJlcXVlc3RQb3J0VGljaygpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gb2xkIGJyb3dzZXJzXG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG5leHRUaWNrO1xufSkoKTtcblxuLy8gQXR0ZW1wdCB0byBtYWtlIGdlbmVyaWNzIHNhZmUgaW4gdGhlIGZhY2Ugb2YgZG93bnN0cmVhbVxuLy8gbW9kaWZpY2F0aW9ucy5cbi8vIFRoZXJlIGlzIG5vIHNpdHVhdGlvbiB3aGVyZSB0aGlzIGlzIG5lY2Vzc2FyeS5cbi8vIElmIHlvdSBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLCB0aGVzZSBwcmltb3JkaWFscyBuZWVkIHRvIGJlXG4vLyBkZWVwbHkgZnJvemVuIGFueXdheSwgYW5kIGlmIHlvdSBkb27igJl0IG5lZWQgYSBzZWN1cml0eSBndWFyYW50ZWUsXG4vLyB0aGlzIGlzIGp1c3QgcGxhaW4gcGFyYW5vaWQuXG4vLyBIb3dldmVyLCB0aGlzICoqbWlnaHQqKiBoYXZlIHRoZSBuaWNlIHNpZGUtZWZmZWN0IG9mIHJlZHVjaW5nIHRoZSBzaXplIG9mXG4vLyB0aGUgbWluaWZpZWQgY29kZSBieSByZWR1Y2luZyB4LmNhbGwoKSB0byBtZXJlbHkgeCgpXG4vLyBTZWUgTWFyayBNaWxsZXLigJlzIGV4cGxhbmF0aW9uIG9mIHdoYXQgdGhpcyBkb2VzLlxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9Y29udmVudGlvbnM6c2FmZV9tZXRhX3Byb2dyYW1taW5nXG52YXIgY2FsbCA9IEZ1bmN0aW9uLmNhbGw7XG5mdW5jdGlvbiB1bmN1cnJ5VGhpcyhmKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNhbGwuYXBwbHkoZiwgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuLy8gVGhpcyBpcyBlcXVpdmFsZW50LCBidXQgc2xvd2VyOlxuLy8gdW5jdXJyeVRoaXMgPSBGdW5jdGlvbl9iaW5kLmJpbmQoRnVuY3Rpb25fYmluZC5jYWxsKTtcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3VuY3Vycnl0aGlzXG5cbnZhciBhcnJheV9zbGljZSA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5zbGljZSk7XG5cbnZhciBhcnJheV9yZWR1Y2UgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUucmVkdWNlIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgYmFzaXMpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gMCxcbiAgICAgICAgICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAvLyBjb25jZXJuaW5nIHRoZSBpbml0aWFsIHZhbHVlLCBpZiBvbmUgaXMgbm90IHByb3ZpZGVkXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAvLyBzZWVrIHRvIHRoZSBmaXJzdCB2YWx1ZSBpbiB0aGUgYXJyYXksIGFjY291bnRpbmdcbiAgICAgICAgICAgIC8vIGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCBpcyBpcyBhIHNwYXJzZSBhcnJheVxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGJhc2lzID0gdGhpc1tpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgrK2luZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAoMSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVkdWNlXG4gICAgICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgLy8gYWNjb3VudCBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgdGhlIGFycmF5IGlzIHNwYXJzZVxuICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICBiYXNpcyA9IGNhbGxiYWNrKGJhc2lzLCB0aGlzW2luZGV4XSwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYXNpcztcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfaW5kZXhPZiA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIHx8IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBub3QgYSB2ZXJ5IGdvb2Qgc2hpbSwgYnV0IGdvb2QgZW5vdWdoIGZvciBvdXIgb25lIHVzZSBvZiBpdFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzW2ldID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfbWFwID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLm1hcCB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNwKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGNvbGxlY3QgPSBbXTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHNlbGYsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgY29sbGVjdC5wdXNoKGNhbGxiYWNrLmNhbGwodGhpc3AsIHZhbHVlLCBpbmRleCwgc2VsZikpO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICByZXR1cm4gY29sbGVjdDtcbiAgICB9XG4pO1xuXG52YXIgb2JqZWN0X2NyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gKHByb3RvdHlwZSkge1xuICAgIGZ1bmN0aW9uIFR5cGUoKSB7IH1cbiAgICBUeXBlLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICByZXR1cm4gbmV3IFR5cGUoKTtcbn07XG5cbnZhciBvYmplY3RfaGFzT3duUHJvcGVydHkgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KTtcblxudmFyIG9iamVjdF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0X2hhc093blByb3BlcnR5KG9iamVjdCwga2V5KSkge1xuICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG59O1xuXG52YXIgb2JqZWN0X3RvU3RyaW5nID0gdW5jdXJyeVRoaXMoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyk7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSBPYmplY3QodmFsdWUpO1xufVxuXG4vLyBnZW5lcmF0b3IgcmVsYXRlZCBzaGltc1xuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgZnVuY3Rpb24gb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW4gU3BpZGVyTW9ua2V5LlxuZnVuY3Rpb24gaXNTdG9wSXRlcmF0aW9uKGV4Y2VwdGlvbikge1xuICAgIHJldHVybiAoXG4gICAgICAgIG9iamVjdF90b1N0cmluZyhleGNlcHRpb24pID09PSBcIltvYmplY3QgU3RvcEl0ZXJhdGlvbl1cIiB8fFxuICAgICAgICBleGNlcHRpb24gaW5zdGFuY2VvZiBRUmV0dXJuVmFsdWVcbiAgICApO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaGVscGVyIGFuZCBRLnJldHVybiBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpblxuLy8gU3BpZGVyTW9ua2V5LlxudmFyIFFSZXR1cm5WYWx1ZTtcbmlmICh0eXBlb2YgUmV0dXJuVmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBRUmV0dXJuVmFsdWUgPSBSZXR1cm5WYWx1ZTtcbn0gZWxzZSB7XG4gICAgUVJldHVyblZhbHVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9O1xufVxuXG4vLyBsb25nIHN0YWNrIHRyYWNlc1xuXG52YXIgU1RBQ0tfSlVNUF9TRVBBUkFUT1IgPSBcIkZyb20gcHJldmlvdXMgZXZlbnQ6XCI7XG5cbmZ1bmN0aW9uIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSkge1xuICAgIC8vIElmIHBvc3NpYmxlLCB0cmFuc2Zvcm0gdGhlIGVycm9yIHN0YWNrIHRyYWNlIGJ5IHJlbW92aW5nIE5vZGUgYW5kIFFcbiAgICAvLyBjcnVmdCwgdGhlbiBjb25jYXRlbmF0aW5nIHdpdGggdGhlIHN0YWNrIHRyYWNlIG9mIGBwcm9taXNlYC4gU2VlICM1Ny5cbiAgICBpZiAoaGFzU3RhY2tzICYmXG4gICAgICAgIHByb21pc2Uuc3RhY2sgJiZcbiAgICAgICAgdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIGVycm9yICE9PSBudWxsICYmXG4gICAgICAgIGVycm9yLnN0YWNrICYmXG4gICAgICAgIGVycm9yLnN0YWNrLmluZGV4T2YoU1RBQ0tfSlVNUF9TRVBBUkFUT1IpID09PSAtMVxuICAgICkge1xuICAgICAgICB2YXIgc3RhY2tzID0gW107XG4gICAgICAgIGZvciAodmFyIHAgPSBwcm9taXNlOyAhIXA7IHAgPSBwLnNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHAuc3RhY2spIHtcbiAgICAgICAgICAgICAgICBzdGFja3MudW5zaGlmdChwLnN0YWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGFja3MudW5zaGlmdChlcnJvci5zdGFjayk7XG5cbiAgICAgICAgdmFyIGNvbmNhdGVkU3RhY2tzID0gc3RhY2tzLmpvaW4oXCJcXG5cIiArIFNUQUNLX0pVTVBfU0VQQVJBVE9SICsgXCJcXG5cIik7XG4gICAgICAgIGVycm9yLnN0YWNrID0gZmlsdGVyU3RhY2tTdHJpbmcoY29uY2F0ZWRTdGFja3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZmlsdGVyU3RhY2tTdHJpbmcoc3RhY2tTdHJpbmcpIHtcbiAgICB2YXIgbGluZXMgPSBzdGFja1N0cmluZy5zcGxpdChcIlxcblwiKTtcbiAgICB2YXIgZGVzaXJlZExpbmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldO1xuXG4gICAgICAgIGlmICghaXNJbnRlcm5hbEZyYW1lKGxpbmUpICYmICFpc05vZGVGcmFtZShsaW5lKSAmJiBsaW5lKSB7XG4gICAgICAgICAgICBkZXNpcmVkTGluZXMucHVzaChsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGVzaXJlZExpbmVzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGlzTm9kZUZyYW1lKHN0YWNrTGluZSkge1xuICAgIHJldHVybiBzdGFja0xpbmUuaW5kZXhPZihcIihtb2R1bGUuanM6XCIpICE9PSAtMSB8fFxuICAgICAgICAgICBzdGFja0xpbmUuaW5kZXhPZihcIihub2RlLmpzOlwiKSAhPT0gLTE7XG59XG5cbmZ1bmN0aW9uIGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpIHtcbiAgICAvLyBOYW1lZCBmdW5jdGlvbnM6IFwiYXQgZnVuY3Rpb25OYW1lIChmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlcilcIlxuICAgIC8vIEluIElFMTAgZnVuY3Rpb24gbmFtZSBjYW4gaGF2ZSBzcGFjZXMgKFwiQW5vbnltb3VzIGZ1bmN0aW9uXCIpIE9fb1xuICAgIHZhciBhdHRlbXB0MSA9IC9hdCAuKyBcXCgoLispOihcXGQrKTooPzpcXGQrKVxcKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDEpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MVsxXSwgTnVtYmVyKGF0dGVtcHQxWzJdKV07XG4gICAgfVxuXG4gICAgLy8gQW5vbnltb3VzIGZ1bmN0aW9uczogXCJhdCBmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlclwiXG4gICAgdmFyIGF0dGVtcHQyID0gL2F0IChbXiBdKyk6KFxcZCspOig/OlxcZCspJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0Mikge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQyWzFdLCBOdW1iZXIoYXR0ZW1wdDJbMl0pXTtcbiAgICB9XG5cbiAgICAvLyBGaXJlZm94IHN0eWxlOiBcImZ1bmN0aW9uQGZpbGVuYW1lOmxpbmVOdW1iZXIgb3IgQGZpbGVuYW1lOmxpbmVOdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MyA9IC8uKkAoLispOihcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDMpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0M1sxXSwgTnVtYmVyKGF0dGVtcHQzWzJdKV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0ludGVybmFsRnJhbWUoc3RhY2tMaW5lKSB7XG4gICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpO1xuXG4gICAgaWYgKCFmaWxlTmFtZUFuZExpbmVOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBmaWxlTmFtZSA9IGZpbGVOYW1lQW5kTGluZU51bWJlclswXTtcbiAgICB2YXIgbGluZU51bWJlciA9IGZpbGVOYW1lQW5kTGluZU51bWJlclsxXTtcblxuICAgIHJldHVybiBmaWxlTmFtZSA9PT0gcUZpbGVOYW1lICYmXG4gICAgICAgIGxpbmVOdW1iZXIgPj0gcVN0YXJ0aW5nTGluZSAmJlxuICAgICAgICBsaW5lTnVtYmVyIDw9IHFFbmRpbmdMaW5lO1xufVxuXG4vLyBkaXNjb3ZlciBvd24gZmlsZSBuYW1lIGFuZCBsaW5lIG51bWJlciByYW5nZSBmb3IgZmlsdGVyaW5nIHN0YWNrXG4vLyB0cmFjZXNcbmZ1bmN0aW9uIGNhcHR1cmVMaW5lKCkge1xuICAgIGlmICghaGFzU3RhY2tzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHZhciBsaW5lcyA9IGUuc3RhY2suc3BsaXQoXCJcXG5cIik7XG4gICAgICAgIHZhciBmaXJzdExpbmUgPSBsaW5lc1swXS5pbmRleE9mKFwiQFwiKSA+IDAgPyBsaW5lc1sxXSA6IGxpbmVzWzJdO1xuICAgICAgICB2YXIgZmlsZU5hbWVBbmRMaW5lTnVtYmVyID0gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKGZpcnN0TGluZSk7XG4gICAgICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBxRmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgICAgIHJldHVybiBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkZXByZWNhdGUoY2FsbGJhY2ssIG5hbWUsIGFsdGVybmF0aXZlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgICB0eXBlb2YgY29uc29sZS53YXJuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihuYW1lICsgXCIgaXMgZGVwcmVjYXRlZCwgdXNlIFwiICsgYWx0ZXJuYXRpdmUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGluc3RlYWQuXCIsIG5ldyBFcnJvcihcIlwiKS5zdGFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KGNhbGxiYWNrLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8vIGVuZCBvZiBzaGltc1xuLy8gYmVnaW5uaW5nIG9mIHJlYWwgd29ya1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLCBwYXNzZXMgcHJvbWlzZXMgdGhyb3VnaCwgb3JcbiAqIGNvZXJjZXMgcHJvbWlzZXMgZnJvbSBkaWZmZXJlbnQgc3lzdGVtcy5cbiAqIEBwYXJhbSB2YWx1ZSBpbW1lZGlhdGUgcmVmZXJlbmNlIG9yIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gUSh2YWx1ZSkge1xuICAgIC8vIElmIHRoZSBvYmplY3QgaXMgYWxyZWFkeSBhIFByb21pc2UsIHJldHVybiBpdCBkaXJlY3RseS4gIFRoaXMgZW5hYmxlc1xuICAgIC8vIHRoZSByZXNvbHZlIGZ1bmN0aW9uIHRvIGJvdGggYmUgdXNlZCB0byBjcmVhdGVkIHJlZmVyZW5jZXMgZnJvbSBvYmplY3RzLFxuICAgIC8vIGJ1dCB0byB0b2xlcmFibHkgY29lcmNlIG5vbi1wcm9taXNlcyB0byBwcm9taXNlcy5cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvLyBhc3NpbWlsYXRlIHRoZW5hYmxlc1xuICAgIGlmIChpc1Byb21pc2VBbGlrZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNvZXJjZSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bGZpbGwodmFsdWUpO1xuICAgIH1cbn1cblEucmVzb2x2ZSA9IFE7XG5cbi8qKlxuICogUGVyZm9ybXMgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm4gb2YgdGhlIGV2ZW50IGxvb3AuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB0YXNrXG4gKi9cblEubmV4dFRpY2sgPSBuZXh0VGljaztcblxuLyoqXG4gKiBDb250cm9scyB3aGV0aGVyIG9yIG5vdCBsb25nIHN0YWNrIHRyYWNlcyB3aWxsIGJlIG9uXG4gKi9cblEubG9uZ1N0YWNrU3VwcG9ydCA9IGZhbHNlO1xuXG4vLyBlbmFibGUgbG9uZyBzdGFja3MgaWYgUV9ERUJVRyBpcyBzZXRcbmlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZW52ICYmIHByb2Nlc3MuZW52LlFfREVCVUcpIHtcbiAgICBRLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSB7cHJvbWlzZSwgcmVzb2x2ZSwgcmVqZWN0fSBvYmplY3QuXG4gKlxuICogYHJlc29sdmVgIGlzIGEgY2FsbGJhY2sgdG8gaW52b2tlIHdpdGggYSBtb3JlIHJlc29sdmVkIHZhbHVlIGZvciB0aGVcbiAqIHByb21pc2UuIFRvIGZ1bGZpbGwgdGhlIHByb21pc2UsIGludm9rZSBgcmVzb2x2ZWAgd2l0aCBhbnkgdmFsdWUgdGhhdCBpc1xuICogbm90IGEgdGhlbmFibGUuIFRvIHJlamVjdCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGEgcmVqZWN0ZWRcbiAqIHRoZW5hYmxlLCBvciBpbnZva2UgYHJlamVjdGAgd2l0aCB0aGUgcmVhc29uIGRpcmVjdGx5LiBUbyByZXNvbHZlIHRoZVxuICogcHJvbWlzZSB0byBhbm90aGVyIHRoZW5hYmxlLCB0aHVzIHB1dHRpbmcgaXQgaW4gdGhlIHNhbWUgc3RhdGUsIGludm9rZVxuICogYHJlc29sdmVgIHdpdGggdGhhdCBvdGhlciB0aGVuYWJsZS5cbiAqL1xuUS5kZWZlciA9IGRlZmVyO1xuZnVuY3Rpb24gZGVmZXIoKSB7XG4gICAgLy8gaWYgXCJtZXNzYWdlc1wiIGlzIGFuIFwiQXJyYXlcIiwgdGhhdCBpbmRpY2F0ZXMgdGhhdCB0aGUgcHJvbWlzZSBoYXMgbm90IHlldFxuICAgIC8vIGJlZW4gcmVzb2x2ZWQuICBJZiBpdCBpcyBcInVuZGVmaW5lZFwiLCBpdCBoYXMgYmVlbiByZXNvbHZlZC4gIEVhY2hcbiAgICAvLyBlbGVtZW50IG9mIHRoZSBtZXNzYWdlcyBhcnJheSBpcyBpdHNlbGYgYW4gYXJyYXkgb2YgY29tcGxldGUgYXJndW1lbnRzIHRvXG4gICAgLy8gZm9yd2FyZCB0byB0aGUgcmVzb2x2ZWQgcHJvbWlzZS4gIFdlIGNvZXJjZSB0aGUgcmVzb2x1dGlvbiB2YWx1ZSB0byBhXG4gICAgLy8gcHJvbWlzZSB1c2luZyB0aGUgYHJlc29sdmVgIGZ1bmN0aW9uIGJlY2F1c2UgaXQgaGFuZGxlcyBib3RoIGZ1bGx5XG4gICAgLy8gbm9uLXRoZW5hYmxlIHZhbHVlcyBhbmQgb3RoZXIgdGhlbmFibGVzIGdyYWNlZnVsbHkuXG4gICAgdmFyIG1lc3NhZ2VzID0gW10sIHByb2dyZXNzTGlzdGVuZXJzID0gW10sIHJlc29sdmVkUHJvbWlzZTtcblxuICAgIHZhciBkZWZlcnJlZCA9IG9iamVjdF9jcmVhdGUoZGVmZXIucHJvdG90eXBlKTtcbiAgICB2YXIgcHJvbWlzZSA9IG9iamVjdF9jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpO1xuXG4gICAgcHJvbWlzZS5wcm9taXNlRGlzcGF0Y2ggPSBmdW5jdGlvbiAocmVzb2x2ZSwgb3AsIG9wZXJhbmRzKSB7XG4gICAgICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICBtZXNzYWdlcy5wdXNoKGFyZ3MpO1xuICAgICAgICAgICAgaWYgKG9wID09PSBcIndoZW5cIiAmJiBvcGVyYW5kc1sxXSkgeyAvLyBwcm9ncmVzcyBvcGVyYW5kXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcnMucHVzaChvcGVyYW5kc1sxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlZFByb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KHJlc29sdmVkUHJvbWlzZSwgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZFxuICAgIHByb21pc2UudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmVhcmVyVmFsdWUgPSBuZWFyZXIocmVzb2x2ZWRQcm9taXNlKTtcbiAgICAgICAgaWYgKGlzUHJvbWlzZShuZWFyZXJWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5lYXJlclZhbHVlOyAvLyBzaG9ydGVuIGNoYWluXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lYXJlclZhbHVlO1xuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghcmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJwZW5kaW5nXCIgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlLmluc3BlY3QoKTtcbiAgICB9O1xuXG4gICAgaWYgKFEubG9uZ1N0YWNrU3VwcG9ydCAmJiBoYXNTdGFja3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBkb24ndCB0cnkgdG8gdXNlIGBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZWAgb3IgdHJhbnNmZXIgdGhlXG4gICAgICAgICAgICAvLyBhY2Nlc3NvciBhcm91bmQ7IHRoYXQgY2F1c2VzIG1lbW9yeSBsZWFrcyBhcyBwZXIgR0gtMTExLiBKdXN0XG4gICAgICAgICAgICAvLyByZWlmeSB0aGUgc3RhY2sgdHJhY2UgYXMgYSBzdHJpbmcgQVNBUC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBdCB0aGUgc2FtZSB0aW1lLCBjdXQgb2ZmIHRoZSBmaXJzdCBsaW5lOyBpdCdzIGFsd2F5cyBqdXN0XG4gICAgICAgICAgICAvLyBcIltvYmplY3QgUHJvbWlzZV1cXG5cIiwgYXMgcGVyIHRoZSBgdG9TdHJpbmdgLlxuICAgICAgICAgICAgcHJvbWlzZS5zdGFjayA9IGUuc3RhY2suc3Vic3RyaW5nKGUuc3RhY2suaW5kZXhPZihcIlxcblwiKSArIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTk9URTogd2UgZG8gdGhlIGNoZWNrcyBmb3IgYHJlc29sdmVkUHJvbWlzZWAgaW4gZWFjaCBtZXRob2QsIGluc3RlYWQgb2ZcbiAgICAvLyBjb25zb2xpZGF0aW5nIHRoZW0gaW50byBgYmVjb21lYCwgc2luY2Ugb3RoZXJ3aXNlIHdlJ2QgY3JlYXRlIG5ld1xuICAgIC8vIHByb21pc2VzIHdpdGggdGhlIGxpbmVzIGBiZWNvbWUod2hhdGV2ZXIodmFsdWUpKWAuIFNlZSBlLmcuIEdILTI1Mi5cblxuICAgIGZ1bmN0aW9uIGJlY29tZShuZXdQcm9taXNlKSB7XG4gICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5ld1Byb21pc2U7XG4gICAgICAgIHByb21pc2Uuc291cmNlID0gbmV3UHJvbWlzZTtcblxuICAgICAgICBhcnJheV9yZWR1Y2UobWVzc2FnZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5ld1Byb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KG5ld1Byb21pc2UsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG5cbiAgICAgICAgbWVzc2FnZXMgPSB2b2lkIDA7XG4gICAgICAgIHByb2dyZXNzTGlzdGVuZXJzID0gdm9pZCAwO1xuICAgIH1cblxuICAgIGRlZmVycmVkLnByb21pc2UgPSBwcm9taXNlO1xuICAgIGRlZmVycmVkLnJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKFEodmFsdWUpKTtcbiAgICB9O1xuXG4gICAgZGVmZXJyZWQuZnVsZmlsbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUoZnVsZmlsbCh2YWx1ZSkpO1xuICAgIH07XG4gICAgZGVmZXJyZWQucmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUocmVqZWN0KHJlYXNvbikpO1xuICAgIH07XG4gICAgZGVmZXJyZWQubm90aWZ5ID0gZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9ncmVzc0xpc3RlbmVycywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvZ3Jlc3NMaXN0ZW5lcikge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcihwcm9ncmVzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmVycmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBOb2RlLXN0eWxlIGNhbGxiYWNrIHRoYXQgd2lsbCByZXNvbHZlIG9yIHJlamVjdCB0aGUgZGVmZXJyZWRcbiAqIHByb21pc2UuXG4gKiBAcmV0dXJucyBhIG5vZGViYWNrXG4gKi9cbmRlZmVyLnByb3RvdHlwZS5tYWtlTm9kZVJlc29sdmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVycm9yLCB2YWx1ZSkge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNlbGYucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vKipcbiAqIEBwYXJhbSByZXNvbHZlciB7RnVuY3Rpb259IGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIG5vdGhpbmcgYW5kIGFjY2VwdHNcbiAqIHRoZSByZXNvbHZlLCByZWplY3QsIGFuZCBub3RpZnkgZnVuY3Rpb25zIGZvciBhIGRlZmVycmVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgbWF5IGJlIHJlc29sdmVkIHdpdGggdGhlIGdpdmVuIHJlc29sdmUgYW5kIHJlamVjdFxuICogZnVuY3Rpb25zLCBvciByZWplY3RlZCBieSBhIHRocm93biBleGNlcHRpb24gaW4gcmVzb2x2ZXJcbiAqL1xuUS5Qcm9taXNlID0gcHJvbWlzZTsgLy8gRVM2XG5RLnByb21pc2UgPSBwcm9taXNlO1xuZnVuY3Rpb24gcHJvbWlzZShyZXNvbHZlcikge1xuICAgIGlmICh0eXBlb2YgcmVzb2x2ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwicmVzb2x2ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLlwiKTtcbiAgICB9XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgfSBjYXRjaCAocmVhc29uKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChyZWFzb24pO1xuICAgIH1cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxucHJvbWlzZS5yYWNlID0gcmFjZTsgLy8gRVM2XG5wcm9taXNlLmFsbCA9IGFsbDsgLy8gRVM2XG5wcm9taXNlLnJlamVjdCA9IHJlamVjdDsgLy8gRVM2XG5wcm9taXNlLnJlc29sdmUgPSBROyAvLyBFUzZcblxuLy8gWFhYIGV4cGVyaW1lbnRhbC4gIFRoaXMgbWV0aG9kIGlzIGEgd2F5IHRvIGRlbm90ZSB0aGF0IGEgbG9jYWwgdmFsdWUgaXNcbi8vIHNlcmlhbGl6YWJsZSBhbmQgc2hvdWxkIGJlIGltbWVkaWF0ZWx5IGRpc3BhdGNoZWQgdG8gYSByZW1vdGUgdXBvbiByZXF1ZXN0LFxuLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGEgcmVmZXJlbmNlLlxuUS5wYXNzQnlDb3B5ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIC8vZnJlZXplKG9iamVjdCk7XG4gICAgLy9wYXNzQnlDb3BpZXMuc2V0KG9iamVjdCwgdHJ1ZSk7XG4gICAgcmV0dXJuIG9iamVjdDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnBhc3NCeUNvcHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy9mcmVlemUob2JqZWN0KTtcbiAgICAvL3Bhc3NCeUNvcGllcy5zZXQob2JqZWN0LCB0cnVlKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSWYgdHdvIHByb21pc2VzIGV2ZW50dWFsbHkgZnVsZmlsbCB0byB0aGUgc2FtZSB2YWx1ZSwgcHJvbWlzZXMgdGhhdCB2YWx1ZSxcbiAqIGJ1dCBvdGhlcndpc2UgcmVqZWN0cy5cbiAqIEBwYXJhbSB4IHtBbnkqfVxuICogQHBhcmFtIHkge0FueSp9XG4gKiBAcmV0dXJucyB7QW55Kn0gYSBwcm9taXNlIGZvciB4IGFuZCB5IGlmIHRoZXkgYXJlIHRoZSBzYW1lLCBidXQgYSByZWplY3Rpb25cbiAqIG90aGVyd2lzZS5cbiAqXG4gKi9cblEuam9pbiA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgcmV0dXJuIFEoeCkuam9pbih5KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiAodGhhdCkge1xuICAgIHJldHVybiBRKFt0aGlzLCB0aGF0XSkuc3ByZWFkKGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIGlmICh4ID09PSB5KSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBcIj09PVwiIHNob3VsZCBiZSBPYmplY3QuaXMgb3IgZXF1aXZcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3Qgam9pbjogbm90IHRoZSBzYW1lOiBcIiArIHggKyBcIiBcIiArIHkpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgZmlyc3Qgb2YgYW4gYXJyYXkgb2YgcHJvbWlzZXMgdG8gYmVjb21lIHNldHRsZWQuXG4gKiBAcGFyYW0gYW5zd2VycyB7QXJyYXlbQW55Kl19IHByb21pc2VzIHRvIHJhY2VcbiAqIEByZXR1cm5zIHtBbnkqfSB0aGUgZmlyc3QgcHJvbWlzZSB0byBiZSBzZXR0bGVkXG4gKi9cblEucmFjZSA9IHJhY2U7XG5mdW5jdGlvbiByYWNlKGFuc3dlclBzKSB7XG4gICAgcmV0dXJuIHByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIFN3aXRjaCB0byB0aGlzIG9uY2Ugd2UgY2FuIGFzc3VtZSBhdCBsZWFzdCBFUzVcbiAgICAgICAgLy8gYW5zd2VyUHMuZm9yRWFjaChmdW5jdGlvbihhbnN3ZXJQKSB7XG4gICAgICAgIC8vICAgICBRKGFuc3dlclApLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIFVzZSB0aGlzIGluIHRoZSBtZWFudGltZVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYW5zd2VyUHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIFEoYW5zd2VyUHNbaV0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5yYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oUS5yYWNlKTtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFByb21pc2Ugd2l0aCBhIHByb21pc2UgZGVzY3JpcHRvciBvYmplY3QgYW5kIG9wdGlvbmFsIGZhbGxiYWNrXG4gKiBmdW5jdGlvbi4gIFRoZSBkZXNjcmlwdG9yIGNvbnRhaW5zIG1ldGhvZHMgbGlrZSB3aGVuKHJlamVjdGVkKSwgZ2V0KG5hbWUpLFxuICogc2V0KG5hbWUsIHZhbHVlKSwgcG9zdChuYW1lLCBhcmdzKSwgYW5kIGRlbGV0ZShuYW1lKSwgd2hpY2ggYWxsXG4gKiByZXR1cm4gZWl0aGVyIGEgdmFsdWUsIGEgcHJvbWlzZSBmb3IgYSB2YWx1ZSwgb3IgYSByZWplY3Rpb24uICBUaGUgZmFsbGJhY2tcbiAqIGFjY2VwdHMgdGhlIG9wZXJhdGlvbiBuYW1lLCBhIHJlc29sdmVyLCBhbmQgYW55IGZ1cnRoZXIgYXJndW1lbnRzIHRoYXQgd291bGRcbiAqIGhhdmUgYmVlbiBmb3J3YXJkZWQgdG8gdGhlIGFwcHJvcHJpYXRlIG1ldGhvZCBhYm92ZSBoYWQgYSBtZXRob2QgYmVlblxuICogcHJvdmlkZWQgd2l0aCB0aGUgcHJvcGVyIG5hbWUuICBUaGUgQVBJIG1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgdGhlIG5hdHVyZVxuICogb2YgdGhlIHJldHVybmVkIG9iamVjdCwgYXBhcnQgZnJvbSB0aGF0IGl0IGlzIHVzYWJsZSB3aGVyZWV2ZXIgcHJvbWlzZXMgYXJlXG4gKiBib3VnaHQgYW5kIHNvbGQuXG4gKi9cblEubWFrZVByb21pc2UgPSBQcm9taXNlO1xuZnVuY3Rpb24gUHJvbWlzZShkZXNjcmlwdG9yLCBmYWxsYmFjaywgaW5zcGVjdCkge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZhbGxiYWNrID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlByb21pc2UgZG9lcyBub3Qgc3VwcG9ydCBvcGVyYXRpb246IFwiICsgb3BcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoaW5zcGVjdCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3N0YXRlOiBcInVua25vd25cIn07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBhcmdzKSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZGVzY3JpcHRvcltvcF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBkZXNjcmlwdG9yW29wXS5hcHBseShwcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2suY2FsbChwcm9taXNlLCBvcCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBpbnNwZWN0O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWQgYHZhbHVlT2ZgIGFuZCBgZXhjZXB0aW9uYCBzdXBwb3J0XG4gICAgaWYgKGluc3BlY3QpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICBwcm9taXNlLmV4Y2VwdGlvbiA9IGluc3BlY3RlZC5yZWFzb247XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHxcbiAgICAgICAgICAgICAgICBpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlXVwiO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTsgICAvLyBlbnN1cmUgdGhlIHVudHJ1c3RlZCBwcm9taXNlIG1ha2VzIGF0IG1vc3QgYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIGNhbGwgdG8gb25lIG9mIHRoZSBjYWxsYmFja3NcblxuICAgIGZ1bmN0aW9uIF9mdWxmaWxsZWQodmFsdWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZnVsZmlsbGVkID09PSBcImZ1bmN0aW9uXCIgPyBmdWxmaWxsZWQodmFsdWUpIDogdmFsdWU7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlamVjdGVkKGV4Y2VwdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIHJlamVjdGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhleGNlcHRpb24sIHNlbGYpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKG5ld0V4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3RXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3Byb2dyZXNzZWQodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBwcm9ncmVzc2VkID09PSBcImZ1bmN0aW9uXCIgPyBwcm9ncmVzc2VkKHZhbHVlKSA6IHZhbHVlO1xuICAgIH1cblxuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX2Z1bGZpbGxlZCh2YWx1ZSkpO1xuICAgICAgICB9LCBcIndoZW5cIiwgW2Z1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX3JlamVjdGVkKGV4Y2VwdGlvbikpO1xuICAgICAgICB9XSk7XG4gICAgfSk7XG5cbiAgICAvLyBQcm9ncmVzcyBwcm9wYWdhdG9yIG5lZWQgdG8gYmUgYXR0YWNoZWQgaW4gdGhlIGN1cnJlbnQgdGljay5cbiAgICBzZWxmLnByb21pc2VEaXNwYXRjaCh2b2lkIDAsIFwid2hlblwiLCBbdm9pZCAwLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG5ld1ZhbHVlO1xuICAgICAgICB2YXIgdGhyZXcgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG5ld1ZhbHVlID0gX3Byb2dyZXNzZWQodmFsdWUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJldyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aHJldykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KG5ld1ZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUS50YXAgPSBmdW5jdGlvbiAocHJvbWlzZSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50YXAoY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBXb3JrcyBhbG1vc3QgbGlrZSBcImZpbmFsbHlcIiwgYnV0IG5vdCBjYWxsZWQgZm9yIHJlamVjdGlvbnMuXG4gKiBPcmlnaW5hbCByZXNvbHV0aW9uIHZhbHVlIGlzIHBhc3NlZCB0aHJvdWdoIGNhbGxiYWNrIHVuYWZmZWN0ZWQuXG4gKiBDYWxsYmFjayBtYXkgcmV0dXJuIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmUgYXdhaXRlZCBmb3IuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybnMge1EuUHJvbWlzZX1cbiAqIEBleGFtcGxlXG4gKiBkb1NvbWV0aGluZygpXG4gKiAgIC50aGVuKC4uLilcbiAqICAgLnRhcChjb25zb2xlLmxvZylcbiAqICAgLnRoZW4oLi4uKTtcbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcblxuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCh2YWx1ZSkudGhlblJlc29sdmUodmFsdWUpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gb2JzZXJ2ZXIgb24gYSBwcm9taXNlLlxuICpcbiAqIEd1YXJhbnRlZXM6XG4gKlxuICogMS4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgYmUgY2FsbGVkIG9ubHkgb25jZS5cbiAqIDIuIHRoYXQgZWl0aGVyIHRoZSBmdWxmaWxsZWQgY2FsbGJhY2sgb3IgdGhlIHJlamVjdGVkIGNhbGxiYWNrIHdpbGwgYmVcbiAqICAgIGNhbGxlZCwgYnV0IG5vdCBib3RoLlxuICogMy4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgbm90IGJlIGNhbGxlZCBpbiB0aGlzIHR1cm4uXG4gKlxuICogQHBhcmFtIHZhbHVlICAgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIHRvIG9ic2VydmVcbiAqIEBwYXJhbSBmdWxmaWxsZWQgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqIEBwYXJhbSByZWplY3RlZCAgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSByZWplY3Rpb24gZXhjZXB0aW9uXG4gKiBAcGFyYW0gcHJvZ3Jlc3NlZCBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBmcm9tIHRoZSBpbnZva2VkIGNhbGxiYWNrXG4gKi9cblEud2hlbiA9IHdoZW47XG5mdW5jdGlvbiB3aGVuKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB2YWx1ZTsgfSk7XG59O1xuXG5RLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHByb21pc2UsIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlc29sdmUodmFsdWUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgdGhyb3cgcmVhc29uOyB9KTtcbn07XG5cblEudGhlblJlamVjdCA9IGZ1bmN0aW9uIChwcm9taXNlLCByZWFzb24pIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVqZWN0KHJlYXNvbik7XG59O1xuXG4vKipcbiAqIElmIGFuIG9iamVjdCBpcyBub3QgYSBwcm9taXNlLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZS5cbiAqIElmIGEgcHJvbWlzZSBpcyByZWplY3RlZCwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUgdG9vLlxuICogSWYgaXTigJlzIGEgZnVsZmlsbGVkIHByb21pc2UsIHRoZSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZWFyZXIuXG4gKiBJZiBpdOKAmXMgYSBkZWZlcnJlZCBwcm9taXNlIGFuZCB0aGUgZGVmZXJyZWQgaGFzIGJlZW4gcmVzb2x2ZWQsIHRoZVxuICogcmVzb2x1dGlvbiBpcyBcIm5lYXJlclwiLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgbW9zdCByZXNvbHZlZCAobmVhcmVzdCkgZm9ybSBvZiB0aGUgb2JqZWN0XG4gKi9cblxuLy8gWFhYIHNob3VsZCB3ZSByZS1kbyB0aGlzP1xuUS5uZWFyZXIgPSBuZWFyZXI7XG5mdW5jdGlvbiBuZWFyZXIodmFsdWUpIHtcbiAgICBpZiAoaXNQcm9taXNlKHZhbHVlKSkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gdmFsdWUuaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwcm9taXNlLlxuICogT3RoZXJ3aXNlIGl0IGlzIGEgZnVsZmlsbGVkIHZhbHVlLlxuICovXG5RLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZShvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgUHJvbWlzZTtcbn1cblxuUS5pc1Byb21pc2VBbGlrZSA9IGlzUHJvbWlzZUFsaWtlO1xuZnVuY3Rpb24gaXNQcm9taXNlQWxpa2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiYgdHlwZW9mIG9iamVjdC50aGVuID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcGVuZGluZyBwcm9taXNlLCBtZWFuaW5nIG5vdFxuICogZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuICovXG5RLmlzUGVuZGluZyA9IGlzUGVuZGluZztcbmZ1bmN0aW9uIGlzUGVuZGluZyhvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSB2YWx1ZSBvciBmdWxmaWxsZWRcbiAqIHByb21pc2UuXG4gKi9cblEuaXNGdWxmaWxsZWQgPSBpc0Z1bGZpbGxlZDtcbmZ1bmN0aW9uIGlzRnVsZmlsbGVkKG9iamVjdCkge1xuICAgIHJldHVybiAhaXNQcm9taXNlKG9iamVjdCkgfHwgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNGdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSByZWplY3RlZCBwcm9taXNlLlxuICovXG5RLmlzUmVqZWN0ZWQgPSBpc1JlamVjdGVkO1xuZnVuY3Rpb24gaXNSZWplY3RlZChvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1JlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufTtcblxuLy8vLyBCRUdJTiBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8vIFRoaXMgcHJvbWlzZSBsaWJyYXJ5IGNvbnN1bWVzIGV4Y2VwdGlvbnMgdGhyb3duIGluIGhhbmRsZXJzIHNvIHRoZXkgY2FuIGJlXG4vLyBoYW5kbGVkIGJ5IGEgc3Vic2VxdWVudCBwcm9taXNlLiAgVGhlIGV4Y2VwdGlvbnMgZ2V0IGFkZGVkIHRvIHRoaXMgYXJyYXkgd2hlblxuLy8gdGhleSBhcmUgY3JlYXRlZCwgYW5kIHJlbW92ZWQgd2hlbiB0aGV5IGFyZSBoYW5kbGVkLiAgTm90ZSB0aGF0IGluIEVTNiBvclxuLy8gc2hpbW1lZCBlbnZpcm9ubWVudHMsIHRoaXMgd291bGQgbmF0dXJhbGx5IGJlIGEgYFNldGAuXG52YXIgdW5oYW5kbGVkUmVhc29ucyA9IFtdO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuXG5mdW5jdGlvbiByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKSB7XG4gICAgdW5oYW5kbGVkUmVhc29ucy5sZW5ndGggPSAwO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMubGVuZ3RoID0gMDtcblxuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFja1JlamVjdGlvbihwcm9taXNlLCByZWFzb24pIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgIGlmIChyZWFzb24gJiYgdHlwZW9mIHJlYXNvbi5zdGFjayAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2gocmVhc29uLnN0YWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2goXCIobm8gc3RhY2spIFwiICsgcmVhc29uKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVudHJhY2tSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYXQgPSBhcnJheV9pbmRleE9mKHVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgIGlmIChhdCAhPT0gLTEpIHtcbiAgICAgICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5zcGxpY2UoYXQsIDEpO1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnNwbGljZShhdCwgMSk7XG4gICAgfVxufVxuXG5RLnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucyA9IHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucztcblxuUS5nZXRVbmhhbmRsZWRSZWFzb25zID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIE1ha2UgYSBjb3B5IHNvIHRoYXQgY29uc3VtZXJzIGNhbid0IGludGVyZmVyZSB3aXRoIG91ciBpbnRlcm5hbCBzdGF0ZS5cbiAgICByZXR1cm4gdW5oYW5kbGVkUmVhc29ucy5zbGljZSgpO1xufTtcblxuUS5zdG9wVW5oYW5kbGVkUmVqZWN0aW9uVHJhY2tpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG4gICAgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gZmFsc2U7XG59O1xuXG5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcblxuLy8vLyBFTkQgVU5IQU5ETEVEIFJFSkVDVElPTiBUUkFDS0lOR1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSByZWplY3RlZCBwcm9taXNlLlxuICogQHBhcmFtIHJlYXNvbiB2YWx1ZSBkZXNjcmliaW5nIHRoZSBmYWlsdXJlXG4gKi9cblEucmVqZWN0ID0gcmVqZWN0O1xuZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAgIHZhciByZWplY3Rpb24gPSBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgICAgICAgICAgLy8gbm90ZSB0aGF0IHRoZSBlcnJvciBoYXMgYmVlbiBoYW5kbGVkXG4gICAgICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB1bnRyYWNrUmVqZWN0aW9uKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQocmVhc29uKSA6IHRoaXM7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjaygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicmVqZWN0ZWRcIiwgcmVhc29uOiByZWFzb24gfTtcbiAgICB9KTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcmVhc29uIGhhcyBub3QgYmVlbiBoYW5kbGVkLlxuICAgIHRyYWNrUmVqZWN0aW9uKHJlamVjdGlvbiwgcmVhc29uKTtcblxuICAgIHJldHVybiByZWplY3Rpb247XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIGZ1bGZpbGxlZCBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2VcbiAqL1xuUS5mdWxmaWxsID0gZnVsZmlsbDtcbmZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0XCI6IGZ1bmN0aW9uIChuYW1lLCByaHMpIHtcbiAgICAgICAgICAgIHZhbHVlW25hbWVdID0gcmhzO1xuICAgICAgICB9LFxuICAgICAgICBcImRlbGV0ZVwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInBvc3RcIjogZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICAgICAgICAgIC8vIE1hcmsgTWlsbGVyIHByb3Bvc2VzIHRoYXQgcG9zdCB3aXRoIG5vIG5hbWUgc2hvdWxkIGFwcGx5IGFcbiAgICAgICAgICAgIC8vIHByb21pc2VkIGZ1bmN0aW9uLlxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IG51bGwgfHwgbmFtZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHZvaWQgMCwgYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYXBwbHlcIjogZnVuY3Rpb24gKHRoaXNwLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodGhpc3AsIGFyZ3MpO1xuICAgICAgICB9LFxuICAgICAgICBcImtleXNcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sIHZvaWQgMCwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwiZnVsZmlsbGVkXCIsIHZhbHVlOiB2YWx1ZSB9O1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZW5hYmxlcyB0byBRIHByb21pc2VzLlxuICogQHBhcmFtIHByb21pc2UgdGhlbmFibGUgcHJvbWlzZVxuICogQHJldHVybnMgYSBRIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gY29lcmNlKHByb21pc2UpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyBhbiBvYmplY3Qgc3VjaCB0aGF0IGl0IHdpbGwgbmV2ZXIgYmVcbiAqIHRyYW5zZmVycmVkIGF3YXkgZnJvbSB0aGlzIHByb2Nlc3Mgb3ZlciBhbnkgcHJvbWlzZVxuICogY29tbXVuaWNhdGlvbiBjaGFubmVsLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgcHJvbWlzZSBhIHdyYXBwaW5nIG9mIHRoYXQgb2JqZWN0IHRoYXRcbiAqIGFkZGl0aW9uYWxseSByZXNwb25kcyB0byB0aGUgXCJpc0RlZlwiIG1lc3NhZ2VcbiAqIHdpdGhvdXQgYSByZWplY3Rpb24uXG4gKi9cblEubWFzdGVyID0gbWFzdGVyO1xuZnVuY3Rpb24gbWFzdGVyKG9iamVjdCkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJpc0RlZlwiOiBmdW5jdGlvbiAoKSB7fVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKG9wLCBhcmdzKSB7XG4gICAgICAgIHJldHVybiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKTtcbiAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBRKG9iamVjdCkuaW5zcGVjdCgpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIFNwcmVhZHMgdGhlIHZhbHVlcyBvZiBhIHByb21pc2VkIGFycmF5IG9mIGFyZ3VtZW50cyBpbnRvIHRoZVxuICogZnVsZmlsbG1lbnQgY2FsbGJhY2suXG4gKiBAcGFyYW0gZnVsZmlsbGVkIGNhbGxiYWNrIHRoYXQgcmVjZWl2ZXMgdmFyaWFkaWMgYXJndW1lbnRzIGZyb20gdGhlXG4gKiBwcm9taXNlZCBhcnJheVxuICogQHBhcmFtIHJlamVjdGVkIGNhbGxiYWNrIHRoYXQgcmVjZWl2ZXMgdGhlIGV4Y2VwdGlvbiBpZiB0aGUgcHJvbWlzZVxuICogaXMgcmVqZWN0ZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgb3IgdGhyb3duIGV4Y2VwdGlvbiBvZlxuICogZWl0aGVyIGNhbGxiYWNrLlxuICovXG5RLnNwcmVhZCA9IHNwcmVhZDtcbmZ1bmN0aW9uIHNwcmVhZCh2YWx1ZSwgZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiBRKHZhbHVlKS5zcHJlYWQoZnVsZmlsbGVkLCByZWplY3RlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnNwcmVhZCA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIHRoaXMuYWxsKCkudGhlbihmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bGZpbGxlZC5hcHBseSh2b2lkIDAsIGFycmF5KTtcbiAgICB9LCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIFRoZSBhc3luYyBmdW5jdGlvbiBpcyBhIGRlY29yYXRvciBmb3IgZ2VuZXJhdG9yIGZ1bmN0aW9ucywgdHVybmluZ1xuICogdGhlbSBpbnRvIGFzeW5jaHJvbm91cyBnZW5lcmF0b3JzLiAgQWx0aG91Z2ggZ2VuZXJhdG9ycyBhcmUgb25seSBwYXJ0XG4gKiBvZiB0aGUgbmV3ZXN0IEVDTUFTY3JpcHQgNiBkcmFmdHMsIHRoaXMgY29kZSBkb2VzIG5vdCBjYXVzZSBzeW50YXhcbiAqIGVycm9ycyBpbiBvbGRlciBlbmdpbmVzLiAgVGhpcyBjb2RlIHNob3VsZCBjb250aW51ZSB0byB3b3JrIGFuZCB3aWxsXG4gKiBpbiBmYWN0IGltcHJvdmUgb3ZlciB0aW1lIGFzIHRoZSBsYW5ndWFnZSBpbXByb3Zlcy5cbiAqXG4gKiBFUzYgZ2VuZXJhdG9ycyBhcmUgY3VycmVudGx5IHBhcnQgb2YgVjggdmVyc2lvbiAzLjE5IHdpdGggdGhlXG4gKiAtLWhhcm1vbnktZ2VuZXJhdG9ycyBydW50aW1lIGZsYWcgZW5hYmxlZC4gIFNwaWRlck1vbmtleSBoYXMgaGFkIHRoZW1cbiAqIGZvciBsb25nZXIsIGJ1dCB1bmRlciBhbiBvbGRlciBQeXRob24taW5zcGlyZWQgZm9ybS4gIFRoaXMgZnVuY3Rpb25cbiAqIHdvcmtzIG9uIGJvdGgga2luZHMgb2YgZ2VuZXJhdG9ycy5cbiAqXG4gKiBEZWNvcmF0ZXMgYSBnZW5lcmF0b3IgZnVuY3Rpb24gc3VjaCB0aGF0OlxuICogIC0gaXQgbWF5IHlpZWxkIHByb21pc2VzXG4gKiAgLSBleGVjdXRpb24gd2lsbCBjb250aW51ZSB3aGVuIHRoYXQgcHJvbWlzZSBpcyBmdWxmaWxsZWRcbiAqICAtIHRoZSB2YWx1ZSBvZiB0aGUgeWllbGQgZXhwcmVzc2lvbiB3aWxsIGJlIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqICAtIGl0IHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlICh3aGVuIHRoZSBnZW5lcmF0b3JcbiAqICAgIHN0b3BzIGl0ZXJhdGluZylcbiAqICAtIHRoZSBkZWNvcmF0ZWQgZnVuY3Rpb24gcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqICAgIG9mIHRoZSBnZW5lcmF0b3Igb3IgdGhlIGZpcnN0IHJlamVjdGVkIHByb21pc2UgYW1vbmcgdGhvc2VcbiAqICAgIHlpZWxkZWQuXG4gKiAgLSBpZiBhbiBlcnJvciBpcyB0aHJvd24gaW4gdGhlIGdlbmVyYXRvciwgaXQgcHJvcGFnYXRlcyB0aHJvdWdoXG4gKiAgICBldmVyeSBmb2xsb3dpbmcgeWllbGQgdW50aWwgaXQgaXMgY2F1Z2h0LCBvciB1bnRpbCBpdCBlc2NhcGVzXG4gKiAgICB0aGUgZ2VuZXJhdG9yIGZ1bmN0aW9uIGFsdG9nZXRoZXIsIGFuZCBpcyB0cmFuc2xhdGVkIGludG8gYVxuICogICAgcmVqZWN0aW9uIGZvciB0aGUgcHJvbWlzZSByZXR1cm5lZCBieSB0aGUgZGVjb3JhdGVkIGdlbmVyYXRvci5cbiAqL1xuUS5hc3luYyA9IGFzeW5jO1xuZnVuY3Rpb24gYXN5bmMobWFrZUdlbmVyYXRvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInNlbmRcIiwgYXJnIGlzIGEgdmFsdWVcbiAgICAgICAgLy8gd2hlbiB2ZXJiIGlzIFwidGhyb3dcIiwgYXJnIGlzIGFuIGV4Y2VwdGlvblxuICAgICAgICBmdW5jdGlvbiBjb250aW51ZXIodmVyYiwgYXJnKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuXG4gICAgICAgICAgICAvLyBVbnRpbCBWOCAzLjE5IC8gQ2hyb21pdW0gMjkgaXMgcmVsZWFzZWQsIFNwaWRlck1vbmtleSBpcyB0aGUgb25seVxuICAgICAgICAgICAgLy8gZW5naW5lIHRoYXQgaGFzIGEgZGVwbG95ZWQgYmFzZSBvZiBicm93c2VycyB0aGF0IHN1cHBvcnQgZ2VuZXJhdG9ycy5cbiAgICAgICAgICAgIC8vIEhvd2V2ZXIsIFNNJ3MgZ2VuZXJhdG9ycyB1c2UgdGhlIFB5dGhvbi1pbnNwaXJlZCBzZW1hbnRpY3Mgb2ZcbiAgICAgICAgICAgIC8vIG91dGRhdGVkIEVTNiBkcmFmdHMuICBXZSB3b3VsZCBsaWtlIHRvIHN1cHBvcnQgRVM2LCBidXQgd2UnZCBhbHNvXG4gICAgICAgICAgICAvLyBsaWtlIHRvIG1ha2UgaXQgcG9zc2libGUgdG8gdXNlIGdlbmVyYXRvcnMgaW4gZGVwbG95ZWQgYnJvd3NlcnMsIHNvXG4gICAgICAgICAgICAvLyB3ZSBhbHNvIHN1cHBvcnQgUHl0aG9uLXN0eWxlIGdlbmVyYXRvcnMuICBBdCBzb21lIHBvaW50IHdlIGNhbiByZW1vdmVcbiAgICAgICAgICAgIC8vIHRoaXMgYmxvY2suXG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgU3RvcEl0ZXJhdGlvbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIC8vIEVTNiBHZW5lcmF0b3JzXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBRKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdoZW4ocmVzdWx0LnZhbHVlLCBjYWxsYmFjaywgZXJyYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBTcGlkZXJNb25rZXkgR2VuZXJhdG9yc1xuICAgICAgICAgICAgICAgIC8vIEZJWE1FOiBSZW1vdmUgdGhpcyBjYXNlIHdoZW4gU00gZG9lcyBFUzYgZ2VuZXJhdG9ycy5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0oYXJnKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3RvcEl0ZXJhdGlvbihleGNlcHRpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUShleGNlcHRpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB3aGVuKHJlc3VsdCwgY2FsbGJhY2ssIGVycmJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBnZW5lcmF0b3IgPSBtYWtlR2VuZXJhdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNvbnRpbnVlci5iaW5kKGNvbnRpbnVlciwgXCJuZXh0XCIpO1xuICAgICAgICB2YXIgZXJyYmFjayA9IGNvbnRpbnVlci5iaW5kKGNvbnRpbnVlciwgXCJ0aHJvd1wiKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBUaGUgc3Bhd24gZnVuY3Rpb24gaXMgYSBzbWFsbCB3cmFwcGVyIGFyb3VuZCBhc3luYyB0aGF0IGltbWVkaWF0ZWx5XG4gKiBjYWxscyB0aGUgZ2VuZXJhdG9yIGFuZCBhbHNvIGVuZHMgdGhlIHByb21pc2UgY2hhaW4sIHNvIHRoYXQgYW55XG4gKiB1bmhhbmRsZWQgZXJyb3JzIGFyZSB0aHJvd24gaW5zdGVhZCBvZiBmb3J3YXJkZWQgdG8gdGhlIGVycm9yXG4gKiBoYW5kbGVyLiBUaGlzIGlzIHVzZWZ1bCBiZWNhdXNlIGl0J3MgZXh0cmVtZWx5IGNvbW1vbiB0byBydW5cbiAqIGdlbmVyYXRvcnMgYXQgdGhlIHRvcC1sZXZlbCB0byB3b3JrIHdpdGggbGlicmFyaWVzLlxuICovXG5RLnNwYXduID0gc3Bhd247XG5mdW5jdGlvbiBzcGF3bihtYWtlR2VuZXJhdG9yKSB7XG4gICAgUS5kb25lKFEuYXN5bmMobWFrZUdlbmVyYXRvcikoKSk7XG59XG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBpbnRlcmZhY2Ugb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW4gU3BpZGVyTW9ua2V5LlxuLyoqXG4gKiBUaHJvd3MgYSBSZXR1cm5WYWx1ZSBleGNlcHRpb24gdG8gc3RvcCBhbiBhc3luY2hyb25vdXMgZ2VuZXJhdG9yLlxuICpcbiAqIFRoaXMgaW50ZXJmYWNlIGlzIGEgc3RvcC1nYXAgbWVhc3VyZSB0byBzdXBwb3J0IGdlbmVyYXRvciByZXR1cm5cbiAqIHZhbHVlcyBpbiBvbGRlciBGaXJlZm94L1NwaWRlck1vbmtleS4gIEluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBFUzZcbiAqIGdlbmVyYXRvcnMgbGlrZSBDaHJvbWl1bSAyOSwganVzdCB1c2UgXCJyZXR1cm5cIiBpbiB5b3VyIGdlbmVyYXRvclxuICogZnVuY3Rpb25zLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgcmV0dXJuIHZhbHVlIGZvciB0aGUgc3Vycm91bmRpbmcgZ2VuZXJhdG9yXG4gKiBAdGhyb3dzIFJldHVyblZhbHVlIGV4Y2VwdGlvbiB3aXRoIHRoZSB2YWx1ZS5cbiAqIEBleGFtcGxlXG4gKiAvLyBFUzYgc3R5bGVcbiAqIFEuYXN5bmMoZnVuY3Rpb24qICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgcmV0dXJuIGZvbyArIGJhcjtcbiAqIH0pXG4gKiAvLyBPbGRlciBTcGlkZXJNb25rZXkgc3R5bGVcbiAqIFEuYXN5bmMoZnVuY3Rpb24gKCkge1xuICogICAgICB2YXIgZm9vID0geWllbGQgZ2V0Rm9vUHJvbWlzZSgpO1xuICogICAgICB2YXIgYmFyID0geWllbGQgZ2V0QmFyUHJvbWlzZSgpO1xuICogICAgICBRLnJldHVybihmb28gKyBiYXIpO1xuICogfSlcbiAqL1xuUVtcInJldHVyblwiXSA9IF9yZXR1cm47XG5mdW5jdGlvbiBfcmV0dXJuKHZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IFFSZXR1cm5WYWx1ZSh2YWx1ZSk7XG59XG5cbi8qKlxuICogVGhlIHByb21pc2VkIGZ1bmN0aW9uIGRlY29yYXRvciBlbnN1cmVzIHRoYXQgYW55IHByb21pc2UgYXJndW1lbnRzXG4gKiBhcmUgc2V0dGxlZCBhbmQgcGFzc2VkIGFzIHZhbHVlcyAoYHRoaXNgIGlzIGFsc28gc2V0dGxlZCBhbmQgcGFzc2VkXG4gKiBhcyBhIHZhbHVlKS4gIEl0IHdpbGwgYWxzbyBlbnN1cmUgdGhhdCB0aGUgcmVzdWx0IG9mIGEgZnVuY3Rpb24gaXNcbiAqIGFsd2F5cyBhIHByb21pc2UuXG4gKlxuICogQGV4YW1wbGVcbiAqIHZhciBhZGQgPSBRLnByb21pc2VkKGZ1bmN0aW9uIChhLCBiKSB7XG4gKiAgICAgcmV0dXJuIGEgKyBiO1xuICogfSk7XG4gKiBhZGQoUShhKSwgUShCKSk7XG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRvIGRlY29yYXRlXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb259IGEgZnVuY3Rpb24gdGhhdCBoYXMgYmVlbiBkZWNvcmF0ZWQuXG4gKi9cblEucHJvbWlzZWQgPSBwcm9taXNlZDtcbmZ1bmN0aW9uIHByb21pc2VkKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNwcmVhZChbdGhpcywgYWxsKGFyZ3VtZW50cyldLCBmdW5jdGlvbiAoc2VsZiwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG4vKipcbiAqIHNlbmRzIGEgbWVzc2FnZSB0byBhIHZhbHVlIGluIGEgZnV0dXJlIHR1cm5cbiAqIEBwYXJhbSBvYmplY3QqIHRoZSByZWNpcGllbnRcbiAqIEBwYXJhbSBvcCB0aGUgbmFtZSBvZiB0aGUgbWVzc2FnZSBvcGVyYXRpb24sIGUuZy4sIFwid2hlblwiLFxuICogQHBhcmFtIGFyZ3MgZnVydGhlciBhcmd1bWVudHMgdG8gYmUgZm9yd2FyZGVkIHRvIHRoZSBvcGVyYXRpb25cbiAqIEByZXR1cm5zIHJlc3VsdCB7UHJvbWlzZX0gYSBwcm9taXNlIGZvciB0aGUgcmVzdWx0IG9mIHRoZSBvcGVyYXRpb25cbiAqL1xuUS5kaXNwYXRjaCA9IGRpc3BhdGNoO1xuZnVuY3Rpb24gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2gob3AsIGFyZ3MpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5kaXNwYXRjaCA9IGZ1bmN0aW9uIChvcCwgYXJncykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChkZWZlcnJlZC5yZXNvbHZlLCBvcCwgYXJncyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gZ2V0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBwcm9wZXJ0eSB2YWx1ZVxuICovXG5RLmdldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZ2V0XCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIG9iamVjdCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBzZXRcbiAqIEBwYXJhbSB2YWx1ZSAgICAgbmV3IHZhbHVlIG9mIHByb3BlcnR5XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5zZXQgPSBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInNldFwiLCBba2V5LCB2YWx1ZV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInNldFwiLCBba2V5LCB2YWx1ZV0pO1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gZGVsZXRlXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5kZWwgPSAvLyBYWFggbGVnYWN5XG5RW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImRlbGV0ZVwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWwgPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImRlbGV0ZVwiXSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImRlbGV0ZVwiLCBba2V5XSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIHZhbHVlICAgICBhIHZhbHVlIHRvIHBvc3QsIHR5cGljYWxseSBhbiBhcnJheSBvZlxuICogICAgICAgICAgICAgICAgICBpbnZvY2F0aW9uIGFyZ3VtZW50cyBmb3IgcHJvbWlzZXMgdGhhdFxuICogICAgICAgICAgICAgICAgICBhcmUgdWx0aW1hdGVseSBiYWNrZWQgd2l0aCBgcmVzb2x2ZWAgdmFsdWVzLFxuICogICAgICAgICAgICAgICAgICBhcyBvcHBvc2VkIHRvIHRob3NlIGJhY2tlZCB3aXRoIFVSTHNcbiAqICAgICAgICAgICAgICAgICAgd2hlcmVpbiB0aGUgcG9zdGVkIHZhbHVlIGNhbiBiZSBhbnlcbiAqICAgICAgICAgICAgICAgICAgSlNPTiBzZXJpYWxpemFibGUgb2JqZWN0LlxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cbi8vIGJvdW5kIGxvY2FsbHkgYmVjYXVzZSBpdCBpcyB1c2VkIGJ5IG90aGVyIG1ldGhvZHNcblEubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLnBvc3QgPSBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJnc10pO1xufTtcblxuLyoqXG4gKiBJbnZva2VzIGEgbWV0aG9kIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIG1ldGhvZCB0byBpbnZva2VcbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgaW52b2NhdGlvbiBhcmd1bWVudHNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNlbmQgPSAvLyBYWFggTWFyayBNaWxsZXIncyBwcm9wb3NlZCBwYXJsYW5jZVxuUS5tY2FsbCA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5Qcm9taXNlLnByb3RvdHlwZS5tY2FsbCA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5pbnZva2UgPSBmdW5jdGlvbiAobmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKV0pO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIGFyZ3MgICAgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUS5mYXBwbHkgPSBmdW5jdGlvbiAob2JqZWN0LCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZhcHBseSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIENhbGxzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUVtcInRyeVwiXSA9XG5RLmZjYWxsID0gZnVuY3Rpb24gKG9iamVjdCAvKiAuLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmNhbGwgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFycmF5X3NsaWNlKGFyZ3VtZW50cyldKTtcbn07XG5cbi8qKlxuICogQmluZHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uLCB0cmFuc2Zvcm1pbmcgcmV0dXJuIHZhbHVlcyBpbnRvIGEgZnVsZmlsbGVkXG4gKiBwcm9taXNlIGFuZCB0aHJvd24gZXJyb3JzIGludG8gYSByZWplY3RlZCBvbmUuXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZiaW5kID0gZnVuY3Rpb24gKG9iamVjdCAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBwcm9taXNlID0gUShvYmplY3QpO1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZmJvdW5kKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS5kaXNwYXRjaChcImFwcGx5XCIsIFtcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBhcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKVxuICAgICAgICBdKTtcbiAgICB9O1xufTtcblByb21pc2UucHJvdG90eXBlLmZiaW5kID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzO1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZmJvdW5kKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS5kaXNwYXRjaChcImFwcGx5XCIsIFtcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBhcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKVxuICAgICAgICBdKTtcbiAgICB9O1xufTtcblxuLyoqXG4gKiBSZXF1ZXN0cyB0aGUgbmFtZXMgb2YgdGhlIG93bmVkIHByb3BlcnRpZXMgb2YgYSBwcm9taXNlZFxuICogb2JqZWN0IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUga2V5cyBvZiB0aGUgZXZlbnR1YWxseSBzZXR0bGVkIG9iamVjdFxuICovXG5RLmtleXMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImtleXNcIiwgW10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImtleXNcIiwgW10pO1xufTtcblxuLyoqXG4gKiBUdXJucyBhbiBhcnJheSBvZiBwcm9taXNlcyBpbnRvIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkuICBJZiBhbnkgb2ZcbiAqIHRoZSBwcm9taXNlcyBnZXRzIHJlamVjdGVkLCB0aGUgd2hvbGUgYXJyYXkgaXMgcmVqZWN0ZWQgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FycmF5Kn0gYW4gYXJyYXkgKG9yIHByb21pc2UgZm9yIGFuIGFycmF5KSBvZiB2YWx1ZXMgKG9yXG4gKiBwcm9taXNlcyBmb3IgdmFsdWVzKVxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXNcbiAqL1xuLy8gQnkgTWFyayBNaWxsZXJcbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPXN0cmF3bWFuOmNvbmN1cnJlbmN5JnJldj0xMzA4Nzc2NTIxI2FsbGZ1bGZpbGxlZFxuUS5hbGwgPSBhbGw7XG5mdW5jdGlvbiBhbGwocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHZhciBwZW5kaW5nQ291bnQgPSAwO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBhcnJheV9yZWR1Y2UocHJvbWlzZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb21pc2UsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgc25hcHNob3Q7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgaXNQcm9taXNlKHByb21pc2UpICYmXG4gICAgICAgICAgICAgICAgKHNuYXBzaG90ID0gcHJvbWlzZS5pbnNwZWN0KCkpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlc1tpbmRleF0gPSBzbmFwc2hvdC52YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKytwZW5kaW5nQ291bnQ7XG4gICAgICAgICAgICAgICAgd2hlbihcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgtLXBlbmRpbmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KHsgaW5kZXg6IGluZGV4LCB2YWx1ZTogcHJvZ3Jlc3MgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICBpZiAocGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGwodGhpcyk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IHJlc29sdmVkIHByb21pc2Ugb2YgYW4gYXJyYXkuIFByaW9yIHJlamVjdGVkIHByb21pc2VzIGFyZVxuICogaWdub3JlZC4gIFJlamVjdHMgb25seSBpZiBhbGwgcHJvbWlzZXMgYXJlIHJlamVjdGVkLlxuICogQHBhcmFtIHtBcnJheSp9IGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIG9yIHByb21pc2VzIGZvciB2YWx1ZXNcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmdWxmaWxsZWQgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IHJlc29sdmVkIHByb21pc2UsXG4gKiBvciBhIHJlamVjdGVkIHByb21pc2UgaWYgYWxsIHByb21pc2VzIGFyZSByZWplY3RlZC5cbiAqL1xuUS5hbnkgPSBhbnk7XG5cbmZ1bmN0aW9uIGFueShwcm9taXNlcykge1xuICAgIGlmIChwcm9taXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIFEucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcbiAgICB2YXIgcGVuZGluZ0NvdW50ID0gMDtcbiAgICBhcnJheV9yZWR1Y2UocHJvbWlzZXMsIGZ1bmN0aW9uKHByZXYsIGN1cnJlbnQsIGluZGV4KSB7XG4gICAgICAgIHZhciBwcm9taXNlID0gcHJvbWlzZXNbaW5kZXhdO1xuXG4gICAgICAgIHBlbmRpbmdDb3VudCsrO1xuXG4gICAgICAgIHdoZW4ocHJvbWlzZSwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIG9uUHJvZ3Jlc3MpO1xuICAgICAgICBmdW5jdGlvbiBvbkZ1bGZpbGxlZChyZXN1bHQpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblJlamVjdGVkKCkge1xuICAgICAgICAgICAgcGVuZGluZ0NvdW50LS07XG4gICAgICAgICAgICBpZiAocGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgXCJDYW4ndCBnZXQgZnVsZmlsbG1lbnQgdmFsdWUgZnJvbSBhbnkgcHJvbWlzZSwgYWxsIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9taXNlcyB3ZXJlIHJlamVjdGVkLlwiXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25Qcm9ncmVzcyhwcm9ncmVzcykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KHtcbiAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHByb2dyZXNzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sIHVuZGVmaW5lZCk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYW55ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGFueSh0aGlzKTtcbn07XG5cbi8qKlxuICogV2FpdHMgZm9yIGFsbCBwcm9taXNlcyB0byBiZSBzZXR0bGVkLCBlaXRoZXIgZnVsZmlsbGVkIG9yXG4gKiByZWplY3RlZC4gIFRoaXMgaXMgZGlzdGluY3QgZnJvbSBgYWxsYCBzaW5jZSB0aGF0IHdvdWxkIHN0b3BcbiAqIHdhaXRpbmcgYXQgdGhlIGZpcnN0IHJlamVjdGlvbi4gIFRoZSBwcm9taXNlIHJldHVybmVkIGJ5XG4gKiBgYWxsUmVzb2x2ZWRgIHdpbGwgbmV2ZXIgYmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0gcHJvbWlzZXMgYSBwcm9taXNlIGZvciBhbiBhcnJheSAob3IgYW4gYXJyYXkpIG9mIHByb21pc2VzXG4gKiAob3IgdmFsdWVzKVxuICogQHJldHVybiBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHByb21pc2VzXG4gKi9cblEuYWxsUmVzb2x2ZWQgPSBkZXByZWNhdGUoYWxsUmVzb2x2ZWQsIFwiYWxsUmVzb2x2ZWRcIiwgXCJhbGxTZXR0bGVkXCIpO1xuZnVuY3Rpb24gYWxsUmVzb2x2ZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHByb21pc2VzID0gYXJyYXlfbWFwKHByb21pc2VzLCBRKTtcbiAgICAgICAgcmV0dXJuIHdoZW4oYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB3aGVuKHByb21pc2UsIG5vb3AsIG5vb3ApO1xuICAgICAgICB9KSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlcztcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbFJlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGxSZXNvbHZlZCh0aGlzKTtcbn07XG5cbi8qKlxuICogQHNlZSBQcm9taXNlI2FsbFNldHRsZWRcbiAqL1xuUS5hbGxTZXR0bGVkID0gYWxsU2V0dGxlZDtcbmZ1bmN0aW9uIGFsbFNldHRsZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gUShwcm9taXNlcykuYWxsU2V0dGxlZCgpO1xufVxuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGVpciBzdGF0ZXMgKGFzXG4gKiByZXR1cm5lZCBieSBgaW5zcGVjdGApIHdoZW4gdGhleSBoYXZlIGFsbCBzZXR0bGVkLlxuICogQHBhcmFtIHtBcnJheVtBbnkqXX0gdmFsdWVzIGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIHtBcnJheVtTdGF0ZV19IGFuIGFycmF5IG9mIHN0YXRlcyBmb3IgdGhlIHJlc3BlY3RpdmUgdmFsdWVzLlxuICovXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxTZXR0bGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHJldHVybiBhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcHJvbWlzZSA9IFEocHJvbWlzZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiByZWdhcmRsZXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlLmluc3BlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4ocmVnYXJkbGVzcywgcmVnYXJkbGVzcyk7XG4gICAgICAgIH0pKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2FwdHVyZXMgdGhlIGZhaWx1cmUgb2YgYSBwcm9taXNlLCBnaXZpbmcgYW4gb3BvcnR1bml0eSB0byByZWNvdmVyXG4gKiB3aXRoIGEgY2FsbGJhY2suICBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpcyBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZFxuICogcHJvbWlzZSBpcyBmdWxmaWxsZWQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gZnVsZmlsbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpZiB0aGVcbiAqIGdpdmVuIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgY2FsbGJhY2tcbiAqL1xuUS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKG9iamVjdCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGEgbGlzdGVuZXIgdGhhdCBjYW4gcmVzcG9uZCB0byBwcm9ncmVzcyBub3RpZmljYXRpb25zIGZyb20gYVxuICogcHJvbWlzZSdzIG9yaWdpbmF0aW5nIGRlZmVycmVkLiBUaGlzIGxpc3RlbmVyIHJlY2VpdmVzIHRoZSBleGFjdCBhcmd1bWVudHNcbiAqIHBhc3NlZCB0byBgYGRlZmVycmVkLm5vdGlmeWBgLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIHJlY2VpdmUgYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm5zIHRoZSBnaXZlbiBwcm9taXNlLCB1bmNoYW5nZWRcbiAqL1xuUS5wcm9ncmVzcyA9IHByb2dyZXNzO1xuZnVuY3Rpb24gcHJvZ3Jlc3Mob2JqZWN0LCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBvYnNlcnZlIHRoZSBzZXR0bGluZyBvZiBhIHByb21pc2UsXG4gKiByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIHByb21pc2UgaXMgZnVsZmlsbGVkIG9yIHJlamVjdGVkLiAgRm9yd2FyZHNcbiAqIHRoZSByZXNvbHV0aW9uIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlIHdoZW4gdGhlIGNhbGxiYWNrIGlzIGRvbmUuXG4gKiBUaGUgY2FsbGJhY2sgY2FuIHJldHVybiBhIHByb21pc2UgdG8gZGVmZXIgY29tcGxldGlvbi5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gb2JzZXJ2ZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW5cbiAqIHByb21pc2UsIHRha2VzIG5vIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2Ugd2hlblxuICogYGBmaW5gYCBpcyBkb25lLlxuICovXG5RLmZpbiA9IC8vIFhYWCBsZWdhY3lcblFbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpW1wiZmluYWxseVwiXShjYWxsYmFjayk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5maW4gPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRPRE8gYXR0ZW1wdCB0byByZWN5Y2xlIHRoZSByZWplY3Rpb24gd2l0aCBcInRoaXNcIi5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUZXJtaW5hdGVzIGEgY2hhaW4gb2YgcHJvbWlzZXMsIGZvcmNpbmcgcmVqZWN0aW9ucyB0byBiZVxuICogdGhyb3duIGFzIGV4Y2VwdGlvbnMuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgYXQgdGhlIGVuZCBvZiBhIGNoYWluIG9mIHByb21pc2VzXG4gKiBAcmV0dXJucyBub3RoaW5nXG4gKi9cblEuZG9uZSA9IGZ1bmN0aW9uIChvYmplY3QsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kb25lKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICB2YXIgb25VbmhhbmRsZWRFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAvLyBmb3J3YXJkIHRvIGEgZnV0dXJlIHR1cm4gc28gdGhhdCBgYHdoZW5gYFxuICAgICAgICAvLyBkb2VzIG5vdCBjYXRjaCBpdCBhbmQgdHVybiBpdCBpbnRvIGEgcmVqZWN0aW9uLlxuICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSk7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBBdm9pZCB1bm5lY2Vzc2FyeSBgbmV4dFRpY2tgaW5nIHZpYSBhbiB1bm5lY2Vzc2FyeSBgd2hlbmAuXG4gICAgdmFyIHByb21pc2UgPSBmdWxmaWxsZWQgfHwgcmVqZWN0ZWQgfHwgcHJvZ3Jlc3MgP1xuICAgICAgICB0aGlzLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIDpcbiAgICAgICAgdGhpcztcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZG9tYWluKSB7XG4gICAgICAgIG9uVW5oYW5kbGVkRXJyb3IgPSBwcm9jZXNzLmRvbWFpbi5iaW5kKG9uVW5oYW5kbGVkRXJyb3IpO1xuICAgIH1cblxuICAgIHByb21pc2UudGhlbih2b2lkIDAsIG9uVW5oYW5kbGVkRXJyb3IpO1xufTtcblxuLyoqXG4gKiBDYXVzZXMgYSBwcm9taXNlIHRvIGJlIHJlamVjdGVkIGlmIGl0IGRvZXMgbm90IGdldCBmdWxmaWxsZWQgYmVmb3JlXG4gKiBzb21lIG1pbGxpc2Vjb25kcyB0aW1lIG91dC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kcyB0aW1lb3V0XG4gKiBAcGFyYW0ge0FueSp9IGN1c3RvbSBlcnJvciBtZXNzYWdlIG9yIEVycm9yIG9iamVjdCAob3B0aW9uYWwpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGlmIGl0IGlzXG4gKiBmdWxmaWxsZWQgYmVmb3JlIHRoZSB0aW1lb3V0LCBvdGhlcndpc2UgcmVqZWN0ZWQuXG4gKi9cblEudGltZW91dCA9IGZ1bmN0aW9uIChvYmplY3QsIG1zLCBlcnJvcikge1xuICAgIHJldHVybiBRKG9iamVjdCkudGltZW91dChtcywgZXJyb3IpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uIChtcywgZXJyb3IpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFlcnJvciB8fCBcInN0cmluZ1wiID09PSB0eXBlb2YgZXJyb3IpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKGVycm9yIHx8IFwiVGltZWQgb3V0IGFmdGVyIFwiICsgbXMgKyBcIiBtc1wiKTtcbiAgICAgICAgICAgIGVycm9yLmNvZGUgPSBcIkVUSU1FRE9VVFwiO1xuICAgICAgICB9XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgfSwgbXMpO1xuXG4gICAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfSwgZGVmZXJyZWQubm90aWZ5KTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGdpdmVuIHZhbHVlIChvciBwcm9taXNlZCB2YWx1ZSksIHNvbWVcbiAqIG1pbGxpc2Vjb25kcyBhZnRlciBpdCByZXNvbHZlZC4gUGFzc2VzIHJlamVjdGlvbnMgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHNcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgYWZ0ZXIgbWlsbGlzZWNvbmRzXG4gKiB0aW1lIGhhcyBlbGFwc2VkIHNpbmNlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlLlxuICogSWYgdGhlIGdpdmVuIHByb21pc2UgcmVqZWN0cywgdGhhdCBpcyBwYXNzZWQgaW1tZWRpYXRlbHkuXG4gKi9cblEuZGVsYXkgPSBmdW5jdGlvbiAob2JqZWN0LCB0aW1lb3V0KSB7XG4gICAgaWYgKHRpbWVvdXQgPT09IHZvaWQgMCkge1xuICAgICAgICB0aW1lb3V0ID0gb2JqZWN0O1xuICAgICAgICBvYmplY3QgPSB2b2lkIDA7XG4gICAgfVxuICAgIHJldHVybiBRKG9iamVjdCkuZGVsYXkodGltZW91dCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uICh0aW1lb3V0KSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBhcyBhbiBhcnJheSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICpcbiAqICAgICAgUS5uZmFwcGx5KEZTLnJlYWRGaWxlLCBbX19maWxlbmFtZV0pXG4gKiAgICAgIC50aGVuKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gKiAgICAgIH0pXG4gKlxuICovXG5RLm5mYXBwbHkgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGluZGl2aWR1YWxseSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZjYWxsKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKVxuICogLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqIH0pXG4gKlxuICovXG5RLm5mY2FsbCA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogV3JhcHMgYSBOb2RlSlMgY29udGludWF0aW9uIHBhc3NpbmcgZnVuY3Rpb24gYW5kIHJldHVybnMgYW4gZXF1aXZhbGVudFxuICogdmVyc2lvbiB0aGF0IHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZiaW5kKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKShcInV0Zi04XCIpXG4gKiAudGhlbihjb25zb2xlLmxvZylcbiAqIC5kb25lKClcbiAqL1xuUS5uZmJpbmQgPVxuUS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2sgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBRKGNhbGxiYWNrKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYmluZCA9XG5Qcm9taXNlLnByb3RvdHlwZS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHJldHVybiBRLmRlbm9kZWlmeS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuUS5uYmluZCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3AgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBmdW5jdGlvbiBib3VuZCgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzcCwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICBRKGJvdW5kKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5iaW5kID0gZnVuY3Rpb24gKC8qdGhpc3AsIC4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAwKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEubmJpbmQuYXBwbHkodm9pZCAwLCBhcmdzKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgYSBtZXRob2Qgb2YgYSBOb2RlLXN0eWxlIG9iamVjdCB0aGF0IGFjY2VwdHMgYSBOb2RlLXN0eWxlXG4gKiBjYWxsYmFjayB3aXRoIGEgZ2l2ZW4gYXJyYXkgb2YgYXJndW1lbnRzLCBwbHVzIGEgcHJvdmlkZWQgY2FsbGJhY2suXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFja1xuICogd2lsbCBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5ucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5wb3N0KG5hbWUsIGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5ucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyB8fCBbXSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrLCBmb3J3YXJkaW5nIHRoZSBnaXZlbiB2YXJpYWRpYyBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZFxuICogY2FsbGJhY2sgYXJndW1lbnQuXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0gLi4uYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2sgd2lsbFxuICogYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5RLm5tY2FsbCA9IC8vIFhYWCBCYXNlZCBvbiBcIlJlZHNhbmRybydzXCIgcHJvcG9zYWxcblEubmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubnNlbmQgPSAvLyBYWFggQmFzZWQgb24gTWFyayBNaWxsZXIncyBwcm9wb3NlZCBcInNlbmRcIlxuUHJvbWlzZS5wcm90b3R5cGUubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUHJvbWlzZS5wcm90b3R5cGUubmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIElmIGEgZnVuY3Rpb24gd291bGQgbGlrZSB0byBzdXBwb3J0IGJvdGggTm9kZSBjb250aW51YXRpb24tcGFzc2luZy1zdHlsZSBhbmRcbiAqIHByb21pc2UtcmV0dXJuaW5nLXN0eWxlLCBpdCBjYW4gZW5kIGl0cyBpbnRlcm5hbCBwcm9taXNlIGNoYWluIHdpdGhcbiAqIGBub2RlaWZ5KG5vZGViYWNrKWAsIGZvcndhcmRpbmcgdGhlIG9wdGlvbmFsIG5vZGViYWNrIGFyZ3VtZW50LiAgSWYgdGhlIHVzZXJcbiAqIGVsZWN0cyB0byB1c2UgYSBub2RlYmFjaywgdGhlIHJlc3VsdCB3aWxsIGJlIHNlbnQgdGhlcmUuICBJZiB0aGV5IGRvIG5vdFxuICogcGFzcyBhIG5vZGViYWNrLCB0aGV5IHdpbGwgcmVjZWl2ZSB0aGUgcmVzdWx0IHByb21pc2UuXG4gKiBAcGFyYW0gb2JqZWN0IGEgcmVzdWx0IChvciBhIHByb21pc2UgZm9yIGEgcmVzdWx0KVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbm9kZWJhY2sgYSBOb2RlLmpzLXN0eWxlIGNhbGxiYWNrXG4gKiBAcmV0dXJucyBlaXRoZXIgdGhlIHByb21pc2Ugb3Igbm90aGluZ1xuICovXG5RLm5vZGVpZnkgPSBub2RlaWZ5O1xuZnVuY3Rpb24gbm9kZWlmeShvYmplY3QsIG5vZGViYWNrKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5ub2RlaWZ5KG5vZGViYWNrKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChub2RlYmFjaykge1xuICAgIGlmIChub2RlYmFjaykge1xuICAgICAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxuLy8gQWxsIGNvZGUgYmVmb3JlIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcy5cbnZhciBxRW5kaW5nTGluZSA9IGNhcHR1cmVMaW5lKCk7XG5cbnJldHVybiBRO1xuXG59KTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoJ19wcm9jZXNzJykpXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbTV2WkdWZmJXOWtkV3hsY3k5eEwzRXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJdkx5QjJhVzA2ZEhNOU5EcHpkSE05TkRwemR6MDBPbHh1THlvaFhHNGdLbHh1SUNvZ1EyOXdlWEpwWjJoMElESXdNRGt0TWpBeE1pQkxjbWx6SUV0dmQyRnNJSFZ1WkdWeUlIUm9aU0IwWlhKdGN5QnZaaUIwYUdVZ1RVbFVYRzRnS2lCc2FXTmxibk5sSUdadmRXNWtJR0YwSUdoMGRIQTZMeTluYVhSb2RXSXVZMjl0TDJ0eWFYTnJiM2RoYkM5eEwzSmhkeTl0WVhOMFpYSXZURWxEUlU1VFJWeHVJQ3BjYmlBcUlGZHBkR2dnY0dGeWRITWdZbmtnVkhsc1pYSWdRMnh2YzJWY2JpQXFJRU52Y0hseWFXZG9kQ0F5TURBM0xUSXdNRGtnVkhsc1pYSWdRMnh2YzJVZ2RXNWtaWElnZEdobElIUmxjbTF6SUc5bUlIUm9aU0JOU1ZRZ1dDQnNhV05sYm5ObElHWnZkVzVrWEc0Z0tpQmhkQ0JvZEhSd09pOHZkM2QzTG05d1pXNXpiM1Z5WTJVdWIzSm5MMnhwWTJWdWMyVnpMMjFwZEMxc2FXTmxibk5sTG1oMGJXeGNiaUFxSUVadmNtdGxaQ0JoZENCeVpXWmZjMlZ1WkM1cWN5QjJaWEp6YVc5dU9pQXlNREE1TFRBMUxURXhYRzRnS2x4dUlDb2dWMmwwYUNCd1lYSjBjeUJpZVNCTllYSnJJRTFwYkd4bGNseHVJQ29nUTI5d2VYSnBaMmgwSUNoREtTQXlNREV4SUVkdmIyZHNaU0JKYm1NdVhHNGdLbHh1SUNvZ1RHbGpaVzV6WldRZ2RXNWtaWElnZEdobElFRndZV05vWlNCTWFXTmxibk5sTENCV1pYSnphVzl1SURJdU1DQW9kR2hsSUZ3aVRHbGpaVzV6WlZ3aUtUdGNiaUFxSUhsdmRTQnRZWGtnYm05MElIVnpaU0IwYUdseklHWnBiR1VnWlhoalpYQjBJR2x1SUdOdmJYQnNhV0Z1WTJVZ2QybDBhQ0IwYUdVZ1RHbGpaVzV6WlM1Y2JpQXFJRmx2ZFNCdFlYa2diMkowWVdsdUlHRWdZMjl3ZVNCdlppQjBhR1VnVEdsalpXNXpaU0JoZEZ4dUlDcGNiaUFxSUdoMGRIQTZMeTkzZDNjdVlYQmhZMmhsTG05eVp5OXNhV05sYm5ObGN5OU1TVU5GVGxORkxUSXVNRnh1SUNwY2JpQXFJRlZ1YkdWemN5QnlaWEYxYVhKbFpDQmllU0JoY0hCc2FXTmhZbXhsSUd4aGR5QnZjaUJoWjNKbFpXUWdkRzhnYVc0Z2QzSnBkR2x1Wnl3Z2MyOW1kSGRoY21WY2JpQXFJR1JwYzNSeWFXSjFkR1ZrSUhWdVpHVnlJSFJvWlNCTWFXTmxibk5sSUdseklHUnBjM1J5YVdKMWRHVmtJRzl1SUdGdUlGd2lRVk1nU1ZOY0lpQkNRVk5KVXl4Y2JpQXFJRmRKVkVoUFZWUWdWMEZTVWtGT1ZFbEZVeUJQVWlCRFQwNUVTVlJKVDA1VElFOUdJRUZPV1NCTFNVNUVMQ0JsYVhSb1pYSWdaWGh3Y21WemN5QnZjaUJwYlhCc2FXVmtMbHh1SUNvZ1UyVmxJSFJvWlNCTWFXTmxibk5sSUdadmNpQjBhR1VnYzNCbFkybG1hV01nYkdGdVozVmhaMlVnWjI5MlpYSnVhVzVuSUhCbGNtMXBjM05wYjI1eklHRnVaRnh1SUNvZ2JHbHRhWFJoZEdsdmJuTWdkVzVrWlhJZ2RHaGxJRXhwWTJWdWMyVXVYRzRnS2x4dUlDb3ZYRzVjYmlobWRXNWpkR2x2YmlBb1pHVm1hVzVwZEdsdmJpa2dlMXh1SUNBZ0lGd2lkWE5sSUhOMGNtbGpkRndpTzF4dVhHNGdJQ0FnTHk4Z1ZHaHBjeUJtYVd4bElIZHBiR3dnWm5WdVkzUnBiMjRnY0hKdmNHVnliSGtnWVhNZ1lTQThjMk55YVhCMFBpQjBZV2NzSUc5eUlHRWdiVzlrZFd4bFhHNGdJQ0FnTHk4Z2RYTnBibWNnUTI5dGJXOXVTbE1nWVc1a0lFNXZaR1ZLVXlCdmNpQlNaWEYxYVhKbFNsTWdiVzlrZFd4bElHWnZjbTFoZEhNdUlDQkpibHh1SUNBZ0lDOHZJRU52YlcxdmJpOU9iMlJsTDFKbGNYVnBjbVZLVXl3Z2RHaGxJRzF2WkhWc1pTQmxlSEJ2Y25SeklIUm9aU0JSSUVGUVNTQmhibVFnZDJobGJseHVJQ0FnSUM4dklHVjRaV04xZEdWa0lHRnpJR0VnYzJsdGNHeGxJRHh6WTNKcGNIUStMQ0JwZENCamNtVmhkR1Z6SUdFZ1VTQm5iRzlpWVd3Z2FXNXpkR1ZoWkM1Y2JseHVJQ0FnSUM4dklFMXZiblJoWjJVZ1VtVnhkV2x5WlZ4dUlDQWdJR2xtSUNoMGVYQmxiMllnWW05dmRITjBjbUZ3SUQwOVBTQmNJbVoxYm1OMGFXOXVYQ0lwSUh0Y2JpQWdJQ0FnSUNBZ1ltOXZkSE4wY21Gd0tGd2ljSEp2YldselpWd2lMQ0JrWldacGJtbDBhVzl1S1R0Y2JseHVJQ0FnSUM4dklFTnZiVzF2YmtwVFhHNGdJQ0FnZlNCbGJITmxJR2xtSUNoMGVYQmxiMllnWlhod2IzSjBjeUE5UFQwZ1hDSnZZbXBsWTNSY0lpQW1KaUIwZVhCbGIyWWdiVzlrZFd4bElEMDlQU0JjSW05aWFtVmpkRndpS1NCN1hHNGdJQ0FnSUNBZ0lHMXZaSFZzWlM1bGVIQnZjblJ6SUQwZ1pHVm1hVzVwZEdsdmJpZ3BPMXh1WEc0Z0lDQWdMeThnVW1WeGRXbHlaVXBUWEc0Z0lDQWdmU0JsYkhObElHbG1JQ2gwZVhCbGIyWWdaR1ZtYVc1bElEMDlQU0JjSW1aMWJtTjBhVzl1WENJZ0ppWWdaR1ZtYVc1bExtRnRaQ2tnZTF4dUlDQWdJQ0FnSUNCa1pXWnBibVVvWkdWbWFXNXBkR2x2YmlrN1hHNWNiaUFnSUNBdkx5QlRSVk1nS0ZObFkzVnlaU0JGWTIxaFUyTnlhWEIwS1Z4dUlDQWdJSDBnWld4elpTQnBaaUFvZEhsd1pXOW1JSE5sY3lBaFBUMGdYQ0oxYm1SbFptbHVaV1JjSWlrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvSVhObGN5NXZheWdwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNDdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCelpYTXViV0ZyWlZFZ1BTQmtaV1pwYm1sMGFXOXVPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0F2THlBOGMyTnlhWEIwUGx4dUlDQWdJSDBnWld4elpTQnBaaUFvZEhsd1pXOW1JSE5sYkdZZ0lUMDlJRndpZFc1a1pXWnBibVZrWENJcElIdGNiaUFnSUNBZ0lDQWdjMlZzWmk1UklEMGdaR1ZtYVc1cGRHbHZiaWdwTzF4dVhHNGdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVWeWNtOXlLRndpVkdocGN5QmxiblpwY205dWJXVnVkQ0IzWVhNZ2JtOTBJR0Z1ZEdsamFYQmhkR1ZrSUdKNUlGRXVJRkJzWldGelpTQm1hV3hsSUdFZ1luVm5MbHdpS1R0Y2JpQWdJQ0I5WEc1Y2JuMHBLR1oxYm1OMGFXOXVJQ2dwSUh0Y2Jsd2lkWE5sSUhOMGNtbGpkRndpTzF4dVhHNTJZWElnYUdGelUzUmhZMnR6SUQwZ1ptRnNjMlU3WEc1MGNua2dlMXh1SUNBZ0lIUm9jbTkzSUc1bGR5QkZjbkp2Y2lncE8xeHVmU0JqWVhSamFDQW9aU2tnZTF4dUlDQWdJR2hoYzFOMFlXTnJjeUE5SUNFaFpTNXpkR0ZqYXp0Y2JuMWNibHh1THk4Z1FXeHNJR052WkdVZ1lXWjBaWElnZEdocGN5QndiMmx1ZENCM2FXeHNJR0psSUdacGJIUmxjbVZrSUdaeWIyMGdjM1JoWTJzZ2RISmhZMlZ6SUhKbGNHOXlkR1ZrWEc0dkx5QmllU0JSTGx4dWRtRnlJSEZUZEdGeWRHbHVaMHhwYm1VZ1BTQmpZWEIwZFhKbFRHbHVaU2dwTzF4dWRtRnlJSEZHYVd4bFRtRnRaVHRjYmx4dUx5OGdjMmhwYlhOY2JseHVMeThnZFhObFpDQm1iM0lnWm1Gc2JHSmhZMnNnYVc0Z1hDSmhiR3hTWlhOdmJIWmxaRndpWEc1MllYSWdibTl2Y0NBOUlHWjFibU4wYVc5dUlDZ3BJSHQ5TzF4dVhHNHZMeUJWYzJVZ2RHaGxJR1poYzNSbGMzUWdjRzl6YzJsaWJHVWdiV1ZoYm5NZ2RHOGdaWGhsWTNWMFpTQmhJSFJoYzJzZ2FXNGdZU0JtZFhSMWNtVWdkSFZ5Ymx4dUx5OGdiMllnZEdobElHVjJaVzUwSUd4dmIzQXVYRzUyWVhJZ2JtVjRkRlJwWTJzZ1BTaG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdMeThnYkdsdWEyVmtJR3hwYzNRZ2IyWWdkR0Z6YTNNZ0tITnBibWRzWlN3Z2QybDBhQ0JvWldGa0lHNXZaR1VwWEc0Z0lDQWdkbUZ5SUdobFlXUWdQU0I3ZEdGemF6b2dkbTlwWkNBd0xDQnVaWGgwT2lCdWRXeHNmVHRjYmlBZ0lDQjJZWElnZEdGcGJDQTlJR2hsWVdRN1hHNGdJQ0FnZG1GeUlHWnNkWE5vYVc1bklEMGdabUZzYzJVN1hHNGdJQ0FnZG1GeUlISmxjWFZsYzNSVWFXTnJJRDBnZG05cFpDQXdPMXh1SUNBZ0lIWmhjaUJwYzA1dlpHVktVeUE5SUdaaGJITmxPMXh1WEc0Z0lDQWdablZ1WTNScGIyNGdabXgxYzJnb0tTQjdYRzRnSUNBZ0lDQWdJQzhxSUdwemFHbHVkQ0JzYjI5d1puVnVZem9nZEhKMVpTQXFMMXh1WEc0Z0lDQWdJQ0FnSUhkb2FXeGxJQ2hvWldGa0xtNWxlSFFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2hsWVdRZ1BTQm9aV0ZrTG01bGVIUTdYRzRnSUNBZ0lDQWdJQ0FnSUNCMllYSWdkR0Z6YXlBOUlHaGxZV1F1ZEdGemF6dGNiaUFnSUNBZ0lDQWdJQ0FnSUdobFlXUXVkR0Z6YXlBOUlIWnZhV1FnTUR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFpoY2lCa2IyMWhhVzRnUFNCb1pXRmtMbVJ2YldGcGJqdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR1J2YldGcGJpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2hsWVdRdVpHOXRZV2x1SUQwZ2RtOXBaQ0F3TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSdmJXRnBiaTVsYm5SbGNpZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCMGNua2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJoYzJzb0tUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTQmpZWFJqYUNBb1pTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNocGMwNXZaR1ZLVXlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCSmJpQnViMlJsTENCMWJtTmhkV2RvZENCbGVHTmxjSFJwYjI1eklHRnlaU0JqYjI1emFXUmxjbVZrSUdaaGRHRnNJR1Z5Y205eWN5NWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1VtVXRkR2h5YjNjZ2RHaGxiU0J6ZVc1amFISnZibTkxYzJ4NUlIUnZJR2x1ZEdWeWNuVndkQ0JtYkhWemFHbHVaeUZjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQXZMeUJGYm5OMWNtVWdZMjl1ZEdsdWRXRjBhVzl1SUdsbUlIUm9aU0IxYm1OaGRXZG9kQ0JsZUdObGNIUnBiMjRnYVhNZ2MzVndjSEpsYzNObFpGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCc2FYTjBaVzVwYm1jZ1hDSjFibU5oZFdkb2RFVjRZMlZ3ZEdsdmJsd2lJR1YyWlc1MGN5QW9ZWE1nWkc5dFlXbHVjeUJrYjJWektTNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1EyOXVkR2x1ZFdVZ2FXNGdibVY0ZENCbGRtVnVkQ0IwYnlCaGRtOXBaQ0IwYVdOcklISmxZM1Z5YzJsdmJpNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHUnZiV0ZwYmlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pHOXRZV2x1TG1WNGFYUW9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6WlhSVWFXMWxiM1YwS0dac2RYTm9MQ0F3S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0dSdmJXRnBiaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWkc5dFlXbHVMbVZ1ZEdWeUtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QmxPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdTVzRnWW5KdmQzTmxjbk1zSUhWdVkyRjFaMmgwSUdWNFkyVndkR2x2Ym5NZ1lYSmxJRzV2ZENCbVlYUmhiQzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdVbVV0ZEdoeWIzY2dkR2hsYlNCaGMzbHVZMmh5YjI1dmRYTnNlU0IwYnlCaGRtOXBaQ0J6Ykc5M0xXUnZkMjV6TGx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpaWFJVYVcxbGIzVjBLR1oxYm1OMGFXOXVLQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QmxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUxDQXdLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hrYjIxaGFXNHBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JrYjIxaGFXNHVaWGhwZENncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdabXgxYzJocGJtY2dQU0JtWVd4elpUdGNiaUFnSUNCOVhHNWNiaUFnSUNCdVpYaDBWR2xqYXlBOUlHWjFibU4wYVc5dUlDaDBZWE5yS1NCN1hHNGdJQ0FnSUNBZ0lIUmhhV3dnUFNCMFlXbHNMbTVsZUhRZ1BTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMFlYTnJPaUIwWVhOckxGeHVJQ0FnSUNBZ0lDQWdJQ0FnWkc5dFlXbHVPaUJwYzA1dlpHVktVeUFtSmlCd2NtOWpaWE56TG1SdmJXRnBiaXhjYmlBZ0lDQWdJQ0FnSUNBZ0lHNWxlSFE2SUc1MWJHeGNiaUFnSUNBZ0lDQWdmVHRjYmx4dUlDQWdJQ0FnSUNCcFppQW9JV1pzZFhOb2FXNW5LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQm1iSFZ6YUdsdVp5QTlJSFJ5ZFdVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhGMVpYTjBWR2xqYXlncE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdjSEp2WTJWemN5QWhQVDBnWENKMWJtUmxabWx1WldSY0lpQW1KaUJ3Y205alpYTnpMbTVsZUhSVWFXTnJLU0I3WEc0Z0lDQWdJQ0FnSUM4dklFNXZaR1V1YW5NZ1ltVm1iM0psSURBdU9TNGdUbTkwWlNCMGFHRjBJSE52YldVZ1ptRnJaUzFPYjJSbElHVnVkbWx5YjI1dFpXNTBjeXdnYkdsclpTQjBhR1ZjYmlBZ0lDQWdJQ0FnTHk4Z1RXOWphR0VnZEdWemRDQnlkVzV1WlhJc0lHbHVkSEp2WkhWalpTQmhJR0J3Y205alpYTnpZQ0JuYkc5aVlXd2dkMmwwYUc5MWRDQmhJR0J1WlhoMFZHbGphMkF1WEc0Z0lDQWdJQ0FnSUdselRtOWtaVXBUSUQwZ2RISjFaVHRjYmx4dUlDQWdJQ0FnSUNCeVpYRjFaWE4wVkdsamF5QTlJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEJ5YjJObGMzTXVibVY0ZEZScFkyc29abXgxYzJncE8xeHVJQ0FnSUNBZ0lDQjlPMXh1WEc0Z0lDQWdmU0JsYkhObElHbG1JQ2gwZVhCbGIyWWdjMlYwU1cxdFpXUnBZWFJsSUQwOVBTQmNJbVoxYm1OMGFXOXVYQ0lwSUh0Y2JpQWdJQ0FnSUNBZ0x5OGdTVzRnU1VVeE1Dd2dUbTlrWlM1cWN5QXdMamtyTENCdmNpQm9kSFJ3Y3pvdkwyZHBkR2gxWWk1amIyMHZUbTlpYkdWS1V5OXpaWFJKYlcxbFpHbGhkR1ZjYmlBZ0lDQWdJQ0FnYVdZZ0tIUjVjR1Z2WmlCM2FXNWtiM2NnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsY1hWbGMzUlVhV05ySUQwZ2MyVjBTVzF0WldScFlYUmxMbUpwYm1Rb2QybHVaRzkzTENCbWJIVnphQ2s3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWEYxWlhOMFZHbGpheUE5SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpaWFJKYlcxbFpHbGhkR1VvWm14MWMyZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdmU0JsYkhObElHbG1JQ2gwZVhCbGIyWWdUV1Z6YzJGblpVTm9ZVzV1Wld3Z0lUMDlJRndpZFc1a1pXWnBibVZrWENJcElIdGNiaUFnSUNBZ0lDQWdMeThnYlc5a1pYSnVJR0p5YjNkelpYSnpYRzRnSUNBZ0lDQWdJQzh2SUdoMGRIQTZMeTkzZDNjdWJtOXVZbXh2WTJ0cGJtY3VhVzh2TWpBeE1TOHdOaTkzYVc1a2IzZHVaWGgwZEdsamF5NW9kRzFzWEc0Z0lDQWdJQ0FnSUhaaGNpQmphR0Z1Ym1Wc0lEMGdibVYzSUUxbGMzTmhaMlZEYUdGdWJtVnNLQ2s3WEc0Z0lDQWdJQ0FnSUM4dklFRjBJR3hsWVhOMElGTmhabUZ5YVNCV1pYSnphVzl1SURZdU1DNDFJQ2c0TlRNMkxqTXdMakVwSUdsdWRHVnliV2wwZEdWdWRHeDVJR05oYm01dmRDQmpjbVZoZEdWY2JpQWdJQ0FnSUNBZ0x5OGdkMjl5YTJsdVp5QnRaWE56WVdkbElIQnZjblJ6SUhSb1pTQm1hWEp6ZENCMGFXMWxJR0VnY0dGblpTQnNiMkZrY3k1Y2JpQWdJQ0FnSUNBZ1kyaGhibTVsYkM1d2IzSjBNUzV2Ym0xbGMzTmhaMlVnUFNCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYRjFaWE4wVkdsamF5QTlJSEpsY1hWbGMzUlFiM0owVkdsamF6dGNiaUFnSUNBZ0lDQWdJQ0FnSUdOb1lXNXVaV3d1Y0c5eWRERXViMjV0WlhOellXZGxJRDBnWm14MWMyZzdYRzRnSUNBZ0lDQWdJQ0FnSUNCbWJIVnphQ2dwTzF4dUlDQWdJQ0FnSUNCOU8xeHVJQ0FnSUNBZ0lDQjJZWElnY21WeGRXVnpkRkJ2Y25SVWFXTnJJRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1QzQmxjbUVnY21WeGRXbHlaWE1nZFhNZ2RHOGdjSEp2ZG1sa1pTQmhJRzFsYzNOaFoyVWdjR0Y1Ykc5aFpDd2djbVZuWVhKa2JHVnpjeUJ2Wmx4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnZDJobGRHaGxjaUIzWlNCMWMyVWdhWFF1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmphR0Z1Ym1Wc0xuQnZjblF5TG5CdmMzUk5aWE56WVdkbEtEQXBPMXh1SUNBZ0lDQWdJQ0I5TzF4dUlDQWdJQ0FnSUNCeVpYRjFaWE4wVkdsamF5QTlJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSE5sZEZScGJXVnZkWFFvWm14MWMyZ3NJREFwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ4ZFdWemRGQnZjblJVYVdOcktDazdYRzRnSUNBZ0lDQWdJSDA3WEc1Y2JpQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0F2THlCdmJHUWdZbkp2ZDNObGNuTmNiaUFnSUNBZ0lDQWdjbVZ4ZFdWemRGUnBZMnNnUFNCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCelpYUlVhVzFsYjNWMEtHWnNkWE5vTENBd0tUdGNiaUFnSUNBZ0lDQWdmVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnlaWFIxY200Z2JtVjRkRlJwWTJzN1hHNTlLU2dwTzF4dVhHNHZMeUJCZEhSbGJYQjBJSFJ2SUcxaGEyVWdaMlZ1WlhKcFkzTWdjMkZtWlNCcGJpQjBhR1VnWm1GalpTQnZaaUJrYjNkdWMzUnlaV0Z0WEc0dkx5QnRiMlJwWm1sallYUnBiMjV6TGx4dUx5OGdWR2hsY21VZ2FYTWdibThnYzJsMGRXRjBhVzl1SUhkb1pYSmxJSFJvYVhNZ2FYTWdibVZqWlhOellYSjVMbHh1THk4Z1NXWWdlVzkxSUc1bFpXUWdZU0J6WldOMWNtbDBlU0JuZFdGeVlXNTBaV1VzSUhSb1pYTmxJSEJ5YVcxdmNtUnBZV3h6SUc1bFpXUWdkRzhnWW1WY2JpOHZJR1JsWlhCc2VTQm1jbTk2Wlc0Z1lXNTVkMkY1TENCaGJtUWdhV1lnZVc5MUlHUnZidUtBbVhRZ2JtVmxaQ0JoSUhObFkzVnlhWFI1SUdkMVlYSmhiblJsWlN4Y2JpOHZJSFJvYVhNZ2FYTWdhblZ6ZENCd2JHRnBiaUJ3WVhKaGJtOXBaQzVjYmk4dklFaHZkMlYyWlhJc0lIUm9hWE1nS2lwdGFXZG9kQ29xSUdoaGRtVWdkR2hsSUc1cFkyVWdjMmxrWlMxbFptWmxZM1FnYjJZZ2NtVmtkV05wYm1jZ2RHaGxJSE5wZW1VZ2IyWmNiaTh2SUhSb1pTQnRhVzVwWm1sbFpDQmpiMlJsSUdKNUlISmxaSFZqYVc1bklIZ3VZMkZzYkNncElIUnZJRzFsY21Wc2VTQjRLQ2xjYmk4dklGTmxaU0JOWVhKcklFMXBiR3hsY3VLQW1YTWdaWGh3YkdGdVlYUnBiMjRnYjJZZ2QyaGhkQ0IwYUdseklHUnZaWE11WEc0dkx5Qm9kSFJ3T2k4dmQybHJhUzVsWTIxaGMyTnlhWEIwTG05eVp5OWtiMnQxTG5Cb2NEOXBaRDFqYjI1MlpXNTBhVzl1Y3pwellXWmxYMjFsZEdGZmNISnZaM0poYlcxcGJtZGNiblpoY2lCallXeHNJRDBnUm5WdVkzUnBiMjR1WTJGc2JEdGNibVoxYm1OMGFXOXVJSFZ1WTNWeWNubFVhR2x6S0dZcElIdGNiaUFnSUNCeVpYUjFjbTRnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1kyRnNiQzVoY0hCc2VTaG1MQ0JoY21kMWJXVnVkSE1wTzF4dUlDQWdJSDA3WEc1OVhHNHZMeUJVYUdseklHbHpJR1Z4ZFdsMllXeGxiblFzSUdKMWRDQnpiRzkzWlhJNlhHNHZMeUIxYm1OMWNuSjVWR2hwY3lBOUlFWjFibU4wYVc5dVgySnBibVF1WW1sdVpDaEdkVzVqZEdsdmJsOWlhVzVrTG1OaGJHd3BPMXh1THk4Z2FIUjBjRG92TDJwemNHVnlaaTVqYjIwdmRXNWpkWEp5ZVhSb2FYTmNibHh1ZG1GeUlHRnljbUY1WDNOc2FXTmxJRDBnZFc1amRYSnllVlJvYVhNb1FYSnlZWGt1Y0hKdmRHOTBlWEJsTG5Oc2FXTmxLVHRjYmx4dWRtRnlJR0Z5Y21GNVgzSmxaSFZqWlNBOUlIVnVZM1Z5Y25sVWFHbHpLRnh1SUNBZ0lFRnljbUY1TG5CeWIzUnZkSGx3WlM1eVpXUjFZMlVnZkh3Z1puVnVZM1JwYjI0Z0tHTmhiR3hpWVdOckxDQmlZWE5wY3lrZ2UxeHVJQ0FnSUNBZ0lDQjJZWElnYVc1a1pYZ2dQU0F3TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdiR1Z1WjNSb0lEMGdkR2hwY3k1c1pXNW5kR2c3WEc0Z0lDQWdJQ0FnSUM4dklHTnZibU5sY201cGJtY2dkR2hsSUdsdWFYUnBZV3dnZG1Gc2RXVXNJR2xtSUc5dVpTQnBjeUJ1YjNRZ2NISnZkbWxrWldSY2JpQWdJQ0FnSUNBZ2FXWWdLR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZ2dQVDA5SURFcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklITmxaV3NnZEc4Z2RHaGxJR1pwY25OMElIWmhiSFZsSUdsdUlIUm9aU0JoY25KaGVTd2dZV05qYjNWdWRHbHVaMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdabTl5SUhSb1pTQndiM056YVdKcGJHbDBlU0IwYUdGMElHbHpJR2x6SUdFZ2MzQmhjbk5sSUdGeWNtRjVYRzRnSUNBZ0lDQWdJQ0FnSUNCa2J5QjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0dsdVpHVjRJR2x1SUhSb2FYTXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1ltRnphWE1nUFNCMGFHbHpXMmx1WkdWNEt5dGRPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDc3JhVzVrWlhnZ1BqMGdiR1Z1WjNSb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOUlIZG9hV3hsSUNneEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0F2THlCeVpXUjFZMlZjYmlBZ0lDQWdJQ0FnWm05eUlDZzdJR2x1WkdWNElEd2diR1Z1WjNSb095QnBibVJsZUNzcktTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QmhZMk52ZFc1MElHWnZjaUIwYUdVZ2NHOXpjMmxpYVd4cGRIa2dkR2hoZENCMGFHVWdZWEp5WVhrZ2FYTWdjM0JoY25ObFhHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2FXNWtaWGdnYVc0Z2RHaHBjeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdKaGMybHpJRDBnWTJGc2JHSmhZMnNvWW1GemFYTXNJSFJvYVhOYmFXNWtaWGhkTENCcGJtUmxlQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR0poYzJsek8xeHVJQ0FnSUgxY2JpazdYRzVjYm5aaGNpQmhjbkpoZVY5cGJtUmxlRTltSUQwZ2RXNWpkWEp5ZVZSb2FYTW9YRzRnSUNBZ1FYSnlZWGt1Y0hKdmRHOTBlWEJsTG1sdVpHVjRUMllnZkh3Z1puVnVZM1JwYjI0Z0tIWmhiSFZsS1NCN1hHNGdJQ0FnSUNBZ0lDOHZJRzV2ZENCaElIWmxjbmtnWjI5dlpDQnphR2x0TENCaWRYUWdaMjl2WkNCbGJtOTFaMmdnWm05eUlHOTFjaUJ2Ym1VZ2RYTmxJRzltSUdsMFhHNGdJQ0FnSUNBZ0lHWnZjaUFvZG1GeUlHa2dQU0F3T3lCcElEd2dkR2hwY3k1c1pXNW5kR2c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSFJvYVhOYmFWMGdQVDA5SUhaaGJIVmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJR2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJQzB4TzF4dUlDQWdJSDFjYmlrN1hHNWNiblpoY2lCaGNuSmhlVjl0WVhBZ1BTQjFibU4xY25KNVZHaHBjeWhjYmlBZ0lDQkJjbkpoZVM1d2NtOTBiM1I1Y0dVdWJXRndJSHg4SUdaMWJtTjBhVzl1SUNoallXeHNZbUZqYXl3Z2RHaHBjM0FwSUh0Y2JpQWdJQ0FnSUNBZ2RtRnlJSE5sYkdZZ1BTQjBhR2x6TzF4dUlDQWdJQ0FnSUNCMllYSWdZMjlzYkdWamRDQTlJRnRkTzF4dUlDQWdJQ0FnSUNCaGNuSmhlVjl5WldSMVkyVW9jMlZzWml3Z1puVnVZM1JwYjI0Z0tIVnVaR1ZtYVc1bFpDd2dkbUZzZFdVc0lHbHVaR1Y0S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjJ4c1pXTjBMbkIxYzJnb1kyRnNiR0poWTJzdVkyRnNiQ2gwYUdsemNDd2dkbUZzZFdVc0lHbHVaR1Y0TENCelpXeG1LU2s3WEc0Z0lDQWdJQ0FnSUgwc0lIWnZhV1FnTUNrN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCamIyeHNaV04wTzF4dUlDQWdJSDFjYmlrN1hHNWNiblpoY2lCdlltcGxZM1JmWTNKbFlYUmxJRDBnVDJKcVpXTjBMbU55WldGMFpTQjhmQ0JtZFc1amRHbHZiaUFvY0hKdmRHOTBlWEJsS1NCN1hHNGdJQ0FnWm5WdVkzUnBiMjRnVkhsd1pTZ3BJSHNnZlZ4dUlDQWdJRlI1Y0dVdWNISnZkRzkwZVhCbElEMGdjSEp2ZEc5MGVYQmxPMXh1SUNBZ0lISmxkSFZ5YmlCdVpYY2dWSGx3WlNncE8xeHVmVHRjYmx4dWRtRnlJRzlpYW1WamRGOW9ZWE5QZDI1UWNtOXdaWEowZVNBOUlIVnVZM1Z5Y25sVWFHbHpLRTlpYW1WamRDNXdjbTkwYjNSNWNHVXVhR0Z6VDNkdVVISnZjR1Z5ZEhrcE8xeHVYRzUyWVhJZ2IySnFaV04wWDJ0bGVYTWdQU0JQWW1wbFkzUXVhMlY1Y3lCOGZDQm1kVzVqZEdsdmJpQW9iMkpxWldOMEtTQjdYRzRnSUNBZ2RtRnlJR3RsZVhNZ1BTQmJYVHRjYmlBZ0lDQm1iM0lnS0haaGNpQnJaWGtnYVc0Z2IySnFaV04wS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h2WW1wbFkzUmZhR0Z6VDNkdVVISnZjR1Z5ZEhrb2IySnFaV04wTENCclpYa3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnJaWGx6TG5CMWMyZ29hMlY1S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdJQ0J5WlhSMWNtNGdhMlY1Y3p0Y2JuMDdYRzVjYm5aaGNpQnZZbXBsWTNSZmRHOVRkSEpwYm1jZ1BTQjFibU4xY25KNVZHaHBjeWhQWW1wbFkzUXVjSEp2ZEc5MGVYQmxMblJ2VTNSeWFXNW5LVHRjYmx4dVpuVnVZM1JwYjI0Z2FYTlBZbXBsWTNRb2RtRnNkV1VwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkbUZzZFdVZ1BUMDlJRTlpYW1WamRDaDJZV3gxWlNrN1hHNTlYRzVjYmk4dklHZGxibVZ5WVhSdmNpQnlaV3hoZEdWa0lITm9hVzF6WEc1Y2JpOHZJRVpKV0UxRk9pQlNaVzF2ZG1VZ2RHaHBjeUJtZFc1amRHbHZiaUJ2Ym1ObElFVlROaUJuWlc1bGNtRjBiM0p6SUdGeVpTQnBiaUJUY0dsa1pYSk5iMjVyWlhrdVhHNW1kVzVqZEdsdmJpQnBjMU4wYjNCSmRHVnlZWFJwYjI0b1pYaGpaWEIwYVc5dUtTQjdYRzRnSUNBZ2NtVjBkWEp1SUNoY2JpQWdJQ0FnSUNBZ2IySnFaV04wWDNSdlUzUnlhVzVuS0dWNFkyVndkR2x2YmlrZ1BUMDlJRndpVzI5aWFtVmpkQ0JUZEc5d1NYUmxjbUYwYVc5dVhWd2lJSHg4WEc0Z0lDQWdJQ0FnSUdWNFkyVndkR2x2YmlCcGJuTjBZVzVqWlc5bUlGRlNaWFIxY201V1lXeDFaVnh1SUNBZ0lDazdYRzU5WEc1Y2JpOHZJRVpKV0UxRk9pQlNaVzF2ZG1VZ2RHaHBjeUJvWld4d1pYSWdZVzVrSUZFdWNtVjBkWEp1SUc5dVkyVWdSVk0ySUdkbGJtVnlZWFJ2Y25NZ1lYSmxJR2x1WEc0dkx5QlRjR2xrWlhKTmIyNXJaWGt1WEc1MllYSWdVVkpsZEhWeWJsWmhiSFZsTzF4dWFXWWdLSFI1Y0dWdlppQlNaWFIxY201V1lXeDFaU0FoUFQwZ1hDSjFibVJsWm1sdVpXUmNJaWtnZTF4dUlDQWdJRkZTWlhSMWNtNVdZV3gxWlNBOUlGSmxkSFZ5YmxaaGJIVmxPMXh1ZlNCbGJITmxJSHRjYmlBZ0lDQlJVbVYwZFhKdVZtRnNkV1VnUFNCbWRXNWpkR2x2YmlBb2RtRnNkV1VwSUh0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTUyWVd4MVpTQTlJSFpoYkhWbE8xeHVJQ0FnSUgwN1hHNTlYRzVjYmk4dklHeHZibWNnYzNSaFkyc2dkSEpoWTJWelhHNWNiblpoY2lCVFZFRkRTMTlLVlUxUVgxTkZVRUZTUVZSUFVpQTlJRndpUm5KdmJTQndjbVYyYVc5MWN5QmxkbVZ1ZERwY0lqdGNibHh1Wm5WdVkzUnBiMjRnYldGclpWTjBZV05yVkhKaFkyVk1iMjVuS0dWeWNtOXlMQ0J3Y205dGFYTmxLU0I3WEc0Z0lDQWdMeThnU1dZZ2NHOXpjMmxpYkdVc0lIUnlZVzV6Wm05eWJTQjBhR1VnWlhKeWIzSWdjM1JoWTJzZ2RISmhZMlVnWW5rZ2NtVnRiM1pwYm1jZ1RtOWtaU0JoYm1RZ1VWeHVJQ0FnSUM4dklHTnlkV1owTENCMGFHVnVJR052Ym1OaGRHVnVZWFJwYm1jZ2QybDBhQ0IwYUdVZ2MzUmhZMnNnZEhKaFkyVWdiMllnWUhCeWIyMXBjMlZnTGlCVFpXVWdJelUzTGx4dUlDQWdJR2xtSUNob1lYTlRkR0ZqYTNNZ0ppWmNiaUFnSUNBZ0lDQWdjSEp2YldselpTNXpkR0ZqYXlBbUpseHVJQ0FnSUNBZ0lDQjBlWEJsYjJZZ1pYSnliM0lnUFQwOUlGd2liMkpxWldOMFhDSWdKaVpjYmlBZ0lDQWdJQ0FnWlhKeWIzSWdJVDA5SUc1MWJHd2dKaVpjYmlBZ0lDQWdJQ0FnWlhKeWIzSXVjM1JoWTJzZ0ppWmNiaUFnSUNBZ0lDQWdaWEp5YjNJdWMzUmhZMnN1YVc1a1pYaFBaaWhUVkVGRFMxOUtWVTFRWDFORlVFRlNRVlJQVWlrZ1BUMDlJQzB4WEc0Z0lDQWdLU0I3WEc0Z0lDQWdJQ0FnSUhaaGNpQnpkR0ZqYTNNZ1BTQmJYVHRjYmlBZ0lDQWdJQ0FnWm05eUlDaDJZWElnY0NBOUlIQnliMjFwYzJVN0lDRWhjRHNnY0NBOUlIQXVjMjkxY21ObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9jQzV6ZEdGamF5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVdOcmN5NTFibk5vYVdaMEtIQXVjM1JoWTJzcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lITjBZV05yY3k1MWJuTm9hV1owS0dWeWNtOXlMbk4wWVdOcktUdGNibHh1SUNBZ0lDQWdJQ0IyWVhJZ1kyOXVZMkYwWldSVGRHRmphM01nUFNCemRHRmphM011YW05cGJpaGNJbHhjYmx3aUlDc2dVMVJCUTB0ZlNsVk5VRjlUUlZCQlVrRlVUMUlnS3lCY0lseGNibHdpS1R0Y2JpQWdJQ0FnSUNBZ1pYSnliM0l1YzNSaFkyc2dQU0JtYVd4MFpYSlRkR0ZqYTFOMGNtbHVaeWhqYjI1allYUmxaRk4wWVdOcmN5azdYRzRnSUNBZ2ZWeHVmVnh1WEc1bWRXNWpkR2x2YmlCbWFXeDBaWEpUZEdGamExTjBjbWx1WnloemRHRmphMU4wY21sdVp5a2dlMXh1SUNBZ0lIWmhjaUJzYVc1bGN5QTlJSE4wWVdOclUzUnlhVzVuTG5Od2JHbDBLRndpWEZ4dVhDSXBPMXh1SUNBZ0lIWmhjaUJrWlhOcGNtVmtUR2x1WlhNZ1BTQmJYVHRjYmlBZ0lDQm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR3hwYm1WekxteGxibWQwYURzZ0t5dHBLU0I3WEc0Z0lDQWdJQ0FnSUhaaGNpQnNhVzVsSUQwZ2JHbHVaWE5iYVYwN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0NGcGMwbHVkR1Z5Ym1Gc1JuSmhiV1VvYkdsdVpTa2dKaVlnSVdselRtOWtaVVp5WVcxbEtHeHBibVVwSUNZbUlHeHBibVVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1JsYzJseVpXUk1hVzVsY3k1d2RYTm9LR3hwYm1VcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVJQ0FnSUhKbGRIVnliaUJrWlhOcGNtVmtUR2x1WlhNdWFtOXBiaWhjSWx4Y2Jsd2lLVHRjYm4xY2JseHVablZ1WTNScGIyNGdhWE5PYjJSbFJuSmhiV1VvYzNSaFkydE1hVzVsS1NCN1hHNGdJQ0FnY21WMGRYSnVJSE4wWVdOclRHbHVaUzVwYm1SbGVFOW1LRndpS0cxdlpIVnNaUzVxY3pwY0lpa2dJVDA5SUMweElIeDhYRzRnSUNBZ0lDQWdJQ0FnSUhOMFlXTnJUR2x1WlM1cGJtUmxlRTltS0Z3aUtHNXZaR1V1YW5NNlhDSXBJQ0U5UFNBdE1UdGNibjFjYmx4dVpuVnVZM1JwYjI0Z1oyVjBSbWxzWlU1aGJXVkJibVJNYVc1bFRuVnRZbVZ5S0hOMFlXTnJUR2x1WlNrZ2UxeHVJQ0FnSUM4dklFNWhiV1ZrSUdaMWJtTjBhVzl1Y3pvZ1hDSmhkQ0JtZFc1amRHbHZiazVoYldVZ0tHWnBiR1Z1WVcxbE9teHBibVZPZFcxaVpYSTZZMjlzZFcxdVRuVnRZbVZ5S1Z3aVhHNGdJQ0FnTHk4Z1NXNGdTVVV4TUNCbWRXNWpkR2x2YmlCdVlXMWxJR05oYmlCb1lYWmxJSE53WVdObGN5QW9YQ0pCYm05dWVXMXZkWE1nWm5WdVkzUnBiMjVjSWlrZ1QxOXZYRzRnSUNBZ2RtRnlJR0YwZEdWdGNIUXhJRDBnTDJGMElDNHJJRnhjS0NndUt5azZLRnhjWkNzcE9pZy9PbHhjWkNzcFhGd3BKQzh1WlhobFl5aHpkR0ZqYTB4cGJtVXBPMXh1SUNBZ0lHbG1JQ2hoZEhSbGJYQjBNU2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnVzJGMGRHVnRjSFF4V3pGZExDQk9kVzFpWlhJb1lYUjBaVzF3ZERGYk1sMHBYVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZMeUJCYm05dWVXMXZkWE1nWm5WdVkzUnBiMjV6T2lCY0ltRjBJR1pwYkdWdVlXMWxPbXhwYm1WT2RXMWlaWEk2WTI5c2RXMXVUblZ0WW1WeVhDSmNiaUFnSUNCMllYSWdZWFIwWlcxd2RESWdQU0F2WVhRZ0tGdGVJRjByS1Rvb1hGeGtLeWs2S0Q4NlhGeGtLeWtrTHk1bGVHVmpLSE4wWVdOclRHbHVaU2s3WEc0Z0lDQWdhV1lnS0dGMGRHVnRjSFF5S1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCYllYUjBaVzF3ZERKYk1WMHNJRTUxYldKbGNpaGhkSFJsYlhCME1sc3lYU2xkTzF4dUlDQWdJSDFjYmx4dUlDQWdJQzh2SUVacGNtVm1iM2dnYzNSNWJHVTZJRndpWm5WdVkzUnBiMjVBWm1sc1pXNWhiV1U2YkdsdVpVNTFiV0psY2lCdmNpQkFabWxzWlc1aGJXVTZiR2x1WlU1MWJXSmxjbHdpWEc0Z0lDQWdkbUZ5SUdGMGRHVnRjSFF6SUQwZ0x5NHFRQ2d1S3lrNktGeGNaQ3NwSkM4dVpYaGxZeWh6ZEdGamEweHBibVVwTzF4dUlDQWdJR2xtSUNoaGRIUmxiWEIwTXlrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1cyRjBkR1Z0Y0hReld6RmRMQ0JPZFcxaVpYSW9ZWFIwWlcxd2RETmJNbDBwWFR0Y2JpQWdJQ0I5WEc1OVhHNWNibVoxYm1OMGFXOXVJR2x6U1c1MFpYSnVZV3hHY21GdFpTaHpkR0ZqYTB4cGJtVXBJSHRjYmlBZ0lDQjJZWElnWm1sc1pVNWhiV1ZCYm1STWFXNWxUblZ0WW1WeUlEMGdaMlYwUm1sc1pVNWhiV1ZCYm1STWFXNWxUblZ0WW1WeUtITjBZV05yVEdsdVpTazdYRzVjYmlBZ0lDQnBaaUFvSVdacGJHVk9ZVzFsUVc1a1RHbHVaVTUxYldKbGNpa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnZG1GeUlHWnBiR1ZPWVcxbElEMGdabWxzWlU1aGJXVkJibVJNYVc1bFRuVnRZbVZ5V3pCZE8xeHVJQ0FnSUhaaGNpQnNhVzVsVG5WdFltVnlJRDBnWm1sc1pVNWhiV1ZCYm1STWFXNWxUblZ0WW1WeVd6RmRPMXh1WEc0Z0lDQWdjbVYwZFhKdUlHWnBiR1ZPWVcxbElEMDlQU0J4Um1sc1pVNWhiV1VnSmlaY2JpQWdJQ0FnSUNBZ2JHbHVaVTUxYldKbGNpQStQU0J4VTNSaGNuUnBibWRNYVc1bElDWW1YRzRnSUNBZ0lDQWdJR3hwYm1WT2RXMWlaWElnUEQwZ2NVVnVaR2x1WjB4cGJtVTdYRzU5WEc1Y2JpOHZJR1JwYzJOdmRtVnlJRzkzYmlCbWFXeGxJRzVoYldVZ1lXNWtJR3hwYm1VZ2JuVnRZbVZ5SUhKaGJtZGxJR1p2Y2lCbWFXeDBaWEpwYm1jZ2MzUmhZMnRjYmk4dklIUnlZV05sYzF4dVpuVnVZM1JwYjI0Z1kyRndkSFZ5WlV4cGJtVW9LU0I3WEc0Z0lDQWdhV1lnS0NGb1lYTlRkR0ZqYTNNcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdU8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhSeWVTQjdYRzRnSUNBZ0lDQWdJSFJvY205M0lHNWxkeUJGY25KdmNpZ3BPMXh1SUNBZ0lIMGdZMkYwWTJnZ0tHVXBJSHRjYmlBZ0lDQWdJQ0FnZG1GeUlHeHBibVZ6SUQwZ1pTNXpkR0ZqYXk1emNHeHBkQ2hjSWx4Y2Jsd2lLVHRjYmlBZ0lDQWdJQ0FnZG1GeUlHWnBjbk4wVEdsdVpTQTlJR3hwYm1Weld6QmRMbWx1WkdWNFQyWW9YQ0pBWENJcElENGdNQ0EvSUd4cGJtVnpXekZkSURvZ2JHbHVaWE5iTWwwN1hHNGdJQ0FnSUNBZ0lIWmhjaUJtYVd4bFRtRnRaVUZ1WkV4cGJtVk9kVzFpWlhJZ1BTQm5aWFJHYVd4bFRtRnRaVUZ1WkV4cGJtVk9kVzFpWlhJb1ptbHljM1JNYVc1bEtUdGNiaUFnSUNBZ0lDQWdhV1lnS0NGbWFXeGxUbUZ0WlVGdVpFeHBibVZPZFcxaVpYSXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5Ymp0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSEZHYVd4bFRtRnRaU0E5SUdacGJHVk9ZVzFsUVc1a1RHbHVaVTUxYldKbGNsc3dYVHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR1pwYkdWT1lXMWxRVzVrVEdsdVpVNTFiV0psY2xzeFhUdGNiaUFnSUNCOVhHNTlYRzVjYm1aMWJtTjBhVzl1SUdSbGNISmxZMkYwWlNoallXeHNZbUZqYXl3Z2JtRnRaU3dnWVd4MFpYSnVZWFJwZG1VcElIdGNiaUFnSUNCeVpYUjFjbTRnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvZEhsd1pXOW1JR052Ym5OdmJHVWdJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdKaVpjYmlBZ0lDQWdJQ0FnSUNBZ0lIUjVjR1Z2WmlCamIyNXpiMnhsTG5kaGNtNGdQVDA5SUZ3aVpuVnVZM1JwYjI1Y0lpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjMjlzWlM1M1lYSnVLRzVoYldVZ0t5QmNJaUJwY3lCa1pYQnlaV05oZEdWa0xDQjFjMlVnWENJZ0t5QmhiSFJsY201aGRHbDJaU0FyWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWENJZ2FXNXpkR1ZoWkM1Y0lpd2dibVYzSUVWeWNtOXlLRndpWENJcExuTjBZV05yS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1kyRnNiR0poWTJzdVlYQndiSGtvWTJGc2JHSmhZMnNzSUdGeVozVnRaVzUwY3lrN1hHNGdJQ0FnZlR0Y2JuMWNibHh1THk4Z1pXNWtJRzltSUhOb2FXMXpYRzR2THlCaVpXZHBibTVwYm1jZ2IyWWdjbVZoYkNCM2IzSnJYRzVjYmk4cUtseHVJQ29nUTI5dWMzUnlkV04wY3lCaElIQnliMjFwYzJVZ1ptOXlJR0Z1SUdsdGJXVmthV0YwWlNCeVpXWmxjbVZ1WTJVc0lIQmhjM05sY3lCd2NtOXRhWE5sY3lCMGFISnZkV2RvTENCdmNseHVJQ29nWTI5bGNtTmxjeUJ3Y205dGFYTmxjeUJtY205dElHUnBabVpsY21WdWRDQnplWE4wWlcxekxseHVJQ29nUUhCaGNtRnRJSFpoYkhWbElHbHRiV1ZrYVdGMFpTQnlaV1psY21WdVkyVWdiM0lnY0hKdmJXbHpaVnh1SUNvdlhHNW1kVzVqZEdsdmJpQlJLSFpoYkhWbEtTQjdYRzRnSUNBZ0x5OGdTV1lnZEdobElHOWlhbVZqZENCcGN5QmhiSEpsWVdSNUlHRWdVSEp2YldselpTd2djbVYwZFhKdUlHbDBJR1JwY21WamRHeDVMaUFnVkdocGN5QmxibUZpYkdWelhHNGdJQ0FnTHk4Z2RHaGxJSEpsYzI5c2RtVWdablZ1WTNScGIyNGdkRzhnWW05MGFDQmlaU0IxYzJWa0lIUnZJR055WldGMFpXUWdjbVZtWlhKbGJtTmxjeUJtY205dElHOWlhbVZqZEhNc1hHNGdJQ0FnTHk4Z1luVjBJSFJ2SUhSdmJHVnlZV0pzZVNCamIyVnlZMlVnYm05dUxYQnliMjFwYzJWeklIUnZJSEJ5YjIxcGMyVnpMbHh1SUNBZ0lHbG1JQ2gyWVd4MVpTQnBibk4wWVc1alpXOW1JRkJ5YjIxcGMyVXBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFpoYkhWbE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4dklHRnpjMmx0YVd4aGRHVWdkR2hsYm1GaWJHVnpYRzRnSUNBZ2FXWWdLR2x6VUhKdmJXbHpaVUZzYVd0bEtIWmhiSFZsS1NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1kyOWxjbU5sS0haaGJIVmxLVHRjYmlBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1puVnNabWxzYkNoMllXeDFaU2s3WEc0Z0lDQWdmVnh1ZlZ4dVVTNXlaWE52YkhabElEMGdVVHRjYmx4dUx5b3FYRzRnS2lCUVpYSm1iM0p0Y3lCaElIUmhjMnNnYVc0Z1lTQm1kWFIxY21VZ2RIVnliaUJ2WmlCMGFHVWdaWFpsYm5RZ2JHOXZjQzVjYmlBcUlFQndZWEpoYlNCN1JuVnVZM1JwYjI1OUlIUmhjMnRjYmlBcUwxeHVVUzV1WlhoMFZHbGpheUE5SUc1bGVIUlVhV05yTzF4dVhHNHZLaXBjYmlBcUlFTnZiblJ5YjJ4eklIZG9aWFJvWlhJZ2IzSWdibTkwSUd4dmJtY2djM1JoWTJzZ2RISmhZMlZ6SUhkcGJHd2dZbVVnYjI1Y2JpQXFMMXh1VVM1c2IyNW5VM1JoWTJ0VGRYQndiM0owSUQwZ1ptRnNjMlU3WEc1Y2JpOHZJR1Z1WVdKc1pTQnNiMjVuSUhOMFlXTnJjeUJwWmlCUlgwUkZRbFZISUdseklITmxkRnh1YVdZZ0tIUjVjR1Z2WmlCd2NtOWpaWE56SUQwOVBTQmNJbTlpYW1WamRGd2lJQ1ltSUhCeWIyTmxjM01nSmlZZ2NISnZZMlZ6Y3k1bGJuWWdKaVlnY0hKdlkyVnpjeTVsYm5ZdVVWOUVSVUpWUnlrZ2UxeHVJQ0FnSUZFdWJHOXVaMU4wWVdOclUzVndjRzl5ZENBOUlIUnlkV1U3WEc1OVhHNWNiaThxS2x4dUlDb2dRMjl1YzNSeWRXTjBjeUJoSUh0d2NtOXRhWE5sTENCeVpYTnZiSFpsTENCeVpXcGxZM1I5SUc5aWFtVmpkQzVjYmlBcVhHNGdLaUJnY21WemIyeDJaV0FnYVhNZ1lTQmpZV3hzWW1GamF5QjBieUJwYm5admEyVWdkMmwwYUNCaElHMXZjbVVnY21WemIyeDJaV1FnZG1Gc2RXVWdabTl5SUhSb1pWeHVJQ29nY0hKdmJXbHpaUzRnVkc4Z1puVnNabWxzYkNCMGFHVWdjSEp2YldselpTd2dhVzUyYjJ0bElHQnlaWE52YkhabFlDQjNhWFJvSUdGdWVTQjJZV3gxWlNCMGFHRjBJR2x6WEc0Z0tpQnViM1FnWVNCMGFHVnVZV0pzWlM0Z1ZHOGdjbVZxWldOMElIUm9aU0J3Y205dGFYTmxMQ0JwYm5admEyVWdZSEpsYzI5c2RtVmdJSGRwZEdnZ1lTQnlaV3BsWTNSbFpGeHVJQ29nZEdobGJtRmliR1VzSUc5eUlHbHVkbTlyWlNCZ2NtVnFaV04wWUNCM2FYUm9JSFJvWlNCeVpXRnpiMjRnWkdseVpXTjBiSGt1SUZSdklISmxjMjlzZG1VZ2RHaGxYRzRnS2lCd2NtOXRhWE5sSUhSdklHRnViM1JvWlhJZ2RHaGxibUZpYkdVc0lIUm9kWE1nY0hWMGRHbHVaeUJwZENCcGJpQjBhR1VnYzJGdFpTQnpkR0YwWlN3Z2FXNTJiMnRsWEc0Z0tpQmdjbVZ6YjJ4MlpXQWdkMmwwYUNCMGFHRjBJRzkwYUdWeUlIUm9aVzVoWW14bExseHVJQ292WEc1UkxtUmxabVZ5SUQwZ1pHVm1aWEk3WEc1bWRXNWpkR2x2YmlCa1pXWmxjaWdwSUh0Y2JpQWdJQ0F2THlCcFppQmNJbTFsYzNOaFoyVnpYQ0lnYVhNZ1lXNGdYQ0pCY25KaGVWd2lMQ0IwYUdGMElHbHVaR2xqWVhSbGN5QjBhR0YwSUhSb1pTQndjbTl0YVhObElHaGhjeUJ1YjNRZ2VXVjBYRzRnSUNBZ0x5OGdZbVZsYmlCeVpYTnZiSFpsWkM0Z0lFbG1JR2wwSUdseklGd2lkVzVrWldacGJtVmtYQ0lzSUdsMElHaGhjeUJpWldWdUlISmxjMjlzZG1Wa0xpQWdSV0ZqYUZ4dUlDQWdJQzh2SUdWc1pXMWxiblFnYjJZZ2RHaGxJRzFsYzNOaFoyVnpJR0Z5Y21GNUlHbHpJR2wwYzJWc1ppQmhiaUJoY25KaGVTQnZaaUJqYjIxd2JHVjBaU0JoY21kMWJXVnVkSE1nZEc5Y2JpQWdJQ0F2THlCbWIzSjNZWEprSUhSdklIUm9aU0J5WlhOdmJIWmxaQ0J3Y205dGFYTmxMaUFnVjJVZ1kyOWxjbU5sSUhSb1pTQnlaWE52YkhWMGFXOXVJSFpoYkhWbElIUnZJR0ZjYmlBZ0lDQXZMeUJ3Y205dGFYTmxJSFZ6YVc1bklIUm9aU0JnY21WemIyeDJaV0FnWm5WdVkzUnBiMjRnWW1WallYVnpaU0JwZENCb1lXNWtiR1Z6SUdKdmRHZ2dablZzYkhsY2JpQWdJQ0F2THlCdWIyNHRkR2hsYm1GaWJHVWdkbUZzZFdWeklHRnVaQ0J2ZEdobGNpQjBhR1Z1WVdKc1pYTWdaM0poWTJWbWRXeHNlUzVjYmlBZ0lDQjJZWElnYldWemMyRm5aWE1nUFNCYlhTd2djSEp2WjNKbGMzTk1hWE4wWlc1bGNuTWdQU0JiWFN3Z2NtVnpiMngyWldSUWNtOXRhWE5sTzF4dVhHNGdJQ0FnZG1GeUlHUmxabVZ5Y21Wa0lEMGdiMkpxWldOMFgyTnlaV0YwWlNoa1pXWmxjaTV3Y205MGIzUjVjR1VwTzF4dUlDQWdJSFpoY2lCd2NtOXRhWE5sSUQwZ2IySnFaV04wWDJOeVpXRjBaU2hRY205dGFYTmxMbkJ5YjNSdmRIbHdaU2s3WEc1Y2JpQWdJQ0J3Y205dGFYTmxMbkJ5YjIxcGMyVkVhWE53WVhSamFDQTlJR1oxYm1OMGFXOXVJQ2h5WlhOdmJIWmxMQ0J2Y0N3Z2IzQmxjbUZ1WkhNcElIdGNiaUFnSUNBZ0lDQWdkbUZ5SUdGeVozTWdQU0JoY25KaGVWOXpiR2xqWlNoaGNtZDFiV1Z1ZEhNcE8xeHVJQ0FnSUNBZ0lDQnBaaUFvYldWemMyRm5aWE1wSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRzFsYzNOaFoyVnpMbkIxYzJnb1lYSm5jeWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvYjNBZ1BUMDlJRndpZDJobGJsd2lJQ1ltSUc5d1pYSmhibVJ6V3pGZEtTQjdJQzh2SUhCeWIyZHlaWE56SUc5d1pYSmhibVJjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3Y205bmNtVnpjMHhwYzNSbGJtVnljeTV3ZFhOb0tHOXdaWEpoYm1Seld6RmRLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUZFdWJtVjRkRlJwWTJzb1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVmtVSEp2YldselpTNXdjbTl0YVhObFJHbHpjR0YwWTJndVlYQndiSGtvY21WemIyeDJaV1JRY205dGFYTmxMQ0JoY21kektUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lDOHZJRmhZV0NCa1pYQnlaV05oZEdWa1hHNGdJQ0FnY0hKdmJXbHpaUzUyWVd4MVpVOW1JRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYldWemMyRm5aWE1wSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQndjbTl0YVhObE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSFpoY2lCdVpXRnlaWEpXWVd4MVpTQTlJRzVsWVhKbGNpaHlaWE52YkhabFpGQnliMjFwYzJVcE8xeHVJQ0FnSUNBZ0lDQnBaaUFvYVhOUWNtOXRhWE5sS0c1bFlYSmxjbFpoYkhWbEtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnpiMngyWldSUWNtOXRhWE5sSUQwZ2JtVmhjbVZ5Vm1Gc2RXVTdJQzh2SUhOb2IzSjBaVzRnWTJoaGFXNWNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdibVZoY21WeVZtRnNkV1U3WEc0Z0lDQWdmVHRjYmx4dUlDQWdJSEJ5YjIxcGMyVXVhVzV6Y0dWamRDQTlJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLQ0Z5WlhOdmJIWmxaRkJ5YjIxcGMyVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCN0lITjBZWFJsT2lCY0luQmxibVJwYm1kY0lpQjlPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ5WlhOdmJIWmxaRkJ5YjIxcGMyVXVhVzV6Y0dWamRDZ3BPMXh1SUNBZ0lIMDdYRzVjYmlBZ0lDQnBaaUFvVVM1c2IyNW5VM1JoWTJ0VGRYQndiM0owSUNZbUlHaGhjMU4wWVdOcmN5a2dlMXh1SUNBZ0lDQWdJQ0IwY25rZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVWeWNtOXlLQ2s3WEc0Z0lDQWdJQ0FnSUgwZ1kyRjBZMmdnS0dVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklFNVBWRVU2SUdSdmJpZDBJSFJ5ZVNCMGJ5QjFjMlVnWUVWeWNtOXlMbU5oY0hSMWNtVlRkR0ZqYTFSeVlXTmxZQ0J2Y2lCMGNtRnVjMlpsY2lCMGFHVmNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklHRmpZMlZ6YzI5eUlHRnliM1Z1WkRzZ2RHaGhkQ0JqWVhWelpYTWdiV1Z0YjNKNUlHeGxZV3R6SUdGeklIQmxjaUJIU0MweE1URXVJRXAxYzNSY2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUhKbGFXWjVJSFJvWlNCemRHRmpheUIwY21GalpTQmhjeUJoSUhOMGNtbHVaeUJCVTBGUUxseHVJQ0FnSUNBZ0lDQWdJQ0FnTHk5Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUVGMElIUm9aU0J6WVcxbElIUnBiV1VzSUdOMWRDQnZabVlnZEdobElHWnBjbk4wSUd4cGJtVTdJR2wwSjNNZ1lXeDNZWGx6SUdwMWMzUmNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklGd2lXMjlpYW1WamRDQlFjbTl0YVhObFhWeGNibHdpTENCaGN5QndaWElnZEdobElHQjBiMU4wY21sdVoyQXVYRzRnSUNBZ0lDQWdJQ0FnSUNCd2NtOXRhWE5sTG5OMFlXTnJJRDBnWlM1emRHRmpheTV6ZFdKemRISnBibWNvWlM1emRHRmpheTVwYm1SbGVFOW1LRndpWEZ4dVhDSXBJQ3NnTVNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNBdkx5Qk9UMVJGT2lCM1pTQmtieUIwYUdVZ1kyaGxZMnR6SUdadmNpQmdjbVZ6YjJ4MlpXUlFjbTl0YVhObFlDQnBiaUJsWVdOb0lHMWxkR2h2WkN3Z2FXNXpkR1ZoWkNCdlpseHVJQ0FnSUM4dklHTnZibk52Ykdsa1lYUnBibWNnZEdobGJTQnBiblJ2SUdCaVpXTnZiV1ZnTENCemFXNWpaU0J2ZEdobGNuZHBjMlVnZDJVblpDQmpjbVZoZEdVZ2JtVjNYRzRnSUNBZ0x5OGdjSEp2YldselpYTWdkMmwwYUNCMGFHVWdiR2x1WlhNZ1lHSmxZMjl0WlNoM2FHRjBaWFpsY2loMllXeDFaU2twWUM0Z1UyVmxJR1V1Wnk0Z1IwZ3RNalV5TGx4dVhHNGdJQ0FnWm5WdVkzUnBiMjRnWW1WamIyMWxLRzVsZDFCeWIyMXBjMlVwSUh0Y2JpQWdJQ0FnSUNBZ2NtVnpiMngyWldSUWNtOXRhWE5sSUQwZ2JtVjNVSEp2YldselpUdGNiaUFnSUNBZ0lDQWdjSEp2YldselpTNXpiM1Z5WTJVZ1BTQnVaWGRRY205dGFYTmxPMXh1WEc0Z0lDQWdJQ0FnSUdGeWNtRjVYM0psWkhWalpTaHRaWE56WVdkbGN5d2dablZ1WTNScGIyNGdLSFZ1WkdWbWFXNWxaQ3dnYldWemMyRm5aU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdVUzV1WlhoMFZHbGpheWhtZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2JtVjNVSEp2YldselpTNXdjbTl0YVhObFJHbHpjR0YwWTJndVlYQndiSGtvYm1WM1VISnZiV2x6WlN3Z2JXVnpjMkZuWlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0FnSUNBZ2ZTd2dkbTlwWkNBd0tUdGNibHh1SUNBZ0lDQWdJQ0J0WlhOellXZGxjeUE5SUhadmFXUWdNRHRjYmlBZ0lDQWdJQ0FnY0hKdlozSmxjM05NYVhOMFpXNWxjbk1nUFNCMmIybGtJREE3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdaR1ZtWlhKeVpXUXVjSEp2YldselpTQTlJSEJ5YjIxcGMyVTdYRzRnSUNBZ1pHVm1aWEp5WldRdWNtVnpiMngyWlNBOUlHWjFibU4wYVc5dUlDaDJZV3gxWlNrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvY21WemIyeDJaV1JRY205dGFYTmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200N1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JpWldOdmJXVW9VU2gyWVd4MVpTa3BPMXh1SUNBZ0lIMDdYRzVjYmlBZ0lDQmtaV1psY25KbFpDNW1kV3htYVd4c0lEMGdablZ1WTNScGIyNGdLSFpoYkhWbEtTQjdYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTnZiSFpsWkZCeWIyMXBjMlVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJqdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdKbFkyOXRaU2htZFd4bWFXeHNLSFpoYkhWbEtTazdYRzRnSUNBZ2ZUdGNiaUFnSUNCa1pXWmxjbkpsWkM1eVpXcGxZM1FnUFNCbWRXNWpkR2x2YmlBb2NtVmhjMjl1S1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h5WlhOdmJIWmxaRkJ5YjIxcGMyVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5Ymp0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR0psWTI5dFpTaHlaV3BsWTNRb2NtVmhjMjl1S1NrN1hHNGdJQ0FnZlR0Y2JpQWdJQ0JrWldabGNuSmxaQzV1YjNScFpua2dQU0JtZFc1amRHbHZiaUFvY0hKdlozSmxjM01wSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLSEpsYzI5c2RtVmtVSEp2YldselpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1TzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdZWEp5WVhsZmNtVmtkV05sS0hCeWIyZHlaWE56VEdsemRHVnVaWEp6TENCbWRXNWpkR2x2YmlBb2RXNWtaV1pwYm1Wa0xDQndjbTluY21WemMweHBjM1JsYm1WeUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCUkxtNWxlSFJVYVdOcktHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3Y205bmNtVnpjMHhwYzNSbGJtVnlLSEJ5YjJkeVpYTnpLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lDQWdJQ0I5TENCMmIybGtJREFwTzF4dUlDQWdJSDA3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdaR1ZtWlhKeVpXUTdYRzU5WEc1Y2JpOHFLbHh1SUNvZ1EzSmxZWFJsY3lCaElFNXZaR1V0YzNSNWJHVWdZMkZzYkdKaFkyc2dkR2hoZENCM2FXeHNJSEpsYzI5c2RtVWdiM0lnY21WcVpXTjBJSFJvWlNCa1pXWmxjbkpsWkZ4dUlDb2djSEp2YldselpTNWNiaUFxSUVCeVpYUjFjbTV6SUdFZ2JtOWtaV0poWTJ0Y2JpQXFMMXh1WkdWbVpYSXVjSEp2ZEc5MGVYQmxMbTFoYTJWT2IyUmxVbVZ6YjJ4MlpYSWdQU0JtZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnZG1GeUlITmxiR1lnUFNCMGFHbHpPMXh1SUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb1pYSnliM0lzSUhaaGJIVmxLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaGxjbkp2Y2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnYzJWc1ppNXlaV3BsWTNRb1pYSnliM0lwTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BpQXlLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnpaV3htTG5KbGMyOXNkbVVvWVhKeVlYbGZjMnhwWTJVb1lYSm5kVzFsYm5SekxDQXhLU2s3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnpaV3htTG5KbGMyOXNkbVVvZG1Gc2RXVXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVHRjYm4wN1hHNWNiaThxS2x4dUlDb2dRSEJoY21GdElISmxjMjlzZG1WeUlIdEdkVzVqZEdsdmJuMGdZU0JtZFc1amRHbHZiaUIwYUdGMElISmxkSFZ5Ym5NZ2JtOTBhR2x1WnlCaGJtUWdZV05qWlhCMGMxeHVJQ29nZEdobElISmxjMjlzZG1Vc0lISmxhbVZqZEN3Z1lXNWtJRzV2ZEdsbWVTQm1kVzVqZEdsdmJuTWdabTl5SUdFZ1pHVm1aWEp5WldRdVhHNGdLaUJBY21WMGRYSnVjeUJoSUhCeWIyMXBjMlVnZEdoaGRDQnRZWGtnWW1VZ2NtVnpiMngyWldRZ2QybDBhQ0IwYUdVZ1oybDJaVzRnY21WemIyeDJaU0JoYm1RZ2NtVnFaV04wWEc0Z0tpQm1kVzVqZEdsdmJuTXNJRzl5SUhKbGFtVmpkR1ZrSUdKNUlHRWdkR2h5YjNkdUlHVjRZMlZ3ZEdsdmJpQnBiaUJ5WlhOdmJIWmxjbHh1SUNvdlhHNVJMbEJ5YjIxcGMyVWdQU0J3Y205dGFYTmxPeUF2THlCRlV6WmNibEV1Y0hKdmJXbHpaU0E5SUhCeWIyMXBjMlU3WEc1bWRXNWpkR2x2YmlCd2NtOXRhWE5sS0hKbGMyOXNkbVZ5S1NCN1hHNGdJQ0FnYVdZZ0tIUjVjR1Z2WmlCeVpYTnZiSFpsY2lBaFBUMGdYQ0ptZFc1amRHbHZibHdpS1NCN1hHNGdJQ0FnSUNBZ0lIUm9jbTkzSUc1bGR5QlVlWEJsUlhKeWIzSW9YQ0p5WlhOdmJIWmxjaUJ0ZFhOMElHSmxJR0VnWm5WdVkzUnBiMjR1WENJcE8xeHVJQ0FnSUgxY2JpQWdJQ0IyWVhJZ1pHVm1aWEp5WldRZ1BTQmtaV1psY2lncE8xeHVJQ0FnSUhSeWVTQjdYRzRnSUNBZ0lDQWdJSEpsYzI5c2RtVnlLR1JsWm1WeWNtVmtMbkpsYzI5c2RtVXNJR1JsWm1WeWNtVmtMbkpsYW1WamRDd2daR1ZtWlhKeVpXUXVibTkwYVdaNUtUdGNiaUFnSUNCOUlHTmhkR05vSUNoeVpXRnpiMjRwSUh0Y2JpQWdJQ0FnSUNBZ1pHVm1aWEp5WldRdWNtVnFaV04wS0hKbFlYTnZiaWs3WEc0Z0lDQWdmVnh1SUNBZ0lISmxkSFZ5YmlCa1pXWmxjbkpsWkM1d2NtOXRhWE5sTzF4dWZWeHVYRzV3Y205dGFYTmxMbkpoWTJVZ1BTQnlZV05sT3lBdkx5QkZVelpjYm5CeWIyMXBjMlV1WVd4c0lEMGdZV3hzT3lBdkx5QkZVelpjYm5CeWIyMXBjMlV1Y21WcVpXTjBJRDBnY21WcVpXTjBPeUF2THlCRlV6WmNibkJ5YjIxcGMyVXVjbVZ6YjJ4MlpTQTlJRkU3SUM4dklFVlRObHh1WEc0dkx5QllXRmdnWlhod1pYSnBiV1Z1ZEdGc0xpQWdWR2hwY3lCdFpYUm9iMlFnYVhNZ1lTQjNZWGtnZEc4Z1pHVnViM1JsSUhSb1lYUWdZU0JzYjJOaGJDQjJZV3gxWlNCcGMxeHVMeThnYzJWeWFXRnNhWHBoWW14bElHRnVaQ0J6YUc5MWJHUWdZbVVnYVcxdFpXUnBZWFJsYkhrZ1pHbHpjR0YwWTJobFpDQjBieUJoSUhKbGJXOTBaU0IxY0c5dUlISmxjWFZsYzNRc1hHNHZMeUJwYm5OMFpXRmtJRzltSUhCaGMzTnBibWNnWVNCeVpXWmxjbVZ1WTJVdVhHNVJMbkJoYzNOQ2VVTnZjSGtnUFNCbWRXNWpkR2x2YmlBb2IySnFaV04wS1NCN1hHNGdJQ0FnTHk5bWNtVmxlbVVvYjJKcVpXTjBLVHRjYmlBZ0lDQXZMM0JoYzNOQ2VVTnZjR2xsY3k1elpYUW9iMkpxWldOMExDQjBjblZsS1R0Y2JpQWdJQ0J5WlhSMWNtNGdiMkpxWldOME8xeHVmVHRjYmx4dVVISnZiV2x6WlM1d2NtOTBiM1I1Y0dVdWNHRnpjMEo1UTI5d2VTQTlJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0F2TDJaeVpXVjZaU2h2WW1wbFkzUXBPMXh1SUNBZ0lDOHZjR0Z6YzBKNVEyOXdhV1Z6TG5ObGRDaHZZbXBsWTNRc0lIUnlkV1VwTzF4dUlDQWdJSEpsZEhWeWJpQjBhR2x6TzF4dWZUdGNibHh1THlvcVhHNGdLaUJKWmlCMGQyOGdjSEp2YldselpYTWdaWFpsYm5SMVlXeHNlU0JtZFd4bWFXeHNJSFJ2SUhSb1pTQnpZVzFsSUhaaGJIVmxMQ0J3Y205dGFYTmxjeUIwYUdGMElIWmhiSFZsTEZ4dUlDb2dZblYwSUc5MGFHVnlkMmx6WlNCeVpXcGxZM1J6TGx4dUlDb2dRSEJoY21GdElIZ2dlMEZ1ZVNwOVhHNGdLaUJBY0dGeVlXMGdlU0I3UVc1NUtuMWNiaUFxSUVCeVpYUjFjbTV6SUh0QmJua3FmU0JoSUhCeWIyMXBjMlVnWm05eUlIZ2dZVzVrSUhrZ2FXWWdkR2hsZVNCaGNtVWdkR2hsSUhOaGJXVXNJR0oxZENCaElISmxhbVZqZEdsdmJseHVJQ29nYjNSb1pYSjNhWE5sTGx4dUlDcGNiaUFxTDF4dVVTNXFiMmx1SUQwZ1puVnVZM1JwYjI0Z0tIZ3NJSGtwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdVU2g0S1M1cWIybHVLSGtwTzF4dWZUdGNibHh1VUhKdmJXbHpaUzV3Y205MGIzUjVjR1V1YW05cGJpQTlJR1oxYm1OMGFXOXVJQ2gwYUdGMEtTQjdYRzRnSUNBZ2NtVjBkWEp1SUZFb1czUm9hWE1zSUhSb1lYUmRLUzV6Y0hKbFlXUW9ablZ1WTNScGIyNGdLSGdzSUhrcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0hnZ1BUMDlJSGtwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUZSUFJFODZJRndpUFQwOVhDSWdjMmh2ZFd4a0lHSmxJRTlpYW1WamRDNXBjeUJ2Y2lCbGNYVnBkbHh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhnN1hHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnVaWGNnUlhKeWIzSW9YQ0pEWVc0bmRDQnFiMmx1T2lCdWIzUWdkR2hsSUhOaGJXVTZJRndpSUNzZ2VDQXJJRndpSUZ3aUlDc2dlU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5S1R0Y2JuMDdYRzVjYmk4cUtseHVJQ29nVW1WMGRYSnVjeUJoSUhCeWIyMXBjMlVnWm05eUlIUm9aU0JtYVhKemRDQnZaaUJoYmlCaGNuSmhlU0J2WmlCd2NtOXRhWE5sY3lCMGJ5QmlaV052YldVZ2MyVjBkR3hsWkM1Y2JpQXFJRUJ3WVhKaGJTQmhibk4zWlhKeklIdEJjbkpoZVZ0QmJua3FYWDBnY0hKdmJXbHpaWE1nZEc4Z2NtRmpaVnh1SUNvZ1FISmxkSFZ5Ym5NZ2UwRnVlU3A5SUhSb1pTQm1hWEp6ZENCd2NtOXRhWE5sSUhSdklHSmxJSE5sZEhSc1pXUmNiaUFxTDF4dVVTNXlZV05sSUQwZ2NtRmpaVHRjYm1aMWJtTjBhVzl1SUhKaFkyVW9ZVzV6ZDJWeVVITXBJSHRjYmlBZ0lDQnlaWFIxY200Z2NISnZiV2x6WlNobWRXNWpkR2x2YmloeVpYTnZiSFpsTENCeVpXcGxZM1FwSUh0Y2JpQWdJQ0FnSUNBZ0x5OGdVM2RwZEdOb0lIUnZJSFJvYVhNZ2IyNWpaU0IzWlNCallXNGdZWE56ZFcxbElHRjBJR3hsWVhOMElFVlROVnh1SUNBZ0lDQWdJQ0F2THlCaGJuTjNaWEpRY3k1bWIzSkZZV05vS0daMWJtTjBhVzl1S0dGdWMzZGxjbEFwSUh0Y2JpQWdJQ0FnSUNBZ0x5OGdJQ0FnSUZFb1lXNXpkMlZ5VUNrdWRHaGxiaWh5WlhOdmJIWmxMQ0J5WldwbFkzUXBPMXh1SUNBZ0lDQWdJQ0F2THlCOUtUdGNiaUFnSUNBZ0lDQWdMeThnVlhObElIUm9hWE1nYVc0Z2RHaGxJRzFsWVc1MGFXMWxYRzRnSUNBZ0lDQWdJR1p2Y2lBb2RtRnlJR2tnUFNBd0xDQnNaVzRnUFNCaGJuTjNaWEpRY3k1c1pXNW5kR2c3SUdrZ1BDQnNaVzQ3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1VTaGhibk4zWlhKUWMxdHBYU2t1ZEdobGJpaHlaWE52YkhabExDQnlaV3BsWTNRcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZTazdYRzU5WEc1Y2JsQnliMjFwYzJVdWNISnZkRzkwZVhCbExuSmhZMlVnUFNCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ2NtVjBkWEp1SUhSb2FYTXVkR2hsYmloUkxuSmhZMlVwTzF4dWZUdGNibHh1THlvcVhHNGdLaUJEYjI1emRISjFZM1J6SUdFZ1VISnZiV2x6WlNCM2FYUm9JR0VnY0hKdmJXbHpaU0JrWlhOamNtbHdkRzl5SUc5aWFtVmpkQ0JoYm1RZ2IzQjBhVzl1WVd3Z1ptRnNiR0poWTJ0Y2JpQXFJR1oxYm1OMGFXOXVMaUFnVkdobElHUmxjMk55YVhCMGIzSWdZMjl1ZEdGcGJuTWdiV1YwYUc5a2N5QnNhV3RsSUhkb1pXNG9jbVZxWldOMFpXUXBMQ0JuWlhRb2JtRnRaU2tzWEc0Z0tpQnpaWFFvYm1GdFpTd2dkbUZzZFdVcExDQndiM04wS0c1aGJXVXNJR0Z5WjNNcExDQmhibVFnWkdWc1pYUmxLRzVoYldVcExDQjNhR2xqYUNCaGJHeGNiaUFxSUhKbGRIVnliaUJsYVhSb1pYSWdZU0IyWVd4MVpTd2dZU0J3Y205dGFYTmxJR1p2Y2lCaElIWmhiSFZsTENCdmNpQmhJSEpsYW1WamRHbHZiaTRnSUZSb1pTQm1ZV3hzWW1GamExeHVJQ29nWVdOalpYQjBjeUIwYUdVZ2IzQmxjbUYwYVc5dUlHNWhiV1VzSUdFZ2NtVnpiMngyWlhJc0lHRnVaQ0JoYm5rZ1puVnlkR2hsY2lCaGNtZDFiV1Z1ZEhNZ2RHaGhkQ0IzYjNWc1pGeHVJQ29nYUdGMlpTQmlaV1Z1SUdadmNuZGhjbVJsWkNCMGJ5QjBhR1VnWVhCd2NtOXdjbWxoZEdVZ2JXVjBhRzlrSUdGaWIzWmxJR2hoWkNCaElHMWxkR2h2WkNCaVpXVnVYRzRnS2lCd2NtOTJhV1JsWkNCM2FYUm9JSFJvWlNCd2NtOXdaWElnYm1GdFpTNGdJRlJvWlNCQlVFa2diV0ZyWlhNZ2JtOGdaM1ZoY21GdWRHVmxjeUJoWW05MWRDQjBhR1VnYm1GMGRYSmxYRzRnS2lCdlppQjBhR1VnY21WMGRYSnVaV1FnYjJKcVpXTjBMQ0JoY0dGeWRDQm1jbTl0SUhSb1lYUWdhWFFnYVhNZ2RYTmhZbXhsSUhkb1pYSmxaWFpsY2lCd2NtOXRhWE5sY3lCaGNtVmNiaUFxSUdKdmRXZG9kQ0JoYm1RZ2MyOXNaQzVjYmlBcUwxeHVVUzV0WVd0bFVISnZiV2x6WlNBOUlGQnliMjFwYzJVN1hHNW1kVzVqZEdsdmJpQlFjbTl0YVhObEtHUmxjMk55YVhCMGIzSXNJR1poYkd4aVlXTnJMQ0JwYm5Od1pXTjBLU0I3WEc0Z0lDQWdhV1lnS0daaGJHeGlZV05ySUQwOVBTQjJiMmxrSURBcElIdGNiaUFnSUNBZ0lDQWdabUZzYkdKaFkyc2dQU0JtZFc1amRHbHZiaUFvYjNBcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ5WldwbFkzUW9ibVYzSUVWeWNtOXlLRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRndpVUhKdmJXbHpaU0JrYjJWeklHNXZkQ0J6ZFhCd2IzSjBJRzl3WlhKaGRHbHZiam9nWENJZ0t5QnZjRnh1SUNBZ0lDQWdJQ0FnSUNBZ0tTazdYRzRnSUNBZ0lDQWdJSDA3WEc0Z0lDQWdmVnh1SUNBZ0lHbG1JQ2hwYm5Od1pXTjBJRDA5UFNCMmIybGtJREFwSUh0Y2JpQWdJQ0FnSUNBZ2FXNXpjR1ZqZENBOUlHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCN2MzUmhkR1U2SUZ3aWRXNXJibTkzYmx3aWZUdGNiaUFnSUNBZ0lDQWdmVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQjJZWElnY0hKdmJXbHpaU0E5SUc5aWFtVmpkRjlqY21WaGRHVW9VSEp2YldselpTNXdjbTkwYjNSNWNHVXBPMXh1WEc0Z0lDQWdjSEp2YldselpTNXdjbTl0YVhObFJHbHpjR0YwWTJnZ1BTQm1kVzVqZEdsdmJpQW9jbVZ6YjJ4MlpTd2diM0FzSUdGeVozTXBJSHRjYmlBZ0lDQWdJQ0FnZG1GeUlISmxjM1ZzZER0Y2JpQWdJQ0FnSUNBZ2RISjVJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hrWlhOamNtbHdkRzl5VzI5d1hTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzNWc2RDQTlJR1JsYzJOeWFYQjBiM0piYjNCZExtRndjR3g1S0hCeWIyMXBjMlVzSUdGeVozTXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYTjFiSFFnUFNCbVlXeHNZbUZqYXk1allXeHNLSEJ5YjIxcGMyVXNJRzl3TENCaGNtZHpLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdmU0JqWVhSamFDQW9aWGhqWlhCMGFXOXVLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWE4xYkhRZ1BTQnlaV3BsWTNRb1pYaGpaWEIwYVc5dUtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JwWmlBb2NtVnpiMngyWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WemIyeDJaU2h5WlhOMWJIUXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVHRjYmx4dUlDQWdJSEJ5YjIxcGMyVXVhVzV6Y0dWamRDQTlJR2x1YzNCbFkzUTdYRzVjYmlBZ0lDQXZMeUJZV0ZnZ1pHVndjbVZqWVhSbFpDQmdkbUZzZFdWUFptQWdZVzVrSUdCbGVHTmxjSFJwYjI1Z0lITjFjSEJ2Y25SY2JpQWdJQ0JwWmlBb2FXNXpjR1ZqZENrZ2UxeHVJQ0FnSUNBZ0lDQjJZWElnYVc1emNHVmpkR1ZrSUQwZ2FXNXpjR1ZqZENncE8xeHVJQ0FnSUNBZ0lDQnBaaUFvYVc1emNHVmpkR1ZrTG5OMFlYUmxJRDA5UFNCY0luSmxhbVZqZEdWa1hDSXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIQnliMjFwYzJVdVpYaGpaWEIwYVc5dUlEMGdhVzV6Y0dWamRHVmtMbkpsWVhOdmJqdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhCeWIyMXBjMlV1ZG1Gc2RXVlBaaUE5SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhaaGNpQnBibk53WldOMFpXUWdQU0JwYm5Od1pXTjBLQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvYVc1emNHVmpkR1ZrTG5OMFlYUmxJRDA5UFNCY0luQmxibVJwYm1kY0lpQjhmRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2x1YzNCbFkzUmxaQzV6ZEdGMFpTQTlQVDBnWENKeVpXcGxZM1JsWkZ3aUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIQnliMjFwYzJVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2FXNXpjR1ZqZEdWa0xuWmhiSFZsTzF4dUlDQWdJQ0FnSUNCOU8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhKbGRIVnliaUJ3Y205dGFYTmxPMXh1ZlZ4dVhHNVFjbTl0YVhObExuQnliM1J2ZEhsd1pTNTBiMU4wY21sdVp5QTlJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdYQ0piYjJKcVpXTjBJRkJ5YjIxcGMyVmRYQ0k3WEc1OU8xeHVYRzVRY205dGFYTmxMbkJ5YjNSdmRIbHdaUzUwYUdWdUlEMGdablZ1WTNScGIyNGdLR1oxYkdacGJHeGxaQ3dnY21WcVpXTjBaV1FzSUhCeWIyZHlaWE56WldRcElIdGNiaUFnSUNCMllYSWdjMlZzWmlBOUlIUm9hWE03WEc0Z0lDQWdkbUZ5SUdSbFptVnljbVZrSUQwZ1pHVm1aWElvS1R0Y2JpQWdJQ0IyWVhJZ1pHOXVaU0E5SUdaaGJITmxPeUFnSUM4dklHVnVjM1Z5WlNCMGFHVWdkVzUwY25WemRHVmtJSEJ5YjIxcGMyVWdiV0ZyWlhNZ1lYUWdiVzl6ZENCaFhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QnphVzVuYkdVZ1kyRnNiQ0IwYnlCdmJtVWdiMllnZEdobElHTmhiR3hpWVdOcmMxeHVYRzRnSUNBZ1puVnVZM1JwYjI0Z1gyWjFiR1pwYkd4bFpDaDJZV3gxWlNrZ2UxeHVJQ0FnSUNBZ0lDQjBjbmtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIUjVjR1Z2WmlCbWRXeG1hV3hzWldRZ1BUMDlJRndpWm5WdVkzUnBiMjVjSWlBL0lHWjFiR1pwYkd4bFpDaDJZV3gxWlNrZ09pQjJZV3gxWlR0Y2JpQWdJQ0FnSUNBZ2ZTQmpZWFJqYUNBb1pYaGpaWEIwYVc5dUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnY21WcVpXTjBLR1Y0WTJWd2RHbHZiaWs3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0I5WEc1Y2JpQWdJQ0JtZFc1amRHbHZiaUJmY21WcVpXTjBaV1FvWlhoalpYQjBhVzl1S1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2gwZVhCbGIyWWdjbVZxWldOMFpXUWdQVDA5SUZ3aVpuVnVZM1JwYjI1Y0lpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2JXRnJaVk4wWVdOclZISmhZMlZNYjI1bktHVjRZMlZ3ZEdsdmJpd2djMlZzWmlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwY25rZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCeVpXcGxZM1JsWkNobGVHTmxjSFJwYjI0cE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNCallYUmphQ0FvYm1WM1JYaGpaWEIwYVc5dUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlISmxhbVZqZENodVpYZEZlR05sY0hScGIyNHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQnlaV3BsWTNRb1pYaGpaWEIwYVc5dUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCbWRXNWpkR2x2YmlCZmNISnZaM0psYzNObFpDaDJZV3gxWlNrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RIbHdaVzltSUhCeWIyZHlaWE56WldRZ1BUMDlJRndpWm5WdVkzUnBiMjVjSWlBL0lIQnliMmR5WlhOelpXUW9kbUZzZFdVcElEb2dkbUZzZFdVN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnVVM1dVpYaDBWR2xqYXlobWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQWdJSE5sYkdZdWNISnZiV2x6WlVScGMzQmhkR05vS0daMWJtTjBhVzl1SUNoMllXeDFaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0dSdmJtVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNDdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0JrYjI1bElEMGdkSEoxWlR0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWkdWbVpYSnlaV1F1Y21WemIyeDJaU2hmWm5Wc1ptbHNiR1ZrS0haaGJIVmxLU2s3WEc0Z0lDQWdJQ0FnSUgwc0lGd2lkMmhsYmx3aUxDQmJablZ1WTNScGIyNGdLR1Y0WTJWd2RHbHZiaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0dSdmJtVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNDdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0JrYjI1bElEMGdkSEoxWlR0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWkdWbVpYSnlaV1F1Y21WemIyeDJaU2hmY21WcVpXTjBaV1FvWlhoalpYQjBhVzl1S1NrN1hHNGdJQ0FnSUNBZ0lIMWRLVHRjYmlBZ0lDQjlLVHRjYmx4dUlDQWdJQzh2SUZCeWIyZHlaWE56SUhCeWIzQmhaMkYwYjNJZ2JtVmxaQ0IwYnlCaVpTQmhkSFJoWTJobFpDQnBiaUIwYUdVZ1kzVnljbVZ1ZENCMGFXTnJMbHh1SUNBZ0lITmxiR1l1Y0hKdmJXbHpaVVJwYzNCaGRHTm9LSFp2YVdRZ01Dd2dYQ0ozYUdWdVhDSXNJRnQyYjJsa0lEQXNJR1oxYm1OMGFXOXVJQ2gyWVd4MVpTa2dlMXh1SUNBZ0lDQWdJQ0IyWVhJZ2JtVjNWbUZzZFdVN1hHNGdJQ0FnSUNBZ0lIWmhjaUIwYUhKbGR5QTlJR1poYkhObE8xeHVJQ0FnSUNBZ0lDQjBjbmtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdibVYzVm1Gc2RXVWdQU0JmY0hKdlozSmxjM05sWkNoMllXeDFaU2s3WEc0Z0lDQWdJQ0FnSUgwZ1kyRjBZMmdnS0dVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2NtVjNJRDBnZEhKMVpUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaFJMbTl1WlhKeWIzSXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JSTG05dVpYSnliM0lvWlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lHVTdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JwWmlBb0lYUm9jbVYzS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JrWldabGNuSmxaQzV1YjNScFpua29ibVYzVm1Gc2RXVXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVjBwTzF4dVhHNGdJQ0FnY21WMGRYSnVJR1JsWm1WeWNtVmtMbkJ5YjIxcGMyVTdYRzU5TzF4dVhHNVJMblJoY0NBOUlHWjFibU4wYVc5dUlDaHdjbTl0YVhObExDQmpZV3hzWW1GamF5a2dlMXh1SUNBZ0lISmxkSFZ5YmlCUktIQnliMjFwYzJVcExuUmhjQ2hqWVd4c1ltRmpheWs3WEc1OU8xeHVYRzR2S2lwY2JpQXFJRmR2Y210eklHRnNiVzl6ZENCc2FXdGxJRndpWm1sdVlXeHNlVndpTENCaWRYUWdibTkwSUdOaGJHeGxaQ0JtYjNJZ2NtVnFaV04wYVc5dWN5NWNiaUFxSUU5eWFXZHBibUZzSUhKbGMyOXNkWFJwYjI0Z2RtRnNkV1VnYVhNZ2NHRnpjMlZrSUhSb2NtOTFaMmdnWTJGc2JHSmhZMnNnZFc1aFptWmxZM1JsWkM1Y2JpQXFJRU5oYkd4aVlXTnJJRzFoZVNCeVpYUjFjbTRnWVNCd2NtOXRhWE5sSUhSb1lYUWdkMmxzYkNCaVpTQmhkMkZwZEdWa0lHWnZjaTVjYmlBcUlFQndZWEpoYlNCN1JuVnVZM1JwYjI1OUlHTmhiR3hpWVdOclhHNGdLaUJBY21WMGRYSnVjeUI3VVM1UWNtOXRhWE5sZlZ4dUlDb2dRR1Y0WVcxd2JHVmNiaUFxSUdSdlUyOXRaWFJvYVc1bktDbGNiaUFxSUNBZ0xuUm9aVzRvTGk0dUtWeHVJQ29nSUNBdWRHRndLR052Ym5OdmJHVXViRzluS1Z4dUlDb2dJQ0F1ZEdobGJpZ3VMaTRwTzF4dUlDb3ZYRzVRY205dGFYTmxMbkJ5YjNSdmRIbHdaUzUwWVhBZ1BTQm1kVzVqZEdsdmJpQW9ZMkZzYkdKaFkyc3BJSHRjYmlBZ0lDQmpZV3hzWW1GamF5QTlJRkVvWTJGc2JHSmhZMnNwTzF4dVhHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdWRHaGxiaWhtZFc1amRHbHZiaUFvZG1Gc2RXVXBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR05oYkd4aVlXTnJMbVpqWVd4c0tIWmhiSFZsS1M1MGFHVnVVbVZ6YjJ4MlpTaDJZV3gxWlNrN1hHNGdJQ0FnZlNrN1hHNTlPMXh1WEc0dktpcGNiaUFxSUZKbFoybHpkR1Z5Y3lCaGJpQnZZbk5sY25abGNpQnZiaUJoSUhCeWIyMXBjMlV1WEc0Z0tseHVJQ29nUjNWaGNtRnVkR1ZsY3pwY2JpQXFYRzRnS2lBeExpQjBhR0YwSUdaMWJHWnBiR3hsWkNCaGJtUWdjbVZxWldOMFpXUWdkMmxzYkNCaVpTQmpZV3hzWldRZ2IyNXNlU0J2Ym1ObExseHVJQ29nTWk0Z2RHaGhkQ0JsYVhSb1pYSWdkR2hsSUdaMWJHWnBiR3hsWkNCallXeHNZbUZqYXlCdmNpQjBhR1VnY21WcVpXTjBaV1FnWTJGc2JHSmhZMnNnZDJsc2JDQmlaVnh1SUNvZ0lDQWdZMkZzYkdWa0xDQmlkWFFnYm05MElHSnZkR2d1WEc0Z0tpQXpMaUIwYUdGMElHWjFiR1pwYkd4bFpDQmhibVFnY21WcVpXTjBaV1FnZDJsc2JDQnViM1FnWW1VZ1kyRnNiR1ZrSUdsdUlIUm9hWE1nZEhWeWJpNWNiaUFxWEc0Z0tpQkFjR0Z5WVcwZ2RtRnNkV1VnSUNBZ0lDQndjbTl0YVhObElHOXlJR2x0YldWa2FXRjBaU0J5WldabGNtVnVZMlVnZEc4Z2IySnpaWEoyWlZ4dUlDb2dRSEJoY21GdElHWjFiR1pwYkd4bFpDQWdablZ1WTNScGIyNGdkRzhnWW1VZ1kyRnNiR1ZrSUhkcGRHZ2dkR2hsSUdaMWJHWnBiR3hsWkNCMllXeDFaVnh1SUNvZ1FIQmhjbUZ0SUhKbGFtVmpkR1ZrSUNBZ1puVnVZM1JwYjI0Z2RHOGdZbVVnWTJGc2JHVmtJSGRwZEdnZ2RHaGxJSEpsYW1WamRHbHZiaUJsZUdObGNIUnBiMjVjYmlBcUlFQndZWEpoYlNCd2NtOW5jbVZ6YzJWa0lHWjFibU4wYVc5dUlIUnZJR0psSUdOaGJHeGxaQ0J2YmlCaGJua2djSEp2WjNKbGMzTWdibTkwYVdacFkyRjBhVzl1YzF4dUlDb2dRSEpsZEhWeWJpQndjbTl0YVhObElHWnZjaUIwYUdVZ2NtVjBkWEp1SUhaaGJIVmxJR1p5YjIwZ2RHaGxJR2x1ZG05clpXUWdZMkZzYkdKaFkydGNiaUFxTDF4dVVTNTNhR1Z1SUQwZ2QyaGxianRjYm1aMWJtTjBhVzl1SUhkb1pXNG9kbUZzZFdVc0lHWjFiR1pwYkd4bFpDd2djbVZxWldOMFpXUXNJSEJ5YjJkeVpYTnpaV1FwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdVU2gyWVd4MVpTa3VkR2hsYmlobWRXeG1hV3hzWldRc0lISmxhbVZqZEdWa0xDQndjbTluY21WemMyVmtLVHRjYm4xY2JseHVVSEp2YldselpTNXdjbTkwYjNSNWNHVXVkR2hsYmxKbGMyOXNkbVVnUFNCbWRXNWpkR2x2YmlBb2RtRnNkV1VwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3k1MGFHVnVLR1oxYm1OMGFXOXVJQ2dwSUhzZ2NtVjBkWEp1SUhaaGJIVmxPeUI5S1R0Y2JuMDdYRzVjYmxFdWRHaGxibEpsYzI5c2RtVWdQU0JtZFc1amRHbHZiaUFvY0hKdmJXbHpaU3dnZG1Gc2RXVXBJSHRjYmlBZ0lDQnlaWFIxY200Z1VTaHdjbTl0YVhObEtTNTBhR1Z1VW1WemIyeDJaU2gyWVd4MVpTazdYRzU5TzF4dVhHNVFjbTl0YVhObExuQnliM1J2ZEhsd1pTNTBhR1Z1VW1WcVpXTjBJRDBnWm5WdVkzUnBiMjRnS0hKbFlYTnZiaWtnZTF4dUlDQWdJSEpsZEhWeWJpQjBhR2x6TG5Sb1pXNG9ablZ1WTNScGIyNGdLQ2tnZXlCMGFISnZkeUJ5WldGemIyNDdJSDBwTzF4dWZUdGNibHh1VVM1MGFHVnVVbVZxWldOMElEMGdablZ1WTNScGIyNGdLSEJ5YjIxcGMyVXNJSEpsWVhOdmJpa2dlMXh1SUNBZ0lISmxkSFZ5YmlCUktIQnliMjFwYzJVcExuUm9aVzVTWldwbFkzUW9jbVZoYzI5dUtUdGNibjA3WEc1Y2JpOHFLbHh1SUNvZ1NXWWdZVzRnYjJKcVpXTjBJR2x6SUc1dmRDQmhJSEJ5YjIxcGMyVXNJR2wwSUdseklHRnpJRndpYm1WaGNsd2lJR0Z6SUhCdmMzTnBZbXhsTGx4dUlDb2dTV1lnWVNCd2NtOXRhWE5sSUdseklISmxhbVZqZEdWa0xDQnBkQ0JwY3lCaGN5QmNJbTVsWVhKY0lpQmhjeUJ3YjNOemFXSnNaU0IwYjI4dVhHNGdLaUJKWmlCcGRPS0FtWE1nWVNCbWRXeG1hV3hzWldRZ2NISnZiV2x6WlN3Z2RHaGxJR1oxYkdacGJHeHRaVzUwSUhaaGJIVmxJR2x6SUc1bFlYSmxjaTVjYmlBcUlFbG1JR2wwNG9DWmN5QmhJR1JsWm1WeWNtVmtJSEJ5YjIxcGMyVWdZVzVrSUhSb1pTQmtaV1psY25KbFpDQm9ZWE1nWW1WbGJpQnlaWE52YkhabFpDd2dkR2hsWEc0Z0tpQnlaWE52YkhWMGFXOXVJR2x6SUZ3aWJtVmhjbVZ5WENJdVhHNGdLaUJBY0dGeVlXMGdiMkpxWldOMFhHNGdLaUJBY21WMGRYSnVjeUJ0YjNOMElISmxjMjlzZG1Wa0lDaHVaV0Z5WlhOMEtTQm1iM0p0SUc5bUlIUm9aU0J2WW1wbFkzUmNiaUFxTDF4dVhHNHZMeUJZV0ZnZ2MyaHZkV3hrSUhkbElISmxMV1J2SUhSb2FYTS9YRzVSTG01bFlYSmxjaUE5SUc1bFlYSmxjanRjYm1aMWJtTjBhVzl1SUc1bFlYSmxjaWgyWVd4MVpTa2dlMXh1SUNBZ0lHbG1JQ2hwYzFCeWIyMXBjMlVvZG1Gc2RXVXBLU0I3WEc0Z0lDQWdJQ0FnSUhaaGNpQnBibk53WldOMFpXUWdQU0IyWVd4MVpTNXBibk53WldOMEtDazdYRzRnSUNBZ0lDQWdJR2xtSUNocGJuTndaV04wWldRdWMzUmhkR1VnUFQwOUlGd2lablZzWm1sc2JHVmtYQ0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQnBibk53WldOMFpXUXVkbUZzZFdVN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOVhHNGdJQ0FnY21WMGRYSnVJSFpoYkhWbE8xeHVmVnh1WEc0dktpcGNiaUFxSUVCeVpYUjFjbTV6SUhkb1pYUm9aWElnZEdobElHZHBkbVZ1SUc5aWFtVmpkQ0JwY3lCaElIQnliMjFwYzJVdVhHNGdLaUJQZEdobGNuZHBjMlVnYVhRZ2FYTWdZU0JtZFd4bWFXeHNaV1FnZG1Gc2RXVXVYRzRnS2k5Y2JsRXVhWE5RY205dGFYTmxJRDBnYVhOUWNtOXRhWE5sTzF4dVpuVnVZM1JwYjI0Z2FYTlFjbTl0YVhObEtHOWlhbVZqZENrZ2UxeHVJQ0FnSUhKbGRIVnliaUJ2WW1wbFkzUWdhVzV6ZEdGdVkyVnZaaUJRY205dGFYTmxPMXh1ZlZ4dVhHNVJMbWx6VUhKdmJXbHpaVUZzYVd0bElEMGdhWE5RY205dGFYTmxRV3hwYTJVN1hHNW1kVzVqZEdsdmJpQnBjMUJ5YjIxcGMyVkJiR2xyWlNodlltcGxZM1FwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdhWE5QWW1wbFkzUW9iMkpxWldOMEtTQW1KaUIwZVhCbGIyWWdiMkpxWldOMExuUm9aVzRnUFQwOUlGd2lablZ1WTNScGIyNWNJanRjYm4xY2JseHVMeW9xWEc0Z0tpQkFjbVYwZFhKdWN5QjNhR1YwYUdWeUlIUm9aU0JuYVhabGJpQnZZbXBsWTNRZ2FYTWdZU0J3Wlc1a2FXNW5JSEJ5YjIxcGMyVXNJRzFsWVc1cGJtY2dibTkwWEc0Z0tpQm1kV3htYVd4c1pXUWdiM0lnY21WcVpXTjBaV1F1WEc0Z0tpOWNibEV1YVhOUVpXNWthVzVuSUQwZ2FYTlFaVzVrYVc1bk8xeHVablZ1WTNScGIyNGdhWE5RWlc1a2FXNW5LRzlpYW1WamRDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCcGMxQnliMjFwYzJVb2IySnFaV04wS1NBbUppQnZZbXBsWTNRdWFXNXpjR1ZqZENncExuTjBZWFJsSUQwOVBTQmNJbkJsYm1ScGJtZGNJanRjYm4xY2JseHVVSEp2YldselpTNXdjbTkwYjNSNWNHVXVhWE5RWlc1a2FXNW5JRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUhKbGRIVnliaUIwYUdsekxtbHVjM0JsWTNRb0tTNXpkR0YwWlNBOVBUMGdYQ0p3Wlc1a2FXNW5YQ0k3WEc1OU8xeHVYRzR2S2lwY2JpQXFJRUJ5WlhSMWNtNXpJSGRvWlhSb1pYSWdkR2hsSUdkcGRtVnVJRzlpYW1WamRDQnBjeUJoSUhaaGJIVmxJRzl5SUdaMWJHWnBiR3hsWkZ4dUlDb2djSEp2YldselpTNWNiaUFxTDF4dVVTNXBjMFoxYkdacGJHeGxaQ0E5SUdselJuVnNabWxzYkdWa08xeHVablZ1WTNScGIyNGdhWE5HZFd4bWFXeHNaV1FvYjJKcVpXTjBLU0I3WEc0Z0lDQWdjbVYwZFhKdUlDRnBjMUJ5YjIxcGMyVW9iMkpxWldOMEtTQjhmQ0J2WW1wbFkzUXVhVzV6Y0dWamRDZ3BMbk4wWVhSbElEMDlQU0JjSW1aMWJHWnBiR3hsWkZ3aU8xeHVmVnh1WEc1UWNtOXRhWE5sTG5CeWIzUnZkSGx3WlM1cGMwWjFiR1pwYkd4bFpDQTlJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3k1cGJuTndaV04wS0NrdWMzUmhkR1VnUFQwOUlGd2lablZzWm1sc2JHVmtYQ0k3WEc1OU8xeHVYRzR2S2lwY2JpQXFJRUJ5WlhSMWNtNXpJSGRvWlhSb1pYSWdkR2hsSUdkcGRtVnVJRzlpYW1WamRDQnBjeUJoSUhKbGFtVmpkR1ZrSUhCeWIyMXBjMlV1WEc0Z0tpOWNibEV1YVhOU1pXcGxZM1JsWkNBOUlHbHpVbVZxWldOMFpXUTdYRzVtZFc1amRHbHZiaUJwYzFKbGFtVmpkR1ZrS0c5aWFtVmpkQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQnBjMUJ5YjIxcGMyVW9iMkpxWldOMEtTQW1KaUJ2WW1wbFkzUXVhVzV6Y0dWamRDZ3BMbk4wWVhSbElEMDlQU0JjSW5KbGFtVmpkR1ZrWENJN1hHNTlYRzVjYmxCeWIyMXBjMlV1Y0hKdmRHOTBlWEJsTG1selVtVnFaV04wWldRZ1BTQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11YVc1emNHVmpkQ2dwTG5OMFlYUmxJRDA5UFNCY0luSmxhbVZqZEdWa1hDSTdYRzU5TzF4dVhHNHZMeTh2SUVKRlIwbE9JRlZPU0VGT1JFeEZSQ0JTUlVwRlExUkpUMDRnVkZKQlEwdEpUa2RjYmx4dUx5OGdWR2hwY3lCd2NtOXRhWE5sSUd4cFluSmhjbmtnWTI5dWMzVnRaWE1nWlhoalpYQjBhVzl1Y3lCMGFISnZkMjRnYVc0Z2FHRnVaR3hsY25NZ2MyOGdkR2hsZVNCallXNGdZbVZjYmk4dklHaGhibVJzWldRZ1lua2dZU0J6ZFdKelpYRjFaVzUwSUhCeWIyMXBjMlV1SUNCVWFHVWdaWGhqWlhCMGFXOXVjeUJuWlhRZ1lXUmtaV1FnZEc4Z2RHaHBjeUJoY25KaGVTQjNhR1Z1WEc0dkx5QjBhR1Y1SUdGeVpTQmpjbVZoZEdWa0xDQmhibVFnY21WdGIzWmxaQ0IzYUdWdUlIUm9aWGtnWVhKbElHaGhibVJzWldRdUlDQk9iM1JsSUhSb1lYUWdhVzRnUlZNMklHOXlYRzR2THlCemFHbHRiV1ZrSUdWdWRtbHliMjV0Wlc1MGN5d2dkR2hwY3lCM2IzVnNaQ0J1WVhSMWNtRnNiSGtnWW1VZ1lTQmdVMlYwWUM1Y2JuWmhjaUIxYm1oaGJtUnNaV1JTWldGemIyNXpJRDBnVzEwN1hHNTJZWElnZFc1b1lXNWtiR1ZrVW1WcVpXTjBhVzl1Y3lBOUlGdGRPMXh1ZG1GeUlIUnlZV05yVlc1b1lXNWtiR1ZrVW1WcVpXTjBhVzl1Y3lBOUlIUnlkV1U3WEc1Y2JtWjFibU4wYVc5dUlISmxjMlYwVlc1b1lXNWtiR1ZrVW1WcVpXTjBhVzl1Y3lncElIdGNiaUFnSUNCMWJtaGhibVJzWldSU1pXRnpiMjV6TG14bGJtZDBhQ0E5SURBN1hHNGdJQ0FnZFc1b1lXNWtiR1ZrVW1WcVpXTjBhVzl1Y3k1c1pXNW5kR2dnUFNBd08xeHVYRzRnSUNBZ2FXWWdLQ0YwY21GamExVnVhR0Z1Wkd4bFpGSmxhbVZqZEdsdmJuTXBJSHRjYmlBZ0lDQWdJQ0FnZEhKaFkydFZibWhoYm1Sc1pXUlNaV3BsWTNScGIyNXpJRDBnZEhKMVpUdGNiaUFnSUNCOVhHNTlYRzVjYm1aMWJtTjBhVzl1SUhSeVlXTnJVbVZxWldOMGFXOXVLSEJ5YjIxcGMyVXNJSEpsWVhOdmJpa2dlMXh1SUNBZ0lHbG1JQ2doZEhKaFkydFZibWhoYm1Sc1pXUlNaV3BsWTNScGIyNXpLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnlianRjYmlBZ0lDQjlYRzVjYmlBZ0lDQjFibWhoYm1Sc1pXUlNaV3BsWTNScGIyNXpMbkIxYzJnb2NISnZiV2x6WlNrN1hHNGdJQ0FnYVdZZ0tISmxZWE52YmlBbUppQjBlWEJsYjJZZ2NtVmhjMjl1TG5OMFlXTnJJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lLU0I3WEc0Z0lDQWdJQ0FnSUhWdWFHRnVaR3hsWkZKbFlYTnZibk11Y0hWemFDaHlaV0Z6YjI0dWMzUmhZMnNwTzF4dUlDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJSFZ1YUdGdVpHeGxaRkpsWVhOdmJuTXVjSFZ6YUNoY0lpaHVieUJ6ZEdGamF5a2dYQ0lnS3lCeVpXRnpiMjRwTzF4dUlDQWdJSDFjYm4xY2JseHVablZ1WTNScGIyNGdkVzUwY21GamExSmxhbVZqZEdsdmJpaHdjbTl0YVhObEtTQjdYRzRnSUNBZ2FXWWdLQ0YwY21GamExVnVhR0Z1Wkd4bFpGSmxhbVZqZEdsdmJuTXBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVPMXh1SUNBZ0lIMWNibHh1SUNBZ0lIWmhjaUJoZENBOUlHRnljbUY1WDJsdVpHVjRUMllvZFc1b1lXNWtiR1ZrVW1WcVpXTjBhVzl1Y3l3Z2NISnZiV2x6WlNrN1hHNGdJQ0FnYVdZZ0tHRjBJQ0U5UFNBdE1Ta2dlMXh1SUNBZ0lDQWdJQ0IxYm1oaGJtUnNaV1JTWldwbFkzUnBiMjV6TG5Od2JHbGpaU2hoZEN3Z01TazdYRzRnSUNBZ0lDQWdJSFZ1YUdGdVpHeGxaRkpsWVhOdmJuTXVjM0JzYVdObEtHRjBMQ0F4S1R0Y2JpQWdJQ0I5WEc1OVhHNWNibEV1Y21WelpYUlZibWhoYm1Sc1pXUlNaV3BsWTNScGIyNXpJRDBnY21WelpYUlZibWhoYm1Sc1pXUlNaV3BsWTNScGIyNXpPMXh1WEc1UkxtZGxkRlZ1YUdGdVpHeGxaRkpsWVhOdmJuTWdQU0JtZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnTHk4Z1RXRnJaU0JoSUdOdmNIa2djMjhnZEdoaGRDQmpiMjV6ZFcxbGNuTWdZMkZ1SjNRZ2FXNTBaWEptWlhKbElIZHBkR2dnYjNWeUlHbHVkR1Z5Ym1Gc0lITjBZWFJsTGx4dUlDQWdJSEpsZEhWeWJpQjFibWhoYm1Sc1pXUlNaV0Z6YjI1ekxuTnNhV05sS0NrN1hHNTlPMXh1WEc1UkxuTjBiM0JWYm1oaGJtUnNaV1JTWldwbFkzUnBiMjVVY21GamEybHVaeUE5SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNCeVpYTmxkRlZ1YUdGdVpHeGxaRkpsYW1WamRHbHZibk1vS1R0Y2JpQWdJQ0IwY21GamExVnVhR0Z1Wkd4bFpGSmxhbVZqZEdsdmJuTWdQU0JtWVd4elpUdGNibjA3WEc1Y2JuSmxjMlYwVlc1b1lXNWtiR1ZrVW1WcVpXTjBhVzl1Y3lncE8xeHVYRzR2THk4dklFVk9SQ0JWVGtoQlRrUk1SVVFnVWtWS1JVTlVTVTlPSUZSU1FVTkxTVTVIWEc1Y2JpOHFLbHh1SUNvZ1EyOXVjM1J5ZFdOMGN5QmhJSEpsYW1WamRHVmtJSEJ5YjIxcGMyVXVYRzRnS2lCQWNHRnlZVzBnY21WaGMyOXVJSFpoYkhWbElHUmxjMk55YVdKcGJtY2dkR2hsSUdaaGFXeDFjbVZjYmlBcUwxeHVVUzV5WldwbFkzUWdQU0J5WldwbFkzUTdYRzVtZFc1amRHbHZiaUJ5WldwbFkzUW9jbVZoYzI5dUtTQjdYRzRnSUNBZ2RtRnlJSEpsYW1WamRHbHZiaUE5SUZCeWIyMXBjMlVvZTF4dUlDQWdJQ0FnSUNCY0luZG9aVzVjSWpvZ1puVnVZM1JwYjI0Z0tISmxhbVZqZEdWa0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QnViM1JsSUhSb1lYUWdkR2hsSUdWeWNtOXlJR2hoY3lCaVpXVnVJR2hoYm1Sc1pXUmNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaHlaV3BsWTNSbFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFZ1ZEhKaFkydFNaV3BsWTNScGIyNG9kR2hwY3lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2NtVnFaV04wWldRZ1B5QnlaV3BsWTNSbFpDaHlaV0Z6YjI0cElEb2dkR2hwY3p0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgwc0lHWjFibU4wYVc5dUlHWmhiR3hpWVdOcktDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3p0Y2JpQWdJQ0I5TENCbWRXNWpkR2x2YmlCcGJuTndaV04wS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2V5QnpkR0YwWlRvZ1hDSnlaV3BsWTNSbFpGd2lMQ0J5WldGemIyNDZJSEpsWVhOdmJpQjlPMXh1SUNBZ0lIMHBPMXh1WEc0Z0lDQWdMeThnVG05MFpTQjBhR0YwSUhSb1pTQnlaV0Z6YjI0Z2FHRnpJRzV2ZENCaVpXVnVJR2hoYm1Sc1pXUXVYRzRnSUNBZ2RISmhZMnRTWldwbFkzUnBiMjRvY21WcVpXTjBhVzl1TENCeVpXRnpiMjRwTzF4dVhHNGdJQ0FnY21WMGRYSnVJSEpsYW1WamRHbHZianRjYm4xY2JseHVMeW9xWEc0Z0tpQkRiMjV6ZEhKMVkzUnpJR0VnWm5Wc1ptbHNiR1ZrSUhCeWIyMXBjMlVnWm05eUlHRnVJR2x0YldWa2FXRjBaU0J5WldabGNtVnVZMlV1WEc0Z0tpQkFjR0Z5WVcwZ2RtRnNkV1VnYVcxdFpXUnBZWFJsSUhKbFptVnlaVzVqWlZ4dUlDb3ZYRzVSTG1aMWJHWnBiR3dnUFNCbWRXeG1hV3hzTzF4dVpuVnVZM1JwYjI0Z1puVnNabWxzYkNoMllXeDFaU2tnZTF4dUlDQWdJSEpsZEhWeWJpQlFjbTl0YVhObEtIdGNiaUFnSUNBZ0lDQWdYQ0ozYUdWdVhDSTZJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQjJZV3gxWlR0Y2JpQWdJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDQWdYQ0puWlhSY0lqb2dablZ1WTNScGIyNGdLRzVoYldVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUIyWVd4MVpWdHVZVzFsWFR0Y2JpQWdJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDQWdYQ0p6WlhSY0lqb2dablZ1WTNScGIyNGdLRzVoYldVc0lISm9jeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkbUZzZFdWYmJtRnRaVjBnUFNCeWFITTdYRzRnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FnSUZ3aVpHVnNaWFJsWENJNklHWjFibU4wYVc5dUlDaHVZVzFsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JrWld4bGRHVWdkbUZzZFdWYmJtRnRaVjA3WEc0Z0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBZ0lGd2ljRzl6ZEZ3aU9pQm1kVzVqZEdsdmJpQW9ibUZ0WlN3Z1lYSm5jeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnVFdGeWF5Qk5hV3hzWlhJZ2NISnZjRzl6WlhNZ2RHaGhkQ0J3YjNOMElIZHBkR2dnYm04Z2JtRnRaU0J6YUc5MWJHUWdZWEJ3YkhrZ1lWeHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z2NISnZiV2x6WldRZ1puVnVZM1JwYjI0dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2JtRnRaU0E5UFQwZ2JuVnNiQ0I4ZkNCdVlXMWxJRDA5UFNCMmIybGtJREFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZG1Gc2RXVXVZWEJ3Ykhrb2RtOXBaQ0F3TENCaGNtZHpLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhaaGJIVmxXMjVoYldWZExtRndjR3g1S0haaGJIVmxMQ0JoY21kektUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDQWdYQ0poY0hCc2VWd2lPaUJtZFc1amRHbHZiaUFvZEdocGMzQXNJR0Z5WjNNcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUIyWVd4MVpTNWhjSEJzZVNoMGFHbHpjQ3dnWVhKbmN5azdYRzRnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FnSUZ3aWEyVjVjMXdpT2lCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnYjJKcVpXTjBYMnRsZVhNb2RtRnNkV1VwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlN3Z2RtOXBaQ0F3TENCbWRXNWpkR2x2YmlCcGJuTndaV04wS0NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2V5QnpkR0YwWlRvZ1hDSm1kV3htYVd4c1pXUmNJaXdnZG1Gc2RXVTZJSFpoYkhWbElIMDdYRzRnSUNBZ2ZTazdYRzU5WEc1Y2JpOHFLbHh1SUNvZ1EyOXVkbVZ5ZEhNZ2RHaGxibUZpYkdWeklIUnZJRkVnY0hKdmJXbHpaWE11WEc0Z0tpQkFjR0Z5WVcwZ2NISnZiV2x6WlNCMGFHVnVZV0pzWlNCd2NtOXRhWE5sWEc0Z0tpQkFjbVYwZFhKdWN5QmhJRkVnY0hKdmJXbHpaVnh1SUNvdlhHNW1kVzVqZEdsdmJpQmpiMlZ5WTJVb2NISnZiV2x6WlNrZ2UxeHVJQ0FnSUhaaGNpQmtaV1psY25KbFpDQTlJR1JsWm1WeUtDazdYRzRnSUNBZ1VTNXVaWGgwVkdsamF5aG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdJQ0FnSUhSeWVTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCd2NtOXRhWE5sTG5Sb1pXNG9aR1ZtWlhKeVpXUXVjbVZ6YjJ4MlpTd2daR1ZtWlhKeVpXUXVjbVZxWldOMExDQmtaV1psY25KbFpDNXViM1JwWm5rcE8xeHVJQ0FnSUNBZ0lDQjlJR05oZEdOb0lDaGxlR05sY0hScGIyNHBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHUmxabVZ5Y21Wa0xuSmxhbVZqZENobGVHTmxjSFJwYjI0cE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZTazdYRzRnSUNBZ2NtVjBkWEp1SUdSbFptVnljbVZrTG5CeWIyMXBjMlU3WEc1OVhHNWNiaThxS2x4dUlDb2dRVzV1YjNSaGRHVnpJR0Z1SUc5aWFtVmpkQ0J6ZFdOb0lIUm9ZWFFnYVhRZ2QybHNiQ0J1WlhabGNpQmlaVnh1SUNvZ2RISmhibk5tWlhKeVpXUWdZWGRoZVNCbWNtOXRJSFJvYVhNZ2NISnZZMlZ6Y3lCdmRtVnlJR0Z1ZVNCd2NtOXRhWE5sWEc0Z0tpQmpiMjF0ZFc1cFkyRjBhVzl1SUdOb1lXNXVaV3d1WEc0Z0tpQkFjR0Z5WVcwZ2IySnFaV04wWEc0Z0tpQkFjbVYwZFhKdWN5QndjbTl0YVhObElHRWdkM0poY0hCcGJtY2diMllnZEdoaGRDQnZZbXBsWTNRZ2RHaGhkRnh1SUNvZ1lXUmthWFJwYjI1aGJHeDVJSEpsYzNCdmJtUnpJSFJ2SUhSb1pTQmNJbWx6UkdWbVhDSWdiV1Z6YzJGblpWeHVJQ29nZDJsMGFHOTFkQ0JoSUhKbGFtVmpkR2x2Ymk1Y2JpQXFMMXh1VVM1dFlYTjBaWElnUFNCdFlYTjBaWEk3WEc1bWRXNWpkR2x2YmlCdFlYTjBaWElvYjJKcVpXTjBLU0I3WEc0Z0lDQWdjbVYwZFhKdUlGQnliMjFwYzJVb2UxeHVJQ0FnSUNBZ0lDQmNJbWx6UkdWbVhDSTZJR1oxYm1OMGFXOXVJQ2dwSUh0OVhHNGdJQ0FnZlN3Z1puVnVZM1JwYjI0Z1ptRnNiR0poWTJzb2IzQXNJR0Z5WjNNcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHUnBjM0JoZEdOb0tHOWlhbVZqZEN3Z2IzQXNJR0Z5WjNNcE8xeHVJQ0FnSUgwc0lHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRkVvYjJKcVpXTjBLUzVwYm5Od1pXTjBLQ2s3WEc0Z0lDQWdmU2s3WEc1OVhHNWNiaThxS2x4dUlDb2dVM0J5WldGa2N5QjBhR1VnZG1Gc2RXVnpJRzltSUdFZ2NISnZiV2x6WldRZ1lYSnlZWGtnYjJZZ1lYSm5kVzFsYm5SeklHbHVkRzhnZEdobFhHNGdLaUJtZFd4bWFXeHNiV1Z1ZENCallXeHNZbUZqYXk1Y2JpQXFJRUJ3WVhKaGJTQm1kV3htYVd4c1pXUWdZMkZzYkdKaFkyc2dkR2hoZENCeVpXTmxhWFpsY3lCMllYSnBZV1JwWXlCaGNtZDFiV1Z1ZEhNZ1puSnZiU0IwYUdWY2JpQXFJSEJ5YjIxcGMyVmtJR0Z5Y21GNVhHNGdLaUJBY0dGeVlXMGdjbVZxWldOMFpXUWdZMkZzYkdKaFkyc2dkR2hoZENCeVpXTmxhWFpsY3lCMGFHVWdaWGhqWlhCMGFXOXVJR2xtSUhSb1pTQndjbTl0YVhObFhHNGdLaUJwY3lCeVpXcGxZM1JsWkM1Y2JpQXFJRUJ5WlhSMWNtNXpJR0VnY0hKdmJXbHpaU0JtYjNJZ2RHaGxJSEpsZEhWeWJpQjJZV3gxWlNCdmNpQjBhSEp2ZDI0Z1pYaGpaWEIwYVc5dUlHOW1YRzRnS2lCbGFYUm9aWElnWTJGc2JHSmhZMnN1WEc0Z0tpOWNibEV1YzNCeVpXRmtJRDBnYzNCeVpXRmtPMXh1Wm5WdVkzUnBiMjRnYzNCeVpXRmtLSFpoYkhWbExDQm1kV3htYVd4c1pXUXNJSEpsYW1WamRHVmtLU0I3WEc0Z0lDQWdjbVYwZFhKdUlGRW9kbUZzZFdVcExuTndjbVZoWkNobWRXeG1hV3hzWldRc0lISmxhbVZqZEdWa0tUdGNibjFjYmx4dVVISnZiV2x6WlM1d2NtOTBiM1I1Y0dVdWMzQnlaV0ZrSUQwZ1puVnVZM1JwYjI0Z0tHWjFiR1pwYkd4bFpDd2djbVZxWldOMFpXUXBJSHRjYmlBZ0lDQnlaWFIxY200Z2RHaHBjeTVoYkd3b0tTNTBhR1Z1S0daMWJtTjBhVzl1SUNoaGNuSmhlU2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWm5Wc1ptbHNiR1ZrTG1Gd2NHeDVLSFp2YVdRZ01Dd2dZWEp5WVhrcE8xeHVJQ0FnSUgwc0lISmxhbVZqZEdWa0tUdGNibjA3WEc1Y2JpOHFLbHh1SUNvZ1ZHaGxJR0Z6ZVc1aklHWjFibU4wYVc5dUlHbHpJR0VnWkdWamIzSmhkRzl5SUdadmNpQm5aVzVsY21GMGIzSWdablZ1WTNScGIyNXpMQ0IwZFhKdWFXNW5YRzRnS2lCMGFHVnRJR2x1ZEc4Z1lYTjVibU5vY205dWIzVnpJR2RsYm1WeVlYUnZjbk11SUNCQmJIUm9iM1ZuYUNCblpXNWxjbUYwYjNKeklHRnlaU0J2Ym14NUlIQmhjblJjYmlBcUlHOW1JSFJvWlNCdVpYZGxjM1FnUlVOTlFWTmpjbWx3ZENBMklHUnlZV1owY3l3Z2RHaHBjeUJqYjJSbElHUnZaWE1nYm05MElHTmhkWE5sSUhONWJuUmhlRnh1SUNvZ1pYSnliM0p6SUdsdUlHOXNaR1Z5SUdWdVoybHVaWE11SUNCVWFHbHpJR052WkdVZ2MyaHZkV3hrSUdOdmJuUnBiblZsSUhSdklIZHZjbXNnWVc1a0lIZHBiR3hjYmlBcUlHbHVJR1poWTNRZ2FXMXdjbTkyWlNCdmRtVnlJSFJwYldVZ1lYTWdkR2hsSUd4aGJtZDFZV2RsSUdsdGNISnZkbVZ6TGx4dUlDcGNiaUFxSUVWVE5pQm5aVzVsY21GMGIzSnpJR0Z5WlNCamRYSnlaVzUwYkhrZ2NHRnlkQ0J2WmlCV09DQjJaWEp6YVc5dUlETXVNVGtnZDJsMGFDQjBhR1ZjYmlBcUlDMHRhR0Z5Ylc5dWVTMW5aVzVsY21GMGIzSnpJSEoxYm5ScGJXVWdabXhoWnlCbGJtRmliR1ZrTGlBZ1UzQnBaR1Z5VFc5dWEyVjVJR2hoY3lCb1lXUWdkR2hsYlZ4dUlDb2dabTl5SUd4dmJtZGxjaXdnWW5WMElIVnVaR1Z5SUdGdUlHOXNaR1Z5SUZCNWRHaHZiaTFwYm5Od2FYSmxaQ0JtYjNKdExpQWdWR2hwY3lCbWRXNWpkR2x2Ymx4dUlDb2dkMjl5YTNNZ2IyNGdZbTkwYUNCcmFXNWtjeUJ2WmlCblpXNWxjbUYwYjNKekxseHVJQ3BjYmlBcUlFUmxZMjl5WVhSbGN5QmhJR2RsYm1WeVlYUnZjaUJtZFc1amRHbHZiaUJ6ZFdOb0lIUm9ZWFE2WEc0Z0tpQWdMU0JwZENCdFlYa2dlV2xsYkdRZ2NISnZiV2x6WlhOY2JpQXFJQ0F0SUdWNFpXTjFkR2x2YmlCM2FXeHNJR052Ym5ScGJuVmxJSGRvWlc0Z2RHaGhkQ0J3Y205dGFYTmxJR2x6SUdaMWJHWnBiR3hsWkZ4dUlDb2dJQzBnZEdobElIWmhiSFZsSUc5bUlIUm9aU0I1YVdWc1pDQmxlSEJ5WlhOemFXOXVJSGRwYkd3Z1ltVWdkR2hsSUdaMWJHWnBiR3hsWkNCMllXeDFaVnh1SUNvZ0lDMGdhWFFnY21WMGRYSnVjeUJoSUhCeWIyMXBjMlVnWm05eUlIUm9aU0J5WlhSMWNtNGdkbUZzZFdVZ0tIZG9aVzRnZEdobElHZGxibVZ5WVhSdmNseHVJQ29nSUNBZ2MzUnZjSE1nYVhSbGNtRjBhVzVuS1Z4dUlDb2dJQzBnZEdobElHUmxZMjl5WVhSbFpDQm1kVzVqZEdsdmJpQnlaWFIxY201eklHRWdjSEp2YldselpTQm1iM0lnZEdobElISmxkSFZ5YmlCMllXeDFaVnh1SUNvZ0lDQWdiMllnZEdobElHZGxibVZ5WVhSdmNpQnZjaUIwYUdVZ1ptbHljM1FnY21WcVpXTjBaV1FnY0hKdmJXbHpaU0JoYlc5dVp5QjBhRzl6WlZ4dUlDb2dJQ0FnZVdsbGJHUmxaQzVjYmlBcUlDQXRJR2xtSUdGdUlHVnljbTl5SUdseklIUm9jbTkzYmlCcGJpQjBhR1VnWjJWdVpYSmhkRzl5TENCcGRDQndjbTl3WVdkaGRHVnpJSFJvY205MVoyaGNiaUFxSUNBZ0lHVjJaWEo1SUdadmJHeHZkMmx1WnlCNWFXVnNaQ0IxYm5ScGJDQnBkQ0JwY3lCallYVm5hSFFzSUc5eUlIVnVkR2xzSUdsMElHVnpZMkZ3WlhOY2JpQXFJQ0FnSUhSb1pTQm5aVzVsY21GMGIzSWdablZ1WTNScGIyNGdZV3gwYjJkbGRHaGxjaXdnWVc1a0lHbHpJSFJ5WVc1emJHRjBaV1FnYVc1MGJ5QmhYRzRnS2lBZ0lDQnlaV3BsWTNScGIyNGdabTl5SUhSb1pTQndjbTl0YVhObElISmxkSFZ5Ym1Wa0lHSjVJSFJvWlNCa1pXTnZjbUYwWldRZ1oyVnVaWEpoZEc5eUxseHVJQ292WEc1UkxtRnplVzVqSUQwZ1lYTjVibU03WEc1bWRXNWpkR2x2YmlCaGMzbHVZeWh0WVd0bFIyVnVaWEpoZEc5eUtTQjdYRzRnSUNBZ2NtVjBkWEp1SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNBZ0lDQWdMeThnZDJobGJpQjJaWEppSUdseklGd2ljMlZ1WkZ3aUxDQmhjbWNnYVhNZ1lTQjJZV3gxWlZ4dUlDQWdJQ0FnSUNBdkx5QjNhR1Z1SUhabGNtSWdhWE1nWENKMGFISnZkMXdpTENCaGNtY2dhWE1nWVc0Z1pYaGpaWEIwYVc5dVhHNGdJQ0FnSUNBZ0lHWjFibU4wYVc5dUlHTnZiblJwYm5WbGNpaDJaWEppTENCaGNtY3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIWmhjaUJ5WlhOMWJIUTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJRlZ1ZEdsc0lGWTRJRE11TVRrZ0x5QkRhSEp2YldsMWJTQXlPU0JwY3lCeVpXeGxZWE5sWkN3Z1UzQnBaR1Z5VFc5dWEyVjVJR2x6SUhSb1pTQnZibXg1WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJsYm1kcGJtVWdkR2hoZENCb1lYTWdZU0JrWlhCc2IzbGxaQ0JpWVhObElHOW1JR0p5YjNkelpYSnpJSFJvWVhRZ2MzVndjRzl5ZENCblpXNWxjbUYwYjNKekxseHVJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1NHOTNaWFpsY2l3Z1UwMG5jeUJuWlc1bGNtRjBiM0p6SUhWelpTQjBhR1VnVUhsMGFHOXVMV2x1YzNCcGNtVmtJSE5sYldGdWRHbGpjeUJ2Wmx4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnYjNWMFpHRjBaV1FnUlZNMklHUnlZV1owY3k0Z0lGZGxJSGR2ZFd4a0lHeHBhMlVnZEc4Z2MzVndjRzl5ZENCRlV6WXNJR0oxZENCM1pTZGtJR0ZzYzI5Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUd4cGEyVWdkRzhnYldGclpTQnBkQ0J3YjNOemFXSnNaU0IwYnlCMWMyVWdaMlZ1WlhKaGRHOXljeUJwYmlCa1pYQnNiM2xsWkNCaWNtOTNjMlZ5Y3l3Z2MyOWNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklIZGxJR0ZzYzI4Z2MzVndjRzl5ZENCUWVYUm9iMjR0YzNSNWJHVWdaMlZ1WlhKaGRHOXljeTRnSUVGMElITnZiV1VnY0c5cGJuUWdkMlVnWTJGdUlISmxiVzkyWlZ4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnZEdocGN5QmliRzlqYXk1Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIUjVjR1Z2WmlCVGRHOXdTWFJsY21GMGFXOXVJRDA5UFNCY0luVnVaR1ZtYVc1bFpGd2lLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1JWTTJJRWRsYm1WeVlYUnZjbk5jYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwY25rZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhOMWJIUWdQU0JuWlc1bGNtRjBiM0piZG1WeVlsMG9ZWEpuS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHTmhkR05vSUNobGVHTmxjSFJwYjI0cElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSEpsYW1WamRDaGxlR05sY0hScGIyNHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2NtVnpkV3gwTG1SdmJtVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUZFb2NtVnpkV3gwTG5aaGJIVmxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZDJobGJpaHlaWE4xYkhRdWRtRnNkV1VzSUdOaGJHeGlZV05yTENCbGNuSmlZV05yS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUZOd2FXUmxjazF2Ym10bGVTQkhaVzVsY21GMGIzSnpYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnUmtsWVRVVTZJRkpsYlc5MlpTQjBhR2x6SUdOaGMyVWdkMmhsYmlCVFRTQmtiMlZ6SUVWVE5pQm5aVzVsY21GMGIzSnpMbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzNWc2RDQTlJR2RsYm1WeVlYUnZjbHQyWlhKaVhTaGhjbWNwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwZ1kyRjBZMmdnS0dWNFkyVndkR2x2YmlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2FYTlRkRzl3U1hSbGNtRjBhVzl1S0dWNFkyVndkR2x2YmlrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCUktHVjRZMlZ3ZEdsdmJpNTJZV3gxWlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2NtVnFaV04wS0dWNFkyVndkR2x2YmlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSGRvWlc0b2NtVnpkV3gwTENCallXeHNZbUZqYXl3Z1pYSnlZbUZqYXlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2RtRnlJR2RsYm1WeVlYUnZjaUE5SUcxaGEyVkhaVzVsY21GMGIzSXVZWEJ3Ykhrb2RHaHBjeXdnWVhKbmRXMWxiblJ6S1R0Y2JpQWdJQ0FnSUNBZ2RtRnlJR05oYkd4aVlXTnJJRDBnWTI5dWRHbHVkV1Z5TG1KcGJtUW9ZMjl1ZEdsdWRXVnlMQ0JjSW01bGVIUmNJaWs3WEc0Z0lDQWdJQ0FnSUhaaGNpQmxjbkppWVdOcklEMGdZMjl1ZEdsdWRXVnlMbUpwYm1Rb1kyOXVkR2x1ZFdWeUxDQmNJblJvY205M1hDSXBPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdZMkZzYkdKaFkyc29LVHRjYmlBZ0lDQjlPMXh1ZlZ4dVhHNHZLaXBjYmlBcUlGUm9aU0J6Y0dGM2JpQm1kVzVqZEdsdmJpQnBjeUJoSUhOdFlXeHNJSGR5WVhCd1pYSWdZWEp2ZFc1a0lHRnplVzVqSUhSb1lYUWdhVzF0WldScFlYUmxiSGxjYmlBcUlHTmhiR3h6SUhSb1pTQm5aVzVsY21GMGIzSWdZVzVrSUdGc2MyOGdaVzVrY3lCMGFHVWdjSEp2YldselpTQmphR0ZwYml3Z2MyOGdkR2hoZENCaGJubGNiaUFxSUhWdWFHRnVaR3hsWkNCbGNuSnZjbk1nWVhKbElIUm9jbTkzYmlCcGJuTjBaV0ZrSUc5bUlHWnZjbmRoY21SbFpDQjBieUIwYUdVZ1pYSnliM0pjYmlBcUlHaGhibVJzWlhJdUlGUm9hWE1nYVhNZ2RYTmxablZzSUdKbFkyRjFjMlVnYVhRbmN5QmxlSFJ5WlcxbGJIa2dZMjl0Ylc5dUlIUnZJSEoxYmx4dUlDb2daMlZ1WlhKaGRHOXljeUJoZENCMGFHVWdkRzl3TFd4bGRtVnNJSFJ2SUhkdmNtc2dkMmwwYUNCc2FXSnlZWEpwWlhNdVhHNGdLaTljYmxFdWMzQmhkMjRnUFNCemNHRjNianRjYm1aMWJtTjBhVzl1SUhOd1lYZHVLRzFoYTJWSFpXNWxjbUYwYjNJcElIdGNiaUFnSUNCUkxtUnZibVVvVVM1aGMzbHVZeWh0WVd0bFIyVnVaWEpoZEc5eUtTZ3BLVHRjYm4xY2JseHVMeThnUmtsWVRVVTZJRkpsYlc5MlpTQjBhR2x6SUdsdWRHVnlabUZqWlNCdmJtTmxJRVZUTmlCblpXNWxjbUYwYjNKeklHRnlaU0JwYmlCVGNHbGtaWEpOYjI1clpYa3VYRzR2S2lwY2JpQXFJRlJvY205M2N5QmhJRkpsZEhWeWJsWmhiSFZsSUdWNFkyVndkR2x2YmlCMGJ5QnpkRzl3SUdGdUlHRnplVzVqYUhKdmJtOTFjeUJuWlc1bGNtRjBiM0l1WEc0Z0tseHVJQ29nVkdocGN5QnBiblJsY21aaFkyVWdhWE1nWVNCemRHOXdMV2RoY0NCdFpXRnpkWEpsSUhSdklITjFjSEJ2Y25RZ1oyVnVaWEpoZEc5eUlISmxkSFZ5Ymx4dUlDb2dkbUZzZFdWeklHbHVJRzlzWkdWeUlFWnBjbVZtYjNndlUzQnBaR1Z5VFc5dWEyVjVMaUFnU1c0Z1luSnZkM05sY25NZ2RHaGhkQ0J6ZFhCd2IzSjBJRVZUTmx4dUlDb2daMlZ1WlhKaGRHOXljeUJzYVd0bElFTm9jbTl0YVhWdElESTVMQ0JxZFhOMElIVnpaU0JjSW5KbGRIVnlibHdpSUdsdUlIbHZkWElnWjJWdVpYSmhkRzl5WEc0Z0tpQm1kVzVqZEdsdmJuTXVYRzRnS2x4dUlDb2dRSEJoY21GdElIWmhiSFZsSUhSb1pTQnlaWFIxY200Z2RtRnNkV1VnWm05eUlIUm9aU0J6ZFhKeWIzVnVaR2x1WnlCblpXNWxjbUYwYjNKY2JpQXFJRUIwYUhKdmQzTWdVbVYwZFhKdVZtRnNkV1VnWlhoalpYQjBhVzl1SUhkcGRHZ2dkR2hsSUhaaGJIVmxMbHh1SUNvZ1FHVjRZVzF3YkdWY2JpQXFJQzh2SUVWVE5pQnpkSGxzWlZ4dUlDb2dVUzVoYzNsdVl5aG1kVzVqZEdsdmJpb2dLQ2tnZTF4dUlDb2dJQ0FnSUNCMllYSWdabTl2SUQwZ2VXbGxiR1FnWjJWMFJtOXZVSEp2YldselpTZ3BPMXh1SUNvZ0lDQWdJQ0IyWVhJZ1ltRnlJRDBnZVdsbGJHUWdaMlYwUW1GeVVISnZiV2x6WlNncE8xeHVJQ29nSUNBZ0lDQnlaWFIxY200Z1ptOXZJQ3NnWW1GeU8xeHVJQ29nZlNsY2JpQXFJQzh2SUU5c1pHVnlJRk53YVdSbGNrMXZibXRsZVNCemRIbHNaVnh1SUNvZ1VTNWhjM2x1WXlobWRXNWpkR2x2YmlBb0tTQjdYRzRnS2lBZ0lDQWdJSFpoY2lCbWIyOGdQU0I1YVdWc1pDQm5aWFJHYjI5UWNtOXRhWE5sS0NrN1hHNGdLaUFnSUNBZ0lIWmhjaUJpWVhJZ1BTQjVhV1ZzWkNCblpYUkNZWEpRY205dGFYTmxLQ2s3WEc0Z0tpQWdJQ0FnSUZFdWNtVjBkWEp1S0dadmJ5QXJJR0poY2lrN1hHNGdLaUI5S1Z4dUlDb3ZYRzVSVzF3aWNtVjBkWEp1WENKZElEMGdYM0psZEhWeWJqdGNibVoxYm1OMGFXOXVJRjl5WlhSMWNtNG9kbUZzZFdVcElIdGNiaUFnSUNCMGFISnZkeUJ1WlhjZ1VWSmxkSFZ5YmxaaGJIVmxLSFpoYkhWbEtUdGNibjFjYmx4dUx5b3FYRzRnS2lCVWFHVWdjSEp2YldselpXUWdablZ1WTNScGIyNGdaR1ZqYjNKaGRHOXlJR1Z1YzNWeVpYTWdkR2hoZENCaGJua2djSEp2YldselpTQmhjbWQxYldWdWRITmNiaUFxSUdGeVpTQnpaWFIwYkdWa0lHRnVaQ0J3WVhOelpXUWdZWE1nZG1Gc2RXVnpJQ2hnZEdocGMyQWdhWE1nWVd4emJ5QnpaWFIwYkdWa0lHRnVaQ0J3WVhOelpXUmNiaUFxSUdGeklHRWdkbUZzZFdVcExpQWdTWFFnZDJsc2JDQmhiSE52SUdWdWMzVnlaU0IwYUdGMElIUm9aU0J5WlhOMWJIUWdiMllnWVNCbWRXNWpkR2x2YmlCcGMxeHVJQ29nWVd4M1lYbHpJR0VnY0hKdmJXbHpaUzVjYmlBcVhHNGdLaUJBWlhoaGJYQnNaVnh1SUNvZ2RtRnlJR0ZrWkNBOUlGRXVjSEp2YldselpXUW9ablZ1WTNScGIyNGdLR0VzSUdJcElIdGNiaUFxSUNBZ0lDQnlaWFIxY200Z1lTQXJJR0k3WEc0Z0tpQjlLVHRjYmlBcUlHRmtaQ2hSS0dFcExDQlJLRUlwS1R0Y2JpQXFYRzRnS2lCQWNHRnlZVzBnZTJaMWJtTjBhVzl1ZlNCallXeHNZbUZqYXlCVWFHVWdablZ1WTNScGIyNGdkRzhnWkdWamIzSmhkR1ZjYmlBcUlFQnlaWFIxY201eklIdG1kVzVqZEdsdmJuMGdZU0JtZFc1amRHbHZiaUIwYUdGMElHaGhjeUJpWldWdUlHUmxZMjl5WVhSbFpDNWNiaUFxTDF4dVVTNXdjbTl0YVhObFpDQTlJSEJ5YjIxcGMyVmtPMXh1Wm5WdVkzUnBiMjRnY0hKdmJXbHpaV1FvWTJGc2JHSmhZMnNwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYzNCeVpXRmtLRnQwYUdsekxDQmhiR3dvWVhKbmRXMWxiblJ6S1Ywc0lHWjFibU4wYVc5dUlDaHpaV3htTENCaGNtZHpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z1kyRnNiR0poWTJzdVlYQndiSGtvYzJWc1ppd2dZWEpuY3lrN1hHNGdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lIMDdYRzU5WEc1Y2JpOHFLbHh1SUNvZ2MyVnVaSE1nWVNCdFpYTnpZV2RsSUhSdklHRWdkbUZzZFdVZ2FXNGdZU0JtZFhSMWNtVWdkSFZ5Ymx4dUlDb2dRSEJoY21GdElHOWlhbVZqZENvZ2RHaGxJSEpsWTJsd2FXVnVkRnh1SUNvZ1FIQmhjbUZ0SUc5d0lIUm9aU0J1WVcxbElHOW1JSFJvWlNCdFpYTnpZV2RsSUc5d1pYSmhkR2x2Yml3Z1pTNW5MaXdnWENKM2FHVnVYQ0lzWEc0Z0tpQkFjR0Z5WVcwZ1lYSm5jeUJtZFhKMGFHVnlJR0Z5WjNWdFpXNTBjeUIwYnlCaVpTQm1iM0ozWVhKa1pXUWdkRzhnZEdobElHOXdaWEpoZEdsdmJseHVJQ29nUUhKbGRIVnlibk1nY21WemRXeDBJSHRRY205dGFYTmxmU0JoSUhCeWIyMXBjMlVnWm05eUlIUm9aU0J5WlhOMWJIUWdiMllnZEdobElHOXdaWEpoZEdsdmJseHVJQ292WEc1UkxtUnBjM0JoZEdOb0lEMGdaR2x6Y0dGMFkyZzdYRzVtZFc1amRHbHZiaUJrYVhOd1lYUmphQ2h2WW1wbFkzUXNJRzl3TENCaGNtZHpLU0I3WEc0Z0lDQWdjbVYwZFhKdUlGRW9iMkpxWldOMEtTNWthWE53WVhSamFDaHZjQ3dnWVhKbmN5azdYRzU5WEc1Y2JsQnliMjFwYzJVdWNISnZkRzkwZVhCbExtUnBjM0JoZEdOb0lEMGdablZ1WTNScGIyNGdLRzl3TENCaGNtZHpLU0I3WEc0Z0lDQWdkbUZ5SUhObGJHWWdQU0IwYUdsek8xeHVJQ0FnSUhaaGNpQmtaV1psY25KbFpDQTlJR1JsWm1WeUtDazdYRzRnSUNBZ1VTNXVaWGgwVkdsamF5aG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdJQ0FnSUhObGJHWXVjSEp2YldselpVUnBjM0JoZEdOb0tHUmxabVZ5Y21Wa0xuSmxjMjlzZG1Vc0lHOXdMQ0JoY21kektUdGNiaUFnSUNCOUtUdGNiaUFnSUNCeVpYUjFjbTRnWkdWbVpYSnlaV1F1Y0hKdmJXbHpaVHRjYm4wN1hHNWNiaThxS2x4dUlDb2dSMlYwY3lCMGFHVWdkbUZzZFdVZ2IyWWdZU0J3Y205d1pYSjBlU0JwYmlCaElHWjFkSFZ5WlNCMGRYSnVMbHh1SUNvZ1FIQmhjbUZ0SUc5aWFtVmpkQ0FnSUNCd2NtOXRhWE5sSUc5eUlHbHRiV1ZrYVdGMFpTQnlaV1psY21WdVkyVWdabTl5SUhSaGNtZGxkQ0J2WW1wbFkzUmNiaUFxSUVCd1lYSmhiU0J1WVcxbElDQWdJQ0FnYm1GdFpTQnZaaUJ3Y205d1pYSjBlU0IwYnlCblpYUmNiaUFxSUVCeVpYUjFjbTRnY0hKdmJXbHpaU0JtYjNJZ2RHaGxJSEJ5YjNCbGNuUjVJSFpoYkhWbFhHNGdLaTljYmxFdVoyVjBJRDBnWm5WdVkzUnBiMjRnS0c5aWFtVmpkQ3dnYTJWNUtTQjdYRzRnSUNBZ2NtVjBkWEp1SUZFb2IySnFaV04wS1M1a2FYTndZWFJqYUNoY0ltZGxkRndpTENCYmEyVjVYU2s3WEc1OU8xeHVYRzVRY205dGFYTmxMbkJ5YjNSdmRIbHdaUzVuWlhRZ1BTQm1kVzVqZEdsdmJpQW9hMlY1S1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdVpHbHpjR0YwWTJnb1hDSm5aWFJjSWl3Z1cydGxlVjBwTzF4dWZUdGNibHh1THlvcVhHNGdLaUJUWlhSeklIUm9aU0IyWVd4MVpTQnZaaUJoSUhCeWIzQmxjblI1SUdsdUlHRWdablYwZFhKbElIUjFjbTR1WEc0Z0tpQkFjR0Z5WVcwZ2IySnFaV04wSUNBZ0lIQnliMjFwYzJVZ2IzSWdhVzF0WldScFlYUmxJSEpsWm1WeVpXNWpaU0JtYjNJZ2IySnFaV04wSUc5aWFtVmpkRnh1SUNvZ1FIQmhjbUZ0SUc1aGJXVWdJQ0FnSUNCdVlXMWxJRzltSUhCeWIzQmxjblI1SUhSdklITmxkRnh1SUNvZ1FIQmhjbUZ0SUhaaGJIVmxJQ0FnSUNCdVpYY2dkbUZzZFdVZ2IyWWdjSEp2Y0dWeWRIbGNiaUFxSUVCeVpYUjFjbTRnY0hKdmJXbHpaU0JtYjNJZ2RHaGxJSEpsZEhWeWJpQjJZV3gxWlZ4dUlDb3ZYRzVSTG5ObGRDQTlJR1oxYm1OMGFXOXVJQ2h2WW1wbFkzUXNJR3RsZVN3Z2RtRnNkV1VwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdVU2h2WW1wbFkzUXBMbVJwYzNCaGRHTm9LRndpYzJWMFhDSXNJRnRyWlhrc0lIWmhiSFZsWFNrN1hHNTlPMXh1WEc1UWNtOXRhWE5sTG5CeWIzUnZkSGx3WlM1elpYUWdQU0JtZFc1amRHbHZiaUFvYTJWNUxDQjJZV3gxWlNrZ2UxeHVJQ0FnSUhKbGRIVnliaUIwYUdsekxtUnBjM0JoZEdOb0tGd2ljMlYwWENJc0lGdHJaWGtzSUhaaGJIVmxYU2s3WEc1OU8xeHVYRzR2S2lwY2JpQXFJRVJsYkdWMFpYTWdZU0J3Y205d1pYSjBlU0JwYmlCaElHWjFkSFZ5WlNCMGRYSnVMbHh1SUNvZ1FIQmhjbUZ0SUc5aWFtVmpkQ0FnSUNCd2NtOXRhWE5sSUc5eUlHbHRiV1ZrYVdGMFpTQnlaV1psY21WdVkyVWdabTl5SUhSaGNtZGxkQ0J2WW1wbFkzUmNiaUFxSUVCd1lYSmhiU0J1WVcxbElDQWdJQ0FnYm1GdFpTQnZaaUJ3Y205d1pYSjBlU0IwYnlCa1pXeGxkR1ZjYmlBcUlFQnlaWFIxY200Z2NISnZiV2x6WlNCbWIzSWdkR2hsSUhKbGRIVnliaUIyWVd4MVpWeHVJQ292WEc1UkxtUmxiQ0E5SUM4dklGaFlXQ0JzWldkaFkzbGNibEZiWENKa1pXeGxkR1ZjSWwwZ1BTQm1kVzVqZEdsdmJpQW9iMkpxWldOMExDQnJaWGtwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdVU2h2WW1wbFkzUXBMbVJwYzNCaGRHTm9LRndpWkdWc1pYUmxYQ0lzSUZ0clpYbGRLVHRjYm4wN1hHNWNibEJ5YjIxcGMyVXVjSEp2ZEc5MGVYQmxMbVJsYkNBOUlDOHZJRmhZV0NCc1pXZGhZM2xjYmxCeWIyMXBjMlV1Y0hKdmRHOTBlWEJsVzF3aVpHVnNaWFJsWENKZElEMGdablZ1WTNScGIyNGdLR3RsZVNrZ2UxeHVJQ0FnSUhKbGRIVnliaUIwYUdsekxtUnBjM0JoZEdOb0tGd2laR1ZzWlhSbFhDSXNJRnRyWlhsZEtUdGNibjA3WEc1Y2JpOHFLbHh1SUNvZ1NXNTJiMnRsY3lCaElHMWxkR2h2WkNCcGJpQmhJR1oxZEhWeVpTQjBkWEp1TGx4dUlDb2dRSEJoY21GdElHOWlhbVZqZENBZ0lDQndjbTl0YVhObElHOXlJR2x0YldWa2FXRjBaU0J5WldabGNtVnVZMlVnWm05eUlIUmhjbWRsZENCdlltcGxZM1JjYmlBcUlFQndZWEpoYlNCdVlXMWxJQ0FnSUNBZ2JtRnRaU0J2WmlCdFpYUm9iMlFnZEc4Z2FXNTJiMnRsWEc0Z0tpQkFjR0Z5WVcwZ2RtRnNkV1VnSUNBZ0lHRWdkbUZzZFdVZ2RHOGdjRzl6ZEN3Z2RIbHdhV05oYkd4NUlHRnVJR0Z5Y21GNUlHOW1YRzRnS2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsdWRtOWpZWFJwYjI0Z1lYSm5kVzFsYm5SeklHWnZjaUJ3Y205dGFYTmxjeUIwYUdGMFhHNGdLaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0Z5WlNCMWJIUnBiV0YwWld4NUlHSmhZMnRsWkNCM2FYUm9JR0J5WlhOdmJIWmxZQ0IyWVd4MVpYTXNYRzRnS2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGeklHOXdjRzl6WldRZ2RHOGdkR2h2YzJVZ1ltRmphMlZrSUhkcGRHZ2dWVkpNYzF4dUlDb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjNhR1Z5WldsdUlIUm9aU0J3YjNOMFpXUWdkbUZzZFdVZ1kyRnVJR0psSUdGdWVWeHVJQ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JLVTA5T0lITmxjbWxoYkdsNllXSnNaU0J2WW1wbFkzUXVYRzRnS2lCQWNtVjBkWEp1SUhCeWIyMXBjMlVnWm05eUlIUm9aU0J5WlhSMWNtNGdkbUZzZFdWY2JpQXFMMXh1THk4Z1ltOTFibVFnYkc5allXeHNlU0JpWldOaGRYTmxJR2wwSUdseklIVnpaV1FnWW5rZ2IzUm9aWElnYldWMGFHOWtjMXh1VVM1dFlYQndiSGtnUFNBdkx5QllXRmdnUVhNZ2NISnZjRzl6WldRZ1lua2dYQ0pTWldSellXNWtjbTljSWx4dVVTNXdiM04wSUQwZ1puVnVZM1JwYjI0Z0tHOWlhbVZqZEN3Z2JtRnRaU3dnWVhKbmN5a2dlMXh1SUNBZ0lISmxkSFZ5YmlCUktHOWlhbVZqZENrdVpHbHpjR0YwWTJnb1hDSndiM04wWENJc0lGdHVZVzFsTENCaGNtZHpYU2s3WEc1OU8xeHVYRzVRY205dGFYTmxMbkJ5YjNSdmRIbHdaUzV0WVhCd2JIa2dQU0F2THlCWVdGZ2dRWE1nY0hKdmNHOXpaV1FnWW5rZ1hDSlNaV1J6WVc1a2NtOWNJbHh1VUhKdmJXbHpaUzV3Y205MGIzUjVjR1V1Y0c5emRDQTlJR1oxYm1OMGFXOXVJQ2h1WVcxbExDQmhjbWR6S1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdVpHbHpjR0YwWTJnb1hDSndiM04wWENJc0lGdHVZVzFsTENCaGNtZHpYU2s3WEc1OU8xeHVYRzR2S2lwY2JpQXFJRWx1ZG05clpYTWdZU0J0WlhSb2IyUWdhVzRnWVNCbWRYUjFjbVVnZEhWeWJpNWNiaUFxSUVCd1lYSmhiU0J2WW1wbFkzUWdJQ0FnY0hKdmJXbHpaU0J2Y2lCcGJXMWxaR2xoZEdVZ2NtVm1aWEpsYm1ObElHWnZjaUIwWVhKblpYUWdiMkpxWldOMFhHNGdLaUJBY0dGeVlXMGdibUZ0WlNBZ0lDQWdJRzVoYldVZ2IyWWdiV1YwYUc5a0lIUnZJR2x1ZG05clpWeHVJQ29nUUhCaGNtRnRJQzR1TG1GeVozTWdJQ0JoY25KaGVTQnZaaUJwYm5adlkyRjBhVzl1SUdGeVozVnRaVzUwYzF4dUlDb2dRSEpsZEhWeWJpQndjbTl0YVhObElHWnZjaUIwYUdVZ2NtVjBkWEp1SUhaaGJIVmxYRzRnS2k5Y2JsRXVjMlZ1WkNBOUlDOHZJRmhZV0NCTllYSnJJRTFwYkd4bGNpZHpJSEJ5YjNCdmMyVmtJSEJoY214aGJtTmxYRzVSTG0xallXeHNJRDBnTHk4Z1dGaFlJRUZ6SUhCeWIzQnZjMlZrSUdKNUlGd2lVbVZrYzJGdVpISnZYQ0pjYmxFdWFXNTJiMnRsSUQwZ1puVnVZM1JwYjI0Z0tHOWlhbVZqZEN3Z2JtRnRaU0F2S2k0dUxtRnlaM01xTHlrZ2UxeHVJQ0FnSUhKbGRIVnliaUJSS0c5aWFtVmpkQ2t1WkdsemNHRjBZMmdvWENKd2IzTjBYQ0lzSUZ0dVlXMWxMQ0JoY25KaGVWOXpiR2xqWlNoaGNtZDFiV1Z1ZEhNc0lESXBYU2s3WEc1OU8xeHVYRzVRY205dGFYTmxMbkJ5YjNSdmRIbHdaUzV6Wlc1a0lEMGdMeThnV0ZoWUlFMWhjbXNnVFdsc2JHVnlKM01nY0hKdmNHOXpaV1FnY0dGeWJHRnVZMlZjYmxCeWIyMXBjMlV1Y0hKdmRHOTBlWEJsTG0xallXeHNJRDBnTHk4Z1dGaFlJRUZ6SUhCeWIzQnZjMlZrSUdKNUlGd2lVbVZrYzJGdVpISnZYQ0pjYmxCeWIyMXBjMlV1Y0hKdmRHOTBlWEJsTG1sdWRtOXJaU0E5SUdaMWJtTjBhVzl1SUNodVlXMWxJQzhxTGk0dVlYSm5jeW92S1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdVpHbHpjR0YwWTJnb1hDSndiM04wWENJc0lGdHVZVzFsTENCaGNuSmhlVjl6YkdsalpTaGhjbWQxYldWdWRITXNJREVwWFNrN1hHNTlPMXh1WEc0dktpcGNiaUFxSUVGd2NHeHBaWE1nZEdobElIQnliMjFwYzJWa0lHWjFibU4wYVc5dUlHbHVJR0VnWm5WMGRYSmxJSFIxY200dVhHNGdLaUJBY0dGeVlXMGdiMkpxWldOMElDQWdJSEJ5YjIxcGMyVWdiM0lnYVcxdFpXUnBZWFJsSUhKbFptVnlaVzVqWlNCbWIzSWdkR0Z5WjJWMElHWjFibU4wYVc5dVhHNGdLaUJBY0dGeVlXMGdZWEpuY3lBZ0lDQWdJR0Z5Y21GNUlHOW1JR0Z3Y0d4cFkyRjBhVzl1SUdGeVozVnRaVzUwYzF4dUlDb3ZYRzVSTG1aaGNIQnNlU0E5SUdaMWJtTjBhVzl1SUNodlltcGxZM1FzSUdGeVozTXBJSHRjYmlBZ0lDQnlaWFIxY200Z1VTaHZZbXBsWTNRcExtUnBjM0JoZEdOb0tGd2lZWEJ3YkhsY0lpd2dXM1p2YVdRZ01Dd2dZWEpuYzEwcE8xeHVmVHRjYmx4dVVISnZiV2x6WlM1d2NtOTBiM1I1Y0dVdVptRndjR3g1SUQwZ1puVnVZM1JwYjI0Z0tHRnlaM01wSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3k1a2FYTndZWFJqYUNoY0ltRndjR3g1WENJc0lGdDJiMmxrSURBc0lHRnlaM05kS1R0Y2JuMDdYRzVjYmk4cUtseHVJQ29nUTJGc2JITWdkR2hsSUhCeWIyMXBjMlZrSUdaMWJtTjBhVzl1SUdsdUlHRWdablYwZFhKbElIUjFjbTR1WEc0Z0tpQkFjR0Z5WVcwZ2IySnFaV04wSUNBZ0lIQnliMjFwYzJVZ2IzSWdhVzF0WldScFlYUmxJSEpsWm1WeVpXNWpaU0JtYjNJZ2RHRnlaMlYwSUdaMWJtTjBhVzl1WEc0Z0tpQkFjR0Z5WVcwZ0xpNHVZWEpuY3lBZ0lHRnljbUY1SUc5bUlHRndjR3hwWTJGMGFXOXVJR0Z5WjNWdFpXNTBjMXh1SUNvdlhHNVJXMXdpZEhKNVhDSmRJRDFjYmxFdVptTmhiR3dnUFNCbWRXNWpkR2x2YmlBb2IySnFaV04wSUM4cUlDNHVMbUZ5WjNNcUx5a2dlMXh1SUNBZ0lISmxkSFZ5YmlCUktHOWlhbVZqZENrdVpHbHpjR0YwWTJnb1hDSmhjSEJzZVZ3aUxDQmJkbTlwWkNBd0xDQmhjbkpoZVY5emJHbGpaU2hoY21kMWJXVnVkSE1zSURFcFhTazdYRzU5TzF4dVhHNVFjbTl0YVhObExuQnliM1J2ZEhsd1pTNW1ZMkZzYkNBOUlHWjFibU4wYVc5dUlDZ3ZLaTR1TG1GeVozTXFMeWtnZTF4dUlDQWdJSEpsZEhWeWJpQjBhR2x6TG1ScGMzQmhkR05vS0Z3aVlYQndiSGxjSWl3Z1czWnZhV1FnTUN3Z1lYSnlZWGxmYzJ4cFkyVW9ZWEpuZFcxbGJuUnpLVjBwTzF4dWZUdGNibHh1THlvcVhHNGdLaUJDYVc1a2N5QjBhR1VnY0hKdmJXbHpaV1FnWm5WdVkzUnBiMjRzSUhSeVlXNXpabTl5YldsdVp5QnlaWFIxY200Z2RtRnNkV1Z6SUdsdWRHOGdZU0JtZFd4bWFXeHNaV1JjYmlBcUlIQnliMjFwYzJVZ1lXNWtJSFJvY205M2JpQmxjbkp2Y25NZ2FXNTBieUJoSUhKbGFtVmpkR1ZrSUc5dVpTNWNiaUFxSUVCd1lYSmhiU0J2WW1wbFkzUWdJQ0FnY0hKdmJXbHpaU0J2Y2lCcGJXMWxaR2xoZEdVZ2NtVm1aWEpsYm1ObElHWnZjaUIwWVhKblpYUWdablZ1WTNScGIyNWNiaUFxSUVCd1lYSmhiU0F1TGk1aGNtZHpJQ0FnWVhKeVlYa2diMllnWVhCd2JHbGpZWFJwYjI0Z1lYSm5kVzFsYm5SelhHNGdLaTljYmxFdVptSnBibVFnUFNCbWRXNWpkR2x2YmlBb2IySnFaV04wSUM4cUxpNHVZWEpuY3lvdktTQjdYRzRnSUNBZ2RtRnlJSEJ5YjIxcGMyVWdQU0JSS0c5aWFtVmpkQ2s3WEc0Z0lDQWdkbUZ5SUdGeVozTWdQU0JoY25KaGVWOXpiR2xqWlNoaGNtZDFiV1Z1ZEhNc0lERXBPMXh1SUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlCbVltOTFibVFvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCd2NtOXRhWE5sTG1ScGMzQmhkR05vS0Z3aVlYQndiSGxjSWl3Z1cxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5eGNiaUFnSUNBZ0lDQWdJQ0FnSUdGeVozTXVZMjl1WTJGMEtHRnljbUY1WDNOc2FXTmxLR0Z5WjNWdFpXNTBjeWtwWEc0Z0lDQWdJQ0FnSUYwcE8xeHVJQ0FnSUgwN1hHNTlPMXh1VUhKdmJXbHpaUzV3Y205MGIzUjVjR1V1Wm1KcGJtUWdQU0JtZFc1amRHbHZiaUFvTHlvdUxpNWhjbWR6S2k4cElIdGNiaUFnSUNCMllYSWdjSEp2YldselpTQTlJSFJvYVhNN1hHNGdJQ0FnZG1GeUlHRnlaM01nUFNCaGNuSmhlVjl6YkdsalpTaGhjbWQxYldWdWRITXBPMXh1SUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlCbVltOTFibVFvS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCd2NtOXRhWE5sTG1ScGMzQmhkR05vS0Z3aVlYQndiSGxjSWl3Z1cxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5eGNiaUFnSUNBZ0lDQWdJQ0FnSUdGeVozTXVZMjl1WTJGMEtHRnljbUY1WDNOc2FXTmxLR0Z5WjNWdFpXNTBjeWtwWEc0Z0lDQWdJQ0FnSUYwcE8xeHVJQ0FnSUgwN1hHNTlPMXh1WEc0dktpcGNiaUFxSUZKbGNYVmxjM1J6SUhSb1pTQnVZVzFsY3lCdlppQjBhR1VnYjNkdVpXUWdjSEp2Y0dWeWRHbGxjeUJ2WmlCaElIQnliMjFwYzJWa1hHNGdLaUJ2WW1wbFkzUWdhVzRnWVNCbWRYUjFjbVVnZEhWeWJpNWNiaUFxSUVCd1lYSmhiU0J2WW1wbFkzUWdJQ0FnY0hKdmJXbHpaU0J2Y2lCcGJXMWxaR2xoZEdVZ2NtVm1aWEpsYm1ObElHWnZjaUIwWVhKblpYUWdiMkpxWldOMFhHNGdLaUJBY21WMGRYSnVJSEJ5YjIxcGMyVWdabTl5SUhSb1pTQnJaWGx6SUc5bUlIUm9aU0JsZG1WdWRIVmhiR3g1SUhObGRIUnNaV1FnYjJKcVpXTjBYRzRnS2k5Y2JsRXVhMlY1Y3lBOUlHWjFibU4wYVc5dUlDaHZZbXBsWTNRcElIdGNiaUFnSUNCeVpYUjFjbTRnVVNodlltcGxZM1FwTG1ScGMzQmhkR05vS0Z3aWEyVjVjMXdpTENCYlhTazdYRzU5TzF4dVhHNVFjbTl0YVhObExuQnliM1J2ZEhsd1pTNXJaWGx6SUQwZ1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpMbVJwYzNCaGRHTm9LRndpYTJWNWMxd2lMQ0JiWFNrN1hHNTlPMXh1WEc0dktpcGNiaUFxSUZSMWNtNXpJR0Z1SUdGeWNtRjVJRzltSUhCeWIyMXBjMlZ6SUdsdWRHOGdZU0J3Y205dGFYTmxJR1p2Y2lCaGJpQmhjbkpoZVM0Z0lFbG1JR0Z1ZVNCdlpseHVJQ29nZEdobElIQnliMjFwYzJWeklHZGxkSE1nY21WcVpXTjBaV1FzSUhSb1pTQjNhRzlzWlNCaGNuSmhlU0JwY3lCeVpXcGxZM1JsWkNCcGJXMWxaR2xoZEdWc2VTNWNiaUFxSUVCd1lYSmhiU0I3UVhKeVlYa3FmU0JoYmlCaGNuSmhlU0FvYjNJZ2NISnZiV2x6WlNCbWIzSWdZVzRnWVhKeVlYa3BJRzltSUhaaGJIVmxjeUFvYjNKY2JpQXFJSEJ5YjIxcGMyVnpJR1p2Y2lCMllXeDFaWE1wWEc0Z0tpQkFjbVYwZFhKdWN5QmhJSEJ5YjIxcGMyVWdabTl5SUdGdUlHRnljbUY1SUc5bUlIUm9aU0JqYjNKeVpYTndiMjVrYVc1bklIWmhiSFZsYzF4dUlDb3ZYRzR2THlCQ2VTQk5ZWEpySUUxcGJHeGxjbHh1THk4Z2FIUjBjRG92TDNkcGEya3VaV050WVhOamNtbHdkQzV2Y21jdlpHOXJkUzV3YUhBL2FXUTljM1J5WVhkdFlXNDZZMjl1WTNWeWNtVnVZM2ttY21WMlBURXpNRGczTnpZMU1qRWpZV3hzWm5Wc1ptbHNiR1ZrWEc1UkxtRnNiQ0E5SUdGc2JEdGNibVoxYm1OMGFXOXVJR0ZzYkNod2NtOXRhWE5sY3lrZ2UxeHVJQ0FnSUhKbGRIVnliaUIzYUdWdUtIQnliMjFwYzJWekxDQm1kVzVqZEdsdmJpQW9jSEp2YldselpYTXBJSHRjYmlBZ0lDQWdJQ0FnZG1GeUlIQmxibVJwYm1kRGIzVnVkQ0E5SURBN1hHNGdJQ0FnSUNBZ0lIWmhjaUJrWldabGNuSmxaQ0E5SUdSbFptVnlLQ2s3WEc0Z0lDQWdJQ0FnSUdGeWNtRjVYM0psWkhWalpTaHdjbTl0YVhObGN5d2dablZ1WTNScGIyNGdLSFZ1WkdWbWFXNWxaQ3dnY0hKdmJXbHpaU3dnYVc1a1pYZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIWmhjaUJ6Ym1Gd2MyaHZkRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwYzFCeWIyMXBjMlVvY0hKdmJXbHpaU2tnSmlaY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBb2MyNWhjSE5vYjNRZ1BTQndjbTl0YVhObExtbHVjM0JsWTNRb0tTa3VjM1JoZEdVZ1BUMDlJRndpWm5Wc1ptbHNiR1ZrWENKY2JpQWdJQ0FnSUNBZ0lDQWdJQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCeWIyMXBjMlZ6VzJsdVpHVjRYU0E5SUhOdVlYQnphRzkwTG5aaGJIVmxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBckszQmxibVJwYm1kRGIzVnVkRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IzYUdWdUtGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3Y205dGFYTmxMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCbWRXNWpkR2x2YmlBb2RtRnNkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCeWIyMXBjMlZ6VzJsdVpHVjRYU0E5SUhaaGJIVmxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0MwdGNHVnVaR2x1WjBOdmRXNTBJRDA5UFNBd0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWkdWbVpYSnlaV1F1Y21WemIyeDJaU2h3Y205dGFYTmxjeWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMHNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdSbFptVnljbVZrTG5KbGFtVmpkQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1puVnVZM1JwYjI0Z0tIQnliMmR5WlhOektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmtaV1psY25KbFpDNXViM1JwWm5rb2V5QnBibVJsZURvZ2FXNWtaWGdzSUhaaGJIVmxPaUJ3Y205bmNtVnpjeUI5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDBzSUhadmFXUWdNQ2s3WEc0Z0lDQWdJQ0FnSUdsbUlDaHdaVzVrYVc1blEyOTFiblFnUFQwOUlEQXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHUmxabVZ5Y21Wa0xuSmxjMjlzZG1Vb2NISnZiV2x6WlhNcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmtaV1psY25KbFpDNXdjbTl0YVhObE8xeHVJQ0FnSUgwcE8xeHVmVnh1WEc1UWNtOXRhWE5sTG5CeWIzUnZkSGx3WlM1aGJHd2dQU0JtZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnY21WMGRYSnVJR0ZzYkNoMGFHbHpLVHRjYm4wN1hHNWNiaThxS2x4dUlDb2dVbVYwZFhKdWN5QjBhR1VnWm1seWMzUWdjbVZ6YjJ4MlpXUWdjSEp2YldselpTQnZaaUJoYmlCaGNuSmhlUzRnVUhKcGIzSWdjbVZxWldOMFpXUWdjSEp2YldselpYTWdZWEpsWEc0Z0tpQnBaMjV2Y21Wa0xpQWdVbVZxWldOMGN5QnZibXg1SUdsbUlHRnNiQ0J3Y205dGFYTmxjeUJoY21VZ2NtVnFaV04wWldRdVhHNGdLaUJBY0dGeVlXMGdlMEZ5Y21GNUtuMGdZVzRnWVhKeVlYa2dZMjl1ZEdGcGJtbHVaeUIyWVd4MVpYTWdiM0lnY0hKdmJXbHpaWE1nWm05eUlIWmhiSFZsYzF4dUlDb2dRSEpsZEhWeWJuTWdZU0J3Y205dGFYTmxJR1oxYkdacGJHeGxaQ0IzYVhSb0lIUm9aU0IyWVd4MVpTQnZaaUIwYUdVZ1ptbHljM1FnY21WemIyeDJaV1FnY0hKdmJXbHpaU3hjYmlBcUlHOXlJR0VnY21WcVpXTjBaV1FnY0hKdmJXbHpaU0JwWmlCaGJHd2djSEp2YldselpYTWdZWEpsSUhKbGFtVmpkR1ZrTGx4dUlDb3ZYRzVSTG1GdWVTQTlJR0Z1ZVR0Y2JseHVablZ1WTNScGIyNGdZVzU1S0hCeWIyMXBjMlZ6S1NCN1hHNGdJQ0FnYVdZZ0tIQnliMjFwYzJWekxteGxibWQwYUNBOVBUMGdNQ2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnVVM1eVpYTnZiSFpsS0NrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnZG1GeUlHUmxabVZ5Y21Wa0lEMGdVUzVrWldabGNpZ3BPMXh1SUNBZ0lIWmhjaUJ3Wlc1a2FXNW5RMjkxYm5RZ1BTQXdPMXh1SUNBZ0lHRnljbUY1WDNKbFpIVmpaU2h3Y205dGFYTmxjeXdnWm5WdVkzUnBiMjRvY0hKbGRpd2dZM1Z5Y21WdWRDd2dhVzVrWlhncElIdGNiaUFnSUNBZ0lDQWdkbUZ5SUhCeWIyMXBjMlVnUFNCd2NtOXRhWE5sYzF0cGJtUmxlRjA3WEc1Y2JpQWdJQ0FnSUNBZ2NHVnVaR2x1WjBOdmRXNTBLeXM3WEc1Y2JpQWdJQ0FnSUNBZ2QyaGxiaWh3Y205dGFYTmxMQ0J2YmtaMWJHWnBiR3hsWkN3Z2IyNVNaV3BsWTNSbFpDd2diMjVRY205bmNtVnpjeWs3WEc0Z0lDQWdJQ0FnSUdaMWJtTjBhVzl1SUc5dVJuVnNabWxzYkdWa0tISmxjM1ZzZENrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWkdWbVpYSnlaV1F1Y21WemIyeDJaU2h5WlhOMWJIUXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdaMWJtTjBhVzl1SUc5dVVtVnFaV04wWldRb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCd1pXNWthVzVuUTI5MWJuUXRMVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h3Wlc1a2FXNW5RMjkxYm5RZ1BUMDlJREFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa1pXWmxjbkpsWkM1eVpXcGxZM1FvYm1WM0lFVnljbTl5S0Z4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmNJa05oYmlkMElHZGxkQ0JtZFd4bWFXeHNiV1Z1ZENCMllXeDFaU0JtY205dElHRnVlU0J3Y205dGFYTmxMQ0JoYkd3Z1hDSWdLMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCY0luQnliMjFwYzJWeklIZGxjbVVnY21WcVpXTjBaV1F1WENKY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBcEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQm1kVzVqZEdsdmJpQnZibEJ5YjJkeVpYTnpLSEJ5YjJkeVpYTnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmtaV1psY25KbFpDNXViM1JwWm5rb2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbHVaR1Y0T2lCcGJtUmxlQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IyWVd4MVpUb2djSEp2WjNKbGMzTmNiaUFnSUNBZ0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZTd2dkVzVrWldacGJtVmtLVHRjYmx4dUlDQWdJSEpsZEhWeWJpQmtaV1psY25KbFpDNXdjbTl0YVhObE8xeHVmVnh1WEc1UWNtOXRhWE5sTG5CeWIzUnZkSGx3WlM1aGJua2dQU0JtZFc1amRHbHZiaWdwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdZVzU1S0hSb2FYTXBPMXh1ZlR0Y2JseHVMeW9xWEc0Z0tpQlhZV2wwY3lCbWIzSWdZV3hzSUhCeWIyMXBjMlZ6SUhSdklHSmxJSE5sZEhSc1pXUXNJR1ZwZEdobGNpQm1kV3htYVd4c1pXUWdiM0pjYmlBcUlISmxhbVZqZEdWa0xpQWdWR2hwY3lCcGN5QmthWE4wYVc1amRDQm1jbTl0SUdCaGJHeGdJSE5wYm1ObElIUm9ZWFFnZDI5MWJHUWdjM1J2Y0Z4dUlDb2dkMkZwZEdsdVp5QmhkQ0IwYUdVZ1ptbHljM1FnY21WcVpXTjBhVzl1TGlBZ1ZHaGxJSEJ5YjIxcGMyVWdjbVYwZFhKdVpXUWdZbmxjYmlBcUlHQmhiR3hTWlhOdmJIWmxaR0FnZDJsc2JDQnVaWFpsY2lCaVpTQnlaV3BsWTNSbFpDNWNiaUFxSUVCd1lYSmhiU0J3Y205dGFYTmxjeUJoSUhCeWIyMXBjMlVnWm05eUlHRnVJR0Z5Y21GNUlDaHZjaUJoYmlCaGNuSmhlU2tnYjJZZ2NISnZiV2x6WlhOY2JpQXFJQ2h2Y2lCMllXeDFaWE1wWEc0Z0tpQkFjbVYwZFhKdUlHRWdjSEp2YldselpTQm1iM0lnWVc0Z1lYSnlZWGtnYjJZZ2NISnZiV2x6WlhOY2JpQXFMMXh1VVM1aGJHeFNaWE52YkhabFpDQTlJR1JsY0hKbFkyRjBaU2hoYkd4U1pYTnZiSFpsWkN3Z1hDSmhiR3hTWlhOdmJIWmxaRndpTENCY0ltRnNiRk5sZEhSc1pXUmNJaWs3WEc1bWRXNWpkR2x2YmlCaGJHeFNaWE52YkhabFpDaHdjbTl0YVhObGN5a2dlMXh1SUNBZ0lISmxkSFZ5YmlCM2FHVnVLSEJ5YjIxcGMyVnpMQ0JtZFc1amRHbHZiaUFvY0hKdmJXbHpaWE1wSUh0Y2JpQWdJQ0FnSUNBZ2NISnZiV2x6WlhNZ1BTQmhjbkpoZVY5dFlYQW9jSEp2YldselpYTXNJRkVwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZDJobGJpaGhiR3dvWVhKeVlYbGZiV0Z3S0hCeWIyMXBjMlZ6TENCbWRXNWpkR2x2YmlBb2NISnZiV2x6WlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSGRvWlc0b2NISnZiV2x6WlN3Z2JtOXZjQ3dnYm05dmNDazdYRzRnSUNBZ0lDQWdJSDBwS1N3Z1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhCeWIyMXBjMlZ6TzF4dUlDQWdJQ0FnSUNCOUtUdGNiaUFnSUNCOUtUdGNibjFjYmx4dVVISnZiV2x6WlM1d2NtOTBiM1I1Y0dVdVlXeHNVbVZ6YjJ4MlpXUWdQU0JtZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnY21WMGRYSnVJR0ZzYkZKbGMyOXNkbVZrS0hSb2FYTXBPMXh1ZlR0Y2JseHVMeW9xWEc0Z0tpQkFjMlZsSUZCeWIyMXBjMlVqWVd4c1UyVjBkR3hsWkZ4dUlDb3ZYRzVSTG1Gc2JGTmxkSFJzWldRZ1BTQmhiR3hUWlhSMGJHVmtPMXh1Wm5WdVkzUnBiMjRnWVd4c1UyVjBkR3hsWkNod2NtOXRhWE5sY3lrZ2UxeHVJQ0FnSUhKbGRIVnliaUJSS0hCeWIyMXBjMlZ6S1M1aGJHeFRaWFIwYkdWa0tDazdYRzU5WEc1Y2JpOHFLbHh1SUNvZ1ZIVnlibk1nWVc0Z1lYSnlZWGtnYjJZZ2NISnZiV2x6WlhNZ2FXNTBieUJoSUhCeWIyMXBjMlVnWm05eUlHRnVJR0Z5Y21GNUlHOW1JSFJvWldseUlITjBZWFJsY3lBb1lYTmNiaUFxSUhKbGRIVnlibVZrSUdKNUlHQnBibk53WldOMFlDa2dkMmhsYmlCMGFHVjVJR2hoZG1VZ1lXeHNJSE5sZEhSc1pXUXVYRzRnS2lCQWNHRnlZVzBnZTBGeWNtRjVXMEZ1ZVNwZGZTQjJZV3gxWlhNZ1lXNGdZWEp5WVhrZ0tHOXlJSEJ5YjIxcGMyVWdabTl5SUdGdUlHRnljbUY1S1NCdlppQjJZV3gxWlhNZ0tHOXlYRzRnS2lCd2NtOXRhWE5sY3lCbWIzSWdkbUZzZFdWektWeHVJQ29nUUhKbGRIVnlibk1nZTBGeWNtRjVXMU4wWVhSbFhYMGdZVzRnWVhKeVlYa2diMllnYzNSaGRHVnpJR1p2Y2lCMGFHVWdjbVZ6Y0dWamRHbDJaU0IyWVd4MVpYTXVYRzRnS2k5Y2JsQnliMjFwYzJVdWNISnZkRzkwZVhCbExtRnNiRk5sZEhSc1pXUWdQU0JtZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdWRHaGxiaWhtZFc1amRHbHZiaUFvY0hKdmJXbHpaWE1wSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdGc2JDaGhjbkpoZVY5dFlYQW9jSEp2YldselpYTXNJR1oxYm1OMGFXOXVJQ2h3Y205dGFYTmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQndjbTl0YVhObElEMGdVU2h3Y205dGFYTmxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHWjFibU4wYVc5dUlISmxaMkZ5Wkd4bGMzTW9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSEJ5YjIxcGMyVXVhVzV6Y0dWamRDZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSEJ5YjIxcGMyVXVkR2hsYmloeVpXZGhjbVJzWlhOekxDQnlaV2RoY21Sc1pYTnpLVHRjYmlBZ0lDQWdJQ0FnZlNrcE8xeHVJQ0FnSUgwcE8xeHVmVHRjYmx4dUx5b3FYRzRnS2lCRFlYQjBkWEpsY3lCMGFHVWdabUZwYkhWeVpTQnZaaUJoSUhCeWIyMXBjMlVzSUdkcGRtbHVaeUJoYmlCdmNHOXlkSFZ1YVhSNUlIUnZJSEpsWTI5MlpYSmNiaUFxSUhkcGRHZ2dZU0JqWVd4c1ltRmpheTRnSUVsbUlIUm9aU0JuYVhabGJpQndjbTl0YVhObElHbHpJR1oxYkdacGJHeGxaQ3dnZEdobElISmxkSFZ5Ym1Wa1hHNGdLaUJ3Y205dGFYTmxJR2x6SUdaMWJHWnBiR3hsWkM1Y2JpQXFJRUJ3WVhKaGJTQjdRVzU1S24wZ2NISnZiV2x6WlNCbWIzSWdjMjl0WlhSb2FXNW5YRzRnS2lCQWNHRnlZVzBnZTBaMWJtTjBhVzl1ZlNCallXeHNZbUZqYXlCMGJ5Qm1kV3htYVd4c0lIUm9aU0J5WlhSMWNtNWxaQ0J3Y205dGFYTmxJR2xtSUhSb1pWeHVJQ29nWjJsMlpXNGdjSEp2YldselpTQnBjeUJ5WldwbFkzUmxaRnh1SUNvZ1FISmxkSFZ5Ym5NZ1lTQndjbTl0YVhObElHWnZjaUIwYUdVZ2NtVjBkWEp1SUhaaGJIVmxJRzltSUhSb1pTQmpZV3hzWW1GamExeHVJQ292WEc1UkxtWmhhV3dnUFNBdkx5QllXRmdnYkdWbllXTjVYRzVSVzF3aVkyRjBZMmhjSWwwZ1BTQm1kVzVqZEdsdmJpQW9iMkpxWldOMExDQnlaV3BsWTNSbFpDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCUktHOWlhbVZqZENrdWRHaGxiaWgyYjJsa0lEQXNJSEpsYW1WamRHVmtLVHRjYm4wN1hHNWNibEJ5YjIxcGMyVXVjSEp2ZEc5MGVYQmxMbVpoYVd3Z1BTQXZMeUJZV0ZnZ2JHVm5ZV041WEc1UWNtOXRhWE5sTG5CeWIzUnZkSGx3WlZ0Y0ltTmhkR05vWENKZElEMGdablZ1WTNScGIyNGdLSEpsYW1WamRHVmtLU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11ZEdobGJpaDJiMmxrSURBc0lISmxhbVZqZEdWa0tUdGNibjA3WEc1Y2JpOHFLbHh1SUNvZ1FYUjBZV05vWlhNZ1lTQnNhWE4wWlc1bGNpQjBhR0YwSUdOaGJpQnlaWE53YjI1a0lIUnZJSEJ5YjJkeVpYTnpJRzV2ZEdsbWFXTmhkR2x2Ym5NZ1puSnZiU0JoWEc0Z0tpQndjbTl0YVhObEozTWdiM0pwWjJsdVlYUnBibWNnWkdWbVpYSnlaV1F1SUZSb2FYTWdiR2x6ZEdWdVpYSWdjbVZqWldsMlpYTWdkR2hsSUdWNFlXTjBJR0Z5WjNWdFpXNTBjMXh1SUNvZ2NHRnpjMlZrSUhSdklHQmdaR1ZtWlhKeVpXUXVibTkwYVdaNVlHQXVYRzRnS2lCQWNHRnlZVzBnZTBGdWVTcDlJSEJ5YjIxcGMyVWdabTl5SUhOdmJXVjBhR2x1WjF4dUlDb2dRSEJoY21GdElIdEdkVzVqZEdsdmJuMGdZMkZzYkdKaFkyc2dkRzhnY21WalpXbDJaU0JoYm5rZ2NISnZaM0psYzNNZ2JtOTBhV1pwWTJGMGFXOXVjMXh1SUNvZ1FISmxkSFZ5Ym5NZ2RHaGxJR2RwZG1WdUlIQnliMjFwYzJVc0lIVnVZMmhoYm1kbFpGeHVJQ292WEc1UkxuQnliMmR5WlhOeklEMGdjSEp2WjNKbGMzTTdYRzVtZFc1amRHbHZiaUJ3Y205bmNtVnpjeWh2WW1wbFkzUXNJSEJ5YjJkeVpYTnpaV1FwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdVU2h2WW1wbFkzUXBMblJvWlc0b2RtOXBaQ0F3TENCMmIybGtJREFzSUhCeWIyZHlaWE56WldRcE8xeHVmVnh1WEc1UWNtOXRhWE5sTG5CeWIzUnZkSGx3WlM1d2NtOW5jbVZ6Y3lBOUlHWjFibU4wYVc5dUlDaHdjbTluY21WemMyVmtLU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11ZEdobGJpaDJiMmxrSURBc0lIWnZhV1FnTUN3Z2NISnZaM0psYzNObFpDazdYRzU5TzF4dVhHNHZLaXBjYmlBcUlGQnliM1pwWkdWeklHRnVJRzl3Y0c5eWRIVnVhWFI1SUhSdklHOWljMlZ5ZG1VZ2RHaGxJSE5sZEhSc2FXNW5JRzltSUdFZ2NISnZiV2x6WlN4Y2JpQXFJSEpsWjJGeVpHeGxjM01nYjJZZ2QyaGxkR2hsY2lCMGFHVWdjSEp2YldselpTQnBjeUJtZFd4bWFXeHNaV1FnYjNJZ2NtVnFaV04wWldRdUlDQkdiM0ozWVhKa2MxeHVJQ29nZEdobElISmxjMjlzZFhScGIyNGdkRzhnZEdobElISmxkSFZ5Ym1Wa0lIQnliMjFwYzJVZ2QyaGxiaUIwYUdVZ1kyRnNiR0poWTJzZ2FYTWdaRzl1WlM1Y2JpQXFJRlJvWlNCallXeHNZbUZqYXlCallXNGdjbVYwZFhKdUlHRWdjSEp2YldselpTQjBieUJrWldabGNpQmpiMjF3YkdWMGFXOXVMbHh1SUNvZ1FIQmhjbUZ0SUh0QmJua3FmU0J3Y205dGFYTmxYRzRnS2lCQWNHRnlZVzBnZTBaMWJtTjBhVzl1ZlNCallXeHNZbUZqYXlCMGJ5QnZZbk5sY25abElIUm9aU0J5WlhOdmJIVjBhVzl1SUc5bUlIUm9aU0JuYVhabGJseHVJQ29nY0hKdmJXbHpaU3dnZEdGclpYTWdibThnWVhKbmRXMWxiblJ6TGx4dUlDb2dRSEpsZEhWeWJuTWdZU0J3Y205dGFYTmxJR1p2Y2lCMGFHVWdjbVZ6YjJ4MWRHbHZiaUJ2WmlCMGFHVWdaMmwyWlc0Z2NISnZiV2x6WlNCM2FHVnVYRzRnS2lCZ1lHWnBibUJnSUdseklHUnZibVV1WEc0Z0tpOWNibEV1Wm1sdUlEMGdMeThnV0ZoWUlHeGxaMkZqZVZ4dVVWdGNJbVpwYm1Gc2JIbGNJbDBnUFNCbWRXNWpkR2x2YmlBb2IySnFaV04wTENCallXeHNZbUZqYXlrZ2UxeHVJQ0FnSUhKbGRIVnliaUJSS0c5aWFtVmpkQ2xiWENKbWFXNWhiR3g1WENKZEtHTmhiR3hpWVdOcktUdGNibjA3WEc1Y2JsQnliMjFwYzJVdWNISnZkRzkwZVhCbExtWnBiaUE5SUM4dklGaFlXQ0JzWldkaFkzbGNibEJ5YjIxcGMyVXVjSEp2ZEc5MGVYQmxXMXdpWm1sdVlXeHNlVndpWFNBOUlHWjFibU4wYVc5dUlDaGpZV3hzWW1GamF5a2dlMXh1SUNBZ0lHTmhiR3hpWVdOcklEMGdVU2hqWVd4c1ltRmpheWs3WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11ZEdobGJpaG1kVzVqZEdsdmJpQW9kbUZzZFdVcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHTmhiR3hpWVdOckxtWmpZV3hzS0NrdWRHaGxiaWhtZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkbUZzZFdVN1hHNGdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lIMHNJR1oxYm1OMGFXOXVJQ2h5WldGemIyNHBJSHRjYmlBZ0lDQWdJQ0FnTHk4Z1ZFOUVUeUJoZEhSbGJYQjBJSFJ2SUhKbFkzbGpiR1VnZEdobElISmxhbVZqZEdsdmJpQjNhWFJvSUZ3aWRHaHBjMXdpTGx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWTJGc2JHSmhZMnN1Wm1OaGJHd29LUzUwYUdWdUtHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9jbTkzSUhKbFlYTnZianRjYmlBZ0lDQWdJQ0FnZlNrN1hHNGdJQ0FnZlNrN1hHNTlPMXh1WEc0dktpcGNiaUFxSUZSbGNtMXBibUYwWlhNZ1lTQmphR0ZwYmlCdlppQndjbTl0YVhObGN5d2dabTl5WTJsdVp5QnlaV3BsWTNScGIyNXpJSFJ2SUdKbFhHNGdLaUIwYUhKdmQyNGdZWE1nWlhoalpYQjBhVzl1Y3k1Y2JpQXFJRUJ3WVhKaGJTQjdRVzU1S24wZ2NISnZiV2x6WlNCaGRDQjBhR1VnWlc1a0lHOW1JR0VnWTJoaGFXNGdiMllnY0hKdmJXbHpaWE5jYmlBcUlFQnlaWFIxY201eklHNXZkR2hwYm1kY2JpQXFMMXh1VVM1a2IyNWxJRDBnWm5WdVkzUnBiMjRnS0c5aWFtVmpkQ3dnWm5Wc1ptbHNiR1ZrTENCeVpXcGxZM1JsWkN3Z2NISnZaM0psYzNNcElIdGNiaUFnSUNCeVpYUjFjbTRnVVNodlltcGxZM1FwTG1SdmJtVW9ablZzWm1sc2JHVmtMQ0J5WldwbFkzUmxaQ3dnY0hKdlozSmxjM01wTzF4dWZUdGNibHh1VUhKdmJXbHpaUzV3Y205MGIzUjVjR1V1Wkc5dVpTQTlJR1oxYm1OMGFXOXVJQ2htZFd4bWFXeHNaV1FzSUhKbGFtVmpkR1ZrTENCd2NtOW5jbVZ6Y3lrZ2UxeHVJQ0FnSUhaaGNpQnZibFZ1YUdGdVpHeGxaRVZ5Y205eUlEMGdablZ1WTNScGIyNGdLR1Z5Y205eUtTQjdYRzRnSUNBZ0lDQWdJQzh2SUdadmNuZGhjbVFnZEc4Z1lTQm1kWFIxY21VZ2RIVnliaUJ6YnlCMGFHRjBJR0JnZDJobGJtQmdYRzRnSUNBZ0lDQWdJQzh2SUdSdlpYTWdibTkwSUdOaGRHTm9JR2wwSUdGdVpDQjBkWEp1SUdsMElHbHVkRzhnWVNCeVpXcGxZM1JwYjI0dVhHNGdJQ0FnSUNBZ0lGRXVibVY0ZEZScFkyc29ablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdiV0ZyWlZOMFlXTnJWSEpoWTJWTWIyNW5LR1Z5Y205eUxDQndjbTl0YVhObEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaFJMbTl1WlhKeWIzSXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JSTG05dVpYSnliM0lvWlhKeWIzSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJsY25KdmNqdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lDOHZJRUYyYjJsa0lIVnVibVZqWlhOellYSjVJR0J1WlhoMFZHbGphMkJwYm1jZ2RtbGhJR0Z1SUhWdWJtVmpaWE56WVhKNUlHQjNhR1Z1WUM1Y2JpQWdJQ0IyWVhJZ2NISnZiV2x6WlNBOUlHWjFiR1pwYkd4bFpDQjhmQ0J5WldwbFkzUmxaQ0I4ZkNCd2NtOW5jbVZ6Y3lBL1hHNGdJQ0FnSUNBZ0lIUm9hWE11ZEdobGJpaG1kV3htYVd4c1pXUXNJSEpsYW1WamRHVmtMQ0J3Y205bmNtVnpjeWtnT2x4dUlDQWdJQ0FnSUNCMGFHbHpPMXh1WEc0Z0lDQWdhV1lnS0hSNWNHVnZaaUJ3Y205alpYTnpJRDA5UFNCY0ltOWlhbVZqZEZ3aUlDWW1JSEJ5YjJObGMzTWdKaVlnY0hKdlkyVnpjeTVrYjIxaGFXNHBJSHRjYmlBZ0lDQWdJQ0FnYjI1VmJtaGhibVJzWldSRmNuSnZjaUE5SUhCeWIyTmxjM011Wkc5dFlXbHVMbUpwYm1Rb2IyNVZibWhoYm1Sc1pXUkZjbkp2Y2lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnY0hKdmJXbHpaUzUwYUdWdUtIWnZhV1FnTUN3Z2IyNVZibWhoYm1Sc1pXUkZjbkp2Y2lrN1hHNTlPMXh1WEc0dktpcGNiaUFxSUVOaGRYTmxjeUJoSUhCeWIyMXBjMlVnZEc4Z1ltVWdjbVZxWldOMFpXUWdhV1lnYVhRZ1pHOWxjeUJ1YjNRZ1oyVjBJR1oxYkdacGJHeGxaQ0JpWldadmNtVmNiaUFxSUhOdmJXVWdiV2xzYkdselpXTnZibVJ6SUhScGJXVWdiM1YwTGx4dUlDb2dRSEJoY21GdElIdEJibmtxZlNCd2NtOXRhWE5sWEc0Z0tpQkFjR0Z5WVcwZ2UwNTFiV0psY24wZ2JXbHNiR2x6WldOdmJtUnpJSFJwYldWdmRYUmNiaUFxSUVCd1lYSmhiU0I3UVc1NUtuMGdZM1Z6ZEc5dElHVnljbTl5SUcxbGMzTmhaMlVnYjNJZ1JYSnliM0lnYjJKcVpXTjBJQ2h2Y0hScGIyNWhiQ2xjYmlBcUlFQnlaWFIxY201eklHRWdjSEp2YldselpTQm1iM0lnZEdobElISmxjMjlzZFhScGIyNGdiMllnZEdobElHZHBkbVZ1SUhCeWIyMXBjMlVnYVdZZ2FYUWdhWE5jYmlBcUlHWjFiR1pwYkd4bFpDQmlaV1p2Y21VZ2RHaGxJSFJwYldWdmRYUXNJRzkwYUdWeWQybHpaU0J5WldwbFkzUmxaQzVjYmlBcUwxeHVVUzUwYVcxbGIzVjBJRDBnWm5WdVkzUnBiMjRnS0c5aWFtVmpkQ3dnYlhNc0lHVnljbTl5S1NCN1hHNGdJQ0FnY21WMGRYSnVJRkVvYjJKcVpXTjBLUzUwYVcxbGIzVjBLRzF6TENCbGNuSnZjaWs3WEc1OU8xeHVYRzVRY205dGFYTmxMbkJ5YjNSdmRIbHdaUzUwYVcxbGIzVjBJRDBnWm5WdVkzUnBiMjRnS0cxekxDQmxjbkp2Y2lrZ2UxeHVJQ0FnSUhaaGNpQmtaV1psY25KbFpDQTlJR1JsWm1WeUtDazdYRzRnSUNBZ2RtRnlJSFJwYldWdmRYUkpaQ0E5SUhObGRGUnBiV1Z2ZFhRb1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb0lXVnljbTl5SUh4OElGd2ljM1J5YVc1blhDSWdQVDA5SUhSNWNHVnZaaUJsY25KdmNpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1pYSnliM0lnUFNCdVpYY2dSWEp5YjNJb1pYSnliM0lnZkh3Z1hDSlVhVzFsWkNCdmRYUWdZV1owWlhJZ1hDSWdLeUJ0Y3lBcklGd2lJRzF6WENJcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWlhKeWIzSXVZMjlrWlNBOUlGd2lSVlJKVFVWRVQxVlVYQ0k3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1pHVm1aWEp5WldRdWNtVnFaV04wS0dWeWNtOXlLVHRjYmlBZ0lDQjlMQ0J0Y3lrN1hHNWNiaUFnSUNCMGFHbHpMblJvWlc0b1puVnVZM1JwYjI0Z0tIWmhiSFZsS1NCN1hHNGdJQ0FnSUNBZ0lHTnNaV0Z5VkdsdFpXOTFkQ2gwYVcxbGIzVjBTV1FwTzF4dUlDQWdJQ0FnSUNCa1pXWmxjbkpsWkM1eVpYTnZiSFpsS0haaGJIVmxLVHRjYmlBZ0lDQjlMQ0JtZFc1amRHbHZiaUFvWlhoalpYQjBhVzl1S1NCN1hHNGdJQ0FnSUNBZ0lHTnNaV0Z5VkdsdFpXOTFkQ2gwYVcxbGIzVjBTV1FwTzF4dUlDQWdJQ0FnSUNCa1pXWmxjbkpsWkM1eVpXcGxZM1FvWlhoalpYQjBhVzl1S1R0Y2JpQWdJQ0I5TENCa1pXWmxjbkpsWkM1dWIzUnBabmtwTzF4dVhHNGdJQ0FnY21WMGRYSnVJR1JsWm1WeWNtVmtMbkJ5YjIxcGMyVTdYRzU5TzF4dVhHNHZLaXBjYmlBcUlGSmxkSFZ5Ym5NZ1lTQndjbTl0YVhObElHWnZjaUIwYUdVZ1oybDJaVzRnZG1Gc2RXVWdLRzl5SUhCeWIyMXBjMlZrSUhaaGJIVmxLU3dnYzI5dFpWeHVJQ29nYldsc2JHbHpaV052Ym1SeklHRm1kR1Z5SUdsMElISmxjMjlzZG1Wa0xpQlFZWE56WlhNZ2NtVnFaV04wYVc5dWN5QnBiVzFsWkdsaGRHVnNlUzVjYmlBcUlFQndZWEpoYlNCN1FXNTVLbjBnY0hKdmJXbHpaVnh1SUNvZ1FIQmhjbUZ0SUh0T2RXMWlaWEo5SUcxcGJHeHBjMlZqYjI1a2MxeHVJQ29nUUhKbGRIVnlibk1nWVNCd2NtOXRhWE5sSUdadmNpQjBhR1VnY21WemIyeDFkR2x2YmlCdlppQjBhR1VnWjJsMlpXNGdjSEp2YldselpTQmhablJsY2lCdGFXeHNhWE5sWTI5dVpITmNiaUFxSUhScGJXVWdhR0Z6SUdWc1lYQnpaV1FnYzJsdVkyVWdkR2hsSUhKbGMyOXNkWFJwYjI0Z2IyWWdkR2hsSUdkcGRtVnVJSEJ5YjIxcGMyVXVYRzRnS2lCSlppQjBhR1VnWjJsMlpXNGdjSEp2YldselpTQnlaV3BsWTNSekxDQjBhR0YwSUdseklIQmhjM05sWkNCcGJXMWxaR2xoZEdWc2VTNWNiaUFxTDF4dVVTNWtaV3hoZVNBOUlHWjFibU4wYVc5dUlDaHZZbXBsWTNRc0lIUnBiV1Z2ZFhRcElIdGNiaUFnSUNCcFppQW9kR2x0Wlc5MWRDQTlQVDBnZG05cFpDQXdLU0I3WEc0Z0lDQWdJQ0FnSUhScGJXVnZkWFFnUFNCdlltcGxZM1E3WEc0Z0lDQWdJQ0FnSUc5aWFtVmpkQ0E5SUhadmFXUWdNRHRjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUZFb2IySnFaV04wS1M1a1pXeGhlU2gwYVcxbGIzVjBLVHRjYm4wN1hHNWNibEJ5YjIxcGMyVXVjSEp2ZEc5MGVYQmxMbVJsYkdGNUlEMGdablZ1WTNScGIyNGdLSFJwYldWdmRYUXBJSHRjYmlBZ0lDQnlaWFIxY200Z2RHaHBjeTUwYUdWdUtHWjFibU4wYVc5dUlDaDJZV3gxWlNrZ2UxeHVJQ0FnSUNBZ0lDQjJZWElnWkdWbVpYSnlaV1FnUFNCa1pXWmxjaWdwTzF4dUlDQWdJQ0FnSUNCelpYUlVhVzFsYjNWMEtHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHUmxabVZ5Y21Wa0xuSmxjMjlzZG1Vb2RtRnNkV1VwTzF4dUlDQWdJQ0FnSUNCOUxDQjBhVzFsYjNWMEtUdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHUmxabVZ5Y21Wa0xuQnliMjFwYzJVN1hHNGdJQ0FnZlNrN1hHNTlPMXh1WEc0dktpcGNiaUFxSUZCaGMzTmxjeUJoSUdOdmJuUnBiblZoZEdsdmJpQjBieUJoSUU1dlpHVWdablZ1WTNScGIyNHNJSGRvYVdOb0lHbHpJR05oYkd4bFpDQjNhWFJvSUhSb1pTQm5hWFpsYmx4dUlDb2dZWEpuZFcxbGJuUnpJSEJ5YjNacFpHVmtJR0Z6SUdGdUlHRnljbUY1TENCaGJtUWdjbVYwZFhKdWN5QmhJSEJ5YjIxcGMyVXVYRzRnS2x4dUlDb2dJQ0FnSUNCUkxtNW1ZWEJ3Ykhrb1JsTXVjbVZoWkVacGJHVXNJRnRmWDJacGJHVnVZVzFsWFNsY2JpQXFJQ0FnSUNBZ0xuUm9aVzRvWm5WdVkzUnBiMjRnS0dOdmJuUmxiblFwSUh0Y2JpQXFJQ0FnSUNBZ2ZTbGNiaUFxWEc0Z0tpOWNibEV1Ym1aaGNIQnNlU0E5SUdaMWJtTjBhVzl1SUNoallXeHNZbUZqYXl3Z1lYSm5jeWtnZTF4dUlDQWdJSEpsZEhWeWJpQlJLR05oYkd4aVlXTnJLUzV1Wm1Gd2NHeDVLR0Z5WjNNcE8xeHVmVHRjYmx4dVVISnZiV2x6WlM1d2NtOTBiM1I1Y0dVdWJtWmhjSEJzZVNBOUlHWjFibU4wYVc5dUlDaGhjbWR6S1NCN1hHNGdJQ0FnZG1GeUlHUmxabVZ5Y21Wa0lEMGdaR1ZtWlhJb0tUdGNiaUFnSUNCMllYSWdibTlrWlVGeVozTWdQU0JoY25KaGVWOXpiR2xqWlNoaGNtZHpLVHRjYmlBZ0lDQnViMlJsUVhKbmN5NXdkWE5vS0dSbFptVnljbVZrTG0xaGEyVk9iMlJsVW1WemIyeDJaWElvS1NrN1hHNGdJQ0FnZEdocGN5NW1ZWEJ3Ykhrb2JtOWtaVUZ5WjNNcExtWmhhV3dvWkdWbVpYSnlaV1F1Y21WcVpXTjBLVHRjYmlBZ0lDQnlaWFIxY200Z1pHVm1aWEp5WldRdWNISnZiV2x6WlR0Y2JuMDdYRzVjYmk4cUtseHVJQ29nVUdGemMyVnpJR0VnWTI5dWRHbHVkV0YwYVc5dUlIUnZJR0VnVG05a1pTQm1kVzVqZEdsdmJpd2dkMmhwWTJnZ2FYTWdZMkZzYkdWa0lIZHBkR2dnZEdobElHZHBkbVZ1WEc0Z0tpQmhjbWQxYldWdWRITWdjSEp2ZG1sa1pXUWdhVzVrYVhacFpIVmhiR3g1TENCaGJtUWdjbVYwZFhKdWN5QmhJSEJ5YjIxcGMyVXVYRzRnS2lCQVpYaGhiWEJzWlZ4dUlDb2dVUzV1Wm1OaGJHd29SbE11Y21WaFpFWnBiR1VzSUY5ZlptbHNaVzVoYldVcFhHNGdLaUF1ZEdobGJpaG1kVzVqZEdsdmJpQW9ZMjl1ZEdWdWRDa2dlMXh1SUNvZ2ZTbGNiaUFxWEc0Z0tpOWNibEV1Ym1aallXeHNJRDBnWm5WdVkzUnBiMjRnS0dOaGJHeGlZV05ySUM4cUxpNHVZWEpuY3lvdktTQjdYRzRnSUNBZ2RtRnlJR0Z5WjNNZ1BTQmhjbkpoZVY5emJHbGpaU2hoY21kMWJXVnVkSE1zSURFcE8xeHVJQ0FnSUhKbGRIVnliaUJSS0dOaGJHeGlZV05yS1M1dVptRndjR3g1S0dGeVozTXBPMXh1ZlR0Y2JseHVVSEp2YldselpTNXdjbTkwYjNSNWNHVXVibVpqWVd4c0lEMGdablZ1WTNScGIyNGdLQzhxTGk0dVlYSm5jeW92S1NCN1hHNGdJQ0FnZG1GeUlHNXZaR1ZCY21keklEMGdZWEp5WVhsZmMyeHBZMlVvWVhKbmRXMWxiblJ6S1R0Y2JpQWdJQ0IyWVhJZ1pHVm1aWEp5WldRZ1BTQmtaV1psY2lncE8xeHVJQ0FnSUc1dlpHVkJjbWR6TG5CMWMyZ29aR1ZtWlhKeVpXUXViV0ZyWlU1dlpHVlNaWE52YkhabGNpZ3BLVHRjYmlBZ0lDQjBhR2x6TG1aaGNIQnNlU2h1YjJSbFFYSm5jeWt1Wm1GcGJDaGtaV1psY25KbFpDNXlaV3BsWTNRcE8xeHVJQ0FnSUhKbGRIVnliaUJrWldabGNuSmxaQzV3Y205dGFYTmxPMXh1ZlR0Y2JseHVMeW9xWEc0Z0tpQlhjbUZ3Y3lCaElFNXZaR1ZLVXlCamIyNTBhVzUxWVhScGIyNGdjR0Z6YzJsdVp5Qm1kVzVqZEdsdmJpQmhibVFnY21WMGRYSnVjeUJoYmlCbGNYVnBkbUZzWlc1MFhHNGdLaUIyWlhKemFXOXVJSFJvWVhRZ2NtVjBkWEp1Y3lCaElIQnliMjFwYzJVdVhHNGdLaUJBWlhoaGJYQnNaVnh1SUNvZ1VTNXVabUpwYm1Rb1JsTXVjbVZoWkVacGJHVXNJRjlmWm1sc1pXNWhiV1VwS0Z3aWRYUm1MVGhjSWlsY2JpQXFJQzUwYUdWdUtHTnZibk52YkdVdWJHOW5LVnh1SUNvZ0xtUnZibVVvS1Z4dUlDb3ZYRzVSTG01bVltbHVaQ0E5WEc1UkxtUmxibTlrWldsbWVTQTlJR1oxYm1OMGFXOXVJQ2hqWVd4c1ltRmpheUF2S2k0dUxtRnlaM01xTHlrZ2UxeHVJQ0FnSUhaaGNpQmlZWE5sUVhKbmN5QTlJR0Z5Y21GNVgzTnNhV05sS0dGeVozVnRaVzUwY3l3Z01TazdYRzRnSUNBZ2NtVjBkWEp1SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNBZ0lDQWdkbUZ5SUc1dlpHVkJjbWR6SUQwZ1ltRnpaVUZ5WjNNdVkyOXVZMkYwS0dGeWNtRjVYM05zYVdObEtHRnlaM1Z0Wlc1MGN5a3BPMXh1SUNBZ0lDQWdJQ0IyWVhJZ1pHVm1aWEp5WldRZ1BTQmtaV1psY2lncE8xeHVJQ0FnSUNBZ0lDQnViMlJsUVhKbmN5NXdkWE5vS0dSbFptVnljbVZrTG0xaGEyVk9iMlJsVW1WemIyeDJaWElvS1NrN1hHNGdJQ0FnSUNBZ0lGRW9ZMkZzYkdKaFkyc3BMbVpoY0hCc2VTaHViMlJsUVhKbmN5a3VabUZwYkNoa1pXWmxjbkpsWkM1eVpXcGxZM1FwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWkdWbVpYSnlaV1F1Y0hKdmJXbHpaVHRjYmlBZ0lDQjlPMXh1ZlR0Y2JseHVVSEp2YldselpTNXdjbTkwYjNSNWNHVXVibVppYVc1a0lEMWNibEJ5YjIxcGMyVXVjSEp2ZEc5MGVYQmxMbVJsYm05a1pXbG1lU0E5SUdaMWJtTjBhVzl1SUNndktpNHVMbUZ5WjNNcUx5a2dlMXh1SUNBZ0lIWmhjaUJoY21keklEMGdZWEp5WVhsZmMyeHBZMlVvWVhKbmRXMWxiblJ6S1R0Y2JpQWdJQ0JoY21kekxuVnVjMmhwWm5Rb2RHaHBjeWs3WEc0Z0lDQWdjbVYwZFhKdUlGRXVaR1Z1YjJSbGFXWjVMbUZ3Y0d4NUtIWnZhV1FnTUN3Z1lYSm5jeWs3WEc1OU8xeHVYRzVSTG01aWFXNWtJRDBnWm5WdVkzUnBiMjRnS0dOaGJHeGlZV05yTENCMGFHbHpjQ0F2S2k0dUxtRnlaM01xTHlrZ2UxeHVJQ0FnSUhaaGNpQmlZWE5sUVhKbmN5QTlJR0Z5Y21GNVgzTnNhV05sS0dGeVozVnRaVzUwY3l3Z01pazdYRzRnSUNBZ2NtVjBkWEp1SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNBZ0lDQWdkbUZ5SUc1dlpHVkJjbWR6SUQwZ1ltRnpaVUZ5WjNNdVkyOXVZMkYwS0dGeWNtRjVYM05zYVdObEtHRnlaM1Z0Wlc1MGN5a3BPMXh1SUNBZ0lDQWdJQ0IyWVhJZ1pHVm1aWEp5WldRZ1BTQmtaV1psY2lncE8xeHVJQ0FnSUNBZ0lDQnViMlJsUVhKbmN5NXdkWE5vS0dSbFptVnljbVZrTG0xaGEyVk9iMlJsVW1WemIyeDJaWElvS1NrN1hHNGdJQ0FnSUNBZ0lHWjFibU4wYVc5dUlHSnZkVzVrS0NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJR05oYkd4aVlXTnJMbUZ3Y0d4NUtIUm9hWE53TENCaGNtZDFiV1Z1ZEhNcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJRkVvWW05MWJtUXBMbVpoY0hCc2VTaHViMlJsUVhKbmN5a3VabUZwYkNoa1pXWmxjbkpsWkM1eVpXcGxZM1FwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWkdWbVpYSnlaV1F1Y0hKdmJXbHpaVHRjYmlBZ0lDQjlPMXh1ZlR0Y2JseHVVSEp2YldselpTNXdjbTkwYjNSNWNHVXVibUpwYm1RZ1BTQm1kVzVqZEdsdmJpQW9MeXAwYUdsemNDd2dMaTR1WVhKbmN5b3ZLU0I3WEc0Z0lDQWdkbUZ5SUdGeVozTWdQU0JoY25KaGVWOXpiR2xqWlNoaGNtZDFiV1Z1ZEhNc0lEQXBPMXh1SUNBZ0lHRnlaM011ZFc1emFHbG1kQ2gwYUdsektUdGNiaUFnSUNCeVpYUjFjbTRnVVM1dVltbHVaQzVoY0hCc2VTaDJiMmxrSURBc0lHRnlaM01wTzF4dWZUdGNibHh1THlvcVhHNGdLaUJEWVd4c2N5QmhJRzFsZEdodlpDQnZaaUJoSUU1dlpHVXRjM1I1YkdVZ2IySnFaV04wSUhSb1lYUWdZV05qWlhCMGN5QmhJRTV2WkdVdGMzUjViR1ZjYmlBcUlHTmhiR3hpWVdOcklIZHBkR2dnWVNCbmFYWmxiaUJoY25KaGVTQnZaaUJoY21kMWJXVnVkSE1zSUhCc2RYTWdZU0J3Y205MmFXUmxaQ0JqWVd4c1ltRmpheTVjYmlBcUlFQndZWEpoYlNCdlltcGxZM1FnWVc0Z2IySnFaV04wSUhSb1lYUWdhR0Z6SUhSb1pTQnVZVzFsWkNCdFpYUm9iMlJjYmlBcUlFQndZWEpoYlNCN1UzUnlhVzVuZlNCdVlXMWxJRzVoYldVZ2IyWWdkR2hsSUcxbGRHaHZaQ0J2WmlCdlltcGxZM1JjYmlBcUlFQndZWEpoYlNCN1FYSnlZWGw5SUdGeVozTWdZWEpuZFcxbGJuUnpJSFJ2SUhCaGMzTWdkRzhnZEdobElHMWxkR2h2WkRzZ2RHaGxJR05oYkd4aVlXTnJYRzRnS2lCM2FXeHNJR0psSUhCeWIzWnBaR1ZrSUdKNUlGRWdZVzVrSUdGd2NHVnVaR1ZrSUhSdklIUm9aWE5sSUdGeVozVnRaVzUwY3k1Y2JpQXFJRUJ5WlhSMWNtNXpJR0VnY0hKdmJXbHpaU0JtYjNJZ2RHaGxJSFpoYkhWbElHOXlJR1Z5Y205eVhHNGdLaTljYmxFdWJtMWhjSEJzZVNBOUlDOHZJRmhZV0NCQmN5QndjbTl3YjNObFpDQmllU0JjSWxKbFpITmhibVJ5YjF3aVhHNVJMbTV3YjNOMElEMGdablZ1WTNScGIyNGdLRzlpYW1WamRDd2dibUZ0WlN3Z1lYSm5jeWtnZTF4dUlDQWdJSEpsZEhWeWJpQlJLRzlpYW1WamRDa3VibkJ2YzNRb2JtRnRaU3dnWVhKbmN5azdYRzU5TzF4dVhHNVFjbTl0YVhObExuQnliM1J2ZEhsd1pTNXViV0Z3Y0d4NUlEMGdMeThnV0ZoWUlFRnpJSEJ5YjNCdmMyVmtJR0o1SUZ3aVVtVmtjMkZ1WkhKdlhDSmNibEJ5YjIxcGMyVXVjSEp2ZEc5MGVYQmxMbTV3YjNOMElEMGdablZ1WTNScGIyNGdLRzVoYldVc0lHRnlaM01wSUh0Y2JpQWdJQ0IyWVhJZ2JtOWtaVUZ5WjNNZ1BTQmhjbkpoZVY5emJHbGpaU2hoY21keklIeDhJRnRkS1R0Y2JpQWdJQ0IyWVhJZ1pHVm1aWEp5WldRZ1BTQmtaV1psY2lncE8xeHVJQ0FnSUc1dlpHVkJjbWR6TG5CMWMyZ29aR1ZtWlhKeVpXUXViV0ZyWlU1dlpHVlNaWE52YkhabGNpZ3BLVHRjYmlBZ0lDQjBhR2x6TG1ScGMzQmhkR05vS0Z3aWNHOXpkRndpTENCYmJtRnRaU3dnYm05a1pVRnlaM05kS1M1bVlXbHNLR1JsWm1WeWNtVmtMbkpsYW1WamRDazdYRzRnSUNBZ2NtVjBkWEp1SUdSbFptVnljbVZrTG5CeWIyMXBjMlU3WEc1OU8xeHVYRzR2S2lwY2JpQXFJRU5oYkd4eklHRWdiV1YwYUc5a0lHOW1JR0VnVG05a1pTMXpkSGxzWlNCdlltcGxZM1FnZEdoaGRDQmhZMk5sY0hSeklHRWdUbTlrWlMxemRIbHNaVnh1SUNvZ1kyRnNiR0poWTJzc0lHWnZjbmRoY21ScGJtY2dkR2hsSUdkcGRtVnVJSFpoY21saFpHbGpJR0Z5WjNWdFpXNTBjeXdnY0d4MWN5QmhJSEJ5YjNacFpHVmtYRzRnS2lCallXeHNZbUZqYXlCaGNtZDFiV1Z1ZEM1Y2JpQXFJRUJ3WVhKaGJTQnZZbXBsWTNRZ1lXNGdiMkpxWldOMElIUm9ZWFFnYUdGeklIUm9aU0J1WVcxbFpDQnRaWFJvYjJSY2JpQXFJRUJ3WVhKaGJTQjdVM1J5YVc1bmZTQnVZVzFsSUc1aGJXVWdiMllnZEdobElHMWxkR2h2WkNCdlppQnZZbXBsWTNSY2JpQXFJRUJ3WVhKaGJTQXVMaTVoY21keklHRnlaM1Z0Wlc1MGN5QjBieUJ3WVhOeklIUnZJSFJvWlNCdFpYUm9iMlE3SUhSb1pTQmpZV3hzWW1GamF5QjNhV3hzWEc0Z0tpQmlaU0J3Y205MmFXUmxaQ0JpZVNCUklHRnVaQ0JoY0hCbGJtUmxaQ0IwYnlCMGFHVnpaU0JoY21kMWJXVnVkSE11WEc0Z0tpQkFjbVYwZFhKdWN5QmhJSEJ5YjIxcGMyVWdabTl5SUhSb1pTQjJZV3gxWlNCdmNpQmxjbkp2Y2x4dUlDb3ZYRzVSTG01elpXNWtJRDBnTHk4Z1dGaFlJRUpoYzJWa0lHOXVJRTFoY21zZ1RXbHNiR1Z5SjNNZ2NISnZjRzl6WldRZ1hDSnpaVzVrWENKY2JsRXVibTFqWVd4c0lEMGdMeThnV0ZoWUlFSmhjMlZrSUc5dUlGd2lVbVZrYzJGdVpISnZKM05jSWlCd2NtOXdiM05oYkZ4dVVTNXVhVzUyYjJ0bElEMGdablZ1WTNScGIyNGdLRzlpYW1WamRDd2dibUZ0WlNBdktpNHVMbUZ5WjNNcUx5a2dlMXh1SUNBZ0lIWmhjaUJ1YjJSbFFYSm5jeUE5SUdGeWNtRjVYM05zYVdObEtHRnlaM1Z0Wlc1MGN5d2dNaWs3WEc0Z0lDQWdkbUZ5SUdSbFptVnljbVZrSUQwZ1pHVm1aWElvS1R0Y2JpQWdJQ0J1YjJSbFFYSm5jeTV3ZFhOb0tHUmxabVZ5Y21Wa0xtMWhhMlZPYjJSbFVtVnpiMngyWlhJb0tTazdYRzRnSUNBZ1VTaHZZbXBsWTNRcExtUnBjM0JoZEdOb0tGd2ljRzl6ZEZ3aUxDQmJibUZ0WlN3Z2JtOWtaVUZ5WjNOZEtTNW1ZV2xzS0dSbFptVnljbVZrTG5KbGFtVmpkQ2s3WEc0Z0lDQWdjbVYwZFhKdUlHUmxabVZ5Y21Wa0xuQnliMjFwYzJVN1hHNTlPMXh1WEc1UWNtOXRhWE5sTG5CeWIzUnZkSGx3WlM1dWMyVnVaQ0E5SUM4dklGaFlXQ0JDWVhObFpDQnZiaUJOWVhKcklFMXBiR3hsY2lkeklIQnliM0J2YzJWa0lGd2ljMlZ1WkZ3aVhHNVFjbTl0YVhObExuQnliM1J2ZEhsd1pTNXViV05oYkd3Z1BTQXZMeUJZV0ZnZ1FtRnpaV1FnYjI0Z1hDSlNaV1J6WVc1a2NtOG5jMXdpSUhCeWIzQnZjMkZzWEc1UWNtOXRhWE5sTG5CeWIzUnZkSGx3WlM1dWFXNTJiMnRsSUQwZ1puVnVZM1JwYjI0Z0tHNWhiV1VnTHlvdUxpNWhjbWR6S2k4cElIdGNiaUFnSUNCMllYSWdibTlrWlVGeVozTWdQU0JoY25KaGVWOXpiR2xqWlNoaGNtZDFiV1Z1ZEhNc0lERXBPMXh1SUNBZ0lIWmhjaUJrWldabGNuSmxaQ0E5SUdSbFptVnlLQ2s3WEc0Z0lDQWdibTlrWlVGeVozTXVjSFZ6YUNoa1pXWmxjbkpsWkM1dFlXdGxUbTlrWlZKbGMyOXNkbVZ5S0NrcE8xeHVJQ0FnSUhSb2FYTXVaR2x6Y0dGMFkyZ29YQ0p3YjNOMFhDSXNJRnR1WVcxbExDQnViMlJsUVhKbmMxMHBMbVpoYVd3b1pHVm1aWEp5WldRdWNtVnFaV04wS1R0Y2JpQWdJQ0J5WlhSMWNtNGdaR1ZtWlhKeVpXUXVjSEp2YldselpUdGNibjA3WEc1Y2JpOHFLbHh1SUNvZ1NXWWdZU0JtZFc1amRHbHZiaUIzYjNWc1pDQnNhV3RsSUhSdklITjFjSEJ2Y25RZ1ltOTBhQ0JPYjJSbElHTnZiblJwYm5WaGRHbHZiaTF3WVhOemFXNW5MWE4wZVd4bElHRnVaRnh1SUNvZ2NISnZiV2x6WlMxeVpYUjFjbTVwYm1jdGMzUjViR1VzSUdsMElHTmhiaUJsYm1RZ2FYUnpJR2x1ZEdWeWJtRnNJSEJ5YjIxcGMyVWdZMmhoYVc0Z2QybDBhRnh1SUNvZ1lHNXZaR1ZwWm5rb2JtOWtaV0poWTJzcFlDd2dabTl5ZDJGeVpHbHVaeUIwYUdVZ2IzQjBhVzl1WVd3Z2JtOWtaV0poWTJzZ1lYSm5kVzFsYm5RdUlDQkpaaUIwYUdVZ2RYTmxjbHh1SUNvZ1pXeGxZM1J6SUhSdklIVnpaU0JoSUc1dlpHVmlZV05yTENCMGFHVWdjbVZ6ZFd4MElIZHBiR3dnWW1VZ2MyVnVkQ0IwYUdWeVpTNGdJRWxtSUhSb1pYa2daRzhnYm05MFhHNGdLaUJ3WVhOeklHRWdibTlrWldKaFkyc3NJSFJvWlhrZ2QybHNiQ0J5WldObGFYWmxJSFJvWlNCeVpYTjFiSFFnY0hKdmJXbHpaUzVjYmlBcUlFQndZWEpoYlNCdlltcGxZM1FnWVNCeVpYTjFiSFFnS0c5eUlHRWdjSEp2YldselpTQm1iM0lnWVNCeVpYTjFiSFFwWEc0Z0tpQkFjR0Z5WVcwZ2UwWjFibU4wYVc5dWZTQnViMlJsWW1GamF5QmhJRTV2WkdVdWFuTXRjM1I1YkdVZ1kyRnNiR0poWTJ0Y2JpQXFJRUJ5WlhSMWNtNXpJR1ZwZEdobGNpQjBhR1VnY0hKdmJXbHpaU0J2Y2lCdWIzUm9hVzVuWEc0Z0tpOWNibEV1Ym05a1pXbG1lU0E5SUc1dlpHVnBabms3WEc1bWRXNWpkR2x2YmlCdWIyUmxhV1o1S0c5aWFtVmpkQ3dnYm05a1pXSmhZMnNwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdVU2h2WW1wbFkzUXBMbTV2WkdWcFpua29ibTlrWldKaFkyc3BPMXh1ZlZ4dVhHNVFjbTl0YVhObExuQnliM1J2ZEhsd1pTNXViMlJsYVdaNUlEMGdablZ1WTNScGIyNGdLRzV2WkdWaVlXTnJLU0I3WEc0Z0lDQWdhV1lnS0c1dlpHVmlZV05yS1NCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11ZEdobGJpaG1kVzVqZEdsdmJpQW9kbUZzZFdVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUZFdWJtVjRkRlJwWTJzb1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRzV2WkdWaVlXTnJLRzUxYkd3c0lIWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBwTzF4dUlDQWdJQ0FnSUNCOUxDQm1kVzVqZEdsdmJpQW9aWEp5YjNJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUZFdWJtVjRkRlJwWTJzb1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRzV2WkdWaVlXTnJLR1Z5Y205eUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ0lDQjlYRzU5TzF4dVhHNHZMeUJCYkd3Z1kyOWtaU0JpWldadmNtVWdkR2hwY3lCd2IybHVkQ0IzYVd4c0lHSmxJR1pwYkhSbGNtVmtJR1p5YjIwZ2MzUmhZMnNnZEhKaFkyVnpMbHh1ZG1GeUlIRkZibVJwYm1kTWFXNWxJRDBnWTJGd2RIVnlaVXhwYm1Vb0tUdGNibHh1Y21WMGRYSnVJRkU3WEc1Y2JuMHBPMXh1SWwxOSJdfQ==
