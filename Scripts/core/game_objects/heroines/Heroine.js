function Heroine(game, args){
    //Basics
    Actor.call(this, game, args);
    this.outOfCameraBoundsKill = true;
    this.body.collideWorldBounds = false;

    //State
    this.enabled = true;
    this.inputEnabled = true
    this.secondaryEnabled = true;
    this.switchEnabled = true;
    this.parentHeroine = null;
    this.type = "Heroine";
    this.canOperate = true;
    this.operateTimer = this.game.time.create(false);
    this.operateCooldown = args.operate_cooldown ? args.operate_cooldown : this.defaults.operate_cooldown;

    //Status
    this.invincible = false;
    this.invincibilityTime = args.invincibility_time ? args.invincibility_time : this.defaults.invincibility_time;

    //Events
    this.invincibilityTimer = this.game.time.create(false);
    this.onCoinPickup = new Phaser.Signal();
    this.currentOperable = null;

    //Keys
    this.keys = args.keys;

    //UI
    this.uiTint = args.ui_tint ? args.ui_tint : this.defaults.ui_tint;
    this.uiBack = args.ui_back ? args.ui_back : this.defaults.ui_back;

    //Collision Groups
    this.platformGroup = args.platformGroup;
    this.damageGroup = args.damageGroup;
    this.collectibleGroup = args.collectibleGroup;
    this.operableGroup = args.operableGroup;

    //Animations
    let stateMachineArgs = args.animation_state_machine ? args.animation_state_machine : this.defaults.animation_state_machine;
    this.animationStateMachine = new StateMachine(this, this.game.cache.getJSON(stateMachineArgs, true));
    this.animationStateMachine.start();

    //Sfx
    this.hurtSfx = args.hurt_sfx ? args.hurt_sfx : this.defaults.hurt_sfx;
    this.jumpSfx = args.jump_sfx ? args.jump_sfx : this.defaults.jump_sfx;
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
            this.animationStateMachine.setProperty("grounded", this.isGrounded());
            if(this.inputEnabled){
                this.handleInput();
                this.handleOperables();
            }
            this.move();
        }
    }
}

//Movement Functions

Heroine.prototype.ladderMove = function(){
    this.body.velocity.x = this.dir.x * this.speed;
    this.body.velocity.y = this.dir.y * this.speed;

    if(this.body.velocity.x < 0 && this.scale.x > 0){
        this.scale.x *= -1;
    }else if(this.body.velocity.x > 0 && this.scale.x < 0){
        this.scale.x *= -1;
    }
};

//Jump Functions

Heroine.prototype.basicJump = function(){
    let canJump = this.isGrounded();

    if(canJump){
        this.game.sound.play(this.jumpSfx);
        this.body.velocity.y = this.jumpSpeed * (this.game.physics.arcade.gravity.y >= 0 ? -1 : 1);
    }

    return canJump;
};

Heroine.prototype.emptyJump = function(){
    //Do nothing
};

Heroine.prototype.setJumpEnabled = function(enabled){
    this.jumpEnabled = enabled;
};

//Attack Functions

//Death Functions


//Secondary Functions
Heroine.prototype.secondaryAbility = function(){
    console.log("Heroine did her secondary ability");
};

//Input handling

Heroine.prototype.handleInput = function(){
    //Secondary Ability
    if(this.secondaryEnabled && this.keys.secondary.justDown){
        this.secondaryAbility();
    }

    //Movement
    this.handleMovementInput();

    //Operating
    if(this.keys.operate.justDown){
        if(this.currentOperable != null && this.canOperate){
            this.currentOperable.operate();
            this.canOperate = false;
            this.operateTimer.add(this.operateCooldown, function(){
                this.canOperate = true;
                this.operateTimer.stop();
            },this);
            this.operateTimer.start();
        }
    }

    if(this.keys.up.justDown){
        this.jump();
    };

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

Heroine.prototype.handleMovementInput = function(){
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
};

//Collision Handling
Heroine.prototype.handleCollisions = function(){
    Actor.prototype.handleCollisions.call(this);
    this.game.physics.arcade.overlap(this, this.collectibleGroup, function(heroine, collectible){
        collectible.onPickup(this);
    }, null, this);
};

Heroine.prototype.handleOperables = function(){
    let found = false;
    let operables = this.operableGroup.getAll();
    let newOpr = null;
    for(var i=0;i<operables.length;++i){
        if(this.game.physics.arcade.intersects(this.body, operables[i].body)){
            newOpr = operables[i];
            found = true;
            break;
        }
    }

    if(!found){
        if(this.currentOperable != null){
            this.currentOperable.onExit();
        }
        this.currentOperable = null;
    }else{
        if(this.currentOperable != null && newOpr != this.currentOperable){
            this.currentOperable.onExit();
        }
        if(newOpr != this.currentOperable){
            newOpr.onEnter();
        }
        this.currentOperable = newOpr;
    }
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
        this.game.sound.play(this.hurtSfx);
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

//Powerup Hooks

Heroine.prototype.onArcane = function(args){
    console.log("Arcane powerup picked on this base heroine instance");
};