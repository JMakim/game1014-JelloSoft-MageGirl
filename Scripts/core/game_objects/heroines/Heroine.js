function Heroine(game, args){
    //Basics
    Actor.call(this, game, args);
    this.outOfCameraBoundsKill = true;
    this.body.collideWorldBounds = false;

    //State
    this.enabled = true;

    //Status
    this.invincible = false;
    this.invincibilityTime = args.invincibility_time ? args.invincibility_time : this.defaults.invincibility_time;

    //Events
    this.invincibilityTimer = this.game.time.create(false);
    this.onCoinPickup = new Phaser.Signal();

    //Keys
    this.keys = args.keys;

    //UI
    this.uiTint = args.ui_tint ? args.ui_tint : this.defaults.ui_tint;
    this.uiBack = args.ui_back ? args.ui_back : this.defaults.ui_back;

    //Collision Groups
    this.platformGroup = args.platformGroup;
    this.damageGroup = args.damageGroup;
    this.enemyDamageGroup = args.enemyDamageGroup;
    this.collectibleGroup = args.collectibleGroup;

    //Animations
    let stateMachineArgs = args.animation_state_machine ? args.animation_state_machine : this.defaults.animation_state_machine;
    this.animationStateMachine = new StateMachine(this, this.game.cache.getJSON(stateMachineArgs));
}

Heroine.prototype = Object.create(Actor.prototype);
Heroine.prototype.constructor = Heroine;

//Constants
Heroine.prototype.defaults = {
    invincibility_time : 2000,
    animation_state_machine : "statemachine:animations:heroine"
};

//Phaser Overrides

Heroine.prototype.update = function(){
    if(this.enabled){
        Actor.prototype.update.call(this);
        if(!this.dead){
            this.animationStateMachine.update();
            this.animationStateMachine.setProperty("x_speed", this.body.velocity.x);
            this.animationStateMachine.setProperty("grounded", this.body.blocked.down);
            this.handleInput();
        }
    }
}

//Movement Functions

//Jump Functions

Heroine.prototype.basicJump = function(){
    let canJump = this.body.blocked.down;

    if(canJump){
        this.body.velocity.y = -this.jumpSpeed;
    }

    return canJump;
};

//Attack Functions

//Death Functions

//Input handling

Heroine.prototype.handleInput = function(){
    //Movement
    if(this.keys.left.isDown){
        this.dir.x = Actor.DIRX_LEFT;
    }else if(this.keys.right.isDown){
        this.dir.x = Actor.DIRX_RIGHT;
    }else{
        this.dir.x = Actor.DIR_NONE;
    }

    if(this.keys.up.isDown){
        this.dir.y = Actor.DIRY_UP;
    }else if(this.keys.down.isDown){
        this.dir.y = Actor.DIRY_DOWN;
    }else{
        this.dir.y = Actor.DIR_NONE;
    }

    this.move();

    //Jumping
    if(this.keys.up.justDown){
        let didJump = this.jump();
    }

    //Attacking
    if(this.keys.attackLeft.isDown){
        this.attackDir.x = Actor.DIRX_LEFT;
    }else if(this.keys.attackRight.isDown){
        this.attackDir.x = Actor.DIRX_RIGHT;
    }else{
        this.attackDir.x = Actor.DIR_NONE;
    }

    if(this.keys.attackUp.isDown){
        this.attackDir.y = Actor.DIRY_UP;
    }else if(this.keys.attackDown.isDown){
        this.attackDir.y = Actor.DIRY_DOWN;
    }else{
        this.attackDir.y = Actor.DIR_NONE;
    }

    this.attack();
};

//Collision Handling
Heroine.prototype.handleCollisions = function(){
    Actor.prototype.handleCollisions.call(this);
    this.game.physics.arcade.overlap(this, this.collectibleGroup, function(heroine, collectible){
        collectible.onPickup(this);
    }, null, this);
};

//Damage Handling

Heroine.prototype.dealDamage = function(amount){
    if(this.invincible){
        return;
    }
    this.hp -= amount;
    if(this.hp <= 0){
        this.hp = 0;
        this.onDeath.dispatch();
    }else if(amount > 0){
        this.startInvincibility();
    }
}

//Status Changes

Heroine.prototype.startInvincibility = function(){
    this.invincible = true;
    this.tint = 0xff00ff;
    this.invincibilityTimer.add(this.invincibilityTime, function(){
        this.invincible = false;
        this.tint = 0xffffff;
        this.invincibilityTimer.stop();
    },this);
    this.invincibilityTimer.start();
};

//Function Wiring

Heroine.prototype.move = Actor.prototype.basicMove;
Heroine.prototype.jump = Heroine.prototype.basicJump;
Heroine.prototype.attack = Actor.prototype.basicAttack;
Heroine.prototype.die = Actor.prototype.basicDeath;

//Powerup Hooks

Heroine.prototype.onArcane = function(args){
    console.log("Arcane powerup picked on this base heroine instance");
};