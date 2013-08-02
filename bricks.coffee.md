Re: [Letter to a Source-Code-Reader](http://stewd.io/pong/lib/pong.js)

Dear Stewart

Thanks for inspiring me and many like me with the wonders of js.
With all it's warts and issues, JS is still one of my favorite languages.
I think simply by it's virtue of being the language of the web, it surpasses most others
in it's ability to champion the spirit of openness.

I have tried to keep this as simple as possible for the many awesome source code lovers
to read, reuse and critique.

Thanks again for caring to write that letter in 2009. It made a kid smile.

Diwank Singh
July 2013

*****

Browser Bricks
==============

Alright, let's get on with it.

Helper Functions
----------------

First, let's define some helper functions for the application.

    _ =   # _ namespace
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
      defer: (fn, args...) -> window.setTimeout fn, 1, args...

      # Clone object
      clone: (obj) ->
        # If object extend
        if obj is Object obj
          _.extend {}, obj

        else  # Assume it's array otherwise
          obj.splice 0

      # Negate function
      negate: (fn) ->
        (args...) -> not fn args...

      # Return first and last of array
      first: (array) -> array[0]
      last: (array) -> array[array.length-1]

Init Function
-------------

Let's write a global init function that can be used to register callbacks which are
executed 'onload'.

    # Callback register
    init = do ->
      # Store registered callbacks
      callbacks = []

      # Run callbacks in order registered
      exec = -> fn?() for fn in callbacks

      # Onload callback
      onLoad = (fn) ->
        window.removeEventListener 'load', init, false
        fn?()

      (cb) ->
        if cb?
          # Register callback
          callbacks.push cb
        else
          # Defer execution until stack cleared
          onLoad -> _.defer exec

        false

    # Attach DOM load listener
    window.addEventListener 'load', init, false

Class: Events
-------------

Here is a simple class for managing events on objects.

    class Events
      constructor: ->
        # Storage for events
        @_events = {}
        this

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

Now, let's define a box that will be the basic building block for the game.
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
      _url: '/index.html' # Fixed to current page, renders based on context

      _EDITABLE: -> Object.keys @constructor::_settings   # Editable settings

      _update: (settings) ->
        # Update settings
        _.extend @_settings, (_.pick settings, @_EDITABLE())

        # Adjust window props
        @_window?.moveTo?   (@_get 'left'), (@_get 'top')
        @_window?.resizeTo? (@_get 'width'), (@_get 'height')

        # Return a copy of settings
        @_getAll()

      _get: (prop) -> @_settings[prop] if prop in @_EDITABLE()
      _getAll: -> _.extend (_.clone @_settings), @_fixed

      _getDefault: -> @constructor::_settings

      # -- Public --

      constructor: (settings={}) ->
        # Make a copy of default settings
        @_settings = _.clone @_settings

        # Override settings.
        @_update settings

        # Set random name with namespace
        @id = _.uuid()
        this

      # Show window with settings.
      show: ->
        # Serialize options
        opts = _.serialize @_getAll(), {sep: ',', eq: '='}, (v) ->
          switch v
            when false then 'no'
            when true then 'yes'
            else v+''

        @_window ?= window.open @_url, @id, opts
        this

      # Hide the window.
      hide: ->
        @_window?.close()
        @_window = null
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
        if coords.length then @_update
          left: coords[0] ? _default.left  # x
          top:  coords[1] ? _default.top   # y

        # Return coords
        _.pick @_getAll(), ['top', 'left']

      # Return or update window dimensions.
      size: (dimensions...) ->
        _default = @_getDefault()

        # Set new dimensions
        if dimensions.length then @_update
          width:  dimensions[0] ? _default.width
          height: dimensions[1] ? _default.height

        # Return dimensions
        _.pick @_getAll(), ['width', 'height']

Class: Brick (Box)
------------------

Now let's use the class `Box` to design the `Brick` class which
will be used to render the bricks.

It's pretty much a useless box.

    class Brick extends Box
      type: -> 'brick'

Class: Ball (Box)
-----------------

Alright, so the ball is a little tricky. It has to move two-
dimensionally and bounce off of objects.

So, we need an instance that also stores it's velocity at any
instant and the methods to manipulate it.

    class Ball extends Box
      # -- Private --
      _velocity: [0, 0]

      # Override getDefault to get default velocity
      _getDefault: -> _.extend {velocity: @_velocity}, super()

      # -- Public --
      constructor: (args...) ->
        @_velocity = _.clone @_velocity
        super args...

      type: -> 'ball'

      # Set or retrieve velocity
      velocity: (vel...) ->
        [vx, vy] = @_getDefault().velocity

        # Set new velocity
        if vel.length then @_velocity = [
          vel[0] ? vx

          # y velocity affects distance from top so inverted to preserve
          # upward positive velocity direction.
          (vel[1] ? vy) * -1
        ]

        # Return velocity
        _.clone @_velocity

      # Invert velocity
      bounce: -> @velocity (@_velocity[0] * -1), (@_velocity[1] * -1)

Class: Paddle (Ball)
--------------------

A paddle is basically an enlarged ball that's constrained to move in a
straight line.

    class Paddle extends Ball
      type: -> 'paddle'

      # Override velocity to constrain 1D motion
      velocity: (vx) ->
        if vx?
          super vx, @_velocity[1]
        else
          super()

Class: Screen (Events)
----------------------

This class is supposed to keep track of screen dimensions, offsets etc.

    class Screen
      # -- Private --
      _screen: window.screen
      _offset: [0, 0]
      _getDefault: -> offset: @constructor::_offset

      # -- Public --
      constructor: ->
        # Copy offset
        @_offset = _.clone @_offset
        this

      # Get available screen coordinates
      height: -> @_screen.availHeight - 2*@offset()[1]
      width: -> @_screen.availWidth - 2*@offset()[0]
      top: -> @offset()[1]
      left: -> @offset()[0]

      # Set or retrieve offset
      offset: (args...) ->
        [ox, oy] = @_getDefault().offset

        if args.length then @_offset = [
          args[0] ? ox  # offsetX
          args[1] ? oy  # offsetY
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

Class: Bricks (Array)
---------------------

Collection of `Brick` instances that organizes itself.
It also ascertains whether the `Ball` is touching a `Brick`.

    class Bricks extends Array
      constructor: (@viewport, @rows=3) -> this

      # Dimensions
      size: ->
        width: @viewport.width()

        # Calc the height of column
        height: @rows * ((_.first this) ? Brick.prototype).size().height

      # Override push to make sure only brick elements pushed.
      push: (element) ->
        if element instanceof Brick then super element else null

      # Remove elements based on search function
      remove: (fn) ->
        # Look for matching elements
        for brick, i in this when fn brick
          brick.hide()

          # Remove element
          @splice i, 1

        this

      # Hide all elements
      hideAll: ->
        brick.hide() for brick in this
        this

      # Show all elements
      showAll: ->
        brick.show() for brick in this
        this

Exports
-------

List of vars exported to global namespace.

    _.extend window ? module.exports ? this,
      _: _
      init: init
      Events: Events
      Box: Box
      Brick: Brick
      Ball: Ball
      Paddle: Paddle
      Screen: Screen
      Bricks: Bricks

