(function(window, angular, undefined) {
  /*
    angular-feathers
    v0.1.0

    Copyright (c) 2014 Brandon Roberson <broberson@gmail.com>

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */

  var defaults = {
    idProperty: '_id',
    server: 'http://localhost:4000',
    socketOptions: {
      forceNew: true
    }
  }

  var imports = {},
    slice = Array.prototype.slice,
    push = Array.prototype.push,
    ownProp = Object.prototype.hasOwnProperty


  function apply(fn) {
    var $rootScope = imports.$rootScope || {},
      phase = $rootScope.$$phase

    if(phase == '$apply' || phase == '$digest') {
      if(typeof fn == 'function')
        fn()
      return
    }

    if(typeof $rootScope.$apply == 'function')
      $rootScope.$apply(fn)
  }


  function makeCallback(resolve, reject) {
    return function(error, results) {
      if(error)
        reject(error)
      else
        resolve(results)
    }
  }





// pardon the ascii art, but this makes it easy to
// find things in Sublime Text

/*
8888888888                           888    8888888888               d8b 888    888
888                                  888    888                      Y8P 888    888
888                                  888    888                          888    888
8888888   888  888  .d88b.  88888b.  888888 8888888    88888b.d88b.  888 888888 888888 .d88b.  888d888
888       888  888 d8P  Y8b 888 "88b 888    888        888 "888 "88b 888 888    888   d8P  Y8b 888P"
888       Y88  88P 88888888 888  888 888    888        888  888  888 888 888    888   88888888 888
888        Y8bd8P  Y8b.     888  888 Y88b.  888        888  888  888 888 Y88b.  Y88b. Y8b.     888
8888888888  Y88P    "Y8888  888  888  "Y888 8888888888 888  888  888 888  "Y888  "Y888 "Y8888  888
*/

  function EventEmitter() {
  }

  EventEmitter.prototype.on = function(event, handler) {
    var self = this,
      listeners = this.$$listeners = this.$$listeners || {},
      handlers = listeners[event] = listeners[event] || []

    handlers.push(handler)

    return function() { self.off(event, handler) }
  }

  EventEmitter.prototype.off = function(event, handler) {
    var listeners = this.$$listeners || {},
      handlers = listeners[event] || []
      idx = handlers.indexOf(handler)

    if(~idx)
      handlers.splice(idx, 1)
  }

  EventEmitter.prototype.emit = function(/* event, args... */) {
    var args = slice.call(arguments),
      event = args.shift(),
      listeners = this.$$listeners || {},
      handlers = listeners[event] || [],
      i = 0,
      len = handlers.length

    apply(function() {
      for(; i < len; i++)
        handlers[i].apply(this, args)
    })
  }







/*
 .d8888b.                    888               888
d88P  Y88b                   888               888
Y88b.                        888               888
 "Y888b.    .d88b.   .d8888b 888  888  .d88b.  888888
    "Y88b. d88""88b d88P"    888 .88P d8P  Y8b 888
      "888 888  888 888      888888K  88888888 888
Y88b  d88P Y88..88P Y88b.    888 "88b Y8b.     Y88b.
 "Y8888P"   "Y88P"   "Y8888P 888  888  "Y8888   "Y888
*/

  function Socket(options) {
    var self = this

    EventEmitter.call(this)

    this.$$options = options
    this.$$socketEvents = {}
    this.$$socket = null

    this.isConnected = false

    this.register('connect', function() {
      apply(function() { self.isConnected = true })
    })
    this.register('disconnect', function() {
      apply(function() { self.isConnected = false })
    })
  }

  angular.extend(Socket.prototype, EventEmitter.prototype)

  Socket.prototype.connect = function() {

    var self = this,
      options = this.$$options,
      q = imports.$q

    return q(function(resolve, reject) {
      var events = self.$$socketEvents,
        socket,
        event

      if(!self.$$socket) {
        socket = self.$$socket = io.connect(options.server, options.socketOptions)
        socket.off = socket.removeListener
        for(event in events)
          socket.on(event, events[event].handler)
      }

      resolve()
    })
  }

  Socket.prototype.disconnect = function() {
    var self = this,
      q = imports.$q

    return q(function(resolve, reject) {
      var socket = self.$$socket

      if(socket) {
        socket.disconnect()
        socket.destroy()
        self.$$socket = null
      }

      resolve()
    })
  }

  Socket.prototype.send = function() {
    var self = this,
      q = imports.$q,
      args = slice.call(arguments)

    return q(function(resolve, reject) {
      if(self.$$socket) {
        args.push(makeCallback(resolve, reject))
        self.$$socket.emit.apply(self.$$socket, args)
      }
      else {
        reject(new Error('Unable to send, socket not connected.'))
      }
    })
  }

  Socket.prototype.register = function(event, callback) {
    var self = this,
      socket = this.$$socket,
      events = this.$$socketEvents,
      register = !events[event],
      registration = events[event] = events[event] || {
        count: 0,
        handler: function() {
          var args = slice.call(arguments)
          args.unshift(event)
          self.emit.apply(self, args)
        }
      }

    if(register && socket)
      socket.on(event, registration.handler)

    registration.count++

    if(typeof callback == 'function')
      this.on(event, callback)

    return function() {
      self.unregister(event, callback)
    }
  }

  Socket.prototype.unregister = function(event, callback) {
    var socket = this.$$socket,
      events = this.$$socketEvents,
      registration = events[event]

    if(typeof callback == 'function')

    if(registration) {
      registration.count--

      if(registration.count == 0) {
        if(socket)
          socket.off(event, registration.handler)
        delete events[event]
      }
    }

  }







/*
8888888b.
888   Y88b
888    888
888   d88P .d88b.  .d8888b   .d88b.  888  888 888d888 .d8888b .d88b.
8888888P" d8P  Y8b 88K      d88""88b 888  888 888P"  d88P"   d8P  Y8b
888 T88b  88888888 "Y8888b. 888  888 888  888 888    888     88888888
888  T88b Y8b.          X88 Y88..88P Y88b 888 888    Y88b.   Y8b.
888   T88b "Y8888   88888P'  "Y88P"   "Y88888 888     "Y8888P "Y8888
*/

  function Resource(service) {
    if(this instanceof Resource)
      throw new Error("Use Resource.create to create new Resource instances, rather than the 'new' keyword.")

    this.$$service = service
    this.$$options = service.$$options
    this.$$isResource = true
    EventEmitter.call(this)
  }

  angular.extend(Resource.prototype, EventEmitter.prototype)

  Resource.create = function(object, service) {
    if(!object)
      return;

    if(object.$$isResource)
      return object

    Resource.call(object, service)
    angular.extend(object, Resource.prototype)
    angular.extend(object, service.resourcePrototype)
    return object
  }

  Resource.prototype.toJSON = function() {
    var object = {},
      prop

    for(prop in this)
      if(prop[0] != '$' && ownProp.call(this, prop) && typeof object[prop] != 'function')
        object[prop] = this[prop]

    return object
  }

  Resource.prototype.syncFrom = function(object) {
    var self = this

    apply(function() {
      var prop

      for(prop in object)
        if(prop[0] != '$'
          && ownProp.call(object, prop)
          && typeof object[prop] != 'function'
        )
          self[prop] = object[prop]

      for(prop in self)
        if(prop[0] != '$'
          && prop != self.$$options.idProperty
          && ownProp.call(self, prop)
          && typeof self[prop] != 'function'
          && !ownProp.call(object, prop)
        )
          delete self[prop]
    })

    return this
  }

  Resource.prototype.refresh = function() {
    return this.$$service.refreshResource(this)
  }

  Resource.prototype.create = function() {
    return this.$$service.create(this)
  }

  Resource.prototype.update = function() {
    return this.$$service.update(this)
  }

  Resource.prototype.patch = function() {
    return this.$$service.patch(this)
  }

  Resource.prototype.destroy = function() {
    return this.$$service.destroy(this)
  }

  Resource.prototype.onUpdated = function(resource) {
    var key = this.$$options.idProperty

    if(resource && resource[key] == this[key])
      this.emit('updated', this)
  }

  Resource.prototype.onPatched = function(resource) {
    var key = this.$$options.idProperty

    if(resource && resource[key] == this[key])
      this.emit('patched', this)
  }

  Resource.prototype.onRemoved = function(resource) {
    var key = this.$$options.idProperty

    if(resource && resource[key] == this[key])
      this.emit('removed', this)
  }








/*
 .d8888b.                            d8b
d88P  Y88b                           Y8P
Y88b.
 "Y888b.    .d88b.  888d888 888  888 888  .d8888b .d88b.
    "Y88b. d8P  Y8b 888P"   888  888 888 d88P"   d8P  Y8b
      "888 88888888 888     Y88  88P 888 888     88888888
Y88b  d88P Y8b.     888      Y8bd8P  888 Y88b.   Y8b.
 "Y8888P"   "Y8888  888       Y88P   888  "Y8888P "Y8888
 */

  function Service(name, query, feathers) {
    if(!(this instanceof Array))
      throw new Error("Use Service.create to create new Service instances, rather than the 'new' keyword.")

    var service = this
    this.$$feathers = feathers
    this.$$options = feathers.$$options
    this.name = name
    this.query = query || {}
    this.resourcePrototype = {}
    EventEmitter.call(this)
  }

  angular.extend(Service.prototype, EventEmitter.prototype)

  Service.create = function(name, query, feathers) {
    var service = new Array()

    Service.call(service, name, query, feathers)
    angular.extend(service, Service.prototype)

    service.on('created', function(object) {
      object = service.addOrUpdate(object)
      service.emit('after create', object)
      service.emit('after get', object)
      object.emit('created')
    })
    service.on('updated', function(object) {
      object = service.addOrUpdate(object)
      service.emit('after update', object)
      service.emit('after get', object)
      object.emit('updated')
    })
    service.on('patched', function(object) {
      object = service.addOrUpdate(object)
      service.emit('after update', object)
      service.emit('after get', object)
      object.emit('updated')
    })
    service.on('removed', function(object) {
      object = service.remove(object)
      service.emit('after remove', object)
      object.emit('removed')
    })

    service.$$handlers = ['created', 'updated', 'patched', 'removed'].map(function(event) {
      return feathers.register(name + ' ' + event, function(object) {
        service.emit(event, Resource.create(object, service))
      })
    })

    feathers.on('connect', function() {
      if(service.offlineCache) {
        service.unempty(service.offlineCache)
        delete service.offlineCache
      }
      service.refresh()
    })
    feathers.on('disconnect', function() {
      service.offlineCache = service.empty()
    })

    feathers.connect()

    return service
  }

  Service.prototype.indexOf = function(object) {
    var key = this.$$options.idProperty,
      i = 0,
      len = this.length

    if(object == null)
      return -1;

    if(!ownProp.call(object, key))
      return -1

    for(; i < len; i++)
      if(this[i][key] == object[key])
        return i

    return -1
  }

  Service.prototype.push = function() {
    var self = this,
      args = slice.call(arguments),
      resources = args.map(function(object) {
        return Resource.create(object, self)
      })

    apply(function() {
      push.apply(self, resources)
    })

    return this.length
  }

  Service.prototype.empty = function() {
    var self = this,
      removed = []

    apply(function() {
      while(self.length)
        removed.unshift(self.pop())
    })

    return removed
  }

  Service.prototype.unempty = function(array) {
    var self = this

    apply(function() {
      while(array.length)
        self.unshift(array.pop())
    })

    return this
  }

  Service.prototype.addOrUpdate = function(object) {
    var self = this

    // resource = Resource.create(resource, this)

    apply(function() {
      var idx = self.indexOf(object)

      if(~idx && self[idx] !== object)
        object = self[idx].syncFrom(object)
      else
        self.push(object)
    })

    return object
  }

  Service.prototype.remove = function(resource) {
    var self = this,
      idx = this.indexOf(resource)

    if(~idx)
      apply(function() { resource = self.splice(idx, 1)[0] })

    return resource
  }

  Service.prototype.get = function(id) {
    var key = this.$$feathers.$$options.idProperty,
      filtered = this.filter(function(object) {
        return object[key] == id
      })

    return filtered[0] || null
  }

  Service.prototype.refresh = function(query) {
    var self = this,
      socket = this.$$feathers,
      key = this.$$options.idProperty,
      query = this.query = query || this.query

    return socket.send(this.name + '::find', query)
      .then(function(data) {
        apply(function() {
          var object, resource,
            i = 0,
            len = data.length,
            toRemove = []

          for(; i < len; i++) {
            resource = self.addOrUpdate(data[i])
            self.emit('after get', resource)
            resource.emit('updated')
          }

          purge: for(i = 0; i < self.length; i++) {
            resource = self[i]
            for(j = 0; j < len; j++) {
              object = data[j]
              if(resource[key] == object[key])
                continue purge
            }
            toRemove.push(resource)
          }

          for(i = 0; i < toRemove.length; i++) {
            self.remove(toRemove[i])
            self.emit('after remove', toRemove[i])
            toRemove[i].emit('removed')
          }

        })
        return self
      })
  }

  Service.prototype.refreshResource = function(resource) {
    var self = this,
      key = this.$$options.idProperty,
      socket = this.$$feathers

    return socket.send(this.name + '::get', resource[key], {})
      .then(function(data) {
        data = self.addOrUpdate(data)
        self.emit('after get', data)
        data.emit('updated')
      })
  }

  Service.prototype.new = function(object) {
    return Resource.create(object, this)
  }

  Service.prototype.create = function(resource) {
    var self = this,
      socket = this.$$feathers

    this.emit('before create', resource)
    return socket.send(this.name + '::create', resource.toJSON(), {})
  }

  Service.prototype.update = function(resource) {
    var key = this.$$options.idProperty,
      socket = this.$$feathers,
      id = resource[key]

    this.emit('before update', resource)

    //var object = resource.toJSON()
    var object = resource;
    delete object[key]

    return socket.send(this.name + '::update', id, object, {})
  }

  Service.prototype.patch = function(resource) {
    var key = this.$$options.idProperty,
      socket = this.$$feathers,
      id = resource[key]

    this.emit('before update', resource)

    var object = resource.toJSON()
    delete object[key]

    return socket.send(this.name + '::patch', id, object, {})
  }

  Service.prototype.destroy = function(resource) {
    var self = this,
      key = this.$$options.idProperty,
      socket = this.$$feathers

    this.emit('before remove', resource)

    return socket.send(this.name + '::remove', resource[key], {})
  }

  // before: create, update, remove
  Service.prototype.before = function(event, handler) {
    var prop

    if(typeof event == 'object' && typeof handler == 'undefined') {
      for(prop in event) {
        if(hasOwnProperty.call(event, prop) && typeof event[prop] == 'function') {
          this.before(prop, event[prop])
        }
      }
      return this
    }

    this.on('before ' + event, handler)
    return this
  }

  // after: get, create, update, remove
  Service.prototype.after = function(event, handler) {
    var prop

    if(typeof event == 'object' && typeof handler == 'undefined') {
      for(prop in event) {
        if(hasOwnProperty.call(event, prop) && typeof event[prop] == 'function') {
          this.after(prop, event[prop])
        }
      }
      return this
    }

    this.on('after ' + event, handler)
    return this
  }

  Service.prototype.extend = function(proto) {
    angular.extend(this.resourcePrototype, proto)
    return this
  }





/*
8888888888                888    888
888                       888    888
888                       888    888
8888888  .d88b.   8888b.  888888 88888b.   .d88b.  888d888 .d8888b
888     d8P  Y8b     "88b 888    888 "88b d8P  Y8b 888P"   88K
888     88888888 .d888888 888    888  888 88888888 888     "Y8888b.
888     Y8b.     888  888 Y88b.  888  888 Y8b.     888          X88
888      "Y8888  "Y888888  "Y888 888  888  "Y8888  888      88888P'
*/
  function Feathers(options) {
    Socket.call(this, options)
    this.services = {}
  }

  angular.extend(Feathers.prototype, Socket.prototype)

  Feathers.prototype.service = function(name, query) {
    var service = this.services[name]

    if(!service)
      service = this.services[name] = Service.create(name, query, this)
    else if(query)
      service.refresh(query)

    return service
  }










  angular.module('ngFeathers', [ 'ng' ]).provider('Feathers', function() {
    this.defaults = defaults

    this.$get = ['$q', '$rootScope', function($q, $rootScope) {
      imports.$q = $q
      imports.$rootScope = $rootScope

      return window.Feathers = new Feathers(this.defaults)
    }]
  })

})(window, angular)