mergeInto(LibraryManager.library, {

  SocketIOLoadScript: function(urlPtr) {
    var url = UTF8ToString(urlPtr);
    var script = document.createElement('script');
    script.setAttribute('src', url + '/socket.io/socket.io.js');
    script.onload = function() {
      // socket.io.js loaded
    };
    document.head.appendChild(script);
  },

  SocketIOConnect: function(urlPtr, goNamePtr) {
    var url = UTF8ToString(urlPtr);
    var goName = UTF8ToString(goNamePtr);

    if (typeof window.socketIO !== 'undefined') {
      window.socketIO.disconnect();
    }

    window._socketIOEvents = {};
    window.socketIO = io.connect(url);

    window.socketIO.on('connect', function() {
      SendMessage(goName, 'SetSocketID', window.socketIO.io.engine.id);
      SendMessage(goName, 'InvokeEventCallback', JSON.stringify({socketEvent: 'connect', eventData: ''}));
    });

    window.socketIO.on('disconnect', function() {
      SendMessage(goName, 'InvokeEventCallback', JSON.stringify({socketEvent: 'disconnect', eventData: ''}));
    });

    window.socketIO.on('error', function(err) {
      SendMessage(goName, 'InvokeEventCallback', JSON.stringify({socketEvent: 'error', eventData: JSON.stringify(err)}));
    });

    // Re-register any events that were added before connect
    if (window._pendingSocketEvents) {
      for (var evt in window._pendingSocketEvents) {
        window.socketIO.on(evt, window._pendingSocketEvents[evt]);
        window._socketIOEvents[evt] = window._pendingSocketEvents[evt];
      }
      window._pendingSocketEvents = null;
    }
  },

  SocketIOEmit: function(eventPtr) {
    var evt = UTF8ToString(eventPtr);
    if (typeof window.socketIO !== 'undefined') {
      window.socketIO.emit(evt);
    }
  },

  SocketIOEmitData: function(eventPtr, dataPtr) {
    var evt = UTF8ToString(eventPtr);
    var data = UTF8ToString(dataPtr);
    if (typeof window.socketIO !== 'undefined') {
      window.socketIO.emit(evt, JSON.parse(data));
    }
  },

  SocketIOEmitAck: function(eventPtr, packetId, goNamePtr) {
    var evt = UTF8ToString(eventPtr);
    var goName = UTF8ToString(goNamePtr);
    if (typeof window.socketIO !== 'undefined') {
      window.socketIO.emit(evt, function(data) {
        var ackData = {
          packetID: packetId,
          data: typeof data === 'undefined' ? '' : JSON.stringify(data)
        };
        SendMessage(goName, 'InvokeAck', JSON.stringify(ackData));
      });
    }
  },

  SocketIOEmitDataAck: function(eventPtr, dataPtr, packetId, goNamePtr) {
    var evt = UTF8ToString(eventPtr);
    var data = UTF8ToString(dataPtr);
    var goName = UTF8ToString(goNamePtr);
    if (typeof window.socketIO !== 'undefined') {
      window.socketIO.emit(evt, JSON.parse(data), function(data) {
        var ackData = {
          packetID: packetId,
          data: typeof data === 'undefined' ? '' : JSON.stringify(data)
        };
        SendMessage(goName, 'InvokeAck', JSON.stringify(ackData));
      });
    }
  },

  SocketIORegisterEvent: function(eventPtr, goNamePtr) {
    var evt = UTF8ToString(eventPtr);
    var goName = UTF8ToString(goNamePtr);

    var handler = function(data) {
      var socketData = {
        socketEvent: evt,
        eventData: typeof data === 'undefined' ? '' : JSON.stringify(data)
      };
      SendMessage(goName, 'InvokeEventCallback', JSON.stringify(socketData));
    };

    if (typeof window.socketIO !== 'undefined') {
      window.socketIO.on(evt, handler);
      window._socketIOEvents[evt] = handler;
    } else {
      if (!window._pendingSocketEvents) {
        window._pendingSocketEvents = {};
      }
      window._pendingSocketEvents[evt] = handler;
    }
  },

  SocketIODisconnect: function() {
    if (typeof window.socketIO !== 'undefined') {
      window.socketIO.disconnect();
    }
  }

});