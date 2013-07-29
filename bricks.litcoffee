Re: [Letter to a Source-Code-Reader](http://stewd.io/pong/lib/pong.js)

Dear Stewart

Thanks for inspiring me and many like me with the wonders of js.
With all it's warts and issues, JS is still one of my favorite languages.
I think simply by it's virtue of being the language of the web, it surpasses most others
in it's ability to champion the spirit of openness and the creative.

I have tried to keep this as simple as possible for the many awesome source code lovers
to read, copy-paste and critique.

Thanks again for caring to write that letter in 2009. It made a kid smile.

Diwank Singh
July 2013

*****

Browser Bricks
==============

Alright, let's get on with it.
First, let's define some helper functions for the application.

Helper Functions
----------------

    @_ = _ =   # _ namespace
      # Extend objects
      extend: (dest, src) -> dest[k] = v for own k, v of src

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

Now, let's define a box that will be the basic building block for the game.
All the objects will inherit from this class.

Class: Box
----------

    class Box
      _EDITABLE: ['height', 'width', 'top', 'left']   # Editable settings
      _settings:
        # Default settings
        height: 100
        width:  200
        top:    0
        left:   0

        # Fixed props
        toolbar:     false
        directories: false
        fullscreen:  false
        location:    false
        menubar:     false
        resizable:   false
        scrollbars:  false
        status:      false

      _window: null  # Empty window object

      initialize: (@url, settings) ->
        # Override settings.
        @_update settings

        # Set random name
        @id = _.uuid()
        this

      # -- Private --
      _update: (settings) -> _.extend @_settings, (_.pick settings, @_EDITABLE)
      _get: (prop) -> @_settings[prop] if prop in @_EDITABLE
      _getAll: -> _.pick @_settings, @_EDITABLE

      # -- Public --

      # Show window with settings.
      show: ->
        # Serialize options
        opts = _.serialize @_getAll(), {sep: ',', eq: '='}, (v) ->
          switch v
            when false then 'no'
            when true then 'yes'
            else v+''

        @_window = window.open @url, @id, opts
        this

      # Hide the window.
      hide: ->
        @_window.close()
        @_window = null
        this

      # Reset window settings.
      reset: ->
        @_update Box::settings
        this

      # Return or update window position coords.
      position: (coords) ->
        # Set new coords
        if coords? then @_update
          left: coords[0] ? Box::settings.left  # x
          top:  coords[1] ? Box::settings.top   # y

        # Return coords
        [(@_get 'left'), (@_get 'top')]

