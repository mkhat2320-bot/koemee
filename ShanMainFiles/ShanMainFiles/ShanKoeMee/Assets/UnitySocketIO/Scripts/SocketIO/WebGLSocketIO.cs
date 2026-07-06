using UnityEngine;
using System;
using System.Collections.Generic;
using UnitySocketIO.IO;
using UnitySocketIO.Events;
using UnitySocketIO.Packet;
using UnitySocketIO.WebGL;
using System.Runtime.InteropServices;

namespace UnitySocketIO.SocketIO {
    public class WebGLSocketIO : BaseSocketIO {

        int packetID;

        Dictionary<string, List<Action<SocketIOEvent>>> eventHandlers;
        object ackQueueLock;
        Queue<SocketPacket> ackQueue;
        List<Ack> ackList;
        bool isReady;

        #if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] private static extern void SocketIOLoadScript(string url);
        [DllImport("__Internal")] private static extern void SocketIOConnect(string url, string goName);
        [DllImport("__Internal")] private static extern void SocketIOEmit(string eventName);
        [DllImport("__Internal")] private static extern void SocketIOEmitData(string eventName, string data);
        [DllImport("__Internal")] private static extern void SocketIOEmitAck(string eventName, int packetId, string goName);
        [DllImport("__Internal")] private static extern void SocketIOEmitDataAck(string eventName, string data, int packetId, string goName);
        [DllImport("__Internal")] private static extern void SocketIORegisterEvent(string eventName, string goName);
        [DllImport("__Internal")] private static extern void SocketIODisconnect();
        #endif

        public override void Init(SocketIOSettings settings) {
            base.Init(settings);
            eventHandlers = new Dictionary<string, List<Action<SocketIOEvent>>>();
            ackList = new List<Ack>();
            AddSocketIO();
        }

        public void SetSocketID(string socketID) {
            SocketID = socketID;
        }

        void AddSocketIO() {
            string fullUrl = (settings.sslEnabled ? "https" : "http") + "://" + settings.url +
                (!settings.sslEnabled && settings.port != 0 ? ":" + settings.port.ToString() : "");

            #if UNITY_WEBGL && !UNITY_EDITOR
            SocketIOLoadScript(fullUrl);
            #else
            Application.ExternalEval(@"
                var socketIOScript = document.createElement('script');
                socketIOScript.setAttribute('src', '" + fullUrl + @"/socket.io/socket.io.js');
                document.head.appendChild(socketIOScript);
            ");
            #endif
        }

        public override void Connect() {
            string fullUrl = (settings.sslEnabled ? "https" : "http") + "://" + settings.url +
                (!settings.sslEnabled && settings.port != 0 ? ":" + settings.port.ToString() : "") + "/";

            #if UNITY_WEBGL && !UNITY_EDITOR
            SocketIOConnect(fullUrl, gameObject.name);
            #else
            Application.ExternalEval(@"
                window.socketIO = io.connect('" + fullUrl + @"');
                window.socketIO.on('connect', function(){
                    SendMessage('" + gameObject.name + @"', 'SetSocketID', window.socketIO.io.engine.id);
                });
                for(var socketEvent in window.socketEvents){
                    window.socketIO.on(socketEvent, window.socketEvents[socketEvent]);
                }
            ");
            #endif
        }

        public override void Close() {
            #if UNITY_WEBGL && !UNITY_EDITOR
            SocketIODisconnect();
            #else
            Application.ExternalEval(@"
                if(typeof window.socketIO !== 'undefined')
                    window.socketIO.disconnect();
            ");
            #endif
        }

        public override void Emit(string e) {
            #if UNITY_WEBGL && !UNITY_EDITOR
            SocketIOEmit(e);
            #else
            Application.ExternalEval(@"
                if(typeof window.socketIO !== 'undefined')
                    window.socketIO.emit('" + e + @"');
            ");
            #endif
        }

        public override void Emit(string e, string data) {
            #if UNITY_WEBGL && !UNITY_EDITOR
            SocketIOEmitData(e, data);
            #else
            Application.ExternalEval(@"
                if(typeof window.socketIO !== 'undefined')
                    window.socketIO.emit('" + e + @"', " + data + @");
            ");
            #endif
        }

        public override void Emit(string e, Action<string> action) {
            packetID++;
            int pid = packetID;

            #if UNITY_WEBGL && !UNITY_EDITOR
            SocketIOEmitAck(e, pid, gameObject.name);
            #else
            Application.ExternalEval(@"
                if(typeof window.socketIO !== 'undefined'){
                    window.socketIO.emit('" + e + @"', function(data){
                        var ackData = {
                            packetID: " + pid + @",
                            data: typeof data === 'undefined' ? '' : JSON.stringify(data)
                        };
                        SendMessage('" + gameObject.name + @"', 'InvokeAck', JSON.stringify(ackData));
                    });
                }
            ");
            #endif
            ackList.Add(new Ack(pid, action));
        }

        public override void Emit(string e, string data, Action<string> action) {
            packetID++;
            int pid = packetID;

            #if UNITY_WEBGL && !UNITY_EDITOR
            SocketIOEmitDataAck(e, data, pid, gameObject.name);
            #else
            Application.ExternalEval(@"
                if(typeof window.socketIO !== 'undefined'){
                    window.socketIO.emit('" + e + @"', " + data + @", function(data){
                        var ackData = {
                            packetID: " + pid + @",
                            data: typeof data === 'undefined' ? '' : JSON.stringify(data)
                        };
                        SendMessage('" + gameObject.name + @"', 'InvokeAck', JSON.stringify(ackData));
                    });
                }
            ");
            #endif
            ackList.Add(new Ack(pid, action));
        }

        public override void On(string e, Action<SocketIOEvent> callback) {
            if(!eventHandlers.ContainsKey(e)) {
                eventHandlers[e] = new List<Action<SocketIOEvent>>();
            }
            eventHandlers[e].Add(callback);

            #if UNITY_WEBGL && !UNITY_EDITOR
            SocketIORegisterEvent(e, gameObject.name);
            #else
            Application.ExternalEval(@"
                if(typeof window.socketEvents['" + e + @"'] === 'undefined'){
                    window.socketEvents['" + e + @"'] = function(data){
                        window.socketEventListener('" + e + @"', data);
                    };
                    if(typeof window.socketIO !== 'undefined'){
                        window.socketIO.on('" + e + @"', function(data){
                            window.socketEventListener('" + e + @"', data);
                        });
                    }
                }
            ");
            #endif
        }

        public override void Off(string e, Action<SocketIOEvent> callback) {
            if(!eventHandlers.ContainsKey(e))
                return;
            List<Action<SocketIOEvent>> _eventHandlers = eventHandlers[e];
            if(!_eventHandlers.Contains(callback))
                return;
            _eventHandlers.Remove(callback);
            if(_eventHandlers.Count == 0) {
                eventHandlers.Remove(e);
            }
        }

        public void InvokeAck(string ackJson) {
            Ack ack;
            AckJson ackData = JsonUtility.FromJson<AckJson>(ackJson);
            for(int i = 0; i < ackList.Count; i++) {
                if(ackList[i].packetID == ackData.packetID) {
                    ack = ackList[i];
                    ackList.RemoveAt(i);
                    ack.Invoke(ackData.data);
                    return;
                }
            }
        }

        public void InvokeEventCallback(string eventJson) {
            EventJson eventData = JsonUtility.FromJson<EventJson>(eventJson);
            if(!eventHandlers.ContainsKey(eventData.socketEvent))
                return;
            for(int i = 0; i < eventHandlers[eventData.socketEvent].Count; i++) {
                SocketIOEvent socketEvent = new SocketIOEvent(eventData.socketEvent, eventData.eventData);
                eventHandlers[eventData.socketEvent][i](socketEvent);
            }
        }
    }
}