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

Class: Box
----------

Now, let's define a box that will be the basic building block for the game.
All the objects will inherit from this class.

    class Box
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

      constructor: (namespace='', settings) ->
        # Make a copy of default settings
        @_settings = _.clone @_settings

        # Override settings.
        @_update settings

        # Set random name with namespace
        @id = "#{ namespace }#{ if namespace then '-' else '' }#{ _.uuid() }"
        this

      # Show window with settings.
      show: ->
        # Serialize options
        opts = _.serialize @_getAll(), {sep: ',', eq: '='}, (v) ->
          switch v
            when false then 'no'
            when true then 'yes'
            else v+''

        @_window = window.open @_url, @id, opts
        this

      # Hide the window.
      hide: ->
        @_window.close()
        @_window = null
        this

      # Check if window is visible.
      isVisible: -> @_window?.location?

      # Reset window settings.
      reset: ->
        @_update @_getDefault()
        this

      # Return or update window position coords.
      position: (coords...) ->
        # Set new coords
        if coords.length then @_update
          left: coords[0] ? @_getDefault().left  # x
          top:  coords[1] ? @_getDefault().top   # y

        # Return coords
        _.pick @_getAll(), ['top', 'left']

      # Return or update window dimensions.
      size: (dimensions...) ->
        # Set new dimensions
        if dimensions.length then @_update
          width:  dimensions[0] ? @_getDefault().width
          height: dimensions[1] ? @_getDefault().height

        # Return dimensions
        _.pick @_getAll(), ['width', 'height']

Class: Brick (Box)
------------------

Now let's use the class `Box` to design the `Brick` class which
will be used to render the bricks.

It's pretty much a useless box.

    class Brick extends Box
      constructor: (args...) -> super @type(), args...
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
      _getDefault: -> _.extend super(), velocity: _.clone @_velocity

      # -- Public --
      constructor: (args...) ->
        @_velocity = _.clone @_velocity
        super @type(), args...

      type: -> 'ball'

      # Set or retrieve velocity
      velocity: (vel...) ->
        # Set new velocity
        if vel.length then @_velocity = [
          vel[0] ? @_getDefault().velocity[0]         # vx

          # y velocity affects distance from top so inverted to preserve
          # upward positive velocity direction.
          (vel[1] ? @_getDefault().velocity[1]) * -1  # vy
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

Exports
-------

List of vars exported to global namespace.

    _.extend window ? module.exports ? this,
      _: _
      init: init
      Box: Box
      Brick: Brick
      Ball: Ball
      Paddle: Paddle
