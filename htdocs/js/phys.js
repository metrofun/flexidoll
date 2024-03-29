//var box2d = new Worker('Box2dWeb-2.1a.3b.js');
importScripts('Box2dWeb-2.1.a.3.js');

var
  b2Vec2 = Box2D.Common.Math.b2Vec2,
  b2BodyDef = Box2D.Dynamics.b2BodyDef,
  b2Body = Box2D.Dynamics.b2Body,
  b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
  b2Fixture = Box2D.Dynamics.b2Fixture,
  b2World = Box2D.Dynamics.b2World,
  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
  e_circleShape = Box2D.Collision.Shapes.b2Shape.e_circleShape,
  e_polygonShape = Box2D.Collision.Shapes.b2Shape.e_polygonShape,
  b2ContactListener = Box2D.Dynamics.b2ContactListener,
  b2RevoluteJointDef =  Box2D.Dynamics.Joints.b2RevoluteJointDef,
  b2WorldManifold = Box2D.Collision.b2WorldManifold,

debug = function(data) {
  if (typeof data == 'object') {
    var obj = {};
    for (var i in data){
      try{
        obj[i] = JSON.parse(JSON.stringify(data[i]));
      } catch(e) {
        obj[i] = '[' + typeof data[i]+']';
      }
    }
  } else {
    obj = data;
  }
  postMessage({
    data : obj,
    contractId : 'debug',
    live : true
  });
}

Flexidoll = function(name) {
    var self = this;

    this.name = name;
    this.groupIndex = ++Flexidoll.prototype.groups;
    this.offsetY = Math.random() * 8;
    this.offsetX = Math.random() * 8;
    //dfs
    this.discovered = [];
    for ( var i in this.skeleton.limbs) {
      if ( typeof this.discovered[i] == 'undefined') {
        this.dfsSkeleton(i);
      }
    }
}
Flexidoll.prototype = {
  name : undefined,
    groups : 0,
    hp : 100,
    applyImpulse : function(impulseVec) {
        var self = this;
        self.headBody.ApplyImpulse(impulseVec, self.headBody.GetWorldCenter());
    },
    size : 0.01,
    offsetX : undefined,
    offsetY : undefined,
    skeleton : {
        limbs : {
            head : {
              x1 : 92,
              y1: 63,
              hw : 44,
              hh : 63,
              vertices :  [
                new b2Vec2(-22, -51),
                new b2Vec2(32, -40),
                new b2Vec2(43, -21),
                new b2Vec2(35, 42),
                new b2Vec2(16, 62),
                new b2Vec2(-15, 62),
                new b2Vec2(-35, 41),
                new b2Vec2(-42, -23)
              ],
              head : true
            },
            torso1 : { x1 : 92, y1: 151, hw : 57, hh : 27},
            torso2 : { x1 : 92, y1: 186, hw : 39, hh : 30},
            torso3 : { x1 : 92, y1: 227, hw : 31, hh : 36},
            upperArmL : { x1 : 25, y1: 172, hw : 22, hh : 38},
            upperArmR : { x1 : 158, y1: 175, hw : 22, hh : 38},
            lowerArmL : { x1 : 20, y1: 241, hw : 20, hh : 38},
            lowerArmR : { x1 : 163, y1: 243, hw : 20, hh : 38},
            upperLegL : { x1 : 74, y1: 272, hw : 18, hh : 31},
            upperLegR : { x1 : 109, y1: 272, hw : 18, hh : 31},
            lowerLegL : { x1 : 73, y1: 334, hw : 13, hh : 40},
            lowerLegR : { x1 : 111, y1: 334 , hw : 13, hh : 40}
        },
        // Adjacency Lists
        joints : {
          head : {
            torso1 : { x : 92, y : 114, lowerAngle : -40, upperAngle : 40}
          },
          torso1 : {
            upperArmL : { x : 25, y : 155, lowerAngle : -85 + 90 , upperAngle : 130 + 35},
            upperArmR : { x : 158, y : 155, lowerAngle : -130 - 35, upperAngle : 85 - 90},
            torso2 : { x : 92, y : 174, lowerAngle : -25, upperAngle : 25}
          },
          upperArmL : {
            lowerArmL : { x : 25, y : 198, lowerAngle : -130, upperAngle : 10 }
          },
          upperArmR : {
            lowerArmR : { x : 158, y : 198, lowerAngle : -10, upperAngle : 130 }
          },
          torso2 : {
            torso3 : { x : 91, y : 213, lowerAngle : -25, upperAngle : 25}
          },
          torso3 : {
            upperLegL : { x : 73, y : 251, lowerAngle : -25, upperAngle : 45},
            upperLegR : { x : 108, y : 251, lowerAngle : -45, upperAngle : 25}
          },
          upperLegL : {
            lowerLegL : { x : 73, y : 295, lowerAngle : -25, upperAngle : 115 }
          },
          upperLegR : {
            lowerLegR : { x : 111, y : 295, lowerAngle : -115, upperAngle : 25 }
          }
        }
    },
    // dfs
    discovered : null,
    dfsSkeleton : function(v) {
        this.discovered[v] = true;
        var vBody = this.createLimb(v);
        for (var y in this.skeleton.joints[v]) {
          if ( typeof this.discovered[i] == 'undefined') {
            var jointData = this.skeleton.joints[v][y];
            this.createJoint( vBody, this.dfsSkeleton(y), jointData);
          }
        }
        return vBody;
    },
    createLimb : function(v) {
      var x1 = this.skeleton.limbs[v].x1;
      var y1 = this.skeleton.limbs[v].y1;
      var hw = this.skeleton.limbs[v].hw;
      var hh = this.skeleton.limbs[v].hh;
      //var dx = hw - x1;
      //var dy = hh - y1;
      var positionX = x1;
      var positionY = y1;
      var halfWidth =  hw;
      var halfHeight =  hh;
      //var angle  = - Math.atan2(dx, dy);
      var angle = 0;


      var bd = new b2BodyDef();
      bd.type = b2Body.b2_dynamicBody;
      bd.position.x = positionX * this.size + this.offsetX;
      bd.position.y = positionY * this.size + this.offsetY;
      bd.angle = angle;
      var body = PhysWorker.world.CreateBody(bd);

      var userData = {};
      var shape = new b2PolygonShape();
      var vertices = this.skeleton.limbs[v].vertices;
      if (typeof vertices == 'undefined') {
        shape.SetAsBox(halfWidth * this.size, halfHeight * this.size);
      } else {
        var verticesCopy = [];
        for (var i=0,len=vertices.length; i < len; i++) {
          verticesCopy.push(vertices[i].Copy());
          verticesCopy[i].Multiply(this.size);
        }
        shape.SetAsArray(verticesCopy, verticesCopy.length);
      }
      if (this.skeleton.limbs[v].head) {
        userData.head = true;
        this.headBody = body;
      } else {
      }
      userData.class = v;
      userData.halfWidth = halfWidth * this.size;
      userData.halfHeight = halfHeight * this.size;
      userData.type = shape.GetType();
      userData.resourceId = PhysWorker.getContractId();
      userData.flexidoll = this;

      var fixtureDef = new b2FixtureDef();
      fixtureDef.shape = shape;
      fixtureDef.density = 1.0;
      fixtureDef.friction = 0.4;
      fixtureDef.restitution = 0.3;
      fixtureDef.filter.groupIndex = - this.groupIndex;
      fixtureDef.filter.categoryBits = 1 << 1;
      fixtureDef.filter.maskBits = 1 | ( 1 << 1 );

      var fixt = body.CreateFixture(fixtureDef);
      //if (typeof vertices != 'undefined') {
        //var w = ( fixt.m_aabb.lowerBound.x - fixt.m_aabb.upperBound.x ) / 2; 
        //var h = ( fixt.m_aabb.lowerBound.y - fixt.m_aabb.upperBound.y ) / 2; 
        //userData.halfWidth = Math.abs(w);
        //userData.halfHeight = Math.abs(h);
        //debug(userData);
      //}
      body.SetUserData(userData);

      return body;
    },
    createJoint : function(bodyA, bodyB, jointData) {
      var jd = new b2RevoluteJointDef();
      //jd.frequencyHz = 10;
      //jd.dampingRatio = 0.05;
      jd.enableMotor = true;
      jd.motorSpeed = 0;
      jd.enableLimit = true;
      jd.maxMotorTorque = 0.1;
      jd.lowerAngle = jointData.lowerAngle / (180/Math.PI);
      jd.upperAngle = jointData.upperAngle / (180/Math.PI);
      jd.Initialize(bodyA, bodyB, new b2Vec2(jointData.x * this.size + this.offsetX, jointData.y * this.size + this.offsetY));
      PhysWorker.world.CreateJoint(jd);
    }
}

PhysWorker = {
    flexidollsState : {},
    world : null,
    timeStepMs : 1000 / 30,
    adrenalineModeMs : undefined,
    adrenalineModeId : undefined,
    worldTimeStepS : 1 / 30,
    worldWidth : undefined,
    worldHeight : undefined,
    collisions : [],
    getContractId : (function() {
        var id = 0;
        return function() {
            return (id++ % 999999999) + "";
        }
    })(),
    //TODO hardcoded for grounds
    adjustUserData : function( body, class) {
      if (fixture = body.GetFixtureList()) {
        var shape = fixture.GetShape(), halfWidth, halfHeight;
        switch (shape.GetType()) {
          case e_polygonShape : 
            var topLeftVertex = shape.GetVertices()[0];
            halfWidth = Math.abs(topLeftVertex.x);
            halfHeight = Math.abs(topLeftVertex.y);
            break;
          case e_circleShape:
            halfWidth = halfHeight = shape.m_radius;
        }

        var userData = body.GetUserData() || {};
        userData.halfWidth = halfWidth;
        userData.halfHeight = halfHeight;
        userData.type = shape.GetType();
        userData.resourceId = PhysWorker.getContractId();
        userData.class = class;
        body.SetUserData(userData);
      }
    },
    init : function() {
        var self = this;

        self.world = new b2World(
            new b2Vec2(0, 0),    //gravity
            true                 //allow sleep
        );

        var contactListener = new b2ContactListener();

        contactListener.BeginContact = function (contact) {
            var fixtureA = contact.GetFixtureA();
            var fixtureB = contact.GetFixtureB();
            if ((fixtureA.GetFilterData().categoryBits != 1) && (fixtureB.GetFilterData().categoryBits != 1)) {
                var worldManifold = new b2WorldManifold;
                contact.GetWorldManifold(worldManifold);
                var extraImpulse = worldManifold.m_normal.Copy();
                extraImpulse.Multiply(15);

                var bodyA = fixtureA.GetBody();
                var bodyB = fixtureB.GetBody();
                bodyA.ApplyImpulse( extraImpulse,  worldManifold.m_points[0] );
                bodyB.ApplyImpulse( extraImpulse.GetNegative(),  worldManifold.m_points[0] );

                var contactedBodies = [bodyA, bodyB];
                var noPow = true;

                for (var i in contactedBodies) {
                  var body = contactedBodies[i];
                  var userData = body.GetUserData();

                  if (typeof userData.head != 'undefined') {
                    noPow = false;
                    var fxdl = userData.flexidoll;
                    //relative to upper left corner
                    var relativePoint = body.GetLocalPoint(worldManifold.m_points[0]).Copy();
                    relativePoint.Add(new b2Vec2(userData.halfWidth, userData.halfHeight));
                    self.collisions.push({
                      pos : relativePoint,
                      type : 'pow',
                      anchorResourceId : userData.resourceId
                    });

                    fxdl.hp -= 10;

                    self.flexidollsState[fxdl.name] = fxdl.hp;

                    if (!fxdl.hp) {

                      for ( var body = PhysWorker.world.GetBodyList(); body ; body = body.GetNext() ) {
                        var userData = body.GetUserData();
                        if (( userData ) && (userData.flexidoll == fxdl)) {
                          delete userData.head;
                          for ( var jointEdge = body.GetJointList(); jointEdge; jointEdge = jointEdge.next ) {
                            self.collisions.push({
                              pos : jointEdge.joint.GetAnchorA(),
                              type : 'pow',
                              anchorResourceId : -1
                            });
                            PhysWorker.world.DestroyJoint(jointEdge.joint);
                          }
                        }
                      }
                    }
                  }
                }

                if (noPow) {
                  self.collisions.push({
                    pos : worldManifold.m_points[0],
                    type : 'block',
                    anchorResourceId : -1
                  });
                }
            }
        }

        self.world.SetContactListener(contactListener);

        onmessage = function(event) {
            postMessage({
                data : eval('('+event.data.command+').apply(this, ' + JSON.stringify(event.data.args) + ')'),
                contractId : event.data.contractId
            });
        }
        //self.player1 = new Flexidoll();
        //self.player2 = new Flexidoll();
    },
    start : function() {
        var self = this;
        var step = function(){
          for (var jj = self.world.GetJointList();jj;jj = jj.GetNext()) {
            jj.SetMotorSpeed(- 1 * jj.GetJointAngle());
          }

          var bodiesState = [];
          //x1,y1,x2,y2
          var worldWidth = PhysWorker.worldWidth;
          var worldHeight = PhysWorker.worldHeight;
          var bounds = [worldWidth, worldHeight, 0, 0];
          var dollHeight = 3;
          for ( var body = PhysWorker.world.GetBodyList(); body ; body = body.GetNext() ) {
            var userData = body.GetUserData();
            if (userData) {
              var pos = body.GetPosition();
              if (typeof userData.head != 'undefined') {
                if (bounds[0] > pos.x - dollHeight) bounds[0] = pos.x - dollHeight;
                if (bounds[1] > pos.y - dollHeight) bounds[1] = pos.y - dollHeight;
                if (bounds[2] < pos.x + dollHeight) bounds[2] = pos.x + dollHeight;
                if (bounds[3] < pos.y + dollHeight) bounds[3] = pos.y + dollHeight;
              }
              bodiesState.push({
                position : pos,
                angle : body.GetAngle(),
                resourceId : userData.resourceId
              });
            }
          }
          var viewPortCenter = [
            (bounds[2] + bounds[0]) / 2,
            (bounds[3] + bounds[1]) / 2
          ];
          var width = (bounds[2] - bounds[0]);
          var height = (bounds[3] - bounds[1]);
          var dollHeight = (width > height ? width / 2 : height / 2) ;
          if (dollHeight > worldHeight / 2 ) {
            dollHeight = worldHeight / 2
          };
          if (viewPortCenter[0] < dollHeight) {
            viewPortCenter[0] = dollHeight
          } else if (viewPortCenter[0] > PhysWorker.worldWidth - dollHeight) {
            viewPortCenter[0] = PhysWorker.worldWidth - dollHeight;
          }
          if (viewPortCenter[1] < dollHeight) {
            viewPortCenter[1] = dollHeight
          } else if (viewPortCenter[1] > worldHeight - dollHeight) {
            viewPortCenter[1] = worldHeight- dollHeight;
          }

          self.world.Step(self.worldTimeStepS, 10, 10);
          self.world.ClearForces();

          //if (self.collisions.length) {
            //self.worldTimeStepS = 1 / 180;

            //clearTimeout(self.adrenalineModeId);
            //self.adrenalineModeId = setTimeout(
              //function() {
                //self.worldTimeStepS = 1 / 60;
              //},
              //self.adrenalineModeMs
            //)
          //}

          postMessage({
            data : {
              bodiesState : bodiesState,
              collisions : self.collisions,
              flexidollsState : self.flexidollsState,
              viewPort : [
                viewPortCenter[0] - dollHeight,
                viewPortCenter[1] - dollHeight,
                2 * dollHeight
              ]
            },
            contractId : 'lifecycle',
            live : true
          });
          self.collisions = [];
          self.flexidollsState = [];
          setTimeout(step, self.timeStepMs);
        };
        step();
    }
}
PhysWorker.init();
//PhysWorker.start();
