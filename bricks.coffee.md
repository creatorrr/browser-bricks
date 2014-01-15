Re: [Letter to a Source-Code-Reader](http://stewd.io/pong/lib/pong.js)

Dear Stewart

Thanks for inspiring me and many like me with the wonders of js.
With all its warts and issues, JS is still one of my favorite languages.
I think simply by its virtue of being the language of the web, it surpasses most others
in its ability to champion the spirit of openness.

I have tried to keep this as simple as possible for the many awesome source code lovers
to read, reuse and critique.

Thanks again for caring to write that letter in 2009. It made a kid smile.

Diwank Singh
July 2013

*****

Browser Bricks
==============

Alright, lets get on with it.

Constants
---------

Defined here are constants used in the game.
To ascertain a particular corner in a list, follow clockwise starting from top-left.

    TL = 0
    TR = 1
    BR = 2
    BL = 3

`X` and `Y` are just sugar for getting abcissa and ordinate from a point pair.

    X = 0
    Y = 1

Game constants:

    DRAW_INTERVAL = 100 # ms

Helper Functions
----------------

First, lets define some helper functions for the application.

    _ =
      # Iterate N times
      times: (n, fn, ctx, args...) ->
        i = 1
        i++ and fn.apply ctx, args while i <= n

      # Extend objects
      extend: (dest, src) ->
        dest[k] = v for own k, v of src
        dest

      # Pick properties
      pick: (obj, props) ->
        result = {}
        result[k] = obj[k] for k in props when obj[k]?

        result

      # UUID function (Copied shamelessly from https://gist.github.com/bmc/1893440)
      uuid: ->
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace /[xy]/g, (c) ->
          r = Math.random() * 16 | 0
          v = if c is 'x' then r else (r & 0x3|0x8)
          v.toString 16

      # Simple serializer for flat objects
      serialize: (obj, {sep, eq}, cb) ->
        # Exec callback on all values of obj
        obj[k] = cb v for own k, v of obj if cb?

        # Return serialized obj
        ("#{ k }#{ eq }#{ v }" for own k, v of obj).join sep

      # Defer execution of function
      defer: (fn, args...) -> setTimeout fn, 1, args...

      # Clone object
      clone: (obj) ->
        # If object extend
        if obj is Object obj
          _.extend {}, obj

        else  # Assume its array otherwise
          obj.splice 0

      # Negate function
      negate: (fn) ->
        (args...) -> not fn args...

      # Return first and last of array
      first: (array) -> array[0]
      last: (array) -> array[array.length-1]

      # Square an integer
      sqr: (n) -> n*n

      # Return random number between min & max
      random: (min, max) ->
        if not max?
          # Only one arg passed
          max = min
          min = 0

        Math.floor (Math.random() * (max - min + 1)) + min

      # Return function thats run only once
      once: (fn) ->
        ran = false
        mem = null

        (args...) ->
          # Return stored result if already run
          return mem if ran

          # Else compute and store result
          ran = true
          mem = fn.apply this, args

          # Deref fn return result
          fn = null
          mem

      # Throttle a function (Inspired by http://remysharp.com/2010/07/21/throttling-function-calls/)
      throttle: (wait, fn, context) ->
        # Closure vars
        last = 0
        deferTimer = null

        # Return throttled fn
        (args...) ->
          # Init
          now = +new Date

          # Callback
          run = ->
            last = now

            # Execute fn
            if context then fn.apply context, args else fn args...

          # Check if wait elapsed
          if last && now < last + wait
            clearTimeout deferTimer if deferTimer
            deferTimer = setTimeout run, wait

          else run()  # For the first time

      # Vector functions
      vec: ([x, y], [x1, y1]=[0, 0]) ->
        add: ([x2, y2]) -> [
          x2 + x
          y2 + y
        ]

        multiply: (scalar) -> [
          x * scalar
          y * scalar
        ]

        center: -> [
          (x + x1) / 2
          (y + y1) / 2
        ]

        dist: ([x2, y2]) ->
          Math.sqrt (_.sqr x - x2) + (_.sqr y - y2)

Class: Events
-------------

Here is a simple class for managing events on objects.

    class Events
      constructor: ->
        # Storage for events
        @_events = {}

      # Add event handler
      on: (name, handler) ->
        (@_events[name] ?= []).push handler
        this

      # Remove event
      off: (name) ->
        delete @_events[name]
        this

      # Trigger event handlers
      trigger: (name, args...) ->
        if (handlers = @_events[name])?
          handler.apply this, args for handler in handlers
        else null

Class: Box (Events)
-------------------

Now, lets define a box that will be the basic building block for the game.
All the objects will inherit from this class.

    class Box extends Events
      # -- Private --
      _settings:
        # Default settings
        height: 100
        width:  200
        top:    0
        left:   0

      _props:
        # Fixed window props
        toolbar:     false
        directories: false
        fullscreen:  false
        location:    false
        menubar:     false
        resizable:   false
        scrollbars:  false
        status:      false

      _window: null  # Empty window object
      _url: '' # Empty placeholder

      _update: (settings) ->
        # Update settings
        _.extend @_settings, settings

        # Adjust window props
        @_window?.moveTo?   (@_get 'left'), (@_get 'top')
        @_window?.resizeTo? (@_get 'width'), (@_get 'height')

        # Trigger change event with changed settings
        @trigger 'change', settings

        # Return a copy of settings
        @_getAll()

      _get: (prop) -> @_settings[prop]
      _getAll: -> _.extend (_.clone @_settings), @_fixed

      _getDefault: -> @constructor::_settings

      # FIXME: Hacky way to find height of chrome
      _getChromeHeight: _.once ->
        total = window.screen.availHeight
        taskbar = window.screen.availTop
        body = (document.querySelector 'body').scrollHeight

        chrome = total - taskbar - body

      # -- Public --
      constructor: (settings={}) ->
        super

        # Make a copy of default settings
        @_settings = _.clone @_settings

        # Override settings.
        @_update settings

        # Set random name with namespace
        @id = _.uuid()

      # Show window with settings.
      show: ->
        # Serialize options
        opts = _.serialize @_getAll(), {sep: ',', eq: '='}, (v) ->
          switch v
            when false then 'no'
            when true then 'yes'
            else "#{ v }"

        # Open window
        @_window or= window.open @_url, @id, opts

        # Trigger show event
        @trigger 'show', this

        this

      # Hide the window.
      hide: ->
        @_window?.close()
        @_window = null

        # Trigger hide event
        @trigger 'hide', this

        this

      # Check if window is visible.
      isVisible: -> @_window?.location?

      # Check for equality
      equals: (box) -> box.id is @id

      # Reset window settings.
      reset: ->
        @_update @_getDefault()
        this

      # Return or update window position coords.
      position: (coords) ->
        _default = @_getDefault()

        # Set new coords
        if coords
          @_update changed =
            left: Math.ceil coords[X] ? _default.left  # x
            top:  Math.ceil coords[Y] ? _default.top   # y

          @trigger 'move', [changed.left, changed.top]

        # Return coords
        {left, top} = @_getAll()
        [left, top]

      # Return or update window dimensions.
      size: (dimensions) ->
        _default = @_getDefault()

        # Set new dimensions
        if dimensions
          @_update changed =
            width:  Math.ceil dimensions[X] ? _default.width
            height: Math.ceil dimensions[Y] ? _default.height

          @trigger 'resize', changed

        # Return dimensions
        [(@_get 'width'), (@_get 'height')]

      # Get all corners
      corners: ->
        [width, height] = @size()
        position = @position()
        ch = @_getChromeHeight()

        # Return corners
        [
          _.vec(position).add [0, -ch]        # tl
          _.vec(position).add [width, -ch]    # tr
          _.vec(position).add [width, height] # br
          _.vec(position).add [0, height]     # bl
        ]

      # Get edge centers
      edgeCenters: ->
        [tl, tr, br, bl] = @corners()

        # Return center coordinates
        [
          _.vec(tl, tr).center()
          _.vec(tr, br).center()
          _.vec(br, bl).center()
          _.vec(bl, tl).center()
        ]

      # Get center
      center: ->
        [tl, tr, br, bl] = @corners()

        # Return center coordinates
        _.vec(tl, br).center()

Class: Brick (Box)
------------------

Now lets use the class `Box` to design the `Brick` class which
will be used to render the bricks.

Its pretty much a useless box.

    class Brick extends Box
      type: 'brick'

Class: Ball (Box)
-----------------

Alright, so the ball is a little tricky. It has to move two-
dimensionally and bounce off of objects.

So, we need an instance that also stores its velocity at any
instant and the methods to manipulate it.

    class Ball extends Box
      # -- Private --
      _velocity: [0, 0]

      # Override getDefault to get default velocity
      _getDefault: -> _.extend {velocity: @_velocity}, super

      # -- Public --
      constructor: (args...) ->
        # Copy deafults
        @_velocity = _.clone @_velocity

        super args...

      type: 'ball'

      # Set or retrieve velocity
      velocity: (vel) ->
        [vx, vy] = @_getDefault().velocity

        # Set new velocity
        if vel then @_velocity = [
          vel[X] ? vx

          # y velocity affects distance from top so inverted to preserve
          # upward positive velocity direction.
          -(vel[Y] ? vy)
        ].map Math.ceil

        # Return velocity
        @_velocity

      # Change direction of velocity components
      bounce: (dir) ->
        # Reverse velocity
        reverse = (v) -> -v

        @velocity newVelocity = [
          if dir[X] then reverse @_velocity[X] else @_velocity[X]
          if dir[Y] then reverse @_velocity[Y] else @_velocity[Y]
        ]...

        @trigger 'change', velocity: newVelocity

      # Override show to make sure paddle is correctly sized after it becomes visible
      show: (args...) ->
        super args...

        # Resize to current size
        @size @size()

        this

      # Move one step
      move: (n=1) ->
        _.times n, =>
          change = _.vec(@velocity()).multiply DRAW_INTERVAL / 1000

          # Move to new position
          @position _.vec(@position())
            .add change

Class: Paddle (Ball)
--------------------

A paddle is basically an enlarged ball thats constrained to move in a
straight line.

    class Paddle extends Ball
      type: 'paddle'

      left: ->
        [vx, vy] = @velocity().map Math.abs
        @velocity [-vx, vy]

        this

      right: ->
        @velocity @velocity().map Math.abs

        this

Class: Screen (Events)
----------------------

This class is supposed to keep track of screen dimensions, offsets etc.

    class Screen extends Events
      # -- Private --
      _screen: window?.screen
      _offset: [0, 0]
      _getDefault: -> offset: @constructor::_offset

      # -- Public --
      constructor: ->
        # Copy offset
        @_offset = _.clone @_offset
        super

      # Get available screen coordinates
      height: -> @_screen.availHeight - 2*@offset()[Y]
      width: -> @_screen.availWidth - 2*@offset()[X]
      top: -> @offset()[Y]
      left: -> @offset()[X]

      # Set or retrieve offset
      offset: (args...) ->
        [ox, oy] = @_getDefault().offset

        if args.length then @_offset = [
          args[X] ? ox  # offsetX
          args[Y] ? oy  # offsetY
        ]

        # Return offset
        _.clone @_offset

      # Adjust coords
      adjust: (x=0, y=0) ->
        # Get offset
        [xo, yo] = @offset()

        # Return adjusted value
        [
          x + xo
          y + yo
        ]

      adjustX: (x) -> (@adjust x, 0)[X]
      adjustY: (y) -> (@adjust 0, y)[Y]

Class: Bricks (Array)
---------------------

Collection of `Brick` instances that organizes itself.
It also ascertains whether the `Ball` is touching a `Brick`.

    class Bricks extends Array
      # -- Private --
      # Generate bricks
      _generate: ({@columns, @rows}) ->
        # Viewport dimensions
        ch = Box::_getChromeHeight()

        # Brick dimensions
        @brick =
          height: height = Math.ceil @height / @rows
          width: width = Math.ceil @width / @columns

        # Add bricks
        for row in [0...@rows]
          this.push []

          for column in [0...@columns]
            this[row].push new Brick
              height: height
              width: width
              top: (height + 2 * ch) * row
              left: width * column

      # -- Public --
      constructor: (viewport, props) ->
        super

        @_initialized = false

        # Default dimensions
        @height = viewport.height() * 0.3
        @width = viewport.width()

        # Generate bricks
        @_generate props

      # Map function
      map: (fn) ->
        fn? brick for brick in row for row in this

      # Remove elements based on search function
      remove: (i, j) ->
        # Hide brick
        (brick = this[i][j]).hide()

        # Remove element
        this[i][j] = null

        this

      # Hide all elements
      hide: ->
        brick?.hide() for brick in row for row in this
        this

      # Show all elements
      show: ->
        brick?.show() for brick in row for row in this
        this

Class: Grid (Screen)
--------------------

Grid manages the elements according to their context.

    class Grid extends Screen
      constructor: ->
        super

        # Set offset and get viewport props
        offset = @offset()
        height = @height()
        width  = @width()
        ch = Box::_getChromeHeight()

        # Create elements
        @elements =
          bricks: new Bricks this,
            rows: 3
            columns: 10

          paddle: new Paddle
            height: paddleHeight = 0.02 * height
            width:  paddleWidth = 0.3 * width
            top:    @adjustY paddleTop = height - paddleHeight  # Place at bottom
            left:   @adjustX (center = width / 2) - paddleWidth / 2

          ball: new Ball
            height: ballHeight = 0.1 * height
            width:  ballHeight

            # Place ball on the paddle
            top:    @adjustY paddleTop - ballHeight - 2 * ch
            left:   @adjustX center - ballHeight / 2

        # Set velocity
        @elements.paddle.velocity [100, 0]
        @elements.ball.velocity [100, 0]

      # Change visibility
      show: -> element.show() for name, element of @elements
      hide: -> element.hide() for name, element of @elements

Class: StateMachine (Events)
----------------------------

We use a state machine (fancy term for a simple concept) to manage game state.

    class StateMachine extends Events
      # -- Private --
      _getState: -> @_state ? null
      _setState: (next) ->
        unless next?
          return @_throw "Invalid state '#{ next }'"

        current = @_getState()
        @_state = next+''
        @trigger 'state:change', current, next

        next

      _throw: (error) ->
        error = new Error error
        @trigger 'error', error
        error

      _addEvents: (state, events) ->
        # Add to blueprint
        (@_blueprint or= {})[state] = events

        # Add events to machine
        for event of events
          this[(event+'').toLowerCase()] ?= =>
            # Get current state and find out if event allowed
            current = @_getState()
            allowed = (next = @_blueprint[current]?[event])?

            # Set next state
            if allowed
              @_setState next
            else
              @_throw "Invalid event '#{ event }' for current state '#{ current }'"
              false

      _addState:({state, events}) -> @_addEvents state, events

      # -- Public --
      constructor: (states) ->
        # List of states and events to initialize machine
        # Ex: [
        #   {
        #     state: 'blah',
        #     events: {
        #       'someEvent': 'newState'
        #     }
        #   },
        #   { ... }
        # ]

        super

        # Add events for corresponding states
        for state in states
          @_addState state

        # Start
        @trigger states[0].state if states[0]

      # Override trigger to run machine events
      trigger: (event, args...) ->
        unless stateEvent = this[event]? args...
          super event, args...

        this

Class Game (StateMachine)
-------------------------

    class Game extends StateMachine
      # -- Private --
      _draw: ->
        # Draw elements
        @show()
        this

      _erase: ->
        # Remove elements
        @hide()
        this

      _controlGame: (key) ->
        # Elements
        {paddle} = @_grid.elements

        # Game controls
        switch key.keyCode
          when 32 then @resume()              # space
          when 80 then @pause()               # 'p'
          when 27 then @stop()                # Esc
          when 37 then paddle.left().move()   # <-
          when 39 then paddle.right().move()  # ->
          else @trigger 'control:invalid'

      _loop: (current, next) ->
       # if next running then draw and timeout to self
       # else pause or stop

      # -- Public --
      constructor: ->
        # Define game states
        super [
          {
            state: 'idle'
            events: {
              start: 'running'
            }
          }
          {
            state: 'running'
            events: {
              pause: 'paused'
              stop: 'idle'
              win: 'won'
              lose: 'lost'
            }
          }
          {
            state: 'paused'
            events: {
              resume: 'running'
              stop: 'idle'
            }
          }
          {
            state: 'won'
            events: {
              reset: 'idle'
            }
          }
          {
            state: 'lost'
            events: {
              reset: 'idle'
            }
          }
        ]

        # Init game elements and controls
        @_grid = new Grid
        @on 'key:pressed', @_controlGame

        # Run game cycle on state change
        @on 'state:change', @_loop

      # Show
      show: ->
        @_grid.show()

        # Attach keydown event
        fn = _.throttle DRAW_INTERVAL, (e) =>
          console.log e
          @trigger 'key:pressed', e

        window.onkeydown = fn

        _window.onkeydown = fn for name, {_window} of @_grid.elements when name in ['ball', 'paddle']
        @_grid.elements.bricks.map ({_window}) ->
          _window.onkeydown = fn

        this

      hide: ->
        # Detach keydown event
        window.onkeydown = null

        _window.onkeydown = null for name, {_window} of @_grid.elements when name in ['ball', 'paddle']
        @_grid.elements.bricks.map ({_window}) ->
          _window.onkeydown = null

        @_grid.hide()
        this

Init
----

Set things up and start game.

    init = ->
      window.game = game = new Game

    # Attach DOM load listener
    window?.addEventListener 'load', init, false


Exports
-------

List of vars exported to global namespace.

    _.extend window,
      _: _
      Events: Events
      Box: Box
      Brick: Brick
      Ball: Ball
      Paddle: Paddle
      Screen: Screen
      Grid: Grid
      Bricks: Bricks
      StateMachine: StateMachine

