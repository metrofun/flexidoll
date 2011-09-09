"usestrict";
jQuery(function(){
if (!window['requestAnimationFrame'])
  window['requestAnimationFrame'] = (function(){
    return  window['webkitRequestAnimationFrame'] ||
    window['mozRequestAnimationFrame']    ||
    window['oRequestAnimationFrame']      ||
    window['msRequestAnimationFrame']     ||
    function(/* function */ callback, /* DOMElement */ element){
      window.setTimeout(callback, 1000 / 60);
    };
  })();
    var stats = new Stats();
    jQuery('.counter').append( stats.domElement );

    setInterval(function () {

        stats.update();

    }, 1000/60);


    //jQuery(document).bind('debug', function(event, data){ console.debug(data); });

    Playground = {
        //audio : new Audio('/sounds/jab.mp3'),
        callbacks : {},
        init : function() {
            //this.audio.preload = "auto";
            //this.audio.volume = 0.5;
            //console.debug(this.audio);
            this.initControls();
            UI.init();
            Physics.init();

            Physics.execInWorkerContext(
                function() {
                    var fixDef = new b2FixtureDef;
                    fixDef.density = 1.0;
                    fixDef.friction = 0.5;
                    fixDef.restitution = 0.2;

                    var bodyDef = new b2BodyDef;

                    //create ground
                    bodyDef.type = b2Body.b2_staticBody;
                    fixDef.shape = new b2PolygonShape;
                    //horizontal lines
                    //fixDef.shape.SetAsBox(PhysWorker.worldWidth / 2, 1);
                    fixDef.shape.SetAsBox(1.56, PhysWorker.worldHeight / 2);
                    //bodyDef.position.Set(PhysWorker.worldWidth / 2, PhysWorker.worldHeight - 1);
                    bodyDef.position.Set(PhysWorker.worldWidth / 2, PhysWorker.worldHeight );
                    var body = PhysWorker.world.CreateBody(bodyDef);
                    body.CreateFixture(fixDef);
                    body.SetAngle(Math.PI / 2);
                    PhysWorker.adjustUserData(body, 'ground down');

                    //bodyDef.position.Set(PhysWorker.worldWidth / 2, 0 + 1);
                    bodyDef.position.Set(PhysWorker.worldWidth / 2, 0);
                    body = PhysWorker.world.CreateBody(bodyDef);
                    body.CreateFixture(fixDef);
                    body.SetAngle(-Math.PI / 2);
                    PhysWorker.adjustUserData(body, 'ground up');

                    //vertical lines
                    fixDef.shape.SetAsBox(1.56, PhysWorker.worldHeight / 2);
                    //bodyDef.position.Set(0 + 1, PhysWorker.worldHeight / 2);
                    bodyDef.position.Set(0, PhysWorker.worldHeight / 2);
                    body = PhysWorker.world.CreateBody(bodyDef);
                    body.CreateFixture(fixDef);
                    body.SetAngle(-Math.PI);
                    PhysWorker.adjustUserData(body, 'ground left');

                    //bodyDef.position.Set(PhysWorker.worldWidth - 1, PhysWorker.worldHeight / 2);
                    bodyDef.position.Set(PhysWorker.worldWidth , PhysWorker.worldHeight / 2);
                    body = PhysWorker.world.CreateBody(bodyDef);
                    body.CreateFixture(fixDef);
                    PhysWorker.adjustUserData(body, 'ground right');
                }
            );


            Physics.execInWorkerContext(
                function(name){
                  PhysWorker.player1 = new Flexidoll(name);
                  return name
                },
                function(name) {
                  jQuery('<div class="hp ' + name + '"></div>').progressbar( { value : 100} ).appendTo(UI.jIndicators);
                },
                'player1'
            )

            Physics.execInWorkerContext(
                function(name){
                  new Flexidoll(name);
                  return name
                },
                function(name) {
                  jQuery('<div class="hp ' + name + '"></div>').progressbar( { value : 100} ).appendTo(UI.jIndicators);
                },
                'player2'
            )

            //Physics.execInWorkerContext(
                //function(name){
                  //new Flexidoll(name);
                  //return name
                //},
                //function(name) {
                  //jQuery('<div class="hp ' + name + '"></div>').progressbar( { value : 100} ).appendTo(UI.jIndicators);
                //},
                //'player3'
            //)



            Renderer.init();
            Playground.callbacks['lifecycle'] = function(data){ Playground.update(data)};
        },
        initControls : function() {
            var self = this;

            jQuery(document).keydown(function(event){
                var motionVec2;
                switch (event.which) {
                //down
                case 40 : 
                    motionVec2 = new b2Vec2(0, 5);
                    break;
                    //up
                case 38 : 
                    motionVec2 = new b2Vec2(0, -5);
                    break;
                    //left
                case 37 : 
                    motionVec2 = new b2Vec2(-5, 0);
                    break;
                    //right
                case 39 : 
                    motionVec2 = new b2Vec2(5, 0);
                    break;
                }
                //console.debug(motionVec2);
                if (motionVec2)
                    Physics.execInWorkerContext(
                        function(motionVec2) {
                            PhysWorker.player1.applyImpulse(motionVec2);
                        },
                        null,
                        motionVec2
                    );
                    return false;
            });
        },
        start : function() {
            Physics.start();
        },
        update : function(data) {
            Physics.viewPort = data.viewPort;
            Settings.scale = Renderer.sceneWidth / data.viewPort[2];
            //window.requestAnimationFrame(function(){
              Renderer.updateBodies(data.bodiesState);
              Renderer.drawGrid();
              Renderer.processEffects(data.collisions);
            //});
            for (var fxdlName in data.flexidollsState) {
              jQuery('.'+fxdlName, UI.jIndicators).progressbar( "value" , data.flexidollsState[fxdlName]);
            }
        }
    }

    Playground.callbacks['debug'] = function(data){ console.debug(data); };
     
    Sound = {
        play : jQuery.throttle(300, function(){
            (new Audio('/sounds/jab.mp3')).play();
        })
    }

    UI = {
      jIndicators : null,
      init : function() {
        this.jIndicators = jQuery('.indicators');
      }
    }

    Physics = {
        adrenalineModeMs : 1000,
        worker : null,
        defaultFixDef : null,
        defaultBodyDef : null,
        viewPort : null,
        worldWidth : 25,
        worldHeight : 25,
        getContractId : (function() {
            var id = 0;
            return function() {
                return (id++ % 999999999) + "";
            }
        })(),
        init : function() {
            var self = this;
            self.viewPort = [0, 0, self.worldWidth];
            self.worker = new Worker('/js/phys.js');
            self.worker.onmessage = function(event) {self.workerListener(event);};
            self.worker.onerror = function(error) {
                throw new Error(error.message + " (" + error.filename + ":" + error.lineno + ")");
            };
            self.execInWorkerContext(
                function(worldWidth, worldHeight, adrenalineModeMs){
                    PhysWorker.worldWidth = worldWidth;
                    PhysWorker.worldHeight= worldHeight;
                    PhysWorker.adrenalineModeMs = adrenalineModeMs;
                },
                null,
                self.worldWidth,
                self.worldHeight,
                self.adrenalineModeMs
            )
        },
        start : function() {
            var self = this;
            self.execInWorkerContext(
                function() {
                    PhysWorker.start();
                }
            );
        },
        execInWorkerContext: function(command, handler) {
            var self = this;
            //alert(String.prototype.replace.call(command, /(^function\s*\(\)\s*{)|(}$)/gi, ''));
            var contractId = self.getContractId();
            //jQuery(document).one(contractId, handler);
            Playground.callbacks[contractId] = handler || function(){};
            self.worker.postMessage(
                {
                    command: command + "",
                    contractId : contractId,
                    args : Array.prototype.slice.call(arguments, 2)
                }
            );
        },
        //throttledExecInWorkedContext : jQuery.throttle( 250, this.execInWorkerContext),
        workerListener : function(event) {
            Playground.callbacks[event.data.contractId](event.data.data);
            //jQuery(document).trigger(event.data.contractId, [event.data.data]);
            if (!event.data.live) {
                delete Playground.callbacks[event.data.contractId];
                //jQuery(document).unbind(event.data.contractId);
            }
        }
    }

    Renderer = {
        //needed for initial drawing and then using trnaform scale
        baseScale : 100,
        adrenalineModeId : undefined,
        jScene : null,
        sceneWidth : undefined,
        sceneHeight : undefined,
        canvasContext : null,
        cursorStickingThreshold : 5,
        canvasCtx : null,
        gridWidth : undefined,
        gridHeight: undefined,
        effectNode : null,
        effectDuration : 300,
        actorNodeList : {},
        effectsQueue : [],
        init : function() {
            var self = this;
            self.jScene = jQuery('.scene');

            self.sceneWidth = Renderer.jScene.width();
            self.sceneHeight = Renderer.jScene.height();


            var canvas = self.jScene.find('canvas')[0];
            canvas.width = self.sceneWidth;
            canvas.height = self.sceneHeight;
            self.canvasCtx = canvas.getContext("2d");
            self.canvasCtx.strokeStyle = "gray"
            self.canvasCtx.lineWidth = 1;
            var colNum = 5;
            self.gridWidth = Physics.worldWidth / colNum; 
            self.gridHeight = Physics.worldHeight / colNum; 
            //self.drawGrid();
            self.effectNodeSample = jQuery('<div class="effect"></div>').get(0);
            Physics.execInWorkerContext(
                function(data) {
                    var renderData = [];
                    for ( var body = PhysWorker.world.GetBodyList(); body ; body = body.GetNext() ) {
                      var userData = body.GetUserData();
                        if (userData) {
                            var fixture = body.GetFixtureList(),
                                shape = fixture.GetShape();
                            renderData.push({
                                position : body.GetPosition(),
                                angle : body.GetAngle(),
                                halfWidth : userData.halfWidth,
                                halfHeight : userData.halfHeight,
                                type : shape.GetType(),
                                resourceId : userData.resourceId,
                                class : userData.class
                            });
                        }
                    }
                    return renderData
                },
                function(renderData) {
                    for (var i=0; i < renderData.length; i++) {
                        //if (renderData[i].userData) {
                      Renderer.actorNodeList[renderData[i].resourceId] = Renderer.initBody(renderData[i]);
                        //}
                    }
                }
            );
        },
        updateBodies : function(bodiesState) {
          var self = this;
            var scale = Settings.scale;
            var baseScale = self.baseScale
            for (var i=0, len = bodiesState.length; i < len; i++) {
              var bodyState = bodiesState[i],
              position = bodyState.position,
              angle = bodyState.angle,
              bodyNode = Renderer.actorNodeList[bodyState.resourceId];
             bodyNode.style.OTransform = bodyNode.style.WebkitTransform = 'translate(' + ( ( position.x  - Physics.viewPort[0]) * scale) + 'px, ' + ( ( position.y - Physics.viewPort[1]) * scale) + 'px) rotate(' + ( angle ) + 'rad) scale(' +  scale / baseScale+ ')';
            }
        },
        initBody : function(bodyData) {
            var self = this;
            var baseScale = self.baseScale
            var scale = Settings.scale;

            var jShape = jQuery('<div class="shape"></div>')
              .addClass(bodyData.class)
              //.css('background-image', 'url(/images/'+bodyData.class+'.png?ts='+Date.now()+')')
              .width(2 * bodyData.halfWidth * baseScale )
              .height(2 * bodyData.halfHeight * baseScale )
              .css('left', -bodyData.halfWidth* baseScale + 'px')
              .css('top', -bodyData.halfHeight* baseScale + 'px')
              .css('-webkit-transform', 'translate(' + ( ( bodyData.position.x - bodyData.halfWidth ) * scale ) + 'px, ' + ( ( bodyData.position.y - bodyData.halfHeight ) * scale ) + 'px) rotate(' + ( bodyData.angle ) + 'rad)')
              //.attr('data-half-base-height', bodyData.halfHeight * baseScale * 0)
              //.attr('data-half-base-width', bodyData.halfWidth * baseScale * 0)
              .appendTo(Renderer.jScene);
            return jShape.get(0);
        },
        processEffects : function(collisions) {
          var scale = Settings.scale;
          var now = Date.now();
          for ( var i=0; i < this.effectsQueue.length; i++ ) {
            var effect = this.effectsQueue[i];
            if (now - effect.updatedOn > 60) {
              effect.frameNum++;
              if (effect.frameNum  > 5) {
                effect.node.parentNode.removeChild(effect.node);
                this.effectsQueue.splice(i,1);
              } else {
                effect.node.style.backgroundPosition = '0 -'+ (effect.frameNum - 1) +'00px';
                //if (effect.type == 'block') {
                  //effect.node.style.backgroundPosition = '0 '+effect.frameNum+'00px';
                  ////console.log('url(/images/effect_'+effect.frameNum+'.png)');
                //} else {
                  //effect.node.style.backgroundImage = 'url(/images/'+effect.frameNum+'.png)';
                //}
                effect.updatedOn = now;
              }
            }
          }
          now = Date.now();
          //new nodes are created after update,
          //so we don't trigger style after insert in DOM
          //TODO make use of document Fragment
          for ( var i=0, len = collisions.length; i < len; i++ ) {
            var collision = collisions[i];
            var effectNode = this.effectNodeSample.cloneNode();
            effectNode.classList.add(collision.type);
            //if (collision.type == 'block') {
              //effectNode.style.backgroundPosition = 'url(/images/effect_1.png)';
            //} else {
              //effectNode.style.backgroundPosition = 'url(/images/1.png)';
            //}
            this.effectsQueue.push(
              {
                node : effectNode,
                updatedOn : now,
                type : collision.type,
                frameNum : 1
              }
            );
            if (collision.anchorResourceId == -1) {
              effectNode.style.WebkitTransform = 'translate(' + ( (collision.pos.x - Physics.viewPort[0]) * scale ) + 'px,' + ( (collision.pos.y - Physics.viewPort[1]) * scale ) + 'px) rotate('+ ( Math.random() * Math.PI) +'rad) scale(' +  Settings.scale / Renderer.baseScale+ ')';
              Renderer.jScene.get(0).appendChild(effectNode);
            } else {
              //doesn't need scaling as parent is already scaled
              effectNode.style.WebkitTransform = 'translate(' + ( collision.pos.x * scale ) + 'px,' + ( collision.pos.y * scale ) + 'px) rotate('+ ( Math.random() * Math.PI) +'rad)';
              Renderer.actorNodeList[collision.anchorResourceId].appendChild(effectNode);
            }
          }
        },
        drawGrid : function() {
            var self = this;
            var gridWidth = self.gridWidth;
            var gridHeight = self.gridHeight;
            var ctx = self.canvasCtx;
            var scale = Settings.scale;
            ctx.clearRect(0,0,Renderer.sceneWidth, Renderer.sceneHeight);
            ctx.beginPath();
            var viewPortXShift = Physics.viewPort[0] * scale;
            var viewPortYShift = Physics.viewPort[1] * scale;
            for (var x = Math.ceil(Physics.viewPort[0] / gridWidth) * gridWidth; x < Physics.worldWidth; x+=gridWidth) {
                ctx.moveTo( x * scale - viewPortXShift, 0);
                ctx.lineTo( x * scale - viewPortXShift, Renderer.sceneHeight);
            }
            for (var y = Math.ceil(Physics.viewPort[1] / gridHeight) * gridHeight; y < Physics.worldHeight; y+=gridHeight) {
                ctx.moveTo(0, y * scale - viewPortYShift);
                ctx.lineTo(Renderer.sceneWidth, y * scale - viewPortYShift);
            }
            ctx.stroke();
        },
        drawAdrenalineEffect : function() {
            var self = this;
            self.jScene.addClass('adrenaline-mode');
            clearTimeout(self.adrenalineModeId);
            self.adrenalineModeId = setTimeout(
                function() {
                    self.jScene.removeClass('adrenaline-mode');
                },
                Physics.adrenalineModeMs
            )
        }
    }

    var
      Settings = {
          scale : 100
      },

      b2Vec2 = Box2D.Common.Math.b2Vec2,
      e_circleShape = Box2D.Collision.Shapes.b2Shape.e_circleShape,
      e_polygonShape = Box2D.Collision.Shapes.b2Shape.e_polygonShape;

    Playground.init();
    Playground.start();
});
