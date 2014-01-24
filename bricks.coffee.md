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

    DRAW_INTERVAL = 50 # ms
    PADDLE_VELOCITY = 500
    BALL_VELOCITY = 250

Host name:

    ROOT = do ->
      root = window.location.href
      if root[root.length - 1] is '/' then root[...root.length-1] else root

Browser type:

    BROWSER = do ->
      ua = window.navigator.userAgent.toLowerCase()

      if !!~ ua.indexOf 'chrome'
        'chrome'

      else if !!~ ua.indexOf 'firefox'
        'firefox'

      else 'other'

Helper Functions
----------------

Shims.

    unless window.Set
      class window.Set extends Array
        constructor: -> super
        add: (e) -> @push e unless @has e
        has: (e) -> e in this
        clear: -> @pop() for i in [0...@size()]
        delete: (e) ->
          found = @indexOf e
          @splice found, 1 unless found is -1

        size: -> @length

Now, lets define some helper functions for the application.

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

      pluck: (arr, prop) ->
        (obj[prop] for obj in arr)

      # Return array with unique elements
      uniq: (arr) ->
        seen = new Set

        for e in arr when not seen.has e
          seen.add e
          e

      # 1-level flatten
      flatten: (arr) ->
        a = []
        for e in arr
          if e.length then a = a.concat e else a.push e

        a

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
      sqr: (n) -> n * n

      # Choose a random arg
      flip: (args...) ->
        args[_.random 0, args.length - 1]

      # Return random number between min & max
      random: (min, max, int=true) ->
        if not max?
          # Only one arg passed
          max = min
          min = 0

        if int
          Math.floor (Math.random() * (max - min + 1)) + min
        else
          (Math.random() * (max - min)) + min

      wait: (t, fn, args...) -> setTimeout fn, t, args...

      # Defer execution of function
      defer: (fn, args...) -> _.wait 1, fn, args...

      # Bind function to context and arguments
      bind: (fn, ctx, args...) ->
        (extra...) ->
          fn.apply ctx, args.concat extra

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
          if last and now < last + wait
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

      # Shim onkeydown to avoid key repeat delay
      onKeyEvent: do ->
        _fn = {}
        _timers = {}

        (w, fn) ->
          _fn[w.name] = fn
          _timers[w.name] or= {}

          w.onkeydown or= (e) ->
            fn = _fn[@name]
            timers = _timers[@name]
            {keyCode} = e

            unless timers[keyCode]?
              clearInterval timers[keyCode]
              fn? 'key:down', e

              timers[keyCode] = setInterval (_.bind fn, null, 'key:down', e), DRAW_INTERVAL

            true

          w.onkeyup or= (e) ->
            fn = _fn[@name]
            timers = _timers[@name]
            {keyCode} = e

            fn? 'key:up', e

            clearInterval timers[keyCode] if timers[keyCode]?
            timers[keyCode] = null

            true

          w.onblur or= ->
            timers = _timers[@name]

            for k, v of timers when v?
              clearInterval v

            timers = {}
            true


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
        @_events[name] = null
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
        height:   100
        width:    200
        top:      0
        left:     0

        template: ''

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
      _getAll: -> _.extend (_.clone @_settings), @_props

      _getDefault: -> @constructor::_settings

      # FIXME: Hacky way to find height of chrome
      _getChromeHeight: _.once ->
        total = window.screen.height
        body = window.innerHeight

        chrome = total - body

      # -- Public --
      constructor: (settings={}) ->
        super

        # Make a copy of default settings
        @_settings = _.clone @_settings

        # Override settings.
        @_update settings

        # Set random name with namespace
        @id = _.uuid()

        # Set template on show
        @on 'show', => @setTemplate @_get 'template'

      # Set inner html
      setTemplate: (template) ->
        return unless root = @_window?.document.querySelector 'html'
        root.innerHTML = template this

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

        # Return corners
        [
          _.vec(position).add [0, 0]            # tl
          _.vec(position).add [width, 0]        # tr
          _.vec(position).add [width, height]   # br
          _.vec(position).add [0, height]       # bl
        ]

      # Get edge centers
      edgeCenters: ->
        [tl, tr, br, bl] = @corners()

        # Return center coordinates
        [
          _.vec(tl, tr).center()  # T
          _.vec(tr, br).center()  # R
          _.vec(br, bl).center()  # B
          _.vec(bl, tl).center()  # L
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

      # Set or retrieve velocity
      velocity: (vel) ->
        [vx, vy] = @_getDefault().velocity

        # Set new velocity
        if vel then @_velocity = [
          vel[X] ? vx
          vel[Y] ? vy
        ].map Math.ceil

        # Return velocity
        @_velocity

      # Change direction of velocity components
      bounce: (dir) ->
        [dx, dy] = dir
        [vx, vy] = @velocity()

        @velocity newVelocity = [
          if dx isnt 0 then dx * Math.abs vx else vx
          if dy isnt 0 then dy * Math.abs vy else vy
        ]

        @trigger 'bounce', newVelocity

      # Override show to make sure paddle is correctly sized after it becomes visible
      show: (args...) ->
        super args...

        # Resize to current size
        @size @size()

        this

      # Define constraints
      atEdge: ->
        [x, y] = @position()
        [w, h] = @size()
        {availHeight, availWidth} = window.screen
        ch = @_getChromeHeight()

        # Left edge
        if x <= 0
          [1, 0]

        # Right edge
        else if x + w >= availWidth
          [-1, 0]

        # Top edge
        else if y <= 0
          [0, 1]

        # Bottom edge
        else if y + h >= availHeight
          [0, -1]

        else false

      # Move n steps
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
      left: ->
        [vx, vy] = @velocity().map Math.abs
        @velocity [-vx, vy]

        this

      right: ->
        @velocity @velocity().map Math.abs

        this

      # Add constraints
      move: (n) ->
        if @atEdge() then return else super n

      atEdge: ->
        [x] = @position()
        [vx] = @velocity()
        [w] = @size()

        # Left edge
        if x <= 0 and vx < 0
          [1, 0]

        # Right edge
        else if x + w >= window.screen.availWidth and vx > 0
          [1, 0]

        else false

Class: Bricks (Array)
---------------------

Collection of `Brick` instances that organizes itself.
It also ascertains whether the `Ball` is touching a `Brick`.

    class Bricks extends Array
      # -- Private --
      # Generate bricks
      _generate: ({@columns, @rows, template}) ->
        # Viewport dimensions
        ch = Box::_getChromeHeight()
        vt = window.screen.availTop

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
              top: ((height + ch) * row) + vt
              left: width * column

              template: template

      # -- Public --
      constructor: (viewport, props) ->
        super

        @_initialized = false

        # Default dimensions
        @height = viewport.height() * 0.3
        @width = viewport.width()

        # Generate bricks
        @_generate props

      # Number of bricks
      len: ->
        length = 0
        length++ for brick in row when brick? for row in this

        length

      # Max bricks
      max: _.once ->
        (row.length for row in this).reduce ((t, l) -> t+l), 0

      # Map function
      map: (fn) ->
        result = (fn? brick for brick in row for row in this)
        result.reduce ((a, b) -> a.concat b), []

      # Find brick by test
      find: (test) ->
        found = null

        for row, i in this
          for brick, j in row
            found = [i, j] if test brick

        found

      # Remove elements based on search function
      remove: (id) ->
        [i, j] = @find (brick) -> brick and brick.id is id

        # Hide brick
        (this[i][j]).hide()

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

            template: -> """
              <body style="
                background: -moz-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('#{ ROOT }/img/bricks.png');
                background: -webkit-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('#{ ROOT }/img/bricks.png');
                background: -o-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('#{ ROOT }/img/bricks.png');
                background: -ms-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('#{ ROOT }/img/bricks.png');
                background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('#{ ROOT }/img/bricks.png');
              "></body>
            """

          paddle: new Paddle
            height: paddleHeight = 0.1 * height
            width:  paddleWidth = 0.3 * width
            top:    paddleTop = height - paddleHeight  # Place at bottom
            left:   (center = width / 2) - paddleWidth / 2

            template: -> """
              <body style="
                background: -webkit-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('#{ ROOT }/img/pattern.png');
                background: -moz-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('#{ ROOT }/img/pattern.png');
                background: -o-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('#{ ROOT }/img/pattern.png');
                background: -ms-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('#{ ROOT }/img/pattern.png');
                background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), url('#{ ROOT }/img/pattern.png');
              "></body>
            """

          ball: new Ball
            height: ballHeight = 0.1 * height
            width:  ballHeight

            # Place ball on the paddle
            top:    paddleTop - ballHeight
            left:   center - ballHeight / 2

            template: -> """
              <body style="background: black; overflow: hidden;">
                <div style="background: lime;
                            height: 80vh;
                            width: 80vh;
                            margin: 0 auto;
                            border-radius: 50%;">
                  &nbsp;
                </div>
              </body>
            """

        # Set velocity
        @elements.paddle.velocity [PADDLE_VELOCITY, 0]
        @elements.ball.velocity _.vec([
          _.flip -1, 1

          # Between 30deg and 60deg
          -1 * _.random Math.sqrt(1/3), Math.sqrt(3), false # Return fraction
        ]).multiply BALL_VELOCITY

      # Change visibility
      show: -> element.show() for name, element of @elements
      hide: -> element.hide() for name, element of @elements

      # Check popups
      popupsDisplayed: ->
        popups = @elements.bricks.map (i) -> i._window
        popups.reduce ((result, popup) -> result and popup?), true

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

      _addStates: (states) ->
        # Add to blueprint
        for {state, events} in states
          @_blueprint[state] = events

        # Add events to machine
        for event in _.uniq _.flatten (_.pluck states, 'events').map Object.keys
          this[event] = do =>
            e = event

            return =>
              @_triggerEvent e
              this

      _triggerEvent: (event) ->
        # Get current state and find out if event allowed
        current = @_getState()
        next = @_blueprint[current]?[event]

        # Set next state
        if next?
          @_setState next

        else
          @_throw "Invalid event '#{ event }' for current state '#{ current }'"
          false

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

        @_blueprint = {}

        # Add events for corresponding states
        @_addStates states

        # Start
        @_setState states[0].state if states[0]

      # Override trigger to run machine events
      trigger: (event, args...) ->
        unless this[event]?.apply this, args
          super event, args...

        this

Class Game (StateMachine)
-------------------------

    class Game extends StateMachine
      # -- Private --
      _incDifficulty: ->
        {ball, bricks} = @_grid.elements

        base = ball.velocity()
        prev = @_ballVelocity

        # Calc new difficulty (exponential growth)
        @_difficulty = _.sqr 2 - bricks.len() / bricks.max()
        @_ballVelocity = next = BALL_VELOCITY * @_difficulty

        # Set new velocity
        ball.velocity _.vec(
          _.vec(base).multiply 1/prev
        ).multiply next

      _playSound: (name) ->
        sound = new Audio "sounds/#{ name }.wav"
        sound.play()

      _moveBall: ->
        {ball, paddle, bricks} = @_grid.elements
        {height, width} = bricks.brick
        ch = Box::_getChromeHeight()

        return @win() unless bricks.len()

        # Points
        [__, __, b2, b1] = ball.corners()
        [p1, p2] = paddle.corners()
        [bT, bR, bB, bL] = ball.edgeCenters()

        # Bounce ball off walls and paddle
        if dir = ball.atEdge()
          if dir[Y] is -1
            @lose()

          else
            ball.bounce dir
            @trigger 'bounce:wall', this

        else if b1[Y] >= p1[Y] and
                p1[X] <= b1[X] <= p2[X] and
                p1[X] <= b2[X] <= p2[X]

          ball.bounce [0, -1]  # Up
          @trigger 'bounce:paddle', this

        # Brick collisions
        # Top edge
        else if brick = bricks[Math.floor bT[Y] / (height + ch)]?[Math.floor bT[X] / width]
          ball.bounce [0, 1]
          bricks.remove brick.id
          @trigger 'bounce:brick', this

        # Bottom edge
        else if brick = bricks[Math.floor bB[Y] / (height + ch)]?[Math.floor bB[X] / width]
          ball.bounce [0, -1]
          bricks.remove brick.id
          @trigger 'bounce:brick', this

        # Right edge
        else if brick = bricks[Math.floor bR[Y] / (height + ch)]?[Math.floor bR[X] / width]
          ball.bounce [-1, 0]
          bricks.remove brick.id
          @trigger 'bounce:brick', this

        # Left edge
        else if brick = bricks[Math.floor bL[Y] / (height + ch)]?[Math.floor bL[X] / width]
          ball.bounce [1, 0]
          bricks.remove brick.id
          @trigger 'bounce:brick', this

        # Move it
        ball.move()

        this

      _controlGame: (key) ->
        state = @_getState()

        # Game controls
        switch key.keyCode
          when 32  # space
            if state is 'running' then @pause() else @resume()

          when 80
            if state in ['lost', 'idle'] then @stop().display()  # 'p'

          when 27 then @stop()  # Esc
          when 37  # <-
            {paddle} = @_grid?.elements
            switch state
              when 'running' then paddle.left().move()
              when 'paused' then @resume()
              else @start()

          when 39  # ->
            {paddle} = @_grid?.elements
            switch state
              when 'running' then paddle.right().move()
              when 'paused' then @resume()
              else @start()

          else @trigger 'error', new Error 'Invalid control'

      _loop: (current, next) ->
        # Draw and undraw game elements on state change
        switch next
          when 'drawn'
            # Init game elements
            @_difficulty = 1
            @_ballVelocity = BALL_VELOCITY
            @_grid = new Grid

            # Show grid
            @show()

          when 'idle', 'won'
            @hide()
            return @_grid = null

          when 'lost'
            {ball} = @_grid.elements
            ball.hide()

        # Route actions
        if @_getState() is 'running'
          @_grid?.elements.paddle.show()
          _.defer => @_moveBall()

          # Recurse
          _.wait DRAW_INTERVAL, => @_loop()

      # -- Public --
      constructor: ->
        # Define game states
        super [
          {
            state: 'idle'
            events: {
              display: 'drawn'
            }
          }
          {
            state: 'drawn'
            events: {
              start: 'running'
              stop: 'idle'
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
              stop: 'idle'
              display: 'drawn'
            }
          }
          {
            state: 'lost'
            events: {
              stop: 'idle'
              display: 'drawn'
            }
          }
        ]

        # Init game controls
        @on 'key:down', @_controlGame

        # Run game cycle on state change
        @on 'state:change', @_loop

        # Increase difficulty
        @on 'bounce:brick', @_incDifficulty

        # Play sounds
        @on 'bounce:brick', _.bind @_playSound, this, 'brick'
        @on 'bounce:wall', _.bind @_playSound, this, 'wall'
        @on 'bounce:paddle', _.bind @_playSound, this, 'paddle'

        @on 'state:change', (__, next) =>
          if next in ['won', 'lost']
            @_playSound next

            # Prompt for rematch
            _.wait 400, =>
              @stop()
              @display() if window.confirm "You #{ next }! Play again?"

      # Show
      show: ->
        @_grid.show()

        # Check for popup blocker
        _.defer =>
          if @_grid? and not @_grid.popupsDisplayed()
            @trigger 'popup:blocked'

            # Take user to help page
            if window.confirm "Please enable popups before playing this game. Do you wish to be taken to your browser's corresponding support page?"
              @stop()

              url = switch BROWSER
                when 'chrome' then 'https://support.google.com/chrome/answer/95472?hl=en'
                when 'firefox' then 'https://support.mozilla.org/en-US/kb/pop-blocker-settings-exceptions-troubleshooting#w_pop-up-blocker-settings'
                else 'http://www.qantas.com.au/travel/airlines/how-to-enable-popups/global/en'

              window.location.replace url, '_blank'

        # Attach key events
        handler = _.throttle DRAW_INTERVAL, (type, e) =>
          @trigger type, e

        for name, {_window} of @_grid.elements when _window? and name in ['ball', 'paddle']
          _.onKeyEvent _window, handler

        @_grid.elements.bricks.map (brick) ->
          w = brick?._window
          _.onKeyEvent w, handler if w?

        this

      hide: ->
        # Detach key events
        for name, {_window} of @_grid.elements when _window? and name in ['ball', 'paddle']
          _.onKeyEvent _window, null

        @_grid.elements.bricks.map (brick) ->
          w = brick?._window
          _.onKeyEvent w, null if w?

        @_grid.hide()
        this

Init
----

Set things up and start game.

    # Alias for querySelector
    $ = (q) -> window.document.querySelector q
    $$ = (q) -> window.document.querySelectorAll q

    init = ->
      window.game = game = new Game

      # Attach keydown event
      _.onKeyEvent window, _.throttle DRAW_INTERVAL, (type, e) ->
        game.trigger type, e

      # Animate onscreen keys
      game.on 'key:down', ({keyCode}) ->
        # Display keypress
        if k = $ "#k#{ keyCode }"
          k.classList.add 'pressed'

      game.on 'key:up', ->
        # Remove pressed state
        for k in $$ 'kbd'
          k.classList.remove 'pressed'

      # Manage glow
      game.on 'state:change', (__, next) ->
        k = $ '#k80'

        if next is 'idle'
          k.className = 'animated delay repeat glow'

        else
          k.className = ''

      # Popup pointer
      game.on 'popup:blocked', ->
        arrow = $ '#arrow'

        arrow.className = 'animated delay bounce'
        _.wait 3*1000, ->
          game.stop()
          arrow.className = 'hidden'

      # Log errors
      game.on 'error', ({message}) -> console.log "Error: #{ message }"

    # Attach DOM load listener
    window?.addEventListener 'load', init, false

    # Cleanup on close
    window.onbeforeunload = ->
      if game._getState() in ['idle', 'won']
        return

      else 'Active game!'

    window.onunload = -> game?.stop()

