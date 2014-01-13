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
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) ->
          r = Math.random() * 16 | 0
          v = if c is 'x' then r else (r & 0x3|0x8)
          v.toString(16)
        )

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

      # Throttle a function (Inspired by http://remysharp.com/2010/07/21/throttling-function-calls/)
      throttle: (fn, wait, context) ->
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
      vec: ([x, y]) ->
        add: ([x2, y2]) -> [
          x2 + x
          y2 + y
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
          handler? args... for handler in handlers
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
      position: (coords...) ->
        _default = @_getDefault()

        # Set new coords
        if coords.length
          @_update changed =
            left: coords[X] ? _default.left  # x
            top:  coords[Y] ? _default.top   # y

          @trigger 'move', [changed.left, changed.top]

        # Return coords
        {left, top} = @_getAll()
        [left, top]

      # Return or update window dimensions.
      size: (dimensions...) ->
        _default = @_getDefault()

        # Set new dimensions
        if dimensions.length
          @_update changed =
            width:  dimensions[X] ? _default.width
            height: dimensions[Y] ? _default.height

          @trigger 'resize', changed

        # Return dimensions
        [(@_get 'width'), (@_get 'height')]

      # Get all corners
      corners: ->
        [width, height] = @size()
        position = @position()

        # Return corners
        [
          position                            # tl
          _.vec(position).add [width, 0]      # tr
          _.vec(position).add [width, height] # br
          _.vec(position).add [0, height]     # bl
        ]

      # Get center
      center: ->
        [tl, tr, br, bl] = @corners()

        # Return center coordinates
        [
          (tl[X] + tr[X]) / 2
          (tl[Y] + bl[Y]) / 2
        ]

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
      velocity: (vel...) ->
        [vx, vy] = @_getDefault().velocity

        # Set new velocity
        if vel.length then @_velocity = [
          vel[X] ? vx

          # y velocity affects distance from top so inverted to preserve
          # upward positive velocity direction.
          (vel[Y] ? vy) * -1
        ]

        # Return velocity
        _.clone @_velocity

      # Change direction of velocity components
      bounce: (dir) ->
        # Reverse velocity
        reverse = (v) -> v * -1

        @velocity newVelocity = [
          if dir[X] then reverse @_velocity[X] else @_velocity[X]
          if dir[Y] then reverse @_velocity[Y] else @_velocity[Y]
        ]...

        @trigger 'change', velocity: newVelocity

      # Override show to make sure paddle is correctly sized after it becomes visible
      show: (args...) ->
        super args...

        # Resize to current size
        @size @size()...

        # FIXME: re-orient
        _.defer =>
          @size @size()...

        this

Class: Paddle (Ball)
--------------------

A paddle is basically an enlarged ball thats constrained to move in a
straight line.

    class Paddle extends Ball
      type: 'paddle'

      # Override velocity to constrain 1D motion
      velocity: (vx) ->
        if vx?
          super vx, @_velocity[Y]
        else
          super

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
              top: height * row
              left: width * column

      constructor: (viewport, props) ->
        @_initialized = false

        # Default dimensions
        @height = viewport.height() * 0.3
        @width = viewport.width()

        # Generate bricks
        @_generate props

        super

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
        # Set offset and get viewport props
        offset = @offset()
        height = @height()
        width  = @width()

        # Create elements
        @elements =
          bricks: new Bricks this,
            rows: 3
            columns: 10

          paddle: new Paddle
            height: paddleHeight = 0.02 * height
            width:  0.3 * width                     # and 30% viewport width
            top:    @adjustY paddleTop = height - paddleHeight  # Place at bottom
            left:   @adjustX center = width / 2     # and center

          ball: new Ball
            height: ballHeight = 0.05 * height
            width:  ballHeight
            top:    @adjustY paddleTop - ballHeight # Place ball on the paddle
            left:   @adjustX center

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

        old = @_getState()
        @_state = next+''
        @trigger 'state:change', old, next

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
        @trigger 'start', this
        @_setState states[0].state if states[0]

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

