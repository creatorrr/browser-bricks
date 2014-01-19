// Generated by CoffeeScript 1.6.3
(function() {
  var BALL_VELOCITY, BL, BR, Ball, Box, Brick, Bricks, DRAW_INTERVAL, Events, Game, Grid, PADDLE_VELOCITY, Paddle, ROOT, Screen, StateMachine, TL, TR, X, Y, init, _, _ref, _ref1,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  TL = 0;

  TR = 1;

  BR = 2;

  BL = 3;

  X = 0;

  Y = 1;

  DRAW_INTERVAL = 50;

  PADDLE_VELOCITY = 500;

  BALL_VELOCITY = 250;

  ROOT = (function() {
    var root;
    root = window.location.href;
    if (root[root.length - 1] === '/') {
      return root.slice(0, root.length - 1);
    } else {
      return root;
    }
  })();

  _ = {
    times: function() {
      var args, ctx, fn, i, n, _results;
      n = arguments[0], fn = arguments[1], ctx = arguments[2], args = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
      i = 1;
      _results = [];
      while (i <= n) {
        _results.push(i++ && fn.apply(ctx, args));
      }
      return _results;
    },
    extend: function(dest, src) {
      var k, v;
      for (k in src) {
        if (!__hasProp.call(src, k)) continue;
        v = src[k];
        dest[k] = v;
      }
      return dest;
    },
    pick: function(obj, props) {
      var k, result, _i, _len;
      result = {};
      for (_i = 0, _len = props.length; _i < _len; _i++) {
        k = props[_i];
        if (obj[k] != null) {
          result[k] = obj[k];
        }
      }
      return result;
    },
    pluck: function(arr, prop) {
      var obj, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = arr.length; _i < _len; _i++) {
        obj = arr[_i];
        _results.push(obj[prop]);
      }
      return _results;
    },
    uniq: function(arr) {
      var e, seen, _i, _len, _results;
      seen = new Set;
      _results = [];
      for (_i = 0, _len = arr.length; _i < _len; _i++) {
        e = arr[_i];
        if (!(!seen.has(e))) {
          continue;
        }
        seen.add(e);
        _results.push(e);
      }
      return _results;
    },
    flatten: function(arr) {
      var a, e, _i, _len;
      a = [];
      for (_i = 0, _len = arr.length; _i < _len; _i++) {
        e = arr[_i];
        if (e.length) {
          a = a.concat(e);
        } else {
          a.push(e);
        }
      }
      return a;
    },
    uuid: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r, v;
        r = Math.random() * 16 | 0;
        v = c === 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
      });
    },
    serialize: function(obj, _arg, cb) {
      var eq, k, sep, v;
      sep = _arg.sep, eq = _arg.eq;
      if (cb != null) {
        for (k in obj) {
          if (!__hasProp.call(obj, k)) continue;
          v = obj[k];
          obj[k] = cb(v);
        }
      }
      return ((function() {
        var _results;
        _results = [];
        for (k in obj) {
          if (!__hasProp.call(obj, k)) continue;
          v = obj[k];
          _results.push("" + k + eq + v);
        }
        return _results;
      })()).join(sep);
    },
    clone: function(obj) {
      if (obj === Object(obj)) {
        return _.extend({}, obj);
      } else {
        return obj.splice(0);
      }
    },
    negate: function(fn) {
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return !fn.apply(null, args);
      };
    },
    first: function(array) {
      return array[0];
    },
    last: function(array) {
      return array[array.length - 1];
    },
    sqr: function(n) {
      return n * n;
    },
    flip: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return args[_.random(0, args.length - 1)];
    },
    random: function(min, max, int) {
      if (int == null) {
        int = true;
      }
      if (max == null) {
        max = min;
        min = 0;
      }
      if (int) {
        return Math.floor((Math.random() * (max - min + 1)) + min);
      } else {
        return (Math.random() * (max - min)) + min;
      }
    },
    wait: function() {
      var args, fn, t;
      t = arguments[0], fn = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      return setTimeout.apply(null, [fn, t].concat(__slice.call(args)));
    },
    defer: function() {
      var args, fn;
      fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return _.wait.apply(_, [1, fn].concat(__slice.call(args)));
    },
    bind: function() {
      var args, ctx, fn;
      fn = arguments[0], ctx = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      return function() {
        var extra;
        extra = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return fn.apply(ctx, args.concat(extra));
      };
    },
    once: function(fn) {
      var mem, ran;
      ran = false;
      mem = null;
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (ran) {
          return mem;
        }
        ran = true;
        mem = fn.apply(this, args);
        fn = null;
        return mem;
      };
    },
    throttle: function(wait, fn, context) {
      var deferTimer, last;
      last = 0;
      deferTimer = null;
      return function() {
        var args, now, run;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        now = +(new Date);
        run = function() {
          last = now;
          if (context) {
            return fn.apply(context, args);
          } else {
            return fn.apply(null, args);
          }
        };
        if (last && now < last + wait) {
          if (deferTimer) {
            clearTimeout(deferTimer);
          }
          return deferTimer = setTimeout(run, wait);
        } else {
          return run();
        }
      };
    },
    vec: function(_arg, _arg1) {
      var x, x1, y, y1, _ref;
      x = _arg[0], y = _arg[1];
      _ref = _arg1 != null ? _arg1 : [0, 0], x1 = _ref[0], y1 = _ref[1];
      return {
        add: function(_arg2) {
          var x2, y2;
          x2 = _arg2[0], y2 = _arg2[1];
          return [x2 + x, y2 + y];
        },
        multiply: function(scalar) {
          return [x * scalar, y * scalar];
        },
        center: function() {
          return [(x + x1) / 2, (y + y1) / 2];
        },
        dist: function(_arg2) {
          var x2, y2;
          x2 = _arg2[0], y2 = _arg2[1];
          return Math.sqrt((_.sqr(x - x2)) + (_.sqr(y - y2)));
        }
      };
    }
  };

  Events = (function() {
    function Events() {
      this._events = {};
    }

    Events.prototype.on = function(name, handler) {
      var _base;
      ((_base = this._events)[name] != null ? (_base = this._events)[name] : _base[name] = []).push(handler);
      return this;
    };

    Events.prototype.off = function(name) {
      delete this._events[name];
      return this;
    };

    Events.prototype.trigger = function() {
      var args, handler, handlers, name, _i, _len, _results;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if ((handlers = this._events[name]) != null) {
        _results = [];
        for (_i = 0, _len = handlers.length; _i < _len; _i++) {
          handler = handlers[_i];
          _results.push(handler.apply(this, args));
        }
        return _results;
      } else {
        return null;
      }
    };

    return Events;

  })();

  Box = (function(_super) {
    __extends(Box, _super);

    Box.prototype._settings = {
      height: 100,
      width: 200,
      top: 0,
      left: 0,
      template: ''
    };

    Box.prototype._props = {
      toolbar: false,
      directories: false,
      fullscreen: false,
      location: false,
      menubar: false,
      resizable: false,
      scrollbars: false,
      status: false
    };

    Box.prototype._window = null;

    Box.prototype._url = '';

    Box.prototype._update = function(settings) {
      var _ref, _ref1;
      _.extend(this._settings, settings);
      if ((_ref = this._window) != null) {
        if (typeof _ref.moveTo === "function") {
          _ref.moveTo(this._get('left'), this._get('top'));
        }
      }
      if ((_ref1 = this._window) != null) {
        if (typeof _ref1.resizeTo === "function") {
          _ref1.resizeTo(this._get('width'), this._get('height'));
        }
      }
      this.trigger('change', settings);
      return this._getAll();
    };

    Box.prototype._get = function(prop) {
      return this._settings[prop];
    };

    Box.prototype._getAll = function() {
      return _.extend(_.clone(this._settings), this._fixed);
    };

    Box.prototype._getDefault = function() {
      return this.constructor.prototype._settings;
    };

    Box.prototype._getChromeHeight = _.once(function() {
      var body, chrome, total;
      total = window.screen.height;
      body = window.innerHeight;
      return chrome = total - body;
    });

    function Box(settings) {
      var _this = this;
      if (settings == null) {
        settings = {};
      }
      Box.__super__.constructor.apply(this, arguments);
      this._settings = _.clone(this._settings);
      this._update(settings);
      this.id = _.uuid();
      this.on('show', function() {
        return _this.setTemplate(_this._get('template'));
      });
    }

    Box.prototype.setTemplate = function(template) {
      var root, _ref;
      if (!(root = (_ref = this._window) != null ? _ref.document.querySelector('html') : void 0)) {
        return;
      }
      return root.innerHTML = template(this);
    };

    Box.prototype.show = function() {
      var opts;
      opts = _.serialize(this._getAll(), {
        sep: ',',
        eq: '='
      }, function(v) {
        switch (v) {
          case false:
            return 'no';
          case true:
            return 'yes';
          default:
            return "" + v;
        }
      });
      this._window || (this._window = window.open(this._url, this.id, opts));
      this.trigger('show', this);
      return this;
    };

    Box.prototype.hide = function() {
      var _ref;
      if ((_ref = this._window) != null) {
        _ref.close();
      }
      this._window = null;
      this.trigger('hide', this);
      return this;
    };

    Box.prototype.isVisible = function() {
      var _ref;
      return ((_ref = this._window) != null ? _ref.location : void 0) != null;
    };

    Box.prototype.equals = function(box) {
      return box.id === this.id;
    };

    Box.prototype.reset = function() {
      this._update(this._getDefault());
      return this;
    };

    Box.prototype.position = function(coords) {
      var changed, left, top, _default, _ref, _ref1, _ref2;
      _default = this._getDefault();
      if (coords) {
        this._update(changed = {
          left: Math.ceil((_ref = coords[X]) != null ? _ref : _default.left),
          top: Math.ceil((_ref1 = coords[Y]) != null ? _ref1 : _default.top)
        });
        this.trigger('move', [changed.left, changed.top]);
      }
      _ref2 = this._getAll(), left = _ref2.left, top = _ref2.top;
      return [left, top];
    };

    Box.prototype.size = function(dimensions) {
      var changed, _default, _ref, _ref1;
      _default = this._getDefault();
      if (dimensions) {
        this._update(changed = {
          width: Math.ceil((_ref = dimensions[X]) != null ? _ref : _default.width),
          height: Math.ceil((_ref1 = dimensions[Y]) != null ? _ref1 : _default.height)
        });
        this.trigger('resize', changed);
      }
      return [this._get('width'), this._get('height')];
    };

    Box.prototype.corners = function() {
      var height, position, width, _ref;
      _ref = this.size(), width = _ref[0], height = _ref[1];
      position = this.position();
      return [_.vec(position).add([0, 0]), _.vec(position).add([width, 0]), _.vec(position).add([width, height]), _.vec(position).add([0, height])];
    };

    Box.prototype.edgeCenters = function() {
      var bl, br, tl, tr, _ref;
      _ref = this.corners(), tl = _ref[0], tr = _ref[1], br = _ref[2], bl = _ref[3];
      return [_.vec(tl, tr).center(), _.vec(tr, br).center(), _.vec(br, bl).center(), _.vec(bl, tl).center()];
    };

    Box.prototype.center = function() {
      var bl, br, tl, tr, _ref;
      _ref = this.corners(), tl = _ref[0], tr = _ref[1], br = _ref[2], bl = _ref[3];
      return _.vec(tl, br).center();
    };

    return Box;

  })(Events);

  Brick = (function(_super) {
    __extends(Brick, _super);

    function Brick() {
      _ref = Brick.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return Brick;

  })(Box);

  Ball = (function(_super) {
    __extends(Ball, _super);

    Ball.prototype._velocity = [0, 0];

    Ball.prototype._getDefault = function() {
      return _.extend({
        velocity: this._velocity
      }, Ball.__super__._getDefault.apply(this, arguments));
    };

    function Ball() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this._velocity = _.clone(this._velocity);
      Ball.__super__.constructor.apply(this, args);
    }

    Ball.prototype.velocity = function(vel) {
      var vx, vy, _ref1, _ref2, _ref3;
      _ref1 = this._getDefault().velocity, vx = _ref1[0], vy = _ref1[1];
      if (vel) {
        this._velocity = [(_ref2 = vel[X]) != null ? _ref2 : vx, (_ref3 = vel[Y]) != null ? _ref3 : vy].map(Math.ceil);
      }
      return this._velocity;
    };

    Ball.prototype.bounce = function(dir) {
      var dx, dy, newVelocity, vx, vy, _ref1;
      dx = dir[0], dy = dir[1];
      _ref1 = this.velocity(), vx = _ref1[0], vy = _ref1[1];
      this.velocity(newVelocity = [dx !== 0 ? dx * Math.abs(vx) : vx, dy !== 0 ? dy * Math.abs(vy) : vy]);
      return this.trigger('bounce', newVelocity);
    };

    Ball.prototype.show = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      Ball.__super__.show.apply(this, args);
      this.size(this.size());
      return this;
    };

    Ball.prototype.atEdge = function() {
      var availHeight, availWidth, ch, h, w, x, y, _ref1, _ref2, _ref3;
      _ref1 = this.position(), x = _ref1[0], y = _ref1[1];
      _ref2 = this.size(), w = _ref2[0], h = _ref2[1];
      _ref3 = window.screen, availHeight = _ref3.availHeight, availWidth = _ref3.availWidth;
      ch = this._getChromeHeight();
      if (x <= 0) {
        return [1, 0];
      } else if (x + w >= availWidth) {
        return [-1, 0];
      } else if (y <= 0) {
        return [0, 1];
      } else if (y + h >= availHeight) {
        return [0, -1];
      } else {
        return false;
      }
    };

    Ball.prototype.move = function(n) {
      var _this = this;
      if (n == null) {
        n = 1;
      }
      return _.times(n, function() {
        var change;
        change = _.vec(_this.velocity()).multiply(DRAW_INTERVAL / 1000);
        return _this.position(_.vec(_this.position()).add(change));
      });
    };

    return Ball;

  })(Box);

  Paddle = (function(_super) {
    __extends(Paddle, _super);

    function Paddle() {
      _ref1 = Paddle.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Paddle.prototype.left = function() {
      var vx, vy, _ref2;
      _ref2 = this.velocity().map(Math.abs), vx = _ref2[0], vy = _ref2[1];
      this.velocity([-vx, vy]);
      return this;
    };

    Paddle.prototype.right = function() {
      this.velocity(this.velocity().map(Math.abs));
      return this;
    };

    Paddle.prototype.move = function(n) {
      if (this.atEdge()) {

      } else {
        return Paddle.__super__.move.call(this, n);
      }
    };

    Paddle.prototype.atEdge = function() {
      var vx, w, x;
      x = this.position()[0];
      vx = this.velocity()[0];
      w = this.size()[0];
      if (x <= 0 && vx < 0) {
        return [1, 0];
      } else if (x + w >= window.screen.availWidth && vx > 0) {
        return [1, 0];
      } else {
        return false;
      }
    };

    return Paddle;

  })(Ball);

  Bricks = (function(_super) {
    __extends(Bricks, _super);

    Bricks.prototype._generate = function(_arg) {
      var ch, column, height, row, template, vt, width, _i, _ref2, _results;
      this.columns = _arg.columns, this.rows = _arg.rows, template = _arg.template;
      ch = Box.prototype._getChromeHeight();
      vt = window.screen.availTop;
      this.brick = {
        height: height = Math.ceil(this.height / this.rows),
        width: width = Math.ceil(this.width / this.columns)
      };
      _results = [];
      for (row = _i = 0, _ref2 = this.rows; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; row = 0 <= _ref2 ? ++_i : --_i) {
        this.push([]);
        _results.push((function() {
          var _j, _ref3, _results1;
          _results1 = [];
          for (column = _j = 0, _ref3 = this.columns; 0 <= _ref3 ? _j < _ref3 : _j > _ref3; column = 0 <= _ref3 ? ++_j : --_j) {
            _results1.push(this[row].push(new Brick({
              height: height,
              width: width,
              top: ((height + ch) * row) + vt,
              left: width * column,
              template: template
            })));
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    function Bricks(viewport, props) {
      Bricks.__super__.constructor.apply(this, arguments);
      this._initialized = false;
      this.height = viewport.height() * 0.3;
      this.width = viewport.width();
      this._generate(props);
    }

    Bricks.prototype.len = function() {
      var brick, length, row, _i, _j, _len, _len1;
      length = 0;
      for (_i = 0, _len = this.length; _i < _len; _i++) {
        row = this[_i];
        for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
          brick = row[_j];
          if (brick != null) {
            length++;
          }
        }
      }
      return length;
    };

    Bricks.prototype.max = _.once(function() {
      var row;
      return ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = this.length; _i < _len; _i++) {
          row = this[_i];
          _results.push(row.length);
        }
        return _results;
      }).call(this)).reduce((function(t, l) {
        return t + l;
      }), 0);
    });

    Bricks.prototype.map = function(fn) {
      var brick, row, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = this.length; _i < _len; _i++) {
        row = this[_i];
        _results.push((function() {
          var _j, _len1, _results1;
          _results1 = [];
          for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
            brick = row[_j];
            _results1.push(typeof fn === "function" ? fn(brick) : void 0);
          }
          return _results1;
        })());
      }
      return _results;
    };

    Bricks.prototype.find = function(test) {
      var brick, found, i, j, row, _i, _j, _len, _len1;
      found = null;
      for (i = _i = 0, _len = this.length; _i < _len; i = ++_i) {
        row = this[i];
        for (j = _j = 0, _len1 = row.length; _j < _len1; j = ++_j) {
          brick = row[j];
          if (test(brick)) {
            found = [i, j];
          }
        }
      }
      return found;
    };

    Bricks.prototype.remove = function(id) {
      var i, j, _ref2;
      _ref2 = this.find(function(brick) {
        return brick && brick.id === id;
      }), i = _ref2[0], j = _ref2[1];
      this[i][j].hide();
      this[i][j] = null;
      return this;
    };

    Bricks.prototype.hide = function() {
      var brick, row, _i, _j, _len, _len1;
      for (_i = 0, _len = this.length; _i < _len; _i++) {
        row = this[_i];
        for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
          brick = row[_j];
          if (brick != null) {
            brick.hide();
          }
        }
      }
      return this;
    };

    Bricks.prototype.show = function() {
      var brick, row, _i, _j, _len, _len1;
      for (_i = 0, _len = this.length; _i < _len; _i++) {
        row = this[_i];
        for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
          brick = row[_j];
          if (brick != null) {
            brick.show();
          }
        }
      }
      return this;
    };

    return Bricks;

  })(Array);

  Screen = (function(_super) {
    __extends(Screen, _super);

    Screen.prototype._screen = typeof window !== "undefined" && window !== null ? window.screen : void 0;

    Screen.prototype._offset = [0, 0];

    Screen.prototype._getDefault = function() {
      return {
        offset: this.constructor.prototype._offset
      };
    };

    function Screen() {
      this._offset = _.clone(this._offset);
      Screen.__super__.constructor.apply(this, arguments);
    }

    Screen.prototype.height = function() {
      return this._screen.availHeight - 2 * this.offset()[Y];
    };

    Screen.prototype.width = function() {
      return this._screen.availWidth - 2 * this.offset()[X];
    };

    Screen.prototype.top = function() {
      return this.offset()[Y];
    };

    Screen.prototype.left = function() {
      return this.offset()[X];
    };

    Screen.prototype.offset = function() {
      var args, ox, oy, _ref2, _ref3, _ref4;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _ref2 = this._getDefault().offset, ox = _ref2[0], oy = _ref2[1];
      if (args.length) {
        this._offset = [(_ref3 = args[X]) != null ? _ref3 : ox, (_ref4 = args[Y]) != null ? _ref4 : oy];
      }
      return _.clone(this._offset);
    };

    Screen.prototype.adjust = function(x, y) {
      var xo, yo, _ref2;
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      _ref2 = this.offset(), xo = _ref2[0], yo = _ref2[1];
      return [x + xo, y + yo];
    };

    Screen.prototype.adjustX = function(x) {
      return (this.adjust(x, 0))[X];
    };

    Screen.prototype.adjustY = function(y) {
      return (this.adjust(0, y))[Y];
    };

    return Screen;

  })(Events);

  Grid = (function(_super) {
    __extends(Grid, _super);

    function Grid() {
      var ballHeight, center, ch, height, offset, paddleHeight, paddleTop, paddleWidth, width;
      Grid.__super__.constructor.apply(this, arguments);
      offset = this.offset();
      height = this.height();
      width = this.width();
      ch = Box.prototype._getChromeHeight();
      this.elements = {
        bricks: new Bricks(this, {
          rows: 3,
          columns: 10,
          template: function() {
            return "<body style=\"background: url('" + ROOT + "/img/bricks.png');\"></body>";
          }
        }),
        paddle: new Paddle({
          height: paddleHeight = 0.1 * height,
          width: paddleWidth = 0.3 * width,
          top: paddleTop = height - paddleHeight,
          left: (center = width / 2) - paddleWidth / 2,
          template: function() {
            return "<body style=\"background: url('" + ROOT + "/img/pattern.png');\"></body>";
          }
        }),
        ball: new Ball({
          height: ballHeight = 0.1 * height,
          width: ballHeight,
          top: paddleTop - ballHeight,
          left: center - ballHeight / 2,
          template: function() {
            return "<body style=\"background: black; overflow: hidden;\">\n  <div style=\"background: white;\n              height: 80vh;\n              width: 80vh;\n              margin: 10vh auto;\n              border-radius: 50%;\">\n    &nbsp;\n  </div>\n</body>";
          }
        })
      };
      this.elements.paddle.velocity([PADDLE_VELOCITY, 0]);
      this.elements.ball.velocity(_.vec([_.flip(-1, 1), -1 * _.random(Math.sqrt(1 / 3), Math.sqrt(3), false)]).multiply(BALL_VELOCITY));
    }

    Grid.prototype.show = function() {
      var element, name, _ref2, _results;
      _ref2 = this.elements;
      _results = [];
      for (name in _ref2) {
        element = _ref2[name];
        _results.push(element.show());
      }
      return _results;
    };

    Grid.prototype.hide = function() {
      var element, name, _ref2, _results;
      _ref2 = this.elements;
      _results = [];
      for (name in _ref2) {
        element = _ref2[name];
        _results.push(element.hide());
      }
      return _results;
    };

    return Grid;

  })(Screen);

  StateMachine = (function(_super) {
    __extends(StateMachine, _super);

    StateMachine.prototype._getState = function() {
      var _ref2;
      return (_ref2 = this._state) != null ? _ref2 : null;
    };

    StateMachine.prototype._setState = function(next) {
      var current;
      if (next == null) {
        return this._throw("Invalid state '" + next + "'");
      }
      current = this._getState();
      this._state = next + '';
      this.trigger('state:change', current, next);
      return next;
    };

    StateMachine.prototype._throw = function(error) {
      error = new Error(error);
      this.trigger('error', error);
      return error;
    };

    StateMachine.prototype._addStates = function(states) {
      var event, events, state, _i, _j, _len, _len1, _ref2, _ref3, _results,
        _this = this;
      for (_i = 0, _len = states.length; _i < _len; _i++) {
        _ref2 = states[_i], state = _ref2.state, events = _ref2.events;
        this._blueprint[state] = events;
      }
      _ref3 = _.uniq(_.flatten((_.pluck(states, 'events')).map(Object.keys)));
      _results = [];
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        event = _ref3[_j];
        _results.push(this[event] = (function() {
          var e;
          e = event;
          return function() {
            _this._triggerEvent(e);
            return _this;
          };
        })());
      }
      return _results;
    };

    StateMachine.prototype._triggerEvent = function(event) {
      var current, next, _ref2;
      current = this._getState();
      next = (_ref2 = this._blueprint[current]) != null ? _ref2[event] : void 0;
      if (next != null) {
        return this._setState(next);
      } else {
        this._throw("Invalid event '" + event + "' for current state '" + current + "'");
        return false;
      }
    };

    function StateMachine(states) {
      StateMachine.__super__.constructor.apply(this, arguments);
      this._blueprint = {};
      this._addStates(states);
      if (states[0]) {
        this._setState(states[0].state);
      }
    }

    StateMachine.prototype.trigger = function() {
      var args, event, _ref2;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (!((_ref2 = this[event]) != null ? _ref2.apply(this, args) : void 0)) {
        StateMachine.__super__.trigger.apply(this, [event].concat(__slice.call(args)));
      }
      return this;
    };

    return StateMachine;

  })(Events);

  Game = (function(_super) {
    __extends(Game, _super);

    Game.prototype._incDifficulty = function() {
      var ball, base, bricks, next, prev, _ref2;
      _ref2 = this._grid.elements, ball = _ref2.ball, bricks = _ref2.bricks;
      base = ball.velocity();
      prev = this._ballVelocity;
      this._difficulty = _.sqr(2 - bricks.len() / bricks.max());
      this._ballVelocity = next = BALL_VELOCITY * this._difficulty;
      return ball.velocity(_.vec(_.vec(base).multiply(1 / prev)).multiply(next));
    };

    Game.prototype._playSound = function(name) {
      var sound;
      sound = new Audio("/sounds/" + name + ".wav");
      return sound.play();
    };

    Game.prototype._moveBall = function() {
      var b1, b2, bB, bL, bR, bT, ball, brick, bricks, ch, dir, height, p1, p2, paddle, width, __, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      _ref2 = this._grid.elements, ball = _ref2.ball, paddle = _ref2.paddle, bricks = _ref2.bricks;
      _ref3 = bricks.brick, height = _ref3.height, width = _ref3.width;
      ch = Box.prototype._getChromeHeight();
      if (!bricks.len()) {
        return this.won();
      }
      _ref4 = ball.corners(), __ = _ref4[0], __ = _ref4[1], b2 = _ref4[2], b1 = _ref4[3];
      _ref5 = paddle.corners(), p1 = _ref5[0], p2 = _ref5[1];
      _ref6 = ball.edgeCenters(), bT = _ref6[0], bR = _ref6[1], bB = _ref6[2], bL = _ref6[3];
      if (dir = ball.atEdge()) {
        if (dir[Y] === -1) {
          this.lose();
        } else {
          ball.bounce(dir);
          this.trigger('bounce:wall', this);
        }
      } else if (b1[Y] >= p1[Y] && (p1[X] <= (_ref7 = b1[X]) && _ref7 <= p2[X]) && (p1[X] <= (_ref8 = b2[X]) && _ref8 <= p2[X])) {
        ball.bounce([0, -1]);
        this.trigger('bounce:paddle', this);
      } else if (brick = (_ref9 = bricks[Math.floor(bT[Y] / (height + ch))]) != null ? _ref9[Math.floor(bT[X] / width)] : void 0) {
        ball.bounce([0, 1]);
        bricks.remove(brick.id);
        this.trigger('bounce:brick', this);
      } else if (brick = (_ref10 = bricks[Math.floor(bB[Y] / (height + ch))]) != null ? _ref10[Math.floor(bB[X] / width)] : void 0) {
        ball.bounce([0, -1]);
        bricks.remove(brick.id);
        this.trigger('bounce:brick', this);
      } else if (brick = (_ref11 = bricks[Math.floor(bR[Y] / (height + ch))]) != null ? _ref11[Math.floor(bR[X] / width)] : void 0) {
        ball.bounce([-1, 0]);
        bricks.remove(brick.id);
        this.trigger('bounce:brick', this);
      } else if (brick = (_ref12 = bricks[Math.floor(bL[Y] / (height + ch))]) != null ? _ref12[Math.floor(bL[X] / width)] : void 0) {
        ball.bounce([1, 0]);
        bricks.remove(brick.id);
        this.trigger('bounce:brick', this);
      }
      ball.move();
      return this;
    };

    Game.prototype._controlGame = function(key) {
      var paddle, state, _ref2, _ref3;
      state = this._getState();
      switch (key.keyCode) {
        case 32:
          if (state === 'running') {
            return this.pause();
          } else {
            return this.resume();
          }
          break;
        case 80:
          return this.stop().display();
        case 27:
          return this.stop();
        case 37:
          paddle = (_ref2 = this._grid) != null ? _ref2.elements.paddle : void 0;
          switch (state) {
            case 'running':
              return paddle.left().move();
            case 'paused':
              return this.resume();
            default:
              return this.start();
          }
          break;
        case 39:
          paddle = (_ref3 = this._grid) != null ? _ref3.elements.paddle : void 0;
          switch (state) {
            case 'running':
              return paddle.right().move();
            case 'paused':
              return this.resume();
            default:
              return this.start();
          }
          break;
        default:
          return this.trigger('error', new Error('Invalid control'));
      }
    };

    Game.prototype._loop = function(current, next) {
      var ball, _ref2,
        _this = this;
      switch (next) {
        case 'drawn':
          this._difficulty = 1;
          this._ballVelocity = BALL_VELOCITY;
          this._grid = new Grid;
          this.show();
          break;
        case 'idle':
        case 'won':
          this.hide();
          return this._grid = null;
        case 'lost':
          ball = this._grid.elements.ball;
          ball.hide();
      }
      if (this._getState() === 'running') {
        if ((_ref2 = this._grid) != null) {
          _ref2.elements.paddle.show();
        }
        _.defer(function() {
          return _this._moveBall();
        });
        return _.wait(DRAW_INTERVAL, function() {
          return _this._loop();
        });
      }
    };

    function Game() {
      var _this = this;
      Game.__super__.constructor.call(this, [
        {
          state: 'idle',
          events: {
            display: 'drawn'
          }
        }, {
          state: 'drawn',
          events: {
            start: 'running',
            stop: 'idle'
          }
        }, {
          state: 'running',
          events: {
            pause: 'paused',
            stop: 'idle',
            win: 'won',
            lose: 'lost'
          }
        }, {
          state: 'paused',
          events: {
            resume: 'running',
            stop: 'idle'
          }
        }, {
          state: 'won',
          events: {
            stop: 'idle',
            display: 'drawn'
          }
        }, {
          state: 'lost',
          events: {
            stop: 'idle',
            display: 'drawn'
          }
        }
      ]);
      this.on('key:pressed', this._controlGame);
      this.on('state:change', this._loop);
      this.on('bounce:brick', this._incDifficulty);
      this.on('bounce:brick', _.bind(this._playSound, this, 'brick'));
      this.on('bounce:wall', _.bind(this._playSound, this, 'wall'));
      this.on('bounce:paddle', _.bind(this._playSound, this, 'paddle'));
      this.on('state:change', function(__, next) {
        if (next === 'won' || next === 'lost') {
          return _this._playSound(next);
        }
      });
    }

    Game.prototype.show = function() {
      var down, name, up, _ref2, _ref3, _window,
        _this = this;
      this._grid.show();
      down = _.throttle(DRAW_INTERVAL, function(e) {
        return _this.trigger('key:pressed', e);
      });
      up = function(e) {
        return _this.trigger('key:up', e);
      };
      _ref2 = this._grid.elements;
      for (name in _ref2) {
        _window = _ref2[name]._window;
        if (name === 'ball' || name === 'paddle') {
          if (_window != null) {
            _window.onkeydown || (_window.onkeydown = down);
          }
        }
      }
      this._grid.elements.bricks.map(function(brick) {
        var _ref3;
        return brick != null ? (_ref3 = brick._window) != null ? _ref3.onkeydown || (_ref3.onkeydown = down) : void 0 : void 0;
      });
      _ref3 = this._grid.elements;
      for (name in _ref3) {
        _window = _ref3[name]._window;
        if (name === 'ball' || name === 'paddle') {
          if (_window != null) {
            _window.onkeyup || (_window.onkeyup = up);
          }
        }
      }
      this._grid.elements.bricks.map(function(brick) {
        var _ref4;
        return brick != null ? (_ref4 = brick._window) != null ? _ref4.onkeyup || (_ref4.onkeyup = up) : void 0 : void 0;
      });
      return this;
    };

    Game.prototype.hide = function() {
      var name, _ref2, _ref3, _window;
      _ref2 = this._grid.elements;
      for (name in _ref2) {
        _window = _ref2[name]._window;
        if (name === 'ball' || name === 'paddle') {
          if (_window != null) {
            _window.onkeydown = null;
          }
        }
      }
      this._grid.elements.bricks.map(function(brick) {
        var _ref3;
        return brick != null ? (_ref3 = brick._window) != null ? _ref3.onkeydown = null : void 0 : void 0;
      });
      _ref3 = this._grid.elements;
      for (name in _ref3) {
        _window = _ref3[name]._window;
        if (name === 'ball' || name === 'paddle') {
          if (_window != null) {
            _window.onkeyup = null;
          }
        }
      }
      this._grid.elements.bricks.map(function(brick) {
        var _ref4;
        return brick != null ? (_ref4 = brick._window) != null ? _ref4.onkeyup = null : void 0 : void 0;
      });
      this._grid.hide();
      return this;
    };

    return Game;

  })(StateMachine);

  init = function() {
    var game;
    window.game = game = new Game;
    window.onkeydown = _.throttle(DRAW_INTERVAL, function(e) {
      return game.trigger('key:pressed', e);
    });
    window.onkeyup = function(e) {
      return game.trigger('key:up', e);
    };
    game.on('key:pressed', function(_arg) {
      var k, keyCode;
      keyCode = _arg.keyCode;
      if (k = window.document.querySelector("#k" + keyCode)) {
        return k.classList.add('pressed');
      }
    });
    game.on('key:up', function(_arg) {
      var e, keyCode, _i, _len, _ref2, _results;
      keyCode = _arg.keyCode;
      _ref2 = window.document.querySelectorAll('kbd');
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        e = _ref2[_i];
        _results.push(e.classList.remove('pressed'));
      }
      return _results;
    });
    return game.on('error', function(_arg) {
      var message;
      message = _arg.message;
      return console.log("Error: " + message);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.addEventListener('load', init, false);
  }

  window.onbeforeunload = function() {
    if (game._getState() === 'idle') {

    } else {
      return 'Active game!';
    }
  };

  window.onunload = function() {
    return typeof game !== "undefined" && game !== null ? game.stop() : void 0;
  };

  _.extend(window, {
    _: _
  });

}).call(this);

/*
//@ sourceMappingURL=bricks.map
*/
